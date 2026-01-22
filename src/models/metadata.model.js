import { DataTypes } from "sequelize";
import { sequelize } from "../config/db.js";

export const Metadata = sequelize.define(
  "Metadata",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    recordType: {
      type: DataTypes.ENUM("enrollment", "withdrawal", "applicationForm", "prospectForm", "studentForm", "applicant", "tour", "assessment"),
      allowNull: false,
      unique: true,
    },
    lastUpdatedAt: {
      type: DataTypes.DATE,
      allowNull: true, // last updated in source system we processed
    },
  },
  {
    tableName: "metadata",
    timestamps: false,
  },
);
