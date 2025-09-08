import cron from "node-cron";
import logger from "../utils/logger.js";
import { arcadiaApi } from "../services/arcadia.service.js";
import { Student } from "../models/student.model.js";
import { metadataService } from "../services/metadata.service.js";
import { zohoService } from "../services/zoho.service.js";
import { config } from "../config/env.js";

export const SyncStudents = async () => {  
  logger.info("Syncing students...");

  let page = 1;
  let pageSize = 300;
  let students = [];
  
  // fetch all students from Arcadia API in pages
  while (true) {
    const params = { page, pageSize };
    const response = await arcadiaApi.getEnrollmentStudents(params);
    students = students.concat(response.students || []);

    if (page >= response.totalPages) {
      break;
    }
    page++;
  }

  // sort students by lastUpdated in ascending order
  students.sort((a, b) => new Date(a.lastUpdated) - new Date(b.lastUpdated));

  // filter students that are not synced by lastUpdated
  const lastUpdated = await metadataService.getEnrollmentLastUpdated()
  students = students.filter((student) => new Date(student.lastUpdated) > new Date(lastUpdated));

  // sync students to Zoho
  for (const student of students) {
    const existing = await Student.findOne({ where: { id: student.id } });

    if (!existing) {
      await Student.create(student);
      await zohoService.addStudent(student);
      await metadataService.createOrUpdate("enrollment", student.lastUpdated);
    } else {
      await Student.update(student, { where: { id: student.id } });
      await zohoService.updateStudent(student);
      await metadataService.createOrUpdate("enrollment", student.lastUpdated);
    }
  }

  logger.info("Synced students successfully");
  return students.length;
};

// Run every 15 minutes
// cron.schedule(config.cronSchedule, async () => {
//   logger.info("Running scheduled sync job...");
//   await SyncStudents();
// });
