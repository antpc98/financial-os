import { loadState, saveState, exportState, importState, resetState } from "./storage.js";
import { ASSET_TYPES, DEBT_TYPES, METRICS, calculate, health, createSnapshot } from "./calculations.js";
import { barChart, lineChart } from "./charts.js";
import { buildUiState } from "./ui-state.js";
import { renderEvolutionDom } from "./evolution-view.js";

let state = loadState();
const $ = selector => document.querySelector(selector);
const euro = value => new Intl.NumberFormat(state.settings.locale, { style: "currency", currency: state.settings.currency, maximumFractionDigits: 2 }).format(Number(value) || 0);
const number = value => new Intl.NumberFormat(state.settings.locale, { maximumFractionDigits: 1 }).format(Number(value) || 0);
const date = value => value ? new Intl.DateTimeFormat(state.settings.locale, { day: "2-digit", month: "short", year: "numeric" }).format(new Date(`${value}T12:00:00`)) : "Sin fecha";
const uid = () => crypto.randomUUID();
const escapeHtml = value => String(value).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const num = value => Number.isFinite(Number(value)) && Number(value) >= 0 ? Number(value) : 0;
const empty = text => `<div class="empty-state">${text}</div>`;

function commit(message) { state = saveState(state); render(); if (message) toast(message); }
function toast(message, isError=false) { const node=$("#toast"); node.textContent=message; node.className=`toast show${isError?" error":""}`; clearTimeout(toast.timer); toast.timer=setTimeout(()=>node.className="toast",3200); }
function fillSelect(node, entries) { node.innerHTML=Object.entries(entries).map(([value,label])=>`<option value="${value}">${label}</option>`).join(""); }
function showView(name) { document.querySelectorAll(".view").forEach(x=>x.classList.toggle("active",x.id===`view-${name}`)); document.querySelectorAll(".nav-button").forEach(x=>x.classList.toggle("active",x.dataset.view===name)); scrollTo({top:0,behavior:"smooth"}); }
function openModal(dialog) { dialog.showModal(); }

function render() {
  const ui = buildUiState(state);
  document.documentElement.dataset.theme=state.settings.theme;
  const m=calculate(state.current), h=health(m,state.settings.healthRules);
  $("#currentDateLabel").textContent=`SITUACIÓN ACTUAL · ${date(state.current.asOfDate)}`;
  $("#healthBadge").textContent=h.label; $("#healthBadge").className=`health-badge ${h.key}`;
  const kpis=[
    ["Patrimonio neto",m.netWorth,m.netWorth>=0?"positive":"negative"],["Activos",m.totalAssets,"positive"],["Pasivos",m.totalDebt,"negative"],["Liquidez",m.liquidity,""],["Fondo seguridad",m.liquidity,""],
    ["Deuda no hipotecaria",m.nonMortgageDebt,m.nonMortgageDebt?"negative":""],["Inversiones",m.investments,""],["Ingreso mensual",m.monthlyIncome,""],["Capacidad de ahorro",m.monthlySavings,m.monthlySavings>=0?"positive":"negative"],["Meses de seguridad",`${number(m.securityMonths)} meses`,""]
  ];
  $("#kpiGrid").innerHTML=kpis.map(([label,value,cls])=>`<article class="kpi-card"><small>${label}</small><strong class="kpi-value ${cls}">${typeof value==="number"?euro(value):value}</strong></article>`).join("");
  const target=state.settings.healthRules.stableMinMonths, pct=Math.min(100,target?m.securityMonths/target*100:100);
  $("#securityMonths").textContent=`${number(m.securityMonths)} / ${number(target)} meses`; $("#securityProgress").style.width=`${pct}%`; $("#securityDetail").textContent=m.essentialOutflow?`${euro(m.liquidity)} disponibles para ${euro(m.essentialOutflow)} de gastos esenciales y cuotas al mes.`:"Añade gastos esenciales o cuotas para calcular la cobertura.";
  barChart($("#balanceChart"),[{label:"Activos",value:m.totalAssets,color:"var(--green)"},{label:"Pasivos",value:m.totalDebt,color:"var(--red)"}],euro);
  renderAssets(m); renderDebts(m); renderCashflow(m); renderEvolution(ui);
  $("#rulesForm").elements.fragileMaxMonths.value=state.settings.healthRules.fragileMaxMonths; $("#rulesForm").elements.stableMinMonths.value=state.settings.healthRules.stableMinMonths;
  $("#localStatus").textContent=`${ui.counts.assets} activos · ${ui.counts.debts} deudas · ${ui.counts.snapshots} snapshots · ${ui.counts.goals} objetivos`;
}
function renderAssets(m) {
  $("#assetsSummary").textContent=euro(m.totalAssets);
  $("#assetsList").innerHTML=state.current.assets.length?state.current.assets.map(a=>`<article class="list-item"><div><div class="item-title">${escapeHtml(a.name)}</div><div class="item-meta">${ASSET_TYPES[a.type]}${a.approximate?" · Valor aproximado":""}</div></div><div class="item-value positive">${euro(a.value)}</div><div class="item-actions"><button class="small-button" data-edit-asset="${a.id}">Editar</button><button class="small-button delete" data-delete-asset="${a.id}">Eliminar</button></div></article>`).join(""):empty("Todavía no hay activos. Añade el primero cuando quieras.");
}
function renderDebts(m) {
  const summary=[["Deuda total",m.totalDebt],["Hipotecaria",m.mortgageDebt],["No hipotecaria",m.nonMortgageDebt],["Cuotas / mes",m.monthlyDebtPayments]];
  $("#debtSummary").innerHTML=summary.map(x=>`<div class="mini-kpi"><small>${x[0]}</small><strong>${euro(x[1])}</strong></div>`).join("");
  $("#debtsList").innerHTML=state.current.debts.length?state.current.debts.map(d=>`<article class="list-item"><div><div class="item-title">${escapeHtml(d.name)}</div><div class="item-meta">${DEBT_TYPES[d.type]} · ${euro(d.monthlyPayment)}/mes${d.approximate?" · Aproximado":""}</div></div><div class="item-value negative">${euro(d.outstandingBalance)}</div><div class="item-actions"><button class="small-button" data-edit-debt="${d.id}">Editar</button><button class="small-button delete" data-delete-debt="${d.id}">Eliminar</button></div></article>`).join(""):empty("No hay deudas registradas.");
}
function renderCashflow(m) {
  const f=$("#cashflowForm").elements, c=state.current.cashFlow; ["monthlyIncome","essentialExpenses","variableExpenses","monthlyInvestment"].forEach(k=>f[k].value=c[k]); f.debtPayments.value=m.monthlyDebtPayments.toFixed(2);
  $("#cashflowResults").innerHTML=`<article class="kpi-card"><small>Ahorro mensual</small><strong class="kpi-value ${m.monthlySavings>=0?"positive":"negative"}">${euro(m.monthlySavings)}</strong></article><article class="kpi-card"><small>Tasa de ahorro</small><strong class="kpi-value">${number(m.savingsRate*100)} %</strong></article>`;
}
function goalMetric(goal) { return METRICS[goal.metric] || goal.metric; }
function renderEvolution(ui) {
  const points=metric=>ui.snapshots.map(s=>({date:s.snapshotDate,value:s.displayMetrics[metric]??0}));
  lineChart($("#netWorthChart"),points("netWorth"),euro); lineChart($("#debtChart"),points("totalDebt"),euro); lineChart($("#liquidityChart"),points("liquidity"),euro);
  renderEvolutionDom({ ui, timelineElement: $("#timeline"), goalsElement: $("#goalsList"), formatCurrency: euro, formatNumber: number, formatDate: date, metricLabel: goalMetric, escapeHtml });
}

function editAsset(item={id:"",name:"",type:"bankAccount",value:0,approximate:false}) { const f=$("#assetForm"); $("#assetDialogTitle").textContent=item.id?"Editar activo":"Añadir activo"; Object.keys(item).forEach(k=>{if(f.elements[k]) f.elements[k].type==="checkbox"?f.elements[k].checked=item[k]:f.elements[k].value=item[k]}); openModal($("#assetDialog")); }
function editDebt(item={id:"",name:"",type:"personalLoan",outstandingBalance:0,monthlyPayment:0,interestRate:0,endDate:"",approximate:false}) { const f=$("#debtForm"); $("#debtDialogTitle").textContent=item.id?"Editar deuda":"Añadir deuda"; Object.keys(item).forEach(k=>{if(f.elements[k]) f.elements[k].type==="checkbox"?f.elements[k].checked=item[k]:f.elements[k].value=item[k]}); openModal($("#debtDialog")); }
function editGoal(item={id:"",name:"",metric:"netWorth",operator:">=",targetValue:0,targetDate:""}) { const f=$("#goalForm"); $("#goalDialogTitle").textContent=item.id?"Editar objetivo":"Añadir objetivo"; Object.keys(item).forEach(k=>{if(f.elements[k]) f.elements[k].value=item[k]}); openModal($("#goalDialog")); }
function ask(title,message,action) { $("#confirmTitle").textContent=title; $("#confirmMessage").textContent=message; $("#confirmAccept").onclick=()=>{$("#confirmDialog").close();action()}; openModal($("#confirmDialog")); }

fillSelect($("#assetForm").elements.type,ASSET_TYPES); fillSelect($("#debtForm").elements.type,DEBT_TYPES); fillSelect($("#goalForm").elements.metric,METRICS);
document.querySelectorAll(".nav-button").forEach(b=>b.onclick=()=>showView(b.dataset.view));
document.querySelectorAll("[data-close]").forEach(b=>b.onclick=()=>b.closest("dialog").close()); $("#confirmCancel").onclick=()=>$("#confirmDialog").close();
$("#addAssetButton").onclick=()=>editAsset(); $("#addDebtButton").onclick=()=>editDebt(); $("#addGoalButton").onclick=()=>editGoal();
$("#assetForm").onsubmit=e=>{e.preventDefault();const f=e.currentTarget.elements,item={id:f.id.value||uid(),name:f.name.value.trim(),type:f.type.value,value:num(f.value.value),approximate:f.approximate.checked},i=state.current.assets.findIndex(x=>x.id===item.id);i<0?state.current.assets.push(item):state.current.assets[i]=item;e.currentTarget.closest("dialog").close();commit("Activo guardado.")};
$("#debtForm").onsubmit=e=>{e.preventDefault();const f=e.currentTarget.elements,item={id:f.id.value||uid(),name:f.name.value.trim(),type:f.type.value,outstandingBalance:num(f.outstandingBalance.value),monthlyPayment:num(f.monthlyPayment.value),interestRate:num(f.interestRate.value),endDate:f.endDate.value,approximate:f.approximate.checked},i=state.current.debts.findIndex(x=>x.id===item.id);i<0?state.current.debts.push(item):state.current.debts[i]=item;e.currentTarget.closest("dialog").close();commit("Deuda guardada.")};
$("#goalForm").onsubmit=e=>{e.preventDefault();const f=e.currentTarget.elements,item={id:f.id.value||uid(),name:f.name.value.trim(),metric:f.metric.value,operator:f.operator.value,targetValue:num(f.targetValue.value),targetDate:f.targetDate.value},i=state.goals.findIndex(x=>x.id===item.id);i<0?state.goals.push(item):state.goals[i]=item;e.currentTarget.closest("dialog").close();commit("Objetivo guardado.")};
$("#cashflowForm").onsubmit=e=>{e.preventDefault();const f=e.currentTarget.elements;state.current.cashFlow={monthlyIncome:num(f.monthlyIncome.value),essentialExpenses:num(f.essentialExpenses.value),variableExpenses:num(f.variableExpenses.value),monthlyInvestment:num(f.monthlyInvestment.value)};commit("Flujo mensual guardado.")};
document.body.onclick=e=>{const find=(attr,list,edit)=>{const id=e.target.dataset[attr];if(id){const item=list.find(x=>x.id===id);if(item)edit(item)}};find("editAsset",state.current.assets,editAsset);find("editDebt",state.current.debts,editDebt);find("editGoal",state.goals,editGoal);[["deleteAsset",state.current.assets,"activo"],["deleteDebt",state.current.debts,"deuda"],["deleteGoal",state.goals,"objetivo"]].forEach(([attr,list,label])=>{const id=e.target.dataset[attr];if(id)ask(`Eliminar ${label}`,"Esta acción no modifica snapshots históricos.",()=>{list.splice(list.findIndex(x=>x.id===id),1);commit(`${label[0].toUpperCase()+label.slice(1)} eliminado.`)})})};
$("#createSnapshotButton").onclick=()=>{const copy=structuredClone(state.current);copy.asOfDate=new Date().toISOString().slice(0,10);state.snapshots.push(createSnapshot(copy));commit("Snapshot inmutable creado.")};
$("#rulesForm").onsubmit=e=>{e.preventDefault();const fragile=num(e.currentTarget.elements.fragileMaxMonths.value),stable=num(e.currentTarget.elements.stableMinMonths.value);if(stable<=fragile)return toast("El umbral estable debe ser mayor que el frágil.",true);state.settings.healthRules={fragileMaxMonths:fragile,stableMinMonths:stable};commit("Reglas guardadas.")};
$("#themeButton").onclick=()=>{state.settings.theme=state.settings.theme==="dark"?"light":"dark";commit()};
function chooseFile(){ $("#fileInput").value=""; $("#fileInput").click() } $("#importButton").onclick=chooseFile; $("#welcomeImportButton").onclick=chooseFile;
$("#fileInput").onchange=async e=>{const file=e.target.files[0];if(!file)return;try{state=importState(await file.text());$("#welcomeDialog").close();render();toast("Datos importados correctamente.")}catch(error){toast(error.message,true)}};
$("#exportButton").onclick=()=>{const blob=new Blob([exportState(state)],{type:"application/json"}),a=document.createElement("a"),day=new Date().toISOString().slice(0,10);a.href=URL.createObjectURL(blob);a.download=`financial-os-backup-${day}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),0);toast("Backup exportado.")};
$("#resetButton").onclick=()=>ask("Borrar todos los datos","Se eliminarán los datos actuales, snapshots, objetivos y ajustes locales. Exporta un backup antes si quieres conservarlos.",()=>{state=resetState();render();$("#welcomeDialog").showModal()});
$("#startEmptyButton").onclick=()=>{state.initialized=true;commit("Financial OS listo.");$("#welcomeDialog").close()};
render(); if(!state.initialized) $("#welcomeDialog").showModal();
