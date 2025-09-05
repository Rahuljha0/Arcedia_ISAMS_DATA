import db from "../config/db.js";
import { zohoService } from "./zoho.service.js";

export const syncService = {
  syncEnrollments: async (students) => {
    for (const student of students) {
      const existing = await db.Student.findOne({ where: { id: student.id } });

      if (!existing) {
        // insert in local DB
        await db.Student.create(student);
        // call Zoho add API
        await zohoService.addStudent(student);
      } else {
        // update local DB
        await db.Student.update(student, { where: { id: student.id } });

        // compare lastUpdated
        if (new Date(student.lastUpdated) > existing.lastUpdated) {
          await zohoService.updateStudent(student);
        }
      }
    }
  },
  syncWithdrawals: async (withdrawals) => { 
    for (const withdrawal of withdrawals) {
      const existing = await db.Withdrawal.findOne({ where: { id: withdrawal.id } });

      if (!existing) {
        // insert in local DB
        await db.Withdrawal.create(withdrawal);
        // call Zoho add API
        await zohoService.addWithdrawal(withdrawal);
      } else {
        // update local DB
        await db.Withdrawal.update(withdrawal, { where: { id: withdrawal.id } });

        // compare lastUpdated
        if (new Date(withdrawal.lastUpdated) > existing.lastUpdated) {
          await zohoService.updateWithdrawal(withdrawal);
        }
      }
    }
  }
};
