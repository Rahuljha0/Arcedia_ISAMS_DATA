import { Metadata } from "../models/metadata.model.js";
import logger from "../utils/logger.js";

export const metadataService = {
  createOrUpdate: async (recordType, lastUpdatedAt) => {
    try {
      const [record, created] = await Metadata.findOrCreate({
        where: { recordType },
        defaults: { lastUpdatedAt, syncedAt: new Date() },
      });

      if (!created) {
        record.lastUpdatedAt = lastUpdatedAt;
        record.syncedAt = new Date();
        await record.save();
      }

      return record;
    } catch (err) {
      logger.error(`Error in createOrUpdate metadata (${recordType}):`, err);
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
  
  getEnrollmentLastUpdated: async () => metadataService.getLastUpdated("enrollment"),
  getWithdrawalLastUpdated: async () => metadataService.getLastUpdated("withdrawal"),
};
