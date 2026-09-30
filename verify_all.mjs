import { SyncEnrollments } from "./src/jobs/enrollmentSync.job.js";
import { SyncWithdrawal } from "./src/jobs/withdrawalSync.job.js";
import { SyncApplicant } from "./src/jobs/applicantSync.job.js";
import { SyncApplicationForms } from "./src/jobs/applicationFormSync.js";
import { SyncProspectForms } from "./src/jobs/prospectFormSync.js";
import { SyncStudentForms } from "./src/jobs/studentFormSync.js";
import { SyncTours } from "./src/jobs/tourSync.js";
import { zohoAnalyticService as z } from "./src/services/zoho-analytic.service.js";

const t = [
  ["Enrollments", SyncEnrollments, z.exportEnrollments],
  ["Withdrawals", SyncWithdrawal, z.exportWithdrawals],
  ["Applicants", SyncApplicant, z.exportApplicants],
  ["Application Forms", SyncApplicationForms, z.exportApplicationForms],
  ["Prospect Forms", SyncProspectForms, z.exportProspects],
  ["Student Forms", SyncStudentForms, z.exportStudentForms],
  ["Tours", SyncTours, z.exportTours],
];
console.log("START", new Date().toLocaleString("sv-SE", { timeZone: "Asia/Dubai" }), "(Dubai)");
for (const [n, sync, exp] of t) {
  try {
    const written = await sync();
    const rows = (await exp())?.data || [];
    const counts = {};
    for (const r of rows) { const v = r.synced_at || "EMPTY"; counts[v] = (counts[v] || 0) + 1; }
    const top = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([v, c]) => v + " x" + c).join(" | ");
    const empty = counts["EMPTY"] || 0;
    console.log("RESULT " + n + ": written=" + written + " rows=" + rows.length + " empty=" + empty + " distinct=" + Object.keys(counts).length + " -> " + top);
  } catch (e) { console.log("RESULT " + n + ": FAILED " + (e.response ? JSON.stringify(e.response.data) : e.message)); }
}
console.log("END", new Date().toLocaleString("sv-SE", { timeZone: "Asia/Dubai" }), "(Dubai)");
process.exit(0);
