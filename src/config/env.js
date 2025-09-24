import dotenv from "dotenv";
dotenv.config();
import { parseCronInterval } from "../utils/helpers.js";

export const config = {
  clientApi: {
    clientId: process.env.ISAMS_CLIENT_ID,
    clientSecret: process.env.ISAMS_CLIENT_SECRET,
    accessTokenUrl: "https://arcadiaschool.isamshosting.cloud/auth/connect/token",
    enrollmentUrl: "https://arcadiaschool.isamshosting.cloud/Main/api/students",
    withdrawalsUrl: "https://arcadiaschool.isamshosting.cloud/api/alumni",
    applicantsUrl: "https://arcadiaschool.isamshosting.cloud/Main/api/admissions/applicants",
  },
  zohoCrmApi: {
    clientId: process.env.ZOHO_CRM_CLIENT_ID,
    clientSecret: process.env.ZOHO_CRM_CLIENT_SECRET,
    refreshToken: process.env.ZOHO_CRM_REFRESH_TOKEN,
    accessTokenUrl: "https://accounts.zoho.com/oauth/v2/token",
    queryApiUrl: "https://www.zohoapis.com/crm/v8/coql",
  },
  zohoApi: {
    clientId: process.env.ZOHO_CLIENT_ID,
    clientSecret: process.env.ZOHO_CLIENT_SECRET,
    refreshToken: process.env.ZOHO_REFRESH_TOKEN,
    orgId: process.env.ZOHO_ORG_ID,
    fullNamePrefix: process.env.ZOHO_FULL_NAME_PREFIX,
    accessTokenUrl: "https://accounts.zoho.com/oauth/v2/token",
    bulkImportEnrollmentUrl: `https://analyticsapi.zoho.com/restapi/v2/workspaces/${process.env.ZOHO_WORKSPACE_ID}/views/${process.env.ZOHO_ENROLLMENT_VIEW_ID}/data`,
    bulkImportWithdrawalUrl: `https://analyticsapi.zoho.com/restapi/v2/workspaces/${process.env.ZOHO_WORKSPACE_ID}/views/${process.env.ZOHO_WITHDRAWAL_VIEW_ID}/data`,
    bulkImportApplicantUrl: `https://analyticsapi.zoho.com/restapi/v2/workspaces/${process.env.ZOHO_WORKSPACE_ID}/views/${process.env.ZOHO_APPLICANT_VIEW_ID}/data`,
    bulkImportApplicationFormUrl: `https://analyticsapi.zoho.com/restapi/v2/workspaces/${process.env.ZOHO_WORKSPACE_ID}/views/${process.env.ZOHO_APPLICATION_FORM_VIEW_ID}/data`,
    bulkImportProspectFormUrl: `https://analyticsapi.zoho.com/restapi/v2/workspaces/${process.env.ZOHO_WORKSPACE_ID}/views/${process.env.ZOHO_PROSPECT_FORM_VIEW_ID}/data`,
    bulkImportStudentFormUrl: `https://analyticsapi.zoho.com/restapi/v2/workspaces/${process.env.ZOHO_WORKSPACE_ID}/views/${process.env.ZOHO_STUDENT_FORM_VIEW_ID}/data`,
    bulkDeleteEnrollmentUrl: `https://analyticsapi.zoho.com/restapi/v2/workspaces/${process.env.ZOHO_WORKSPACE_ID}/views/${process.env.ZOHO_ENROLLMENT_VIEW_ID}/rows`,
  },
  cronSchedule: parseCronInterval(process.env.CRON_INTERVAL),
  ntfyTopic: process.env.NTFY_TOPIC,
};
