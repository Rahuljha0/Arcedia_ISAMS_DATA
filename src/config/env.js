import dotenv from "dotenv";
dotenv.config();

export const config = {
  clientApi: {
    clientId: process.env.ISAMS_CLIENT_ID,
    clientSecret: process.env.ISAMS_CLIENT_SECRET,
    accessTokenUrl: "https://arcadiaschool.isamshosting.cloud/auth/connect/token",
    enrollmentUrl: "https://arcadiaschool.isamshosting.cloud/Main/api/students",
    withdrawalsUrl: "https://arcadiaschool.isamshosting.cloud/api/alumni",
  },
  zohoApi: {
    clientId: process.env.ZOHO_CLIENT_ID,
    clientSecret: process.env.ZOHO_CLIENT_SECRET,
    refreshToken: process.env.ZOHO_REFRESH_TOKEN,
    orgId: process.env.ZOHO_ORG_ID,
    workspaceId: process.env.ZOHO_WORKSPACE_ID,
    enrollmentViewId: process.env.ZOHO_ENROLLMENT_VIEW_ID,
    withdrawalViewId: process.env.ZOHO_WITHDRAWAL_VIEW_ID,
    accessTokenUrl: "https://accounts.zoho.com/oauth/v2/token",
    addEnrollmentUrl: "",
    updateEnrollmentUrl: "",
    addWithdrawalUrl: "",
    updateWithdrawalUrl: "",
  },
  db: {
    name: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    host: process.env.DB_HOST,
  },
  cronSchedule: "*/15 * * * *", // run every 15 minutes
};
