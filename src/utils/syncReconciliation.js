export const normalizeKey = (value) => {
  if (value === null || value === undefined) return "";
  return String(value).trim();
};

export const getReconciliationResult = ({
  sourceData = [],
  analyticsData = [],
  primaryKey,
}) => {
  const sourceIds = new Set(
    sourceData
      .map((row) => normalizeKey(row?.[primaryKey]))
      .filter(Boolean)
  );

  const analyticsIds = new Set(
    analyticsData
      .map((row) => normalizeKey(row?.[primaryKey]))
      .filter(Boolean)
  );

  const missingInAnalytics = [...sourceIds].filter(
    (id) => !analyticsIds.has(id)
  );

  const extraInAnalytics = [...analyticsIds].filter(
    (id) => !sourceIds.has(id)
  );

  const countMismatch = sourceData.length !== analyticsData.length;
  const keyMismatch =
    missingInAnalytics.length > 0 || extraInAnalytics.length > 0;

  return {
    fullSync: countMismatch || keyMismatch,
    countMismatch,
    keyMismatch,
    sourceCount: sourceData.length,
    analyticsCount: analyticsData.length,
    missingInAnalytics,
    extraInAnalytics,
  };
};
