// READ-ONLY health check: source API count vs Zoho Analytics count, with timings.
import fs from "fs";
import path from "path";
import { pathToFileURL } from "url";
import { config } from "./src/config/env.js";
import { getReconciliationResult } from "./src/utils/syncReconciliation.js";

const SLOW_MS = 5000;
const SEQUENTIAL = process.env.SEQUENTIAL === "1";

const dir = path.resolve("./src/services");
const services = [];
for (const f of fs.readdirSync(dir).filter((x) => x.endsWith(".js"))) {
  const mod = await import(pathToFileURL(path.join(dir, f)).href);
  for (const [exp, obj] of Object.entries(mod)) {
    if (!obj || typeof obj !== "object") continue;
    const names = new Set();
    let o = obj;
    while (o && o !== Object.prototype) {
      Object.getOwnPropertyNames(o).forEach((n) => typeof obj[n] === "function" && n !== "constructor" && names.add(n));
      o = Object.getPrototypeOf(o);
    }
    services.push({ file: f, exp, obj, names: [...names] });
  }
}
const isAnalytics = (s) => /analytic/i.test(s.file);
const isMeta = (s) => /metadata/i.test(s.file);
const find = (re, filter, exclude = /lastupdated|upsert|delete|update|create|token|refresh/i) => {
  for (const s of services.filter(filter))
    for (const n of s.names) if (re.test(n) && !exclude.test(n)) return { svc: s, name: n };
  return null;
};

const entities = [
  { label: "Enrollments",      key: /enrol/i,          src: /^get.*enrol/i },
  { label: "Withdrawals",      key: /withdraw/i,       src: /^get.*withdraw/i, extra: { expand: "customFields" } },
  { label: "Applicants",       key: /^applicant/i,     src: /^get.*applicants?$/i },
  { label: "Application Forms",key: /applicationform/i,src: /^get.*applicationform/i },
  { label: "Prospect Forms",   key: /prospect/i,   src: /^get.*prospectform/i },
  { label: "Student Forms",    key: /studentform/i,    src: /^get.*studentform/i },
  { label: "Tours",            key: /tour/i,           src: /^get.*tours?$/i },
];

const asList = (r) => {
  if (Array.isArray(r)) return r;
  if (r?.data && Array.isArray(r.data)) return r.data;
  const k = Object.keys(r || {}).find((x) => Array.isArray(r[x]));
  return k ? r[k] : [];
};

async function fetchSource(found, extra) {
  const { svc, name } = found;
  let all = [], page = 1;
  for (;;) {
    const r = /arcadia/i.test(svc.file) ? await svc.obj[name]({ page, pageSize: 300, ...(extra || {}) }) : /booking/i.test(svc.file) ? await svc.obj[name]({ from_time: "01-04-2023", to_time: (() => { const d = new Date(); return String(d.getDate()).padStart(2, "0") + "-" + ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][d.getMonth()] + "-" + d.getFullYear(); })() }) : await svc.obj[name]();
    all = all.concat(asList(r));
    const tp = Number(r?.totalPages);
    if (!tp || page >= tp) break;
    page++;
  }
  return all;
}

const pkMap = config.zohoAnalyticApi?.primaryKeys || {};
const pkFor = (re) => {
  const k = Object.keys(pkMap).find((x) => re.test(x));
  return k ? pkMap[k] : undefined;
};

async function check(e) {
  const out = { entity: e.label };
  try {
    const src = find(e.src, (s) => !isAnalytics(s) && !isMeta(s));
    const exp = find(new RegExp("^export.*" + e.key.source.replace(/^\^/, ""), "i"), isAnalytics, /nothing/);
    if (!src) throw new Error("source method not found");
    if (!exp) throw new Error("analytics export method not found. Available: " + services.filter(isAnalytics).flatMap((x) => x.names).filter((n) => /^export/i.test(n)).join(", "));
    out.srcMethod = `${src.svc.exp}.${src.name}`;
    let t = Date.now();
    const source = await fetchSource(src, e.extra);
    out.srcMs = Date.now() - t;
    t = Date.now();
    const an = await exp.svc.obj[exp.name]();
    out.anMs = Date.now() - t;
    const analytics = an?.data || asList(an);
    const pk = pkFor(e.key);
    const srcNorm = source.map((x) => (pk && x[pk] === undefined && x[pk?.toLowerCase()] !== undefined ? { ...x, [pk]: x[pk.toLowerCase()] } : x));
    const rec = getReconciliationResult({ sourceData: srcNorm, analyticsData: analytics, primaryKey: pk });
    Object.assign(out, {
      pk, source: source.length, analytics: analytics.length,
      countMatch: !rec.countMismatch, keyMatch: !rec.keyMismatch,
      missingInAnalytics: rec.missingInAnalytics?.length ?? "?", extraInAnalytics: rec.extraInAnalytics?.length ?? "?",
    });
    out.status = rec.countMismatch || rec.keyMismatch ? "MISMATCH" : Math.max(out.srcMs, out.anMs) > SLOW_MS ? "OK (slow)" : "OK";
  } catch (err) {
    out.status = "FAILED"; out.error = String(err.message || err).slice(0, 400);
  }
  return out;
}

const t0 = Date.now();
const results = [];
if (SEQUENTIAL) for (const e of entities) results.push(await check(e));
else results.push(...(await Promise.all(entities.map(check))));

console.log("\n==== SYNC HEALTH CHECK (read-only) ====");
console.table(results.map((r) => ({
  Entity: r.entity, Status: r.status, Source: r.source, Analytics: r.analytics,
  Count: r.countMatch === undefined ? "-" : r.countMatch ? "match" : "DIFF",
  Keys: r.keyMatch === undefined ? "-" : r.keyMatch ? "match" : "DIFF",
  "Missing in AN": r.missingInAnalytics, "Extra in AN": r.extraInAnalytics,
  "API ms": r.srcMs, "Analytics ms": r.anMs,
})));
results.filter((r) => r.error).forEach((r) => console.log(`FAILED ${r.entity}: ${r.error}`));
results.forEach((r) => r.srcMethod && console.log(`source method ${r.entity}: ${r.srcMethod}`));

const meta = services.find(isMeta);
if (meta) {
  console.log("\n---- last synced (metadata) ----");
  for (const n of meta.names.filter((x) => /^get.*lastupdated$/i.test(x))) {
    try { console.log(n.replace(/^get|LastUpdated$/gi, ""), "=", await meta.obj[n]()); } catch (e) { console.log(n, "error", e.message); }
  }
}
console.log("\ncron:", JSON.stringify(config.cronInterval));
const bad = results.filter((r) => r.status === "MISMATCH" || r.status === "FAILED").length;
console.log(`Total ${((Date.now() - t0) / 1000).toFixed(1)}s | ${results.length - bad}/${results.length} healthy`);
process.exit(bad ? 1 : 0);
