import express from "express";
import { connectDB } from "./config/db.js";
import { initModels } from "./models/index.js";
import { SyncStudents } from "./jobs/studentSync.job.js";
import { SyncWithdrawal } from "./jobs/withdrawalSync.job.js";

const app = express();

(async () => {
  await connectDB();
  await initModels();
  // startStudentSyncJob(); // cron job
  // startWithdrawalSyncJob(); // cron job
})();

app.get("/health", (req, res) => res.json({ status: "ok" }));
app.get("/sync", (req, res) => {
  SyncWithdrawal().then((students) => {
    res.json(students);
  });
});

app.listen(3000, () => console.log("Scheduler running on port 3000"));
