const clone = value => globalThis.structuredClone ? structuredClone(value) : JSON.parse(JSON.stringify(value));

export function latestSnapshot(snapshots = []) {
  return snapshots.reduce((latest, snapshot) => !latest || snapshot.snapshotDate > latest.snapshotDate ? snapshot : latest, null);
}

export function currentFromSnapshot(snapshot) {
  if (!snapshot) return null;
  return {
    asOfDate: snapshot.snapshotDate,
    assets: clone(snapshot.assets || []),
    debts: clone(snapshot.debts || []),
    cashFlow: clone(snapshot.cashFlow || { monthlyIncome: 0, essentialExpenses: 0, variableExpenses: 0, monthlyInvestment: 0 })
  };
}

export function reconcileCurrentWithSnapshots(state) {
  const latest = latestSnapshot(state.snapshots);
  if (!latest || latest.snapshotDate <= state.current.asOfDate) return { state, currentUpdated: false };
  return { state: { ...state, current: currentFromSnapshot(latest) }, currentUpdated: true };
}

export function getFinancialStateForPeriod(state, period) {
  const inPeriod = state.snapshots.filter(snapshot => snapshot.snapshotDate.slice(0, 7) === period);
  const periodSnapshot = latestSnapshot(inPeriod);
  const currentInPeriod = state.current.asOfDate.slice(0, 7) === period;
  if (currentInPeriod && (!periodSnapshot || state.current.asOfDate >= periodSnapshot.snapshotDate)) return state.current;
  if (periodSnapshot) return currentFromSnapshot(periodSnapshot);

  const prior = latestSnapshot(state.snapshots.filter(snapshot => snapshot.snapshotDate.slice(0, 7) < period));
  if (prior) return currentFromSnapshot(prior);
  if (period >= state.current.asOfDate.slice(0, 7)) return state.current;
  return null;
}
