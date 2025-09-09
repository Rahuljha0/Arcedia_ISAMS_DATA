import express from "express";
import { connectDB } from "./config/db.js";
import { initModels } from "./models/index.js";
import { SyncStudents } from "./jobs/studentSync.job.js";
import { SyncWithdrawal } from "./jobs/withdrawalSync.job.js";
import { zohoService } from "./services/zoho.service.js";

const app = express();

(async () => {
  await connectDB();
  await initModels();
  // startStudentSyncJob(); // cron job
  // startWithdrawalSyncJob(); // cron job
})();

app.get("/health", (req, res) => res.json({ status: "ok" }));
app.get("/sync", (req, res) => {
  zohoService.getAccessToken().then((token) => {
    res.json(token);
  });
});

app.listen(3000, () => console.log("Scheduler running on port 3000"));
