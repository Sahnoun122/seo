// Some hosting dashboards (Vercel, Railway, etc.) silently accept a stray
// leading/trailing whitespace character (tab, space, newline) when an env var
// value is copy-pasted in — `NODE_ENV` set to "\tproduction" is a real case
// that broke every `=== 'production'` check in this codebase despite the
// value looking correct in the dashboard UI. Trim on every call so this can't
// happen again.
//
// This is a function rather than a precomputed constant so it always reads
// the live value of process.env.NODE_ENV, regardless of when dotenv finishes
// loading relative to this module being imported — some entry points (e.g.
// scripts/seed.js) call dotenv.config() manually after their static imports
// have already run, which would otherwise bake in a stale/empty value.
export const isProduction = () => (process.env.NODE_ENV || '').trim() === 'production';
