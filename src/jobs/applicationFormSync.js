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
  logger.info("Syncing application forms...");

  let applicationForms = await zohoCrmService.getApplicationForms();

  // Sort application forms by lastUpdated (oldest → newest)
  applicationForms.sort((a, b) => new Date(a.Modified_Time) - new Date(b.Modified_Time));

  // Keep only application forms updated after the last sync
  const lastUpdated = await metadataService.getApplicationFormLastUpdated();
  applicationForms = applicationForms.filter(
    (applicationForm) => new Date(applicationForm.Modified_Time) > new Date(lastUpdated)
  );

  // If no new application forms to sync, return
  if(applicationForms.length === 0) {
    logger.info("No new application forms to sync");
    return 0;
  }

  // prefix fullName (useful for testing/demo environments)
  if (config.zohoApi.fullNamePrefix) {
    applicationForms = applicationForms.map((applicationForm) => {
      applicationForm.First_Name = `${config.zohoApi.fullNamePrefix} ${applicationForm.First_Name}`;
      return applicationForm;
    });
  }

  logger.info(`Syncing ${applicationForms.length} application forms...`);

  // Upsert each application form into Zoho and update metadata
  let success = 0;
  if(await zohoAnalyticService.upsertApplicationForms(applicationForms)) {
    await metadataService.upsertApplicationForm(applicationForms[applicationForms.length - 1].Modified_Time);
    success = applicationForms.length;
  }

  logger.info(`Synced ${success} application forms successfully`);
  return success;
};

// Runs SyncApplicationForms() on the configured cron schedule
export const startApplicationFormSyncJob = () => {
  logger.info(`Starting application form sync job with schedule: ${config.cronSchedule}`);
  cron.schedule(config.cronSchedule, async () => {
    logger.info("Running scheduled sync job...");
    await SyncApplicationForms();
  }, {
    timezone: "Asia/Dubai"
  });
};
