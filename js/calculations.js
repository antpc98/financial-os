export const ASSET_TYPES = { house: "Vivienda", vehicle: "Vehículo", bankAccount: "Cuenta bancaria", investment: "Inversión", cash: "Efectivo", other: "Otros" };
export const DEBT_TYPES = { mortgage: "Hipoteca", personalLoan: "Préstamo personal", vehicleLoan: "Préstamo vehículo", credit: "Crédito", deferredPurchase: "Compra aplazada", other: "Otros" };
export const METRICS = { netWorth: "Patrimonio neto", totalAssets: "Activos", totalDebt: "Deuda total", nonMortgageDebt: "Deuda no hipotecaria", liquidity: "Liquidez", investments: "Inversiones", securityMonths: "Meses de seguridad", monthlySavings: "Ahorro mensual" };
const sum = values => values.reduce((total, value) => total + (Number(value) || 0), 0);
export function calculate(current) {
  const totalAssets = sum(current.assets.map(x => x.value));
  const totalDebt = sum(current.debts.map(x => x.outstandingBalance));
  const mortgageDebt = sum(current.debts.filter(x => x.type === "mortgage").map(x => x.outstandingBalance));
  const nonMortgageDebt = totalDebt - mortgageDebt;
  const monthlyDebtPayments = sum(current.debts.map(x => x.monthlyPayment));
  const liquidity = sum(current.assets.filter(x => ["bankAccount", "cash"].includes(x.type)).map(x => x.value));
  const investments = sum(current.assets.filter(x => x.type === "investment").map(x => x.value));
  const flow = current.cashFlow;
  const monthlySavings = flow.monthlyIncome - flow.essentialExpenses - monthlyDebtPayments - flow.variableExpenses - flow.monthlyInvestment;
  const savingsRate = flow.monthlyIncome > 0 ? monthlySavings / flow.monthlyIncome : 0;
  const essentialOutflow = flow.essentialExpenses + monthlyDebtPayments;
  const securityMonths = essentialOutflow > 0 ? liquidity / essentialOutflow : 0;
  return { totalAssets, totalDebt, mortgageDebt, nonMortgageDebt, monthlyDebtPayments, liquidity, investments, netWorth: totalAssets - totalDebt, monthlyIncome: flow.monthlyIncome, monthlySavings, savingsRate, essentialOutflow, securityMonths };
}
export function health(metrics, rules) { if (metrics.securityMonths < rules.fragileMaxMonths) return { key: "fragile", label: "🔴 FRÁGIL" }; if (metrics.securityMonths >= rules.stableMinMonths) return { key: "stable", label: "🟢 ESTABLE" }; return { key: "control", label: "🟠 CONTROL" }; }
export function createSnapshot(current) { const metrics = calculate(current); return { id: crypto.randomUUID(), snapshotDate: current.asOfDate, createdAt: new Date().toISOString(), assets: structuredClone(current.assets), debts: structuredClone(current.debts), cashFlow: structuredClone(current.cashFlow), metrics: structuredClone(metrics) }; }
