import { DataTypes } from "sequelize";
import { sequelize } from "../config/db.js";

export const Withdrawal = sequelize.define("Withdrawal", {
  personId: { type: DataTypes.INTEGER, primaryKey: true },
  forename: DataTypes.STRING,
  fullName: DataTypes.STRING,
  preferredName: DataTypes.STRING,
  surname: DataTypes.STRING,
  gender: DataTypes.STRING,
  title: DataTypes.STRING,
  schoolId: DataTypes.STRING,
  schoolCode: DataTypes.STRING,
  enrolmentDate: DataTypes.DATEONLY,
  leavingDate: DataTypes.DATEONLY,
  leavingReason: DataTypes.STRING,
  enrolmentYear: DataTypes.INTEGER,
  leavingYearGroup: DataTypes.INTEGER,
  systemStatus: DataTypes.STRING,
  lastUpdated: DataTypes.DATE,
}, {
  tableName: "withdrawals",
  timestamps: true,
});
