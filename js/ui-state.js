import { calculate } from "./calculations.js";

export function snapshotMetrics(snapshot) {
  const calculated = calculate({
    assets: snapshot.assets,
    debts: snapshot.debts,
    cashFlow: snapshot.cashFlow
  });
  return { ...calculated, ...(snapshot.metrics || {}) };
}

export function buildUiState(state) {
  const snapshots = [...state.snapshots]
    .sort((a, b) => a.snapshotDate.localeCompare(b.snapshotDate))
    .map(snapshot => ({ ...snapshot, displayMetrics: snapshotMetrics(snapshot) }));

  const timeline = [
    ...snapshots.map(snapshot => ({ date: snapshot.snapshotDate, kind: "real", source: snapshot })),
    ...state.goals.map(goal => ({ date: goal.targetDate, kind: "target", source: goal }))
  ].sort((a, b) => a.date.localeCompare(b.date));

  return {
    counts: {
      assets: state.current.assets.length,
      debts: state.current.debts.length,
      snapshots: state.snapshots.length,
      goals: state.goals.length
    },
    snapshots,
    goals: state.goals,
    timeline
  };
}
