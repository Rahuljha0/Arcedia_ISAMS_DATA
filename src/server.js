import express from "express";
import { connectDB } from "./config/db.js";
import { initModels } from "./models/index.js";
import { startStudentSyncJob, SyncStudents } from "./jobs/studentSync.job.js";
import { startWithdrawalSyncJob, SyncWithdrawal } from "./jobs/withdrawalSync.job.js";

const app = express();

(async () => {
  await connectDB();
  await initModels();
  startStudentSyncJob(); // cron job
  startWithdrawalSyncJob(); // cron job
})();

app.get("/health", (req, res) => res.json({ status: "ok" }));
app.get("/sync", async (req, res) => {
  const students = await SyncStudents();
  const withdrawals = await SyncWithdrawal();
  return res.json({ students, withdrawals });
});

app.listen(3000, () => console.log("Scheduler running on port 3000"));
