import { http } from "../utils/http.js";
import { config } from "../config/env.js";

export const clientApi = {
  getAccessToken: async () => {
    const payload = {
      client_id: config.clientApi.clientId,
      client_secret: config.clientApi.clientSecret,
      grant_type: "client_credentials",
      scope: "restapi",
    };
  
    const { data } = await http.post(config.clientApi.accessTokenUrl,
      qs.stringify(payload),
      { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
    );
  
    return data.access_token;
  },
  getEnrollmentStudents: async (params = {}) => {
    const { data } = await http.get(config.clientApi.enrollmentUrl, {
      headers: {
        accept: 'application/json',
        Authorization: `Bearer ${await clientApi.getAccessToken()}`,
      },
    }, {
      params
    });
    return data;
  },
  getWithdrawals: async (params = {expand: 'customFields'}) => {
    const { data } = await http.get(config.clientApi.withdrawalsUrl, {
      headers: {
        accept: 'application/json',
        Authorization: `Bearer ${await clientApi.getAccessToken()}`,
      },  
    }, {
      params
    });
    return data;
  },
};
