import cron from "node-cron";
import logger from "../utils/logger.js";
import { syncEnrollments } from "../services/sync.service.js";
import { config } from "../config/env.js";

// Run every 15 minutes
cron.schedule(config.cronSchedule, async () => {
  logger.info("Running scheduled sync job...");
  await syncEnrollments();
  await syncWithdrawals();
});
