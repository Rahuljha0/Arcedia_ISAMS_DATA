import cron from "node-cron";
import logger from "../utils/logger.js";
import { metadataService } from "../services/metadata.service.js";
import { zohoAnalyticService } from "../services/zoho-analytic.service.js";
import { config } from "../config/env.js";
import { zohoBookingService } from "../services/zoho-booking.service.js";
import dayjs from "dayjs";

/**
 * SyncAssessments
 * ------------
 * Fetches assessment records from ZOHO Booking,
 * filters unsynced records based on `lastUpdated`,
 * and upserts them into Zoho Analytics.
 */
export const SyncAssessments = async () => {
  let assessments = await zohoBookingService.getAssessments({
    from_time: "28-08-2025",
    to_time: dayjs().format("DD-MMM-YYYY"),
  });

  // Sort assessments by lastUpdated (oldest → newest)
  assessments.sort((a, b) => new Date(a.last_updated_time) - new Date(b.last_updated_time));

  // Delete assessments from zoho analytics those are not in source
  const pk = config.zohoAnalyticApi.primaryKeys.assessment;
  const sourceIds = new Set(assessments.map((a) => a[pk]));
  const analytics = await zohoAnalyticService.exportAssessments();
  const needToDelete = analytics.data.filter((a) => !sourceIds.has(a[pk])).map((a) => a[pk]);

  logger.info(`Assessments: ${assessments.length}, Analytics: ${analytics.data.length}, Deleting ${needToDelete.length} assessments from Analytics`);
  if (needToDelete.length > 0) {
    const deleted = await zohoAnalyticService.deleteAssessments(needToDelete);
    logger.info(`Deleted ${deleted} assessments from Analytics`);
  }

  // Keep only tours updated after the last sync
  const lastUpdated = await metadataService.getAssessmentLastUpdated();
  assessments = assessments.filter((assessment) => new Date(assessment.last_updated_time) > new Date(lastUpdated));

  // If no new tours to sync, return
  if (assessments.length === 0) {
    logger.info("No new tours to sync");
    return 0;
  }

  // prefix fullName (useful for testing/demo environments)
  if (config.zohoAnalyticApi.fullNamePrefix) {
    assessments = assessments.map((assessment) => {
      assessment.customer_name = `${config.zohoAnalyticApi.fullNamePrefix} ${assessment.customer_name}`;
      return assessment;
    });
  }

  logger.info(`Syncing ${assessments.length} assessments...`);

  // Upsert each assessment into Zoho and update metadata
  let success = 0;
  if (await zohoAnalyticService.upsertAssessments(assessments)) {
    await metadataService.upsertAssessment(assessments[assessments.length - 1].last_updated_time);
    success = assessments.length;
  }

  return success;
};

// Runs SyncTours() on the configured cron schedule
export const startAssessmentSyncJob = () => {
  logger.info(`Starting assessment sync job with schedule: ${config.cronInterval.assessment}`);
  cron.schedule(
    config.cronInterval.assessment,
    async () => {
      await SyncAssessments();
    },
    {
      timezone: "Asia/Dubai",
    },
  );
};
