import { withSyncedAt } from "../utils/syncStamp.js";
import cron from "node-cron";
import logger from "../utils/logger.js";
import { zohoCrmService } from "../services/zoho-crm.service.js";
import { metadataService } from "../services/metadata.service.js";
import { zohoAnalyticService } from "../services/zoho-analytic.service.js";
import { config } from "../config/env.js";
import { getReconciliationResult } from "../utils/syncReconciliation.js";

export const SyncProspectForms = async () => {
  const allProspectForms =
    await zohoCrmService.getProspectForms();

  const pk = config.zohoAnalyticApi.primaryKeys.prospectForm;

  const analytics = await zohoAnalyticService.exportProspects();
  const analyticsData = analytics?.data || [];

  const reconciliation = getReconciliationResult({
    sourceData: allProspectForms,
    analyticsData,
    primaryKey: pk,
  });

  logger.info(
    `Prospect Forms reconciliation | Source=${reconciliation.sourceCount} | Analytics=${reconciliation.analyticsCount} | CountMismatch=${reconciliation.countMismatch} | KeyMismatch=${reconciliation.keyMismatch} | FullSync=${reconciliation.fullSync}`
  );

  if (reconciliation.extraInAnalytics.length > 0) {
    const deleted = await zohoAnalyticService.deleteProspects(
      reconciliation.extraInAnalytics
    );

    logger.info(
      `Prospect Forms: deleted ${deleted} records that no longer exist in source`
    );
  }

  let recordsToSync;

  if (reconciliation.fullSync) {
    recordsToSync = [...allProspectForms];

    logger.info(
      `Prospect Forms: reconciliation mismatch detected. Performing FULL sync of ${recordsToSync.length} records.`
    );
  } else {
    const lastUpdated =
      await metadataService.getProspectFormLastUpdated();

    recordsToSync = allProspectForms.filter(
      (prospect) =>
        new Date(prospect.Modified_Time) >
        new Date(lastUpdated)
    );

    logger.info(
      `Prospect Forms: source and Analytics are aligned. Performing incremental sync of ${recordsToSync.length} records.`
    );
  }

  // FULL REFRESH every run
  recordsToSync = [...allProspectForms];
  if (recordsToSync.length === 0) {
    logger.info("No new or changed prospect forms to sync");
    return 0;
  }

  if (config.zohoAnalyticApi.fullNamePrefix) {
    recordsToSync = recordsToSync.map((prospect) => ({
      ...prospect,
      First_Name: `${config.zohoAnalyticApi.fullNamePrefix} ${prospect.First_Name}`,
    }));
  }

  logger.info(
    `Prospect Forms: syncing ${recordsToSync.length} records using View ID ${config.zohoAnalyticApi.prospectFormViewId} and primary key ${pk}`
  );

  const result =
    await zohoAnalyticService.upsertProspects(withSyncedAt(recordsToSync));

  if (!result) {
    logger.error("Prospect Forms: Zoho Analytics sync failed");
    return 0;
  }

  await metadataService.upsertProspectForm(
    recordsToSync[recordsToSync.length - 1].Modified_Time
  );

  logger.info(
    `Prospect Forms: sync completed successfully. Records processed=${recordsToSync.length}`
  );

  return recordsToSync.length;
};

export const startProspectFormSyncJob = () => {
  logger.info(
    `Starting prospect form sync job with schedule: ${config.cronInterval.prospectForm}`
  );

  cron.schedule(
    config.cronInterval.prospectForm,
    async () => {
      try {
        await SyncProspectForms();
      } catch (error) {
        logger.error(
          "Prospect Form sync job failed",
          error.response?.data || error.message
        );
      }
    },
    {
      timezone: "Asia/Dubai",
    }
  );
};
