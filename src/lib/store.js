const KEY_BUDGET = 'ss_budget'
const KEY_SAVED = 'ss_saved_plans'
const KEY_LEDGER = 'ss_ledger'
const KEY_DEALS = 'ss_saved_deals'

const read = (k, fallback) => {
  try {
    return JSON.parse(localStorage.getItem(k)) ?? fallback
  } catch {
    return fallback
  }
}
const write = (k, v) => localStorage.setItem(k, JSON.stringify(v))

export function loadBudget() {
  const v = Number(localStorage.getItem(KEY_BUDGET))
  return Number.isFinite(v) && v > 0 ? v : 1000
}

export function saveBudget(v) {
  localStorage.setItem(KEY_BUDGET, String(v))
}

export function loadSavedPlans() {
  return read(KEY_SAVED, [])
}

export function toggleSavePlan(plan) {
  const list = loadSavedPlans()
  const i = list.findIndex((p) => p.id === plan.id)
  if (i >= 0) list.splice(i, 1)
  else list.unshift(plan)
  write(KEY_SAVED, list)
  return list
}

export function removeSavedPlan(id) {
  const list = loadSavedPlans().filter((p) => p.id !== id)
  write(KEY_SAVED, list)
  return list
}

// ---- 记账本 ----
export function loadLedger() {
  return read(KEY_LEDGER, [])
}

export function addLedgerEntry(entry) {
  const list = [{ ...entry, id: `e${Date.now()}`, ts: Date.now() }, ...loadLedger()]
  write(KEY_LEDGER, list)
  return list
}

export function removeLedgerEntry(id) {
  const list = loadLedger().filter((e) => e.id !== id)
  write(KEY_LEDGER, list)
  return list
}

export function clearLedger() {
  write(KEY_LEDGER, [])
  return []
}

// ---- 心动清单（详情页收藏，汇入心动模式路线） ----
const KEY_SPOTS = 'ss_saved_spots'
export function loadSavedSpots() {
  return read(KEY_SPOTS, [])
}
export function toggleSavedSpot(spot) {
  const list = loadSavedSpots()
  const i = list.findIndex((s) => s.id === spot.id)
  if (i >= 0) list.splice(i, 1)
  else list.push(spot)
  write(KEY_SPOTS, list)
  return list
}
// ---- 用户共建投稿 ----
const KEY_CONTRIB = 'ss_contribs'
export function loadContribs() {
  return read(KEY_CONTRIB, [])
}
export function addContrib(entry) {
  const list = [{ ...entry, id: `c${Date.now()}`, ts: Date.now() }, ...loadContribs()]
  write(KEY_CONTRIB, list)
  return list
}
export function removeContrib(id) {
  const list = loadContribs().filter((c) => c.id !== id)
  write(KEY_CONTRIB, list)
  return list
}

export function loadSavedDeals() {
  return read(KEY_DEALS, [])
}

export function toggleSavedDeal(id) {
  const list = loadSavedDeals()
  const i = list.indexOf(id)
  if (i >= 0) list.splice(i, 1)
  else list.push(id)
  write(KEY_DEALS, list)
  return list
}
