import { http } from "../utils/http.js";
import { config } from "../config/env.js";
import logger from "../utils/logger.js";
import FormData from "form-data";

export const zohoBookingService = {
  getAccessToken: async () => {
    try {
      const res = await http.post(config.zohoBookingApi.accessTokenUrl, null, {
        params: {
          client_id: config.zohoBookingApi.clientId,
          client_secret: config.zohoBookingApi.clientSecret,
          refresh_token: config.zohoBookingApi.refreshToken,
          grant_type: "refresh_token",
        },
      });
      return res.data.access_token;
    } catch (err) {
      logger.error(
        "ZohoBookingService: Error getting access token:",
        err.response?.data || err.message
      );
      throw err;
    }
  },
  getTours: async (params = {}) => {
    const token = await zohoBookingService.getAccessToken();
    if (!token) return null;

    let page = 1;
    let tours = [];

    try {
      while (true) {
        // Prepare form-data payload
        const formData = new FormData();
        formData.append(
          "data",
          JSON.stringify({
            ...params,
            workspace_id: config.zohoBookingApi.workspaceId,
            page,
          })
        );

        const { data } = await http.post(
          config.zohoBookingApi.toursUrl,
          formData,
          {
            headers: {
              Authorization: `Zoho-oauthtoken ${token}`,
              accept: "application/json",
              ...formData.getHeaders(),
            },
          }
        );

        tours = tours.concat(data?.response?.returnvalue?.response || []);

        if (!data?.response?.returnvalue?.next_page_available) {
          break;
        }
        page++;
      }

      return tours;
    } catch (err) {
      logger.error("Zoho Booking Error", err.response?.data || err.message);
      return null;
    }
  },
};
