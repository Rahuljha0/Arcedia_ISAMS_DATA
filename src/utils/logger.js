import { createLogger, format, transports } from "winston";

// Function to dynamically generate log file names based on the date
const getLogFileName = () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = `0${date.getMonth() + 1}`.slice(-2);
  const day = `0${date.getDate()}`.slice(-2);
  return `logs/${year}-${month}-${day}.log`;
};

const enumerateErrorFormat = format((info) => {
  if (info instanceof Error) {
    return {
      ...info,
      message: info.message,
      stack: info.stack,
    };
  }
  if (info.message instanceof Error) {
    return {
      ...info,
      message: info.message.message,
      stack: info.message.stack,
    };
  }
  return info;
});

// Create logger instance
const logger = createLogger({
  level: "info",
  format: format.combine(
    enumerateErrorFormat(),
    format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    format.printf(({ timestamp, level, message, stack, ...meta }) => {
      let log = `${timestamp} [${level.toUpperCase()}]: ${
        typeof message === "object"
          ? JSON.stringify(message, null, 2)
          : message
      }`;

      if (stack) {
        log += `\n${stack}`;
      }

      if (Object.keys(meta).length > 0) {
        log += `\nMeta: ${JSON.stringify(meta, null, 2)}`;
      }

      return log;
    })
  ),
  transports: [
    new transports.Console({
      format: format.combine(
        format.colorize(),
        enumerateErrorFormat(),
        format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
        format.printf(({ timestamp, level, message, stack, ...meta }) => {
          let log = `${timestamp} [${level}]: ${
            typeof message === "object"
              ? JSON.stringify(message, null, 2)
              : message
          }`;

          if (stack) {
            log += `\n${stack}`;
          }

          if (Object.keys(meta).length > 0) {
            log += `\nMeta: ${JSON.stringify(meta, null, 2)}`;
          }

          return log;
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

// Helper methods that accept meta args
logger.debug = (message, ...meta) => logger.log({ level: "debug", message, ...meta });
logger.info = (message, ...meta) => logger.log({ level: "info", message, ...meta });
logger.error = (message, ...meta) => logger.log({ level: "error", message, ...meta });

export default logger;
