import cron from "node-cron";
import logger from "../utils/logger.js";
import { metadataService } from "../services/metadata.service.js";
import { zohoAnalyticService } from "../services/zoho-analytic.service.js";
import { config } from "../config/env.js";
import { zohoBookingService } from "../services/zoho-booking.service.js";
import dayjs from "dayjs";

/**
 * SyncTours
 * ------------
 * Fetches tour records from ZOHO Booking,
 * filters unsynced records based on `lastUpdated`,
 * and upserts them into Zoho Analytics.
 */
export const SyncTours = async () => {
  const lastUpdated =
    (await metadataService.getTourLastUpdated()) || "2023-04-01";
  const from_time = dayjs(lastUpdated).format("DD-MMM-YYYY");
  const to_time = dayjs().format("DD-MMM-YYYY");
  const workspace_id = "4501039000000033018";

  let tours = await zohoBookingService.getTours({
    workspace_id,
    from_time,
    to_time,
  });

  // If no new tours to sync, return
  if (tours.length === 0) {
    logger.info("No new tours to sync");
    return 0;
  }

  // prefix fullName (useful for testing/demo environments)
  if (config.zohoAnalyticApi.fullNamePrefix) {
    tours = tours.map((tour) => {
      tour.customer_name = `${config.zohoAnalyticApi.fullNamePrefix} ${tour.customer_name}`;
      return tour;
    });
  }

  logger.info(`Syncing ${tours.length} tours...`);

  // Upsert each tour into Zoho and update metadata
  let success = 0;
  if (await zohoAnalyticService.upsertTours(tours)) {
    await metadataService.upsertTour(tours[tours.length - 1].last_updated_time);
    success = tours.length;
  }

  return success;
};

// Runs SyncTours() on the configured cron schedule
export const startTourSyncJob = () => {
  logger.info(`Starting tour sync job with schedule: ${config.cronSchedule}`);
  cron.schedule(
    config.cronSchedule,
    async () => {
      await SyncTours();
    },
    {
      timezone: "Asia/Dubai",
    }
  );
};
