const esc = value => String(value).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
export function chartDate(value) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(value));
  return match ? `${match[3]}/${match[2]}/${match[1]}` : String(value);
}
export function barChart(container, items, formatter) {
  const max=Math.max(...items.map(x=>Math.abs(x.value)),1),width=340,height=135,barMax=210;
  container.innerHTML=`<svg viewBox="0 0 ${width} ${height}" role="img"><title>Comparación proporcional de ${items.map(x=>esc(x.label)).join(" y ")}</title>${items.map((x,i)=>{const y=18+i*46,w=Math.max(2,Math.abs(x.value)/max*barMax);return `<text x="4" y="${y+13}">${esc(x.label)}</text><rect x="88" y="${y}" width="${w}" height="20" rx="7" fill="${x.color}"/><text x="${Math.min(332,94+w)}" y="${y+14}">${esc(formatter(x.value))}</text>`}).join("")}<text x="4" y="125">Diferencia · ${esc(formatter((items[0]?.value||0)-(items[1]?.value||0)))}</text></svg>`;
}
export function lineChart(container, points, formatter) {
  if (!points.length) { container.innerHTML = '<div class="empty-state">Crea snapshots u objetivos para ver la evolución.</div>'; return; }
  const w=320,h=175,p=32, values=points.map(x=>x.value), min=Math.min(0,...values), max=Math.max(...values,1), range=max-min||1;
  const xy=points.map((x,i)=>({x:p+(points.length===1?(w-2*p)/2:i*(w-2*p)/(points.length-1)),y:p+(max-x.value)*(h-2*p)/range,...x}));
  const path=xy.map((x,i)=>`${i?"L":"M"}${x.x},${x.y}`).join(" ");
  container.innerHTML=`<svg viewBox="0 0 ${w} ${h}" role="img"><title>Evolución histórica</title><line class="gridline" x1="${p}" y1="${h-p}" x2="${w-p}" y2="${h-p}"/><path class="line" d="${path}"/>${xy.map(x=>`<circle class="dot" cx="${x.x}" cy="${x.y}" r="4"><title>${esc(chartDate(x.date))}: ${esc(formatter(x.value))}</title></circle><text x="${x.x}" y="${h-8}" text-anchor="middle">${esc(chartDate(x.date))}</text>`).join("")}</svg>`;
}
