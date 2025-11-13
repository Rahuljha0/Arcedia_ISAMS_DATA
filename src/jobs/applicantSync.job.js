import cron from "node-cron";
import logger from "../utils/logger.js";
import { arcadiaApi } from "../services/arcadia.service.js";
import { metadataService } from "../services/metadata.service.js";
import { zohoAnalyticService } from "../services/zoho-analytic.service.js";
import { config } from "../config/env.js";

/**
 * SyncApplicant
 * ------------
 * Fetches applicant records from Arcadia API,
 * filters unsynced records based on `lastUpdated`,
 * and upserts them into Zoho Analytics.
 */
export const SyncApplicant = async () => {
  let page = 1;
  let pageSize = 300;
  let applicants = [];

  // Fetch applicants from Arcadia API in a paginated loop
  while (true) {
    const params = { page, pageSize };
    const response = await arcadiaApi.getApplicants(params);
    applicants = applicants.concat(response?.applicants || []);

    if (page >= response?.totalPages) {
      break;
    }
    page++;
  }

  // Sort applicants by lastUpdated (oldest → newest)
  applicants.sort((a, b) => new Date(a.lastUpdated) - new Date(b.lastUpdated));

  // Delete applicants from zoho analytics those are not in source
  const sourceIds = new Set(applicants.map((a) => a.schoolId));
  const analyticApplicants = await zohoAnalyticService.exportApplicants();
  const needToDelete = analyticApplicants.data
    .filter((a) => !sourceIds.has(a.schoolId))
    .map((a) => a.schoolId);

  logger.info(
    `Applicants: ${applicants.length}, AnalyticApplicants: ${analyticApplicants.data.length}, Deleting ${needToDelete.length} applicants from Zoho Analytics`
  );
  if (needToDelete.length > 0) {
    const deleted = await zohoAnalyticService.deleteApplicants(needToDelete);
    logger.info(`Deleted ${deleted} applicants from Zoho Analytics`);
  }

  // Keep only applicants updated after the last sync
  const lastUpdated = await metadataService.getApplicantLastUpdated();
  applicants = applicants.filter(
    (applicant) => new Date(applicant.lastUpdated) > new Date(lastUpdated)
  );

  // If no new applicants to sync, return
  if (applicants.length === 0) {
    logger.info("No new applicants to sync");
    return 0;
  }

  // prefix fullName (useful for testing/demo environments)
  if (config.zohoAnalyticApi.fullNamePrefix) {
    applicants = applicants.map((applicant) => {
      applicant.fullName = `${config.zohoAnalyticApi.fullNamePrefix} ${applicant.fullName}`;
      return applicant;
    });
  }

  logger.info(`Syncing ${applicants.length} applicants...`);

  // Upsert each applicant into Zoho and update metadata
  let success = 0;
  if (await zohoAnalyticService.upsertApplicants(applicants)) {
    await metadataService.upsertApplicant(
      applicants[applicants.length - 1].lastUpdated
    );
    success = applicants.length;
  }

  return success;
};

// Runs SyncApplicant() on the configured cron schedule
export const startApplicantSyncJob = () => {
  logger.info(
    `Starting applicant sync job with schedule: ${config.cronSchedule}`
  );
  cron.schedule(
    config.cronSchedule,
    async () => {
      await SyncApplicant();
    },
    {
      timezone: "Asia/Dubai",
    }
  );
};
