import axios from "axios";
import logger from "./logger.js";

export const http = axios.create({
  timeout: 600000, //600 seconds
});

http.interceptors.response.use(
  (res) => res,
  (err) => {
    logger.error("API Error:", err.message);
    throw err;
  }
);
