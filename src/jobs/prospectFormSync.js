import cron from "node-cron";
import logger from "../utils/logger.js";
import { zohoCrmService } from "../services/zoho-crm.service.js";
import { metadataService } from "../services/metadata.service.js";
import { zohoAnalyticService } from "../services/zoho-analytic.service.js";
import { config } from "../config/env.js";

/**
 * SyncProspects
 * ------------
 * Fetches prospect records from ZOHO CRM,
 * filters unsynced records based on `lastUpdated`,
 * and upserts them into Zoho Analytics.
 */
export const SyncProspectForms = async () => {  
  logger.info("Syncing prospect forms...");

  let prospects = await zohoCrmService.getProspectForms();

  // Sort prospects by lastUpdated (oldest → newest)
  prospects.sort((a, b) => new Date(a.Modified_Time) - new Date(b.Modified_Time));

  // Keep only prospects updated after the last sync
  const lastUpdated = await metadataService.getProspectFormLastUpdated();
  prospects = prospects.filter(
    (prospect) => new Date(prospect.Modified_Time) > new Date(lastUpdated)
  );

  // If no new prospects to sync, return
  if(prospects.length === 0) {
    logger.info("No new prospect forms to sync");
    return 0;
  }

  // prefix fullName (useful for testing/demo environments)
  if (config.zohoApi.fullNamePrefix) {
    prospects = prospects.map((prospect) => {
      prospect.First_Name = `${config.zohoApi.fullNamePrefix} ${prospect.First_Name}`;
      return prospect;
    });
  }

  logger.info(`Syncing ${prospects.length} prospect forms...`);

  // Upsert each prospect into Zoho and update metadata
  let success = 0;
  if(await zohoAnalyticService.upsertProspects(prospects)) {
    await metadataService.upsertProspectForm(prospects[prospects.length - 1].Modified_Time);
    success = prospects.length;
  }

  logger.info(`Synced ${success} prospect forms successfully`);
  return success;
};

// Runs SyncProspects() on the configured cron schedule
export const startProspectFormSyncJob = () => {
  logger.info(`Starting prospect form sync job with schedule: ${config.cronSchedule}`);
  cron.schedule(config.cronSchedule, async () => {
    logger.info("Running scheduled sync job...");
    await SyncProspectForms();
  }, {
    timezone: "Asia/Dubai"
  });
};
