export const parseCronInterval = (value) => {
    if (!value) return "*/15 * * * *"; // default every 15 minutes
  
    const match = value.match(/^(\d+)([mhdwy])$/i);
    if (!match) {
      throw new Error(
        `Invalid CRON_INTERVAL: ${value}. Use like "10m", "5h", "2d", "1y"`
      );
    }
    
    const num = parseInt(match[1], 10);
    const unit = match[2].toLowerCase();
  
    switch (unit) {
      case "m": // minutes
        return `*/${num} * * * *`;
      case "h": // hours
        return `0 */${num} * * *`;
      case "d": // days
        return `0 0 */${num} * *`;
      case "w": // weeks
        return `0 0 * * ${num % 7}`; // run every Nth weekday
      case "y": // years
        return `0 0 1 1 */${num}`; // run every N years on Jan 1st
      default:
        return "*/15 * * * *"; // default every 15 minutes
    }
}