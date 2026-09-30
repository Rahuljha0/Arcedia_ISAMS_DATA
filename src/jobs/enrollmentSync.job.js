import { withSyncedAt } from "../utils/syncStamp.js";
import cron from "node-cron";
import logger from "../utils/logger.js";
import { arcadiaApi } from "../services/arcadia.service.js";
import { metadataService } from "../services/metadata.service.js";
import { zohoAnalyticService } from "../services/zoho-analytic.service.js";
import { config } from "../config/env.js";
import { getReconciliationResult } from "../utils/syncReconciliation.js";

export const SyncEnrollments = async () => {
  let page = 1;
  const pageSize = 300;
  let students = [];

  while (true) {
    const response = await arcadiaApi.getEnrollmentStudents({
      page,
      pageSize,
    });

    students = students.concat(response?.students || []);

    if (
      !response?.totalPages ||
      !response?.students ||
      page >= Number(response.totalPages)
    ) {
      break;
    }

    page++;
  }

  students.sort(
    (a, b) => new Date(a.lastUpdated) - new Date(b.lastUpdated)
  );

  const pk = config.zohoAnalyticApi.primaryKeys.enrollment;

  const analytics = await zohoAnalyticService.exportEnrollments();
  const analyticsData = analytics?.data || [];

  const reconciliation = getReconciliationResult({
    sourceData: students,
    analyticsData,
    primaryKey: pk,
  });

  logger.info(
    `Enrollments reconciliation | Source=${reconciliation.sourceCount} | Analytics=${reconciliation.analyticsCount} | CountMismatch=${reconciliation.countMismatch} | KeyMismatch=${reconciliation.keyMismatch} | FullSync=${reconciliation.fullSync}`
  );

  if (reconciliation.extraInAnalytics.length > 0) {
    const deleted = await zohoAnalyticService.deleteEnrollments(
      reconciliation.extraInAnalytics
    );

    logger.info(
      `Enrollments: deleted ${deleted} records that no longer exist in source`
    );
  }

  let recordsToSync;

  if (reconciliation.fullSync) {
    recordsToSync = [...students];

    logger.info(
      `Enrollments: reconciliation mismatch detected. Performing FULL sync of ${recordsToSync.length} records.`
    );
  } else {
    const lastUpdated = await metadataService.getEnrollmentLastUpdated();

    recordsToSync = students.filter(
      (student) =>
        new Date(student.lastUpdated) > new Date(lastUpdated)
    );

    logger.info(
      `Enrollments: source and Analytics are aligned. Performing incremental sync of ${recordsToSync.length} records.`
    );
  }

  // FULL REFRESH every run
  recordsToSync = [...students];
  if (recordsToSync.length === 0) {
    logger.info("No new or changed enrollments to sync");
    return 0;
  }

  if (config.zohoAnalyticApi.fullNamePrefix) {
    recordsToSync = recordsToSync.map((student) => ({
      ...student,
      fullName: `${config.zohoAnalyticApi.fullNamePrefix} ${student.fullName}`,
    }));
  }

  logger.info(
    `Enrollments: syncing ${recordsToSync.length} records using View ID ${config.zohoAnalyticApi.enrollmentViewId} and primary key ${pk}`
  );

  const result = await zohoAnalyticService.upsertEnrollments(withSyncedAt(recordsToSync));

  if (!result) {
    logger.error("Enrollments: Zoho Analytics sync failed");
    return 0;
  }

  await metadataService.upsertEnrollment(
    recordsToSync[recordsToSync.length - 1].lastUpdated
  );

  logger.info(
    `Enrollments: sync completed successfully. Records processed=${recordsToSync.length}`
  );

  return recordsToSync.length;
};

export const startEnrollmentSyncJob = () => {
  logger.info(
    `Starting enrollment sync job with schedule: ${config.cronInterval.enrollment}`
  );

  cron.schedule(
    config.cronInterval.enrollment,
    async () => {
      try {
        await SyncEnrollments();
      } catch (error) {
        logger.error(
          "Enrollment sync job failed",
          error.response?.data || error.message
        );
      }
    },
    {
      timezone: "Asia/Dubai",
    }
  );
};
