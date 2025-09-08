import { createLogger, format, transports } from "winston";

// Function to dynamically generate log file names based on the date
const getLogFileName = () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = `0${date.getMonth() + 1}`.slice(-2); // Month is 0-indexed
  const day = `0${date.getDate()}`.slice(-2);
  return `logs/${year}-${month}-${day}.log`; // Example: logs/2024-12-19.log
};

const logger = createLogger({
  level: "info",
  format: format.combine(
    format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    format.printf(({ timestamp, level, message }) => {
      return `${timestamp} [${level.toUpperCase()}]: ${message}`;
    })
  ),
  transports: [
    new transports.Console({
      format: format.combine(
        format.colorize(),
        format.printf(({ timestamp, level, message }) => {
          return `${timestamp} [${level}]: ${message}`;
        })
      ),
    }),
    new transports.File({
      filename: getLogFileName(),
      level: "info",
    }),
  ],
  exceptionHandlers: [new transports.Console()],
  rejectionHandlers: [new transports.Console()],
  exitOnError: false,
});

// Custom helper methods for specific log levels
logger.debug = (message) => logger.log({ level: "debug", message });
logger.info = (message) => logger.log({ level: "info", message });
logger.error = (message) => logger.log({ level: "error", message });

export default logger;
