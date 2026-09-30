import { withSyncedAt } from "../utils/syncStamp.js";
import cron from "node-cron";
import logger from "../utils/logger.js";
import { arcadiaApi } from "../services/arcadia.service.js";
import { metadataService } from "../services/metadata.service.js";
import { zohoAnalyticService } from "../services/zoho-analytic.service.js";
import { config } from "../config/env.js";
import { getReconciliationResult } from "../utils/syncReconciliation.js";

export const SyncApplicant = async () => {
  let page = 1;
  const pageSize = 300;
  let applicants = [];

  while (true) {
    const response = await arcadiaApi.getApplicants({
      page,
      pageSize,
    });

    applicants = applicants.concat(response?.applicants || []);

    if (
      !response?.totalPages ||
      !response?.applicants ||
      page >= Number(response.totalPages)
    ) {
      break;
    }

    page++;
  }

  applicants.sort(
    (a, b) => new Date(a.lastUpdated) - new Date(b.lastUpdated)
  );

  const pk = config.zohoAnalyticApi.primaryKeys.applicant;

  const analytics = await zohoAnalyticService.exportApplicants();
  const analyticsData = analytics?.data || [];

  const reconciliation = getReconciliationResult({
    sourceData: applicants,
    analyticsData,
    primaryKey: pk,
  });

  logger.info(
    `Applicants reconciliation | Source=${reconciliation.sourceCount} | Analytics=${reconciliation.analyticsCount} | CountMismatch=${reconciliation.countMismatch} | KeyMismatch=${reconciliation.keyMismatch} | FullSync=${reconciliation.fullSync}`
  );

  if (reconciliation.extraInAnalytics.length > 0) {
    const deleted = await zohoAnalyticService.deleteApplicants(
      reconciliation.extraInAnalytics
    );

    logger.info(
      `Applicants: deleted ${deleted} records that no longer exist in source`
    );
  }

  let recordsToSync;

  if (reconciliation.fullSync) {
    recordsToSync = [...applicants];

    logger.info(
      `Applicants: reconciliation mismatch detected. Performing FULL sync of ${recordsToSync.length} records.`
    );
  } else {
    const lastUpdated = await metadataService.getApplicantLastUpdated();

    recordsToSync = applicants.filter(
      (applicant) =>
        new Date(applicant.lastUpdated) > new Date(lastUpdated)
    );

    logger.info(
      `Applicants: source and Analytics are aligned. Performing incremental sync of ${recordsToSync.length} records.`
    );
  }

  // FULL REFRESH every run
  recordsToSync = [...applicants];
  if (recordsToSync.length === 0) {
    logger.info("No new or changed applicants to sync");
    return 0;
  }

  if (config.zohoAnalyticApi.fullNamePrefix) {
    recordsToSync = recordsToSync.map((applicant) => ({
      ...applicant,
      fullName: `${config.zohoAnalyticApi.fullNamePrefix} ${applicant.fullName}`,
    }));
  }

  logger.info(
    `Applicants: syncing ${recordsToSync.length} records using View ID ${config.zohoAnalyticApi.applicantViewId} and primary key ${pk}`
  );

  const result = await zohoAnalyticService.upsertApplicants(withSyncedAt(recordsToSync));

  if (!result) {
    logger.error("Applicants: Zoho Analytics sync failed");
    return 0;
  }

  await metadataService.upsertApplicant(
    recordsToSync[recordsToSync.length - 1].lastUpdated
  );

  logger.info(
    `Applicants: sync completed successfully. Records processed=${recordsToSync.length}`
  );

  return recordsToSync.length;
};

export const startApplicantSyncJob = () => {
  logger.info(
    `Starting applicant sync job with schedule: ${config.cronInterval.applicant}`
  );

  cron.schedule(
    config.cronInterval.applicant,
    async () => {
      try {
        await SyncApplicant();
      } catch (error) {
        logger.error(
          "Applicant sync job failed",
          error.response?.data || error.message
        );
      }
    },
    {
      timezone: "Asia/Dubai",
    }
  );
};
