import { sequelize } from "../config/db.js";
import { Student } from "./student.model.js";
import { Withdrawal } from "./withdrawal.model.js";

export const initModels = async () => {
  try {
    await sequelize.sync({ alter: true }); 
    console.log("Database & tables synced.");
  } catch (err) {
    console.error("Model sync error:", err.message);
  }
};

export { Student, Withdrawal };
