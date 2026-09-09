import { TIERS } from './tiers.js'

function uuid() {
  return crypto.randomUUID()
}

function nowIso() {
  return new Date().toISOString()
}

function addDaysIso(days) {
  return new Date(Date.now() + days * 86400000).toISOString()
}

export async function upsertGoogleUser(db, { sub, email, name, picture }) {
  const existing = await db.prepare('SELECT * FROM users WHERE google_sub = ?').bind(sub).first()
  if (existing) {
    await db.prepare('UPDATE users SET email = ?, name = ?, picture = ? WHERE id = ?')
      .bind(email, name || null, picture || null, existing.id).run()
    return { ...existing, email, name, picture }
  }
  const id = uuid()
  await db.prepare('INSERT INTO users (id, google_sub, email, name, picture, created_at) VALUES (?, ?, ?, ?, ?, ?)')
    .bind(id, sub, email, name || null, picture || null, nowIso()).run()
  await db.prepare('INSERT INTO subscriptions (user_id, tier, status, period_start, period_end, runs_used) VALUES (?, ?, ?, ?, ?, ?)')
    .bind(id, 'trial', 'active', nowIso(), addDaysIso(TIERS.trial.periodDays), 0).run()
  return { id, google_sub: sub, email, name, picture, created_at: nowIso() }
}

export async function getUserById(db, id) {
  return db.prepare('SELECT * FROM users WHERE id = ?').bind(id).first()
}

// Returns the subscription row, rolling the period (and resetting runs_used)
// if the current period has expired.
export async function getActiveSubscription(db, userId) {
  let sub = await db.prepare('SELECT * FROM subscriptions WHERE user_id = ?').bind(userId).first()
  if (!sub) {
    await db.prepare('INSERT INTO subscriptions (user_id, tier, status, period_start, period_end, runs_used) VALUES (?, ?, ?, ?, ?, ?)')
      .bind(userId, 'trial', 'active', nowIso(), addDaysIso(TIERS.trial.periodDays), 0).run()
    sub = await db.prepare('SELECT * FROM subscriptions WHERE user_id = ?').bind(userId).first()
  }
  if (new Date(sub.period_end).getTime() < Date.now()) {
    const tierConf = TIERS[sub.tier] || TIERS.trial
    await db.prepare('UPDATE subscriptions SET period_start = ?, period_end = ?, runs_used = 0 WHERE user_id = ?')
      .bind(nowIso(), addDaysIso(tierConf.periodDays), userId).run()
    sub = await db.prepare('SELECT * FROM subscriptions WHERE user_id = ?').bind(userId).first()
  }
  return sub
}

export async function incrementRunUsage(db, userId) {
  await db.prepare('UPDATE subscriptions SET runs_used = runs_used + 1 WHERE user_id = ?').bind(userId).run()
}

export async function recordGroqUsage(db, headers) {
  const num = (v) => (v === null || v === undefined ? null : Number(v))
  await db.prepare(`
    UPDATE groq_usage SET
      limit_requests = ?, remaining_requests = ?,
      limit_tokens = ?, remaining_tokens = ?,
      reset_requests = ?, reset_tokens = ?,
      updated_at = ?
    WHERE id = 1
  `).bind(
    num(headers.get('x-ratelimit-limit-requests')),
    num(headers.get('x-ratelimit-remaining-requests')),
    num(headers.get('x-ratelimit-limit-tokens')),
    num(headers.get('x-ratelimit-remaining-tokens')),
    headers.get('x-ratelimit-reset-requests'),
    headers.get('x-ratelimit-reset-tokens'),
    nowIso()
  ).run()
}

export async function getGroqUsage(db) {
  return db.prepare('SELECT * FROM groq_usage WHERE id = 1').first()
}
