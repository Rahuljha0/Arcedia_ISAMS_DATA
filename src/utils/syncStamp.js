export const withSyncedAt = (rows) => {
  const ts = new Date().toLocaleString("sv-SE", { timeZone: "Asia/Dubai" });
  return rows.map((r) => ({ ...r, synced_at: ts }));
};
