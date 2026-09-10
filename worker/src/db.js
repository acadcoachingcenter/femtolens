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

// ---------- Research runs (Active Research) ----------

export async function createRun(db, { id, userId, question, type, depth, plan }) {
  const now = nowIso()
  await db.prepare(`
    INSERT INTO research_runs (id, user_id, question, type, depth, status, plan_json, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, 'running', ?, ?, ?)
  `).bind(id, userId, question, type || null, depth || null, plan ? JSON.stringify(plan) : null, now, now).run()
}

export async function updateRun(db, id, userId, { status, papers, synthesis, error }) {
  const now = nowIso()
  await db.prepare(`
    UPDATE research_runs SET
      status = ?,
      papers_json = COALESCE(?, papers_json),
      synthesis_json = COALESCE(?, synthesis_json),
      error = ?,
      updated_at = ?
    WHERE id = ? AND user_id = ?
  `).bind(
    status,
    papers ? JSON.stringify(papers) : null,
    synthesis ? JSON.stringify(synthesis) : null,
    error || null,
    now,
    id,
    userId
  ).run()
}

export async function setRunSaved(db, id, userId, saved) {
  await db.prepare('UPDATE research_runs SET saved = ? WHERE id = ? AND user_id = ?')
    .bind(saved ? 1 : 0, id, userId).run()
}

export async function listRuns(db, userId, { limit = 20, offset = 0, search = '', status = '' } = {}) {
  let sql = `
    SELECT id, question, type, depth, status, saved, created_at, updated_at,
           (papers_json IS NOT NULL) as has_papers
    FROM research_runs
    WHERE user_id = ?
  `
  const params = [userId]
  if (search) {
    sql += ' AND question LIKE ?'
    params.push(`%${search}%`)
  }
  if (status) {
    sql += ' AND status = ?'
    params.push(status)
  }
  sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?'
  params.push(limit, offset)
  const { results } = await db.prepare(sql).bind(...params).all()
  return results
}

export async function getRun(db, id, userId) {
  return db.prepare('SELECT * FROM research_runs WHERE id = ? AND user_id = ?').bind(id, userId).first()
}
