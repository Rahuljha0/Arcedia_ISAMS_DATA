import { http } from "../utils/http.js";
import { config } from "../config/env.js";
import logger from "../utils/logger.js";

export const zohoService = {
  getAccessToken: async () => {
    try {
      const res = await http.post(config.zohoApi.accessTokenUrl, null, {
        params: {
          client_id: config.zohoApi.clientId,
          client_secret: config.zohoApi.clientSecret,
          refresh_token: config.zohoApi.refreshToken,
          grant_type: "refresh_token",
        },
      });
      return res.data.access_token;
    } catch (err) {
      console.error("Error getting access token:", err.response?.data || err.message);
      throw err;
    }
  },
  addStudent: async (student) => {
    try {
      const created = await http.post(config.zohoApi.addEnrollmentUrl, { data: student });
      return created;
    } catch (err) {
      logger.error("Zoho Add Error", err.response?.data || err.message);
      return null;
    }
  },
  updateStudent: async (student) => {
    try {
      const updated = await http.post(config.zohoApi.updateEnrollmentUrl, { criteria: `(personId=${student.personId})`, data: student });
      return updated;
    } catch (err) {
      logger.error("Zoho Update Error", err.response?.data || err.message);
      return null;
    }
  },
  addWithdrawal: async (withdrawal) => {
    try {
      const created = await http.post(config.zohoApi.addWithdrawalUrl, { data: withdrawal });
      return created;
    } catch (err) {
      logger.error("Zoho Add Error", err.response?.data || err.message);
      return null;
    }
  },
  updateWithdrawal: async (withdrawal) => {
    try {
      const updated = await http.post(config.zohoApi.updateWithdrawalUrl, { criteria: `(personId=${withdrawal.personId})`, data: withdrawal });
      return updated;
    } catch (err) {
      logger.error("Zoho Update Error", err.response?.data || err.message);
      return null;
    }
  },
};
