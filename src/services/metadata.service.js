import { Metadata } from "../models/metadata.model.js";
import logger from "../utils/logger.js";

export const metadataService = {
  upsert: async (recordType, lastUpdatedAt) => {
    try {
      const [record, created] = await Metadata.findOrCreate({
        where: { recordType },
        defaults: { lastUpdatedAt },
      });

      if (!created) {
        record.lastUpdatedAt = lastUpdatedAt;
        await record.save();
      }

      return record;
    } catch (err) {
      logger.error(`Error in upsert metadata (${recordType}):`, err);
      throw err;
    }
  },

  getLastUpdated: async (recordType) => {
    try {
      const record = await Metadata.findOne({ where: { recordType } });
      return record?.lastUpdatedAt || null;
    } catch (err) {
      logger.error(`Error in getLastUpdated metadata (${recordType}):`, err);
      throw err;
    }
  },
  
  upsertEnrollment: async (lastUpdatedAt) => metadataService.upsert("enrollment", lastUpdatedAt),
  upsertWithdrawal: async (lastUpdatedAt) => metadataService.upsert("withdrawal", lastUpdatedAt),
  getEnrollmentLastUpdated: async () => metadataService.getLastUpdated("enrollment"),
  getWithdrawalLastUpdated: async () => metadataService.getLastUpdated("withdrawal"),
};
