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

  bulkUpsertRequest: async (url, data, matchingColumns = []) => {
    const token = await zohoService.getAccessToken();
    if (!token) return null;

    const formdata = new FormData();
    formdata.append("DATA", JSON.stringify(data));

    const headers = {
      ...formdata.getHeaders(),
      "ZANALYTICS-ORGID": config.zohoApi.orgId,
      Authorization: `Zoho-oauthtoken ${token}`,
    };

    const configJson = {
      matchingColumns,
      importType: "updateadd",
      fileType: "json",
      autoIdentify: true,
    };

    const fullUrl = `${url}?CONFIG=${encodeURIComponent(JSON.stringify(configJson))}`;

    return await http.post(fullUrl, formdata, { headers });
  },

  upsertEnrollments: async (students) => {
    try {
      // Extract custom fields from each withdrawal
      const flatStudents = [...students].map((student) => {
        student.languages = student.languages.join(",");
        student.nationalities = student.nationalities.join(",");

        return student;
      });

      const response = await zohoService.bulkUpsertRequest(config.zohoApi.bulkImportEnrollmentUrl, flatStudents, ["id"]);
      logger.info("Zoho Bulk Enrollment Success", response.data);
      return response.data;
    } catch (err) {
      logger.error("Zoho Bulk Enrollment Error", err.response?.data || err.message);
      return null;
    }
  },

  upsertWithdrawals: async (withdrawals) => {
    try {
      // Extract custom fields from each withdrawal
      const flatWithdrawals = [...withdrawals].map((withdrawal) => {
        const customFields = withdrawal.customFields;
        delete withdrawal.customFields;

        customFields.map((field) => {
          withdrawal[field.name.trim()] = field.value;
        });

        withdrawal.languages = withdrawal.languages.join(",");
        withdrawal.nationalities = withdrawal.nationalities.join(",");

        return withdrawal;
      });

      const response = await zohoService.bulkUpsertRequest(config.zohoApi.bulkImportWithdrawalUrl, flatWithdrawals, ["personId"]);
      logger.info("Zoho Bulk Withdrawal Success", response.data);
      return response.data;
    } catch (err) {
      logger.error("Zoho Bulk Withdrawal Error", err.response?.data || err.message);
      return null;
    }
  },
}