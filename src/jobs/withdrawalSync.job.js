import { withSyncedAt } from "../utils/syncStamp.js";
import cron from "node-cron";
import logger from "../utils/logger.js";
import { arcadiaApi } from "../services/arcadia.service.js";
import { metadataService } from "../services/metadata.service.js";
import { zohoAnalyticService } from "../services/zoho-analytic.service.js";
import { config } from "../config/env.js";
import { getReconciliationResult } from "../utils/syncReconciliation.js";

/**
 * SyncWithdrawal
 * ------------
 * Fetches student withdrawal records from Arcadia API,
 * filters unsynced records based on `lastUpdated`,
 * and upserts them into Zoho Analytics.
 */
export const SyncWithdrawal = async () => {
  let page = 1;
  let pageSize = 300;
  let withdrawals = [];
  let expand = "customFields";

  // Fetch withdrawals from Arcadia API in a paginated loop
  while (true) {
    const params = { page, pageSize, expand };
    const response = await arcadiaApi.getWithdrawals(params);
    withdrawals = withdrawals.concat(response?.alumni || []);

    if (
      !response?.totalPages ||
      !response?.alumni ||
      page >= response?.totalPages
    ) {
      break;
    }
    page++;
  }

  // Sort withdrawals by lastUpdated (oldest → newest)
  withdrawals.sort((a, b) => new Date(a.lastUpdated) - new Date(b.lastUpdated));

  const pk = config.zohoAnalyticApi.primaryKeys.withdrawal;
  const analytics = await zohoAnalyticService.exportWithdrawals();
  const analyticsData = analytics?.data || [];

  const reconciliation = getReconciliationResult({
    sourceData: withdrawals,
    analyticsData,
    primaryKey: pk,
  });

  logger.info(
    `Withdrawals reconciliation | Source=${reconciliation.sourceCount} | Analytics=${reconciliation.analyticsCount} | CountMismatch=${reconciliation.countMismatch} | KeyMismatch=${reconciliation.keyMismatch} | FullSync=${reconciliation.fullSync}`
  );

  if (reconciliation.extraInAnalytics.length > 0) {
    const deleted = await zohoAnalyticService.deleteWithdrawals(
      reconciliation.extraInAnalytics
    );

    logger.info(
      `Withdrawals: deleted ${deleted} records that no longer exist in source`
    );
  }

  let recordsToSync;

  if (reconciliation.fullSync) {
    recordsToSync = [...withdrawals];

    logger.info(
      `Withdrawals: reconciliation mismatch detected. Performing FULL sync of ${recordsToSync.length} records.`
    );
  } else {
    const lastUpdated = await metadataService.getWithdrawalLastUpdated();

    recordsToSync = withdrawals.filter(
      (withdrawal) =>
        new Date(withdrawal.lastUpdated) > new Date(lastUpdated)
    );

    logger.info(
      `Withdrawals: source and Analytics are aligned. Performing incremental sync of ${recordsToSync.length} records.`
    );
  }

  // FULL REFRESH every run
  recordsToSync = [...withdrawals];
  if (recordsToSync.length === 0) {
    logger.info("No withdrawals to sync");
    return 0;
  }


  // prefix fullName (useful for testing/demo environments)
  if (config.zohoAnalyticApi.fullNamePrefix) {
    recordsToSync = recordsToSync.map((withdrawal) => ({
      ...withdrawal,
      fullName: `${config.zohoAnalyticApi.fullNamePrefix} ${withdrawal.fullName || ""}`.trim(),
    }));
  }

  logger.info(
    `Withdrawals: syncing ${recordsToSync.length} records using View ID ${config.zohoAnalyticApi.withdrawalViewId} and primary key ${pk}`
  );

  if (await zohoAnalyticService.upsertWithdrawals(withSyncedAt(recordsToSync))) {
    await metadataService.upsertWithdrawal(
      recordsToSync[recordsToSync.length - 1].lastUpdated
    );

    logger.info(
      `Withdrawals: sync completed successfully. Records processed=${recordsToSync.length}`
    );

    return recordsToSync.length;
  }

  return 0;
};

// Runs SyncWithdrawal() on the configured cron schedule
export const startWithdrawalSyncJob = () => {
  logger.info(
    `Starting withdrawal sync job with schedule: ${config.cronInterval.withdrawal}`
  );
  cron.schedule(
    config.cronInterval.withdrawal,
    async () => {
      await SyncWithdrawal();
    },
    {
      timezone: "Asia/Dubai",
    }
  );
};
