import { DataTypes } from "sequelize";
import { sequelize } from "../config/db.js";

export const Student = sequelize.define("Student", {
  id: { type: DataTypes.INTEGER, primaryKey: true },
  academicHouse: DataTypes.STRING,
  boardingStatus: DataTypes.STRING,
  dob: DataTypes.DATEONLY,
  enrolmentDate: DataTypes.DATEONLY,
  enrolmentTerm: DataTypes.STRING,
  enrolmentYear: DataTypes.INTEGER,
  forename: DataTypes.STRING,
  fullName: DataTypes.STRING,
  gender: DataTypes.STRING,
  initials: DataTypes.STRING,
  labelSalutation: DataTypes.STRING,
  letterSalutation: DataTypes.STRING,
  officialName: DataTypes.STRING,
  preferredName: DataTypes.STRING,
  surname: DataTypes.STRING,
  title: DataTypes.STRING,
  yearGroup: DataTypes.INTEGER,
  schoolEmailAddress: DataTypes.STRING,
  personGuid: DataTypes.STRING,
  personId: DataTypes.INTEGER,
  systemStatus: DataTypes.STRING,
  lastUpdated: DataTypes.DATE,
}, {
  tableName: "students",
  timestamps: true,
});
