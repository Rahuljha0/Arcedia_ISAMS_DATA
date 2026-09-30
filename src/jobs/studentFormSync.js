import { withSyncedAt } from "../utils/syncStamp.js";
import cron from "node-cron";
import logger from "../utils/logger.js";
import { zohoCrmService } from "../services/zoho-crm.service.js";
import { metadataService } from "../services/metadata.service.js";
import { zohoAnalyticService } from "../services/zoho-analytic.service.js";
import { config } from "../config/env.js";
import { getReconciliationResult } from "../utils/syncReconciliation.js";

/**
 * SyncStudentForms
 * ------------
 * Fetches student form records from ZOHO CRM,
 * filters unsynced records based on `lastUpdated`,
 * and upserts them into Zoho Analytics.
 */
export const SyncStudentForms = async () => {
  // Fetch the complete source dataset for reconciliation.
  const allStudentForms = await zohoCrmService.getStudentForms();

  const pk = config.zohoAnalyticApi.primaryKeys.studentForm;
  const analytics = await zohoAnalyticService.exportStudentForms();
  const analyticsData = analytics?.data || [];

  const reconciliation = getReconciliationResult({
    sourceData: allStudentForms.map((studentForm) => ({
      ...studentForm,
      ID: studentForm.id,
    })),
    analyticsData,
    primaryKey: pk,
  });

  logger.info(
    `Student Forms reconciliation | Source=${reconciliation.sourceCount} | Analytics=${reconciliation.analyticsCount} | CountMismatch=${reconciliation.countMismatch} | KeyMismatch=${reconciliation.keyMismatch} | FullSync=${reconciliation.fullSync}`
  );

  if (reconciliation.extraInAnalytics.length > 0) {
    const deleted = await zohoAnalyticService.deleteStudentForms(
      reconciliation.extraInAnalytics
    );

    logger.info(
      `Student Forms: deleted ${deleted} records that no longer exist in source`
    );
  }

  let studentForms;

  if (reconciliation.fullSync) {
    studentForms = [...allStudentForms];

    logger.info(
      `Student Forms: reconciliation mismatch detected. Performing FULL sync of ${studentForms.length} records.`
    );
  } else {
    const lastUpdated = await metadataService.getStudentFormLastUpdated();

    studentForms = allStudentForms.filter(
      (studentForm) =>
        new Date(studentForm.Modified_Time) > new Date(lastUpdated)
    );

    logger.info(
      `Student Forms: source and Analytics are aligned. Performing incremental sync of ${studentForms.length} records.`
    );
  }

  // FULL REFRESH every run
  studentForms = [...allStudentForms];
  if (studentForms.length === 0) {
    logger.info("No student forms to sync");
    return 0;
  }

  if (config.zohoAnalyticApi.fullNamePrefix) {
    studentForms = studentForms.map((studentForm) => ({
      ...studentForm,
      First_Name: `${config.zohoAnalyticApi.fullNamePrefix} ${studentForm.First_Name || ""}`.trim(),
    }));
  }

  logger.info(
    `Student Forms: syncing ${studentForms.length} records using View ID ${config.zohoAnalyticApi.studentFormViewId} and primary key ${pk}`
  );

  if (await zohoAnalyticService.upsertStudentForms(withSyncedAt(studentForms))) {
    await metadataService.upsertStudentForm(
      studentForms[studentForms.length - 1].Modified_Time
    );

    logger.info(
      `Student Forms: sync completed successfully. Records processed=${studentForms.length}`
    );

    return studentForms.length;
  }

  return 0;
};

// Runs SyncStudentForms() on the configured cron schedule
export const startStudentFormSyncJob = () => {
  logger.info(
    `Starting student form sync job with schedule: ${config.cronInterval.studentForm}`
  );
  cron.schedule(
    config.cronInterval.studentForm,
    async () => {
      await SyncStudentForms();
    },
    {
      timezone: "Asia/Dubai",
    }
  );
};
