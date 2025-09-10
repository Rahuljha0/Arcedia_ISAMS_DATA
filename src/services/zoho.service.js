import { http } from "../utils/http.js";
import { config } from "../config/env.js";
import logger from "../utils/logger.js";
import FormData from "form-data";

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
      logger.error("Error getting access token:", err.response?.data || err.message);
      throw err;
    }
  },

  upsertEnrollment: async (token, student) => {
    try {
      const formdata = new FormData();
      formdata.append(
        "CONFIG",
        JSON.stringify({
          criteria: `"id"='${student.id}'`,
          addIfNotExist: true,
          columns: student,
        })
      );

      const headers = {
        ...formdata.getHeaders(),
        "ZANALYTICS-ORGID": config.zohoApi.orgId,
        Authorization: `Zoho-oauthtoken ${token}`,
      };

      const updated = await http.put(
        config.zohoApi.upsertEnrollmentUrl,
        formdata,
        { headers }
      );

      return updated.data;
    } catch (err) {
      logger.error("Zoho Enrollment Error", err.response?.data || err.message);
      return null;
    }
  },

  upsertWithdrawal: async (token, withdrawal) => {
    try {
      const formdata = new FormData();
      formdata.append(
        "CONFIG",
        JSON.stringify({
          criteria: `"personId"='${withdrawal.personId}'`,
          addIfNotExist: true,
          columns: withdrawal,
        })
      );

      const headers = {
        ...formdata.getHeaders(),
        "ZANALYTICS-ORGID": config.zohoApi.orgId,
        Authorization: `Zoho-oauthtoken ${token}`,
      };

      const updated = await http.put(config.zohoApi.upsertWithdrawalUrl, formdata, {
        headers,
      });
      return updated.data;
    } catch (err) {
      logger.error("Zoho Withdrawal Error", err.response?.data || err.message);
      return null;
    }
  },
};
