import cron from "node-cron";
import logger from "../utils/logger.js";
import { zohoCrmService } from "../services/zoho-crm.service.js";
import { metadataService } from "../services/metadata.service.js";
import { zohoAnalyticService } from "../services/zoho-analytic.service.js";
import { config } from "../config/env.js";

/**
 * SyncStudentForms
 * ------------
 * Fetches student form records from ZOHO CRM,
 * filters unsynced records based on `lastUpdated`,
 * and upserts them into Zoho Analytics.
 */
export const SyncStudentForms = async () => {
  const lastUpdated = await metadataService.getStudentFormLastUpdated();
  let studentForms = await zohoCrmService.getStudentForms(lastUpdated);

  // If no new student forms to sync, return
  if (studentForms.length === 0) {
    logger.info("No new student forms to sync");
    return 0;
  }

  // prefix fullName (useful for testing/demo environments)
  if (config.zohoAnalyticApi.fullNamePrefix) {
    studentForms = studentForms.map((studentForm) => {
      studentForm.First_Name = `${config.zohoAnalyticApi.fullNamePrefix} ${studentForm.First_Name}`;
      return studentForm;
    });
  }

  logger.info(`Syncing ${studentForms.length} student forms...`);

  // Upsert each student form into Zoho and update metadata
  let success = 0;
  if (await zohoAnalyticService.upsertStudentForms(studentForms)) {
    await metadataService.upsertStudentForm(
      studentForms[studentForms.length - 1].Modified_Time
    );
    success = studentForms.length;
  }

  return success;
};

// Runs SyncStudentForms() on the configured cron schedule
export const startStudentFormSyncJob = () => {
  logger.info(
    `Starting student form sync job with schedule: ${config.cronSchedule}`
  );
  cron.schedule(
    config.cronSchedule,
    async () => {
      await SyncStudentForms();
    },
    {
      timezone: "Asia/Dubai",
    }
  );
};
