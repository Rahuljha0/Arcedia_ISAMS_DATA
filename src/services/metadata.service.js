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
  upsertApplicant: async (lastUpdatedAt) => metadataService.upsert("applicant", lastUpdatedAt),
  upsertApplicationForm: async (lastUpdatedAt) => metadataService.upsert("applicationForm", lastUpdatedAt),
  upsertProspectForm: async (lastUpdatedAt) => metadataService.upsert("prospectForm", lastUpdatedAt),
  upsertStudentForm: async (lastUpdatedAt) => metadataService.upsert("studentForm", lastUpdatedAt),
  upsertTour: async (lastUpdatedAt) => metadataService.upsert("tour", lastUpdatedAt),
  upsertAssessment: async (lastUpdatedAt) => metadataService.upsert("assessment", lastUpdatedAt),

  getEnrollmentLastUpdated: async () => metadataService.getLastUpdated("enrollment"),
  getWithdrawalLastUpdated: async () => metadataService.getLastUpdated("withdrawal"),
  getApplicantLastUpdated: async () => metadataService.getLastUpdated("applicant"),
  getApplicationFormLastUpdated: async () => metadataService.getLastUpdated("applicationForm"),
  getProspectFormLastUpdated: async () => metadataService.getLastUpdated("prospectForm"),
  getStudentFormLastUpdated: async () => metadataService.getLastUpdated("studentForm"),
  getTourLastUpdated: async () => metadataService.getLastUpdated("tour"),
  getAssessmentLastUpdated: async () => metadataService.getLastUpdated("assessment"),
};
