import { Sequelize } from "sequelize";
import dotenv from "dotenv";
import sequelizeConfig from "./sequelizeConfig.cjs";

dotenv.config();

export const sequelize = new Sequelize(
  sequelizeConfig.production.database,
  sequelizeConfig.production.username,
  sequelizeConfig.production.password,
  {
    host: sequelizeConfig.production.host,
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
