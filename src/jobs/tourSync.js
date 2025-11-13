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
  let tours = await zohoBookingService.getTours({
    from_time: "01-01-2023",
    to_time: dayjs().format("DD-MMM-YYYY"),
  });

  // Sort tours by lastUpdated (oldest → newest)
  tours.sort(
    (a, b) => new Date(a.last_updated_time) - new Date(b.last_updated_time)
  );

  // Delete tours from zoho analytics those are not in source
  const pk = config.zohoAnalyticApi.primaryKeys.tour;
  const sourceIds = new Set(tours.map((a) => a[pk]));
  const analytics = await zohoAnalyticService.exportTours();
  const needToDelete = analytics.data
    .filter((a) => !sourceIds.has(a[pk]))
    .map((a) => a[pk]);

  logger.info(
    `Tours: ${tours.length}, Analytics: ${analytics.data.length}, Deleting ${needToDelete.length} tours from Analytics`
  );
  if (needToDelete.length > 0) {
    const deleted = await zohoAnalyticService.deleteTours(needToDelete);
    logger.info(`Deleted ${deleted} tours from Analytics`);
  }

  // Keep only tours updated after the last sync
  const lastUpdated = await metadataService.getTourLastUpdated();
  tours = tours.filter(
    (tour) => new Date(tour.last_updated_time) > new Date(lastUpdated)
  );

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
