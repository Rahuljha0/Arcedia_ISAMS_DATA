import cron from "node-cron";
import logger from "../utils/logger.js";
import { arcadiaApi } from "../services/arcadia.service.js";
import { metadataService } from "../services/metadata.service.js";
import { zohoAnalyticService } from "../services/zoho-analytic.service.js";
import { config } from "../config/env.js";

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
    withdrawals = withdrawals.concat(response.alumni || []);

    if (page >= response.totalPages) {
      break;
    }
    page++;
  }

  // Sort withdrawals by lastUpdated (oldest → newest)
  withdrawals.sort((a, b) => new Date(a.lastUpdated) - new Date(b.lastUpdated));

  // Delete students from zoho analytics those are not in source
  const pk = config.zohoAnalyticApi.primaryKeys.withdrawal;
  const sourceIds = new Set(withdrawals.map((a) => a[pk]));
  const analytics = await zohoAnalyticService.exportWithdrawals();
  const needToDelete = analytics.data
    .filter((a) => !sourceIds.has(a[pk]))
    .map((a) => a[pk]);

  logger.info(
    `Withdrawals: ${withdrawals.length}, Analytics: ${analytics.data.length}, Deleting ${needToDelete.length} withdrawals from Analytics`
  );
  if (needToDelete.length > 0) {
    const deleted = await zohoAnalyticService.deleteWithdrawals(needToDelete);
    logger.info(`Deleted ${deleted} withdrawals from Analytics`);
  }

  // Keep only withdrawals updated after the last sync
  const lastUpdated = await metadataService.getWithdrawalLastUpdated();
  withdrawals = withdrawals.filter(
    (withdrawal) => new Date(withdrawal.lastUpdated) > new Date(lastUpdated)
  );

  // If no new withdrawals to sync, return
  if (withdrawals.length === 0) {
    logger.info("No new withdrawals to sync");
    return 0;
  }

  // prefix fullName (useful for testing/demo environments)
  if (config.zohoAnalyticApi.fullNamePrefix) {
    withdrawals = withdrawals.map((withdrawal) => {
      withdrawal.fullName = `${config.zohoAnalyticApi.fullNamePrefix} ${withdrawal.fullName}`;
      return withdrawal;
    });
  }

  logger.info(`Syncing ${withdrawals.length} withdrawals...`);

  // Upsert each withdrawal into Zoho and update metadata
  let success = 0;
  if (await zohoAnalyticService.upsertWithdrawals(withdrawals)) {
    await metadataService.upsertWithdrawal(
      withdrawals[withdrawals.length - 1].lastUpdated
    );
    success = withdrawals.length;
  }

  return success;
};

// Runs SyncWithdrawal() on the configured cron schedule
export const startWithdrawalSyncJob = () => {
  logger.info(
    `Starting withdrawal sync job with schedule: ${config.cronSchedule}`
  );
  cron.schedule(
    config.cronSchedule,
    async () => {
      await SyncWithdrawal();
    },
    {
      timezone: "Asia/Dubai",
    }
  );
};
