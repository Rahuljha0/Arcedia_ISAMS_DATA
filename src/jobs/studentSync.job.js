import cron from "node-cron";
import logger from "../utils/logger.js";
import { arcadiaApi } from "../services/arcadia.service.js";
import { metadataService } from "../services/metadata.service.js";
import { zohoService } from "../services/zoho.service.js";
import { config } from "../config/env.js";

/**
 * SyncStudents
 * ------------
 * Fetches student enrollment records from Arcadia API,
 * filters unsynced records based on `lastUpdated`,
 * and upserts them into Zoho Analytics.
 */
export const SyncStudents = async () => {  
  logger.info("Syncing students...");

  let page = 1;
  let pageSize = 300;
  let students = [];
  
  // Fetch students from Arcadia API in a paginated loop
  while (true) {
    const params = { page, pageSize };
    const response = await arcadiaApi.getEnrollmentStudents(params);
    students = students.concat(response.students || []);

    if (page >= response.totalPages) {
      break;
    }
    page++;
  }

  // Sort students by lastUpdated (oldest → newest)
  students.sort((a, b) => new Date(a.lastUpdated) - new Date(b.lastUpdated));
  
  // Keep only students updated after the last sync
  const lastUpdated = await metadataService.getEnrollmentLastUpdated();
  students = students.filter(
    (student) => new Date(student.lastUpdated) > new Date(lastUpdated)
  );

  // If no new students to sync, return
  if(students.length === 0) {
    logger.info("No new students to sync");
    return 0;
  }

  // prefix fullName (useful for testing/demo environments)
  if (config.zohoApi.fullNamePrefix) {
    students = students.map((student) => {
      student.fullName = `${config.zohoApi.fullNamePrefix} ${student.fullName}`;
      return student;
    });
  }

  logger.info(`Syncing ${students.length} students...`);

  // Upsert each student into Zoho and update metadata
  let success = 0;
  if(await zohoService.upsertEnrollments(students)) {
    await metadataService.upsertEnrollment(students[students.length - 1].lastUpdated);
    success = students.length;
  }

  logger.info(`Synced ${success} students successfully`);
  return success;
};

// Runs SyncStudents() on the configured cron schedule
export const startStudentSyncJob = () => {
  logger.info(`Starting student sync job with schedule: ${config.cronSchedule}`);
  cron.schedule(config.cronSchedule, async () => {
    logger.info("Running scheduled sync job...");
    await SyncStudents();
  }, {
    timezone: "Asia/Dubai"
  });
};
