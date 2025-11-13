import cron from "node-cron";
import logger from "../utils/logger.js";
import { zohoCrmService } from "../services/zoho-crm.service.js";
import { metadataService } from "../services/metadata.service.js";
import { zohoAnalyticService } from "../services/zoho-analytic.service.js";
import { config } from "../config/env.js";

/**
 * SyncApplicationForms
 * ------------
 * Fetches application form records from ZOHO CRM,
 * filters unsynced records based on `lastUpdated`,
 * and upserts them into Zoho Analytics.
 */
export const SyncApplicationForms = async () => {
  let allApplicationForms = await zohoCrmService.getApplicationForms();

  // Delete application forms from zoho analytics those are not in source
  const sourceIds = new Set(allApplicationForms.map((a) => a.id));
  const analytics = await zohoAnalyticService.exportApplicationForms();
  const needToDelete = analytics.data
    .filter((a) => !sourceIds.has(a.ID))
    .map((a) => a.ID);

  logger.info(
    `Application Forms: ${allApplicationForms.length}, Analytics: ${analytics.data.length}, Deleting ${needToDelete.length} application forms from Analytics`
  );
  if (needToDelete.length > 0) {
    const deleted = await zohoAnalyticService.deleteApplicationForms(
      needToDelete
    );
    logger.info(`Deleted ${deleted} application forms from Analytics`);
  }

  // Keep only applicants updated after the last sync
  const lastUpdated = await metadataService.getApplicationFormLastUpdated();
  let applicationForms = await zohoCrmService.getApplicationForms(lastUpdated);

  // If no new application forms to sync, return
  if (applicationForms.length === 0) {
    logger.info("No new application forms to sync");
    return 0;
  }

  // prefix fullName (useful for testing/demo environments)
  if (config.zohoAnalyticApi.fullNamePrefix) {
    applicationForms = applicationForms.map((applicationForm) => {
      applicationForm.First_Name = `${config.zohoAnalyticApi.fullNamePrefix} ${applicationForm.First_Name}`;
      return applicationForm;
    });
  }

  logger.info(`Syncing ${applicationForms.length} application forms...`);

  // Upsert each application form into Zoho and update metadata
  let success = 0;
  if (await zohoAnalyticService.upsertApplicationForms(applicationForms)) {
    await metadataService.upsertApplicationForm(
      applicationForms[applicationForms.length - 1].Modified_Time
    );
    success = applicationForms.length;
  }

  return success;
};

// Runs SyncApplicationForms() on the configured cron schedule
export const startApplicationFormSyncJob = () => {
  logger.info(
    `Starting application form sync job with schedule: ${config.cronSchedule}`
  );
  cron.schedule(
    config.cronSchedule,
    async () => {
      await SyncApplicationForms();
    },
    {
      timezone: "Asia/Dubai",
    }
  );
};
