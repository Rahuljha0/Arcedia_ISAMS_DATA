import { http } from "../utils/http.js";
import { config } from "../config/env.js";
import logger from "../utils/logger.js";
import { formatDateForZoho } from "../utils/helpers.js";

export const zohoCrmService = {
  getAccessToken: async () => {
    try {
      const res = await http.post(config.zohoCrmApi.accessTokenUrl, null, {
        params: {
          client_id: config.zohoCrmApi.clientId,
          client_secret: config.zohoCrmApi.clientSecret,
          refresh_token: config.zohoCrmApi.refreshToken,
          grant_type: "refresh_token",
        },
      });
      return res.data.access_token;
    } catch (err) {
      logger.error(
        "ZohoCrmService: Error getting access token:",
        err.response?.data || err.message
      );
      throw err;
    }
  },

  executeQuery: async (baseQuery, limit = 2000) => {
    const token = await zohoCrmService.getAccessToken();
    if (!token) throw new Error("Failed to get zoho crm access token");

    const headers = {
      Authorization: `Zoho-oauthtoken ${token}`,
    };

    let data = [];
    let offset = 0;
    let moreRecords = true;

    while (moreRecords) {
      const select_query = `${baseQuery} limit ${limit} offset ${offset}`;
      const response = await http.post(
        config.zohoCrmApi.queryApiUrl,
        { select_query },
        { headers }
      );

      if (response?.data?.data?.length) {
        data = data.concat(response.data.data);
      }

      moreRecords = response?.data?.info?.more_records || false;
      offset += limit;
    }

    return data;
  },

  getApplicationForms: async (lastUpdated) => {
    try {
      const baseQuery = `
        select id, Name, Application_Status, First_Name, Last_Name, Year_Group, Year_of_Entry, 
               Total_Documents, Mandatory_Doc, Address, Date_of_Birth, Gender, Language, 
               Nationality, Parent, Last_Activity_Time, Modified_Time, Created_Time 
        from Application2 
        where Name != null ${
          lastUpdated
            ? `and Modified_Time > '${formatDateForZoho(lastUpdated)}'`
            : ""
        }
        order by Modified_Time ASC
      `;

      const data = await zohoCrmService.executeQuery(baseQuery);
      return data;
    } catch (err) {
      logger.error(
        "Zoho Application Forms Error",
        err.response?.data || err.message
      );
      return [];
    }
  },

  getProspectForms: async (lastUpdated) => {
    try {
      const baseQuery = `
        select id, Acadmic_Year, Address, Application_Form_ID, Assessment_Completed_Date, Assessment_Date, 
            Date_of_Birth, Gender, Interested_Year_Group, Languages, Marital_Status, Nationality, Offer_Sent_on, 
            Offer_Status, Contact_Name, Payment_Receipt_Date, Payment_Status, Deal_Name, Religion, 
            Secondary_Contact_Name, Stage, Approval_Date, First_Name, Last_Name, Tour_Date, 
            Tour_Completed, Tour_Assigned_Staff, Tour_ID, Tour_Time, Offer_Rejected_on, Offer_Accepted_on, 
            Payment_Confirmation_By, Enrollment_Deposit_Fee, Assessment_Fee, Term, 
            Last_Activity_Time, Modified_Time , Created_Time 
        from Deals 
        where First_Name != null ${
          lastUpdated
            ? `and Modified_Time > '${formatDateForZoho(lastUpdated)}'`
            : ""
        }
        order by Modified_Time ASC
      `;

      const data = await zohoCrmService.executeQuery(baseQuery);
      return data;
    } catch (err) {
      logger.error(
        "Zoho Prospect Forms Error",
        err.response?.data || err.message
      );
      return [];
    }
  },

  getStudentForms: async (lastUpdated) => {
    try {
      const baseQuery = `
        select id, Current_Academic_Year, Current_Form, Current_Year_Group, Date_of_Leaving, Date_of_Notice, 
            Enrollment_Fee, Exit_Comments, First_Name, Form, Gender, House, Joined_in_Academic_Year, Joined_in_Year_Group, 
            Joining_Date, Language, Last_Name, Marital_Status, Nationality, Primary_Contact_Name, Prospect, Religion, 
            School_Transfer_Name, Secondary_Contact_Name, Student_ID, Name, Withdrawal_Reasons, Status,  Last_Activity_Time, 
            Modified_Time , Created_Time 
        from Students 
        where Name != null ${
          lastUpdated
            ? `and Modified_Time > '${formatDateForZoho(lastUpdated)}'`
            : ""
        }
        order by Modified_Time ASC 
      `;

      const data = await zohoCrmService.executeQuery(baseQuery);
      return data;
    } catch (err) {
      logger.error(
        "Zoho Student Forms Error",
        err.response?.data || err.message
      );
      return [];
    }
  },
};
