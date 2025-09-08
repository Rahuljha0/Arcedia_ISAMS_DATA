import { http } from "../utils/http.js";
import { config } from "../config/env.js";
import logger from "../utils/logger.js";

export const zohoService = {
  addStudent: async (student) => {
    try {
      const created = await http.post(config.zohoApi.addUrl, { data: student });
      return created;
    } catch (err) {
      logger.error("Zoho Add Error", err.response?.data || err.message);
      return null;
    }
  },
  updateStudent: async (student) => {
    try {
      const updated = await http.post(config.zohoApi.updateUrl, { criteria: `(personId=${student.personId})`, data: student });
      return updated;
    } catch (err) {
      logger.error("Zoho Update Error", err.response?.data || err.message);
      return null;
    }
  },
  addWithdrawal: async (withdrawal) => {
    try {
      const created = await http.post(config.zohoApi.addUrl, { data: withdrawal });
      return created;
    } catch (err) {
      logger.error("Zoho Add Error", err.response?.data || err.message);
      return null;
    }
  },
  updateWithdrawal: async (withdrawal) => {
    try {
      const updated = await http.post(config.zohoApi.updateUrl, { criteria: `(personId=${withdrawal.personId})`, data: withdrawal });
      return updated;
    } catch (err) {
      logger.error("Zoho Update Error", err.response?.data || err.message);
      return null;
    }
  },
};
