import cron from "node-cron";
import logger from "../utils/logger.js";
import { arcadiaApi } from "../services/arcadia.service.js";
import { metadataService } from "../services/metadata.service.js";
import { zohoService } from "../services/zoho.service.js";
import { config } from "../config/env.js";
import { Withdrawal } from "../models/withdrawal.model.js";

export const SyncWithdrawal = async () => {  
  logger.info("Syncing withdrawals...");

  let page = 1;
  let pageSize = 300;
  let expand = 'customFields';
  let withdrawals = [];
  
  // fetch all withdrawals from Arcadia API in pages
  while (true) {
    const params = { page, pageSize, expand };
    const response = await arcadiaApi.getWithdrawals(params);
    withdrawals = withdrawals.concat(response.alumni || []);

    if (page >= response.totalPages) {
      break;
    }
    page++;
  }

  // sort withdrawals by lastUpdated in ascending order
  withdrawals.sort((a, b) => new Date(a.lastUpdated) - new Date(b.lastUpdated));

  // filter withdrawals that are not synced by lastUpdated
  const lastUpdated = await metadataService.getWithdrawalLastUpdated()
  withdrawals = withdrawals.filter((withdrawal) => new Date(withdrawal.lastUpdated) > new Date(lastUpdated));

  // sync withdrawals to Zoho
  for (const withdrawal of withdrawals) {
    const existing = await Withdrawal.findOne({ where: { personId: withdrawal.personId } });

    if (!existing) {
      await Withdrawal.create(withdrawal);
      await zohoService.addWithdrawal(withdrawal);
      await metadataService.createOrUpdate("withdrawal", withdrawal.lastUpdated);
    } else {
      await Withdrawal.update(withdrawal, { where: { personId: withdrawal.personId } });
      await zohoService.updateWithdrawal(withdrawal);
      await metadataService.createOrUpdate("withdrawal", withdrawal.lastUpdated);
    }
  }

  logger.info("Synced withdrawals successfully");
  return withdrawals.length;
};

// Run every 15 minutes
// cron.schedule(config.cronSchedule, async () => {
//   logger.info("Running scheduled SyncWithdrawal job...");
//   await SyncWithdrawal();
// });
