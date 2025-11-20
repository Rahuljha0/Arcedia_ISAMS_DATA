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
  let allProspectForms = await zohoCrmService.getProspectForms();

  // Delete student forms from zoho analytics those are not in source
  const pk = config.zohoAnalyticApi.primaryKeys.prospectForm;
  const sourcePk = pk.toLowerCase();
  const sourceIds = new Set(allProspectForms.map((a) => a[sourcePk]));
  const analytics = await zohoAnalyticService.exportProspects();
  const needToDelete = analytics.data
    .filter((a) => !sourceIds.has(a[pk]))
    .map((a) => a[pk]);

  logger.info(
    `Prospect Forms: ${allProspectForms.length}, Analytics: ${analytics.data.length}, Deleting ${needToDelete.length} prospect forms from Analytics`
  );
  if (needToDelete.length > 0) {
    const deleted = await zohoAnalyticService.deleteProspects(needToDelete);
    logger.info(`Deleted ${deleted} prospect forms from Analytics`);
  }

  // Keep only student forms updated after the last sync
  const lastUpdated = await metadataService.getProspectFormLastUpdated();
  let prospects = await zohoCrmService.getProspectForms(lastUpdated);

  // If no new prospects to sync, return
  if (prospects.length === 0) {
    logger.info("No new prospect forms to sync");
    return 0;
  }

  // prefix fullName (useful for testing/demo environments)
  if (config.zohoAnalyticApi.fullNamePrefix) {
    prospects = prospects.map((prospect) => {
      prospect.First_Name = `${config.zohoAnalyticApi.fullNamePrefix} ${prospect.First_Name}`;
      return prospect;
    });
  }

  logger.info(`Syncing ${prospects.length} prospect forms...`);

  // Upsert each prospect into Zoho and update metadata
  let success = 0;
  if (await zohoAnalyticService.upsertProspects(prospects)) {
    await metadataService.upsertProspectForm(
      prospects[prospects.length - 1].Modified_Time
    );
    success = prospects.length;
  }

  return success;
};

// Runs SyncProspects() on the configured cron schedule
export const startProspectFormSyncJob = () => {
  logger.info(
    `Starting prospect form sync job with schedule: ${config.cronInterval.prospectForm}`
  );
  cron.schedule(
    config.cronInterval.prospectForm,
    async () => {
      await SyncProspectForms();
    },
    {
      timezone: "Asia/Dubai",
    }
  );
};
