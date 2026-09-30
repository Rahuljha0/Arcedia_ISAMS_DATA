import { withSyncedAt } from "../utils/syncStamp.js";
import cron from "node-cron";
import logger from "../utils/logger.js";
import { zohoCrmService } from "../services/zoho-crm.service.js";
import { metadataService } from "../services/metadata.service.js";
import { zohoAnalyticService } from "../services/zoho-analytic.service.js";
import { config } from "../config/env.js";
import { getReconciliationResult } from "../utils/syncReconciliation.js";

export const SyncApplicationForms = async () => {
  const allApplicationForms =
    await zohoCrmService.getApplicationForms();

  const pk = config.zohoAnalyticApi.primaryKeys.applicationForm;

  const analytics = await zohoAnalyticService.exportApplicationForms();
  const analyticsData = analytics?.data || [];

  const reconciliation = getReconciliationResult({
    sourceData: allApplicationForms,
    analyticsData,
    primaryKey: pk,
  });

  logger.info(
    `Application Forms reconciliation | Source=${reconciliation.sourceCount} | Analytics=${reconciliation.analyticsCount} | CountMismatch=${reconciliation.countMismatch} | KeyMismatch=${reconciliation.keyMismatch} | FullSync=${reconciliation.fullSync}`
  );

  if (reconciliation.extraInAnalytics.length > 0) {
    const deleted = await zohoAnalyticService.deleteApplicationForms(
      reconciliation.extraInAnalytics
    );

    logger.info(
      `Application Forms: deleted ${deleted} records that no longer exist in source`
    );
  }

  let recordsToSync;

  if (reconciliation.fullSync) {
    recordsToSync = [...allApplicationForms];

    logger.info(
      `Application Forms: reconciliation mismatch detected. Performing FULL sync of ${recordsToSync.length} records.`
    );
  } else {
    const lastUpdated =
      await metadataService.getApplicationFormLastUpdated();

    recordsToSync = allApplicationForms.filter(
      (applicationForm) =>
        new Date(applicationForm.Modified_Time) >
        new Date(lastUpdated)
    );

    logger.info(
      `Application Forms: source and Analytics are aligned. Performing incremental sync of ${recordsToSync.length} records.`
    );
  }

  // FULL REFRESH every run
  recordsToSync = [...allApplicationForms];
  if (recordsToSync.length === 0) {
    logger.info("No new or changed application forms to sync");
    return 0;
  }

  if (config.zohoAnalyticApi.fullNamePrefix) {
    recordsToSync = recordsToSync.map((applicationForm) => ({
      ...applicationForm,
      First_Name: `${config.zohoAnalyticApi.fullNamePrefix} ${applicationForm.First_Name}`,
    }));
  }

  logger.info(
    `Application Forms: syncing ${recordsToSync.length} records using View ID ${config.zohoAnalyticApi.applicationFormViewId} and primary key ${pk}`
  );

  const result =
    await zohoAnalyticService.upsertApplicationForms(withSyncedAt(recordsToSync));

  if (!result) {
    logger.error("Application Forms: Zoho Analytics sync failed");
    return 0;
  }

  await metadataService.upsertApplicationForm(
    recordsToSync[recordsToSync.length - 1].Modified_Time
  );

  logger.info(
    `Application Forms: sync completed successfully. Records processed=${recordsToSync.length}`
  );

  return recordsToSync.length;
};

export const startApplicationFormSyncJob = () => {
  logger.info(
    `Starting application form sync job with schedule: ${config.cronInterval.applicationForm}`
  );

  cron.schedule(
    config.cronInterval.applicationForm,
    async () => {
      try {
        await SyncApplicationForms();
      } catch (error) {
        logger.error(
          "Application Form sync job failed",
          error.response?.data || error.message
        );
      }
    },
    {
      timezone: "Asia/Dubai",
    }
  );
};
