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
    addUrl: "",
    updateUrl: "",
  },
  db: {
    name: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    host: process.env.DB_HOST,
  },
  cronSchedule: "*/15 * * * *", // run every 15 minutes
};
