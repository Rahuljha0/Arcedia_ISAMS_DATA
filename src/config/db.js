import { Sequelize } from "sequelize";
import dotenv from "dotenv";
import { config } from "../config/env.js";

dotenv.config();

export const sequelize = new Sequelize(
  config.db.name,
  config.db.user,
  config.db.password,
  {
    host: config.db.host,
    dialect: "mysql",
    logging: false,
  }
);

export const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log("MySQL connection established.");
  } catch (error) {
    console.error("Unable to connect to DB:", error.message);
    process.exit(1);
  }
};
