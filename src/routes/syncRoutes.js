import express from "express";
import {
  SyncEnrollments,
  SyncWithdrawal,
  SyncApplicant,
  SyncApplicationForms,
  SyncProspectForms,
  SyncStudentForms,
} from "../jobs/index.js";

const router = express.Router();

// Sync endpoints
router.get("/sync/enrollments", async (req, res) => {
  const success = await SyncEnrollments();
  return res.status(200).json({message:"Synced enrollments successfully", success});
});

router.get("/sync/withdrawals", async (req, res) => {
  const success = await SyncWithdrawal();
  return res.status(200).json({message:"Synced withdrawals successfully", success});
});

router.get("/sync/applicants", async (req, res) => {
  const success = await SyncApplicant();
  return res.status(200).json({message:"Synced applicants successfully", success});
});

router.get("/sync/applicationForms", async (req, res) => {
  const success = await SyncApplicationForms();
  return res.status(200).json({message:"Synced application forms successfully", success});
});

router.get("/sync/prospectForms", async (req, res) => {
  const success = await SyncProspectForms();
  return res.status(200).json({message:"Synced prospect forms successfully", success});
});

router.get("/sync/studentForms", async (req, res) => {
  const success = await SyncStudentForms();
  return res.status(200).json({message:"Synced student forms successfully", success});
});

router.get("/sync/all", async (req, res) => {
  const success = {};
  success.enrollments = await SyncEnrollments();
  success.withdrawals = await SyncWithdrawal();
  success.applicants = await SyncApplicant();
  success.applicationForms = await SyncApplicationForms();
  success.prospectForms = await SyncProspectForms();
  success.students = await SyncStudentForms();
  return res.status(200).json({message:"Synced successfully", success});
});

export default router;
