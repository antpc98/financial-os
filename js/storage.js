const STORAGE_KEY = "financialOS.state.v2";
const LEGACY_KEY = "financialOS.snapshot.sep2026";
export const FORMAT_VERSION = 2;

export const emptyState = () => ({
  formatVersion: FORMAT_VERSION,
  initialized: false,
  current: { asOfDate: new Date().toISOString().slice(0, 10), assets: [], debts: [], cashFlow: { monthlyIncome: 0, essentialExpenses: 0, variableExpenses: 0, monthlyInvestment: 0 } },
  snapshots: [], goals: [],
  settings: { currency: "EUR", locale: "es-ES", theme: "dark", healthRules: { fragileMaxMonths: 1, stableMinMonths: 3 } },
  metadata: { createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
});

const clone = value => JSON.parse(JSON.stringify(value));
const isObject = value => value && typeof value === "object" && !Array.isArray(value);
const finitePositive = value => typeof value === "number" && Number.isFinite(value) && value >= 0;
const dateOk = value => typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(`${value}T00:00:00`));
const id = () => globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(16).slice(2)}`;

function validateAsset(asset, path, errors) {
  if (!isObject(asset)) return errors.push(`${path} debe ser un objeto.`);
  if (typeof asset.name !== "string" || !asset.name.trim()) errors.push(`${path}.name es obligatorio.`);
  if (!["house", "vehicle", "bankAccount", "investment", "cash", "other"].includes(asset.type)) errors.push(`${path}.type no es válido.`);
  if (!finitePositive(asset.value)) errors.push(`${path}.value debe ser un número igual o mayor que cero.`);
  if (asset.approximate !== undefined && typeof asset.approximate !== "boolean") errors.push(`${path}.approximate debe ser true o false.`);
}
function validateDebt(debt, path, errors) {
  if (!isObject(debt)) return errors.push(`${path} debe ser un objeto.`);
  if (typeof debt.name !== "string" || !debt.name.trim()) errors.push(`${path}.name es obligatorio.`);
  if (!["mortgage", "personalLoan", "vehicleLoan", "credit", "deferredPurchase", "other"].includes(debt.type)) errors.push(`${path}.type no es válido.`);
  ["outstandingBalance", "monthlyPayment", "interestRate"].forEach(key => { if (!finitePositive(debt[key] ?? 0)) errors.push(`${path}.${key} debe ser un número igual o mayor que cero.`); });
  if (debt.endDate && !dateOk(debt.endDate)) errors.push(`${path}.endDate no es una fecha válida.`);
}
function validateCashFlow(flow, path, errors) {
  if (!isObject(flow)) return errors.push(`${path} debe ser un objeto.`);
  ["monthlyIncome", "essentialExpenses", "variableExpenses", "monthlyInvestment"].forEach(key => { if (!finitePositive(flow[key])) errors.push(`${path}.${key} debe ser un número igual o mayor que cero.`); });
}

export function validateState(value) {
  const errors = [];
  if (!isObject(value)) return { valid: false, errors: ["El JSON debe contener un objeto."] };
  if (value.formatVersion !== FORMAT_VERSION) errors.push(`formatVersion debe ser ${FORMAT_VERSION}.`);
  if (!isObject(value.current)) errors.push("current es obligatorio.");
  else {
    if (!dateOk(value.current.asOfDate)) errors.push("current.asOfDate debe usar YYYY-MM-DD.");
    if (!Array.isArray(value.current.assets)) errors.push("current.assets debe ser una lista."); else value.current.assets.forEach((x, i) => validateAsset(x, `current.assets[${i}]`, errors));
    if (!Array.isArray(value.current.debts)) errors.push("current.debts debe ser una lista."); else value.current.debts.forEach((x, i) => validateDebt(x, `current.debts[${i}]`, errors));
    validateCashFlow(value.current.cashFlow, "current.cashFlow", errors);
  }
  if (!Array.isArray(value.snapshots)) errors.push("snapshots debe ser una lista.");
  else value.snapshots.forEach((snapshot, i) => {
    const path = `snapshots[${i}]`;
    if (!isObject(snapshot)) return errors.push(`${path} debe ser un objeto.`);
    if (!dateOk(snapshot.snapshotDate)) errors.push(`${path}.snapshotDate no es válido.`);
    if (!Array.isArray(snapshot.assets)) errors.push(`${path}.assets debe ser una lista.`); else snapshot.assets.forEach((x, j) => validateAsset(x, `${path}.assets[${j}]`, errors));
    if (!Array.isArray(snapshot.debts)) errors.push(`${path}.debts debe ser una lista.`); else snapshot.debts.forEach((x, j) => validateDebt(x, `${path}.debts[${j}]`, errors));
    validateCashFlow(snapshot.cashFlow, `${path}.cashFlow`, errors);
  });
  if (!Array.isArray(value.goals)) errors.push("goals debe ser una lista.");
  else value.goals.forEach((goal, i) => {
    const path = `goals[${i}]`;
    if (!isObject(goal)) return errors.push(`${path} debe ser un objeto.`);
    if (typeof goal.name !== "string" || !goal.name.trim()) errors.push(`${path}.name es obligatorio.`);
    if (!["netWorth", "totalAssets", "totalDebt", "nonMortgageDebt", "liquidity", "investments", "securityMonths", "monthlySavings"].includes(goal.metric)) errors.push(`${path}.metric no es válida.`);
    if (![">=", "<="].includes(goal.operator)) errors.push(`${path}.operator no es válido.`);
    if (!finitePositive(goal.targetValue)) errors.push(`${path}.targetValue debe ser un número no negativo.`);
    if (!dateOk(goal.targetDate)) errors.push(`${path}.targetDate no es válida.`);
  });
  if (value.settings && (!isObject(value.settings) || !isObject(value.settings.healthRules) || !finitePositive(value.settings.healthRules.fragileMaxMonths) || !finitePositive(value.settings.healthRules.stableMinMonths) || value.settings.healthRules.stableMinMonths <= value.settings.healthRules.fragileMaxMonths)) errors.push("settings.healthRules contiene umbrales no válidos.");
  return { valid: errors.length === 0, errors };
}

function normalize(state) {
  const base = emptyState();
  const result = { ...base, ...clone(state), initialized: true };
  result.current.assets = result.current.assets.map(a => ({ ...a, id: a.id || id(), approximate: Boolean(a.approximate) }));
  result.current.debts = result.current.debts.map(d => ({ interestRate: 0, endDate: "", approximate: false, ...d, id: d.id || id() }));
  result.snapshots = (result.snapshots || []).map(s => ({ ...s, id: s.id || id() }));
  result.goals = (result.goals || []).map(g => ({ ...g, id: g.id || id() }));
  result.settings = { ...base.settings, ...(result.settings || {}), healthRules: { ...base.settings.healthRules, ...(result.settings?.healthRules || {}) } };
  return result;
}

function convertV1(data) {
  if (data.formatVersion !== 1 || !dateOk(data.snapshotDate) || !isObject(data.assets) || !isObject(data.liabilities) || !isObject(data.income)) return null;
  const state = emptyState();
  state.current.asOfDate = data.snapshotDate;
  const addAsset = (name, type, value) => { if (finitePositive(value) && value > 0) state.current.assets.push({ id: id(), name, type, value, approximate: false }); };
  addAsset("Vivienda", "house", data.assets.house); addAsset("Vehículo", "vehicle", data.assets.car); addAsset("Inversiones", "investment", data.assets.investments);
  if (!Array.isArray(data.assets.bankAccounts || [])) throw new Error("assets.bankAccounts debe ser una lista.");
  data.assets.bankAccounts.forEach((account, index) => {
    const value = isObject(account) ? account.value : account;
    if (!finitePositive(value)) throw new Error(`assets.bankAccounts[${index}] no es válido.`);
    addAsset(isObject(account) && account.name ? account.name : `Cuenta ${index + 1}`, "bankAccount", value);
  });
  const addDebt = (name, type, value) => { if (finitePositive(value) && value > 0) state.current.debts.push({ id: id(), name, type, outstandingBalance: value, monthlyPayment: 0, interestRate: 0, endDate: "", approximate: false }); };
  addDebt("Hipoteca", "mortgage", data.liabilities.mortgage);
  if (!Array.isArray(data.liabilities.loans || [])) throw new Error("liabilities.loans debe ser una lista.");
  data.liabilities.loans.forEach((loan, index) => {
    const value = isObject(loan) ? (loan.outstandingBalance ?? loan.value) : loan;
    if (!finitePositive(value)) throw new Error(`liabilities.loans[${index}] no es válido.`);
    addDebt(isObject(loan) && loan.name ? loan.name : `Préstamo ${index + 1}`, "personalLoan", value);
  });
  if (!finitePositive(data.income.monthlyNet)) throw new Error("income.monthlyNet debe ser un número igual o mayor que cero.");
  state.current.cashFlow.monthlyIncome = data.income.monthlyNet;
  return state;
}

export function loadState() {
  try { const raw = localStorage.getItem(STORAGE_KEY); if (!raw) return emptyState(); const parsed = JSON.parse(raw); return validateState(parsed).valid ? normalize(parsed) : emptyState(); }
  catch { return emptyState(); }
}
export function saveState(state) { const safe = normalize(state); safe.metadata.updatedAt = new Date().toISOString(); localStorage.setItem(STORAGE_KEY, JSON.stringify(safe)); return safe; }
export function exportState(state) { return JSON.stringify({ ...clone(state), formatVersion: FORMAT_VERSION, exportedAt: new Date().toISOString() }, null, 2); }
export function importState(text) {
  let parsed; try { parsed = JSON.parse(text); } catch { throw new Error("El archivo no contiene JSON válido."); }
  if (parsed.formatVersion === 1) parsed = convertV1(parsed);
  const check = validateState(parsed); if (!check.valid) throw new Error(check.errors.slice(0, 4).join(" "));
  return saveState(parsed);
}
export function resetState() { localStorage.removeItem(STORAGE_KEY); localStorage.removeItem(LEGACY_KEY); return emptyState(); }
