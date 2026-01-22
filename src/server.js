import express from "express";
import expressRateLimit from "express-rate-limit";
import { connectDB } from "./config/db.js";
import { initModels } from "./models/index.js";
import syncRoutes from "./routes/syncRoutes.js";
import {
  startEnrollmentSyncJob,
  startWithdrawalSyncJob,
  startApplicantSyncJob,
  startApplicationFormSyncJob,
  startProspectFormSyncJob,
  startStudentFormSyncJob,
  startTourSyncJob,
} from "./jobs/index.js";
import { startAssessmentSyncJob } from "./jobs/assessmentSync.js";

const app = express();

// Rate limiting
const limiter = expressRateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 10, // Limit each IP to 100 requests per windowMs
  message: "Too many requests, please try again later.",
});
app.use(limiter);

(async () => {
  await connectDB();
  await initModels();
  startEnrollmentSyncJob(); // cron job
  startWithdrawalSyncJob(); // cron job
  startApplicantSyncJob(); // cron job
  startApplicationFormSyncJob(); // cron job
  startProspectFormSyncJob(); // cron job
  startStudentFormSyncJob(); // cron job
  startTourSyncJob(); // cron job
  startAssessmentSyncJob(); // cron job
})();

// Routes
app.get("/health", (_, res) => res.json({ status: "ok" }));
app.use("/api", syncRoutes);

app.listen(3000, () => console.log("Scheduler running on port 3000"));
