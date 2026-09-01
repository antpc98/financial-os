import { importState } from "../js/storage.js";
import { buildUiState } from "../js/ui-state.js";
import { renderEvolutionDom } from "../js/evolution-view.js";

const memory = new Map();
const originalStorage = window.localStorage;
const storage = { getItem: key => memory.get(key) ?? null, setItem: (key, value) => memory.set(key, value), removeItem: key => memory.delete(key) };
Object.defineProperty(window, "localStorage", { configurable: true, value: storage });

try {
  const fixture = await fetch("fixtures/v2-render-regression.json").then(response => response.text());
  const state = importState(fixture);
  const ui = buildUiState(state);
  renderEvolutionDom({
    ui,
    timelineElement: document.querySelector("#timeline"),
    goalsElement: document.querySelector("#goalsList"),
    formatCurrency: value => `${Number(value || 0).toFixed(2)} €`,
    formatNumber: value => String(Number(value || 0)),
    formatDate: value => value,
    metricLabel: goal => goal.metric,
    escapeHtml: value => String(value).replace(/[&<>"']/g, character => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[character]))
  });
  const timelineCount = document.querySelectorAll("#timeline .timeline-item").length;
  const goalsCount = document.querySelectorAll("#goalsList .list-item").length;
  if (timelineCount !== 6 || goalsCount !== 5) throw new Error(`Conteos DOM incorrectos: ${timelineCount} timeline, ${goalsCount} goals.`);
  document.querySelector("#result").textContent = "PASS";
} catch (error) {
  document.querySelector("#result").textContent = `FAIL: ${error.message}`;
  console.error(error);
} finally {
  Object.defineProperty(window, "localStorage", { configurable: true, value: originalStorage });
}
