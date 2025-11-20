import dotenv from "dotenv";
dotenv.config();
import { parseCronInterval } from "../utils/helpers.js";

export const config = {
  clientApi: {
    clientId: process.env.ISAMS_CLIENT_ID,
    clientSecret: process.env.ISAMS_CLIENT_SECRET,
    accessTokenUrl:
      "https://arcadiaschool.isamshosting.cloud/auth/connect/token",
    enrollmentUrl: "https://arcadiaschool.isamshosting.cloud/Main/api/students",
    withdrawalsUrl: "https://arcadiaschool.isamshosting.cloud/api/alumni",
    applicantsUrl:
      "https://arcadiaschool.isamshosting.cloud/Main/api/admissions/applicants",
  },
  zohoCrmApi: {
    clientId: process.env.ZOHO_CRM_CLIENT_ID,
    clientSecret: process.env.ZOHO_CRM_CLIENT_SECRET,
    refreshToken: process.env.ZOHO_CRM_REFRESH_TOKEN,
    accessTokenUrl: "https://accounts.zoho.com/oauth/v2/token",
    queryApiUrl: "https://www.zohoapis.com/crm/v8/coql",
  },
  zohoBookingApi: {
    clientId: process.env.ZOHO_BOOKINGS_CLIENT_ID,
    clientSecret: process.env.ZOHO_BOOKINGS_CLIENT_SECRET,
    refreshToken: process.env.ZOHO_BOOKINGS_REFRESH_TOKEN,
    workspaceId: process.env.ZOHO_BOOKINGS_WORKSPACE_ID,
    accessTokenUrl: "https://accounts.zoho.com/oauth/v2/token",
    toursUrl: "https://www.zohoapis.com/bookings/v1/json/fetchappointment",
  },
  zohoAnalyticApi: {
    clientId: process.env.ZOHO_CLIENT_ID,
    clientSecret: process.env.ZOHO_CLIENT_SECRET,
    refreshToken: process.env.ZOHO_REFRESH_TOKEN,
    orgId: process.env.ZOHO_ORG_ID,
    fullNamePrefix: process.env.ZOHO_FULL_NAME_PREFIX,
    workspaceId: process.env.ZOHO_WORKSPACE_ID,
    enrollmentViewId: process.env.ZOHO_ENROLLMENT_VIEW_ID,
    withdrawalViewId: process.env.ZOHO_WITHDRAWAL_VIEW_ID,
    applicantViewId: process.env.ZOHO_APPLICANT_VIEW_ID,
    applicationFormViewId: process.env.ZOHO_APPLICATION_FORM_VIEW_ID,
    prospectFormViewId: process.env.ZOHO_PROSPECT_FORM_VIEW_ID,
    studentFormViewId: process.env.ZOHO_STUDENT_FORM_VIEW_ID,
    tourViewId: process.env.ZOHO_TOUR_VIEW_ID,
    accessTokenUrl: "https://accounts.zoho.com/oauth/v2/token",
    primaryKeys: {
      enrollment: "schoolId",
      withdrawal: "schoolId",
      applicant: "schoolId",
      applicationForm: "ID",
      prospectForm: "ID",
      studentForm: "ID",
      tour: "booking_id",
    },
  },
  cronInterval: {
    enrollment: parseCronInterval(process.env.ENROLLMENT_CRON),
    withdrawal: parseCronInterval(process.env.WITHDRAWAL_CRON),
    applicant: parseCronInterval(process.env.APPLICANT_CRON),
    applicationForm: parseCronInterval(process.env.APPLICATION_FORM_CRON),
    prospectForm: parseCronInterval(process.env.PROSPECT_FORM_CRON),
    studentForm: parseCronInterval(process.env.STUDENT_FORM_CRON),
    tour: parseCronInterval(process.env.TOUR_CRON),
  },
  ntfyTopic: process.env.NTFY_TOPIC,
};
