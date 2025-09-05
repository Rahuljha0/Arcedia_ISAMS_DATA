import { http } from "../utils/http.js";
import { config } from "../config/env.js";

export const zohoService = {
  addStudent: async (student) => {
    try {
      const created = await http.post(config.zohoApi.addUrl, { data: student });
      return created;
    } catch (err) {
      console.error("Zoho Add Error", err.response?.data || err.message);
      return null;
    }
  },
  updateStudent: async (student) => {
    try {
      const updated = await http.post(config.zohoApi.updateUrl, { criteria: `(personId=${student.personId})`, data: student });
      return updated;
    } catch (err) {
      console.error("Zoho Update Error", err.response?.data || err.message);
      return null;
    }
  },
};
