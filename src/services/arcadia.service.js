import { http } from "../utils/http.js";
import { config } from "../config/env.js";
import logger from "../utils/logger.js";

export const arcadiaApi = {
  getAccessToken: async () => {
    const payload = {
      client_id: config.clientApi.clientId,
      client_secret: config.clientApi.clientSecret,
      grant_type: "client_credentials",
      scope: "restapi",
    };
  
    try {
      const { data } = await http.post(config.clientApi.accessTokenUrl,
        payload,
        { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
      );
    return data.access_token;
    } catch (err) {
      logger.error("Arcadia Access Token Error", err.response?.data || err.message);
      return null;
    }
  },
  getEnrollmentStudents: async (params = {}) => {
    const token = await arcadiaApi.getAccessToken();
    if(!token) return null;

    try {
    const { data } = await http.get(config.clientApi.enrollmentUrl, {
      headers: {
        accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
      params,
    });
    return data;
    } catch (err) {
      logger.error("Arcadia Enrollment Error", err.response?.data || err.message);
      return null;
    }
  },
  getWithdrawals: async (params = {}) => {
    const token = await arcadiaApi.getAccessToken();
    if(!token) return null;

    try {
    const { data } = await http.get(config.clientApi.withdrawalsUrl, {
      headers: {
        accept: 'application/json',
        Authorization: `Bearer ${token}`,
      },  
      params,
    });
    return data;
    } catch (err) {
      logger.error("Arcadia Withdrawals Error", err.response?.data || err.message);
      return null;
    }
  },
  getApplicants: async (params = {}) => {
    const token = await arcadiaApi.getAccessToken();
    if(!token) return null;

    try {
    const { data } = await http.get(config.clientApi.applicantsUrl, {
      headers: {
        accept: 'application/json',
        Authorization: `Bearer ${token}`,
      },  
      params,
    });
    return data;
    } catch (err) {
      logger.error("Arcadia Withdrawals Error", err.response?.data || err.message);
      return null;
    }
  },
};
