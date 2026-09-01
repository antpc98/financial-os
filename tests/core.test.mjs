import assert from "node:assert/strict";
const memory = new Map();
globalThis.localStorage = { getItem: key => memory.get(key) ?? null, setItem: (key, value) => memory.set(key, value), removeItem: key => memory.delete(key) };

const { calculate, createSnapshot, health } = await import("../js/calculations.js");
const { emptyState, importState, exportState, resetState } = await import("../js/storage.js");
const { buildUiState } = await import("../js/ui-state.js");
const { chartDate } = await import("../js/charts.js");

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

const regressionState = emptyState();
regressionState.current.assets = Array.from({ length: 5 }, (_, i) => ({ id: `asset-${i}`, name: `Activo ${i + 1}`, type: "other", value: 10, approximate: false }));
regressionState.current.debts = Array.from({ length: 10 }, (_, i) => ({ id: `debt-${i}`, name: `Deuda ${i + 1}`, type: "other", outstandingBalance: 5, monthlyPayment: 1, interestRate: 0, endDate: "", approximate: false }));
regressionState.snapshots = [{ id: "snapshot-1", snapshotDate: "2026-09-01", assets: structuredClone(regressionState.current.assets), debts: structuredClone(regressionState.current.debts), cashFlow: structuredClone(regressionState.current.cashFlow) }];
regressionState.goals = Array.from({ length: 5 }, (_, i) => ({ id: `goal-${i}`, name: `Objetivo ${i + 1}`, metric: "netWorth", operator: ">=", targetValue: i, targetDate: `2027-0${i + 1}-01` }));
const importedRegression = importState(JSON.stringify(regressionState));
const ui = buildUiState(importedRegression);
assert.deepEqual(ui.counts, { assets: 5, debts: 10, snapshots: 1, goals: 5 });
assert.equal(ui.snapshots.length, 1); assert.equal(ui.goals.length, 5); assert.equal(ui.timeline.length, 6);
assert.equal(ui.timeline.filter(item => item.kind === "real").length, 1); assert.equal(ui.timeline.filter(item => item.kind === "target").length, 5);
assert.equal(ui.snapshots[0].displayMetrics.totalAssets, 50, "la UI debe recalcular métricas ausentes del snapshot");
assert.equal(chartDate("2026-09-01"), "01/09/2026");
assert.throws(() => importState("{no"), /JSON válido/); assert.throws(() => importState(JSON.stringify({ formatVersion: 2 })), /current/);
const cleared = resetState(); assert.equal(cleared.initialized, false); assert.equal(memory.size, 0);
console.log("core.test.mjs: OK");
