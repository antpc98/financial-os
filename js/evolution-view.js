function fallback(message) {
  return `<div class="empty-state">${message}</div>`;
}

export function renderEvolutionDom({ ui, timelineElement, goalsElement, formatCurrency, formatNumber, formatDate, metricLabel, escapeHtml }) {
  const renderTimelineEntry = entry => {
    try {
      if (entry.kind === "real") {
        const metrics = entry.source?.displayMetrics || {};
        return `<article class="timeline-item real"><div class="timeline-top"><strong>Snapshot real</strong><span class="timeline-type">REAL</span></div><div class="timeline-metrics">${formatDate(entry.date)} · Patrimonio ${formatCurrency(metrics.netWorth)} · Deuda ${formatCurrency(metrics.totalDebt)} · Liquidez ${formatCurrency(metrics.liquidity)}</div></article>`;
      }
      const goal = entry.source || {};
      const value = goal.metric === "securityMonths" ? `${formatNumber(goal.targetValue)} meses` : formatCurrency(goal.targetValue);
      return `<article class="timeline-item target"><div class="timeline-top"><strong>${escapeHtml(goal.name || "Objetivo sin nombre")}</strong><span class="timeline-type">OBJETIVO</span></div><div class="timeline-metrics">${formatDate(entry.date)} · ${escapeHtml(metricLabel(goal))} ${escapeHtml(goal.operator || "")} ${value}</div></article>`;
    } catch (error) {
      console.error("Financial OS: error al renderizar una entrada de Timeline.", error);
      return '<article class="timeline-item render-error"><strong>No se pudo mostrar esta entrada</strong></article>';
    }
  };

  const renderGoal = goal => {
    try {
      const value = goal.metric === "securityMonths" ? `${formatNumber(goal.targetValue)} meses` : formatCurrency(goal.targetValue);
      return `<article class="list-item"><div><div class="item-title">${escapeHtml(goal.name || "Objetivo sin nombre")}</div><div class="item-meta">${escapeHtml(metricLabel(goal))} · ${formatDate(goal.targetDate)}</div></div><div class="item-value">${escapeHtml(goal.operator || "")} ${value}</div><div class="item-actions"><button class="small-button" data-edit-goal="${escapeHtml(goal.id)}">Editar</button><button class="small-button delete" data-delete-goal="${escapeHtml(goal.id)}">Eliminar</button></div></article>`;
    } catch (error) {
      console.error("Financial OS: error al renderizar un objetivo.", error);
      return '<article class="list-item render-error"><strong>No se pudo mostrar este objetivo</strong></article>';
    }
  };

  try {
    timelineElement.innerHTML = ui.timeline.length ? ui.timeline.map(renderTimelineEntry).join("") : fallback("Crea un snapshot o un objetivo para iniciar la timeline.");
  } catch (error) {
    console.error("Financial OS: error al renderizar Timeline.", error);
    timelineElement.innerHTML = fallback("No se pudo mostrar la Timeline.");
  }

  try {
    goalsElement.innerHTML = ui.goals.length ? ui.goals.map(renderGoal).join("") : fallback("No hay objetivos configurados.");
  } catch (error) {
    console.error("Financial OS: error al renderizar Objetivos.", error);
    goalsElement.innerHTML = fallback("No se pudieron mostrar los objetivos.");
  }
}
