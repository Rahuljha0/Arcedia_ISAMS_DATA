import express from "express";
import { connectDB } from "./config/db.js";
import { initModels } from "./models/index.js";
import { startStudentSyncJob } from "./jobs/studentSync.job.js";

const app = express();

(async () => {
  await connectDB();
  await initModels();
  startStudentSyncJob(); // cron job
})();

app.get("/health", (req, res) => res.json({ status: "ok" }));

app.listen(3000, () => console.log("Scheduler running on port 3000"));
