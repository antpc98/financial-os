import assert from "node:assert/strict";
const memory = new Map();
globalThis.localStorage = { getItem: key => memory.get(key) ?? null, setItem: (key, value) => memory.set(key, value), removeItem: key => memory.delete(key) };

const { calculate, createSnapshot, health } = await import("../js/calculations.js");
const { emptyState, importState, exportState, resetState } = await import("../js/storage.js");

const current = {
  asOfDate: "2026-01-01",
  assets: [{ id: "a", name: "Cuenta", type: "bankAccount", value: 600, approximate: false }, { id: "b", name: "Inversión", type: "investment", value: 400, approximate: false }],
  debts: [{ id: "d", name: "Préstamo", type: "personalLoan", outstandingBalance: 250, monthlyPayment: 50, interestRate: 0, endDate: "", approximate: false }],
  cashFlow: { monthlyIncome: 1000, essentialExpenses: 300, variableExpenses: 100, monthlyInvestment: 50 }
};
const metrics = calculate(current);
assert.equal(metrics.totalAssets, 1000); assert.equal(metrics.totalDebt, 250); assert.equal(metrics.netWorth, 750); assert.equal(metrics.monthlySavings, 500); assert.equal(metrics.securityMonths, 600 / 350);
assert.equal(health(metrics, { fragileMaxMonths: 1, stableMinMonths: 3 }).key, "control");
const snapshot = createSnapshot(current); current.assets[0].value = 1; assert.equal(snapshot.assets[0].value, 600, "el snapshot debe ser una copia profunda");

const compact = { formatVersion: 1, snapshotDate: "2026-01-01", assets: { house: 0, car: 0, investments: 10, bankAccounts: [{ name: "Cuenta", value: 20 }] }, liabilities: { mortgage: 0, loans: [] }, income: { monthlyNet: 100 } };
const imported = importState(JSON.stringify(compact)); assert.equal(imported.current.assets.length, 2); assert.equal(imported.current.cashFlow.monthlyIncome, 100);
const roundTrip = importState(exportState(imported)); assert.equal(roundTrip.formatVersion, 2); assert.equal(roundTrip.current.assets.length, 2);
assert.throws(() => importState("{no"), /JSON válido/); assert.throws(() => importState(JSON.stringify({ formatVersion: 2 })), /current/);
const cleared = resetState(); assert.equal(cleared.initialized, false); assert.equal(memory.size, 0);
console.log("core.test.mjs: OK");
