import express from "express";
import { connectDB } from "./config/db.js";
import { initModels } from "./models/index.js";
import { startEnrollmentSyncJob, SyncEnrollments } from "./jobs/enrollmentSync.job.js";
import { startWithdrawalSyncJob, SyncWithdrawal } from "./jobs/withdrawalSync.job.js";
import { startApplicantSyncJob, SyncApplicant } from "./jobs/applicantSync.job.js";
import { startApplicationFormSyncJob, SyncApplicationForms } from "./jobs/applicationFormSync.js";
import { startProspectFormSyncJob, SyncProspectForms } from "./jobs/prospectFormSync.js";
import { startStudentFormSyncJob, SyncStudentForms } from "./jobs/studentFormSync.js";

const app = express();

(async () => {
  await connectDB();
  await initModels();
  startEnrollmentSyncJob(); // cron job
  startWithdrawalSyncJob(); // cron job
  startApplicantSyncJob(); // cron job
  startApplicationFormSyncJob(); // cron job
  startProspectFormSyncJob(); // cron job
  startStudentFormSyncJob(); // cron job
})();

app.get("/health", (req, res) => res.json({ status: "ok" }));
app.get("/sync", async (req, res) => {
  // this route is for testing only
  let data = {};
  // data.token = await zohoAnalyticService.getAccessToken();
  // data.enrollments = await SyncEnrollments();
  // data.withdrawals = await SyncWithdrawal();
  // data.applicants = await SyncApplicant();
  // data.applicationForms = await SyncApplicationForms();
  // data.prospectForms = await SyncProspectForms();
  // data.students = await SyncStudentForms();
  return res.json(data);
});

app.listen(3000, () => console.log("Scheduler running on port 3000"));
