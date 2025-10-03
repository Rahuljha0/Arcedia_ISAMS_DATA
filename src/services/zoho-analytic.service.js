import { http } from "../utils/http.js";
import { config } from "../config/env.js";
import logger from "../utils/logger.js";
import FormData from "form-data";

export const zohoAnalyticService = {
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

  bulkDeleteRequest: async (url, token, criteria) => {
    const headers = {
      "ZANALYTICS-ORGID": config.zohoApi.orgId,
      Authorization: `Zoho-oauthtoken ${token}`,
    };

    const configJson = {
      criteria
    };

    const fullUrl = `${url}?CONFIG=${encodeURIComponent(JSON.stringify(configJson))}`;

    return await http.delete(fullUrl, { headers });
  },

  bulkUpsertRequest: async (url, data, matchingColumns = []) => {
    const token = await zohoAnalyticService.getAccessToken();
    if (!token) throw new Error("Failed to get access token");

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
        student.languages = student.languages?.join(",") || null;
        student.nationalities = student.nationalities?.join(",") || null;

        return student;
      });

      const response = await zohoAnalyticService.bulkUpsertRequest(config.zohoApi.bulkImportEnrollmentUrl, flatStudents, ["id"]);
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
        const customFields = withdrawal?.customFields || [];
        delete withdrawal.customFields;

        customFields.map((field) => {
          withdrawal[field.name.trim()] = field.value;
        });

        withdrawal.languages = withdrawal.languages?.join(",") || null;
        withdrawal.nationalities = withdrawal.nationalities?.join(",") || null;

        return withdrawal;
      });

      const response = await zohoAnalyticService.bulkUpsertRequest(config.zohoApi.bulkImportWithdrawalUrl, flatWithdrawals, ["schoolId"]);
      logger.info("Zoho Bulk Withdrawal Success", response.data);

      // Delete enrollments where schoolId is in withdrawals in chunks of 200
      const token = await zohoAnalyticService.getAccessToken();
      if (!token) throw new Error("Failed to get access token");

      for (let i = 0; i < flatWithdrawals.length; i += 200) {
        const chunk = flatWithdrawals.slice(i, i + 200);
        const criteria = `("schoolId" IN (${chunk.map(w => `'${w.schoolId}'`).join(",")}))`;
        const deleteResponse = await zohoAnalyticService.bulkDeleteRequest(
          config.zohoApi.bulkDeleteEnrollmentUrl,
          token,
          criteria
        );
        logger.info("Zoho Bulk Withdrawal Delete Success from Enrollments", deleteResponse.data, criteria);
      }


      return response.data;
    } catch (err) {
      logger.error("Zoho Bulk Withdrawal Error", err.response?.data || err.message);
      return null;
    }
  },

  upsertApplicants: async (applicants) => {
    try {
      // Extract custom fields from each withdrawal
      const flatApplicants = [...applicants].map((applicant) => {
        applicant.languages = applicant.languages?.join(",") || null;
        applicant.nationalities = applicant.nationalities?.join(",") || null;

        return applicant;
      });

      const response = await zohoAnalyticService.bulkUpsertRequest(config.zohoApi.bulkImportApplicantUrl, flatApplicants, ["schoolId"]);
      logger.info("Zoho Bulk Applicant Success", response.data);
      return response.data;
    } catch (err) {
      logger.error("Zoho Bulk Applicant Error", err.response?.data || err.message);
      return null;
    }
  },

  upsertApplicationForms: async (applicationForms) => {
    try {
      // Extract custom fields from each application form
      const flatApplicationForms = [...applicationForms].map((applicationForm) => {
        applicationForm.ID = applicationForm?.id || null;
        applicationForm.Parent = applicationForm?.Parent?.name || null;
        applicationForm.Language = applicationForm?.Language?.join(",") || null;
        return applicationForm;
      });

      const response = await zohoAnalyticService.bulkUpsertRequest(config.zohoApi.bulkImportApplicationFormUrl, flatApplicationForms, ["ID"]);
      logger.info("Zoho Bulk Application Forms Success", response.data);
      return response.data;
    } catch (err) {
      logger.error("Zoho Bulk Application Forms Error", err.response?.data || err.message);
      return null;
    }
  },

  upsertProspects: async (prospects) => {
    try { 
      // Extract custom fields from each application form
      const flatProspects = [...prospects].map((prospect) => {
        prospect.ID = prospect?.id || null;
        prospect.Acadmic_Year = prospect?.Acadmic_Year?.name || null;
        prospect.Contact_Name = prospect?.Contact_Name?.name || null;
        prospect.Languages = prospect?.Languages?.join(",") || null;
        prospect.Tour_Assigned_Staff = prospect?.Tour_Assigned_Staff?.name || null;
        prospect.Payment_Confirmation_By = prospect?.Payment_Confirmation_By?.name || null;
        return prospect;
      });

      const response = await zohoAnalyticService.bulkUpsertRequest(config.zohoApi.bulkImportProspectFormUrl, flatProspects, ["ID"]);
      logger.info("Zoho Bulk Prospects Success", response.data);
      return response.data;
    } catch (err) {
      logger.error("Zoho Bulk Prospects Error", err.response?.data || err.message);
      return null;
    }
  },

  upsertStudentForms: async (studentForms) => {
    try { 
      // Extract custom fields from each student form 
      const flatStudentForms = [...studentForms].map((studentForm) => { 
        studentForm.ID = studentForm?.id || null;
        studentForm.Joined_in_Academic_Year = studentForm?.Joined_in_Academic_Year?.name || null;
        studentForm.Primary_Contact_Name = studentForm?.Primary_Contact_Name?.name || null;
        studentForm.Prospect = studentForm?.Prospect?.name || null;
        studentForm.Current_Academic_Year = studentForm?.Current_Academic_Year?.name || null;
        studentForm.Exit_Comments = studentForm?.Exit_Comments?.join(",") || null;
        studentForm.Withdrawal_Reasons = studentForm?.Withdrawal_Reasons?.join(",") || null;
        studentForm.Language = studentForm?.Language?.join(",") || null;
        return studentForm;
      });

      const response = await zohoAnalyticService.bulkUpsertRequest(config.zohoApi.bulkImportStudentFormUrl, flatStudentForms, ["ID"]);
      logger.info("Zoho Bulk Student Forms Success", response.data);
      return response.data;
    } catch (err) {
      logger.error("Zoho Bulk Student Forms Error", err.response?.data || err.message);
      return null;
    }
  },
}