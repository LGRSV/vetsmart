/* ============================================================
   VetSmart — Controle de Medicamentos (SPA vanilla JS)
   Persistência em localStorage. Sem dependências externas.
   ============================================================ */

const STORAGE_KEY = 'vetsmart:meds:v1';
const MOVES_KEY = 'vetsmart:moves:v1';
const AUTH_KEY = 'vetsmart:auth:v1';

/* ---------- Credenciais de acesso ----------
   Para trocar o usuário/senha, edite os dois valores abaixo.
   Observação: por ser um site estático (sem servidor), esta é uma
   proteção básica — não guarde aqui senhas realmente sensíveis. */
const LOGIN_USUARIO = 'admin';
const LOGIN_SENHA = 'medvet2026';

/* ---------- Estado ---------- */
let meds = [];
let moves = [];
let sortKey = 'nome';
let sortDir = 1;

/* ---------- Utils ---------- */
const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];
const uid = () => 'm' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
const brl = (n) => (Number(n) || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const todayISO = () => new Date().toISOString().slice(0, 10);

function daysUntil(dateStr) {
  if (!dateStr) return Infinity;
  const d = new Date(dateStr + 'T00:00:00');
  const now = new Date(todayISO() + 'T00:00:00');
  return Math.round((d - now) / 86400000);
}

function fmtDate(dateStr) {
  if (!dateStr) return '—';
  const [y, m, d] = dateStr.split('-');
  return `${d}/${m}/${y}`;
}

function fmtDateTime(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString('pt-BR') + ' ' + d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

/* status de um medicamento */
function medStatus(m) {
  const dias = daysUntil(m.validade);
  if (m.validade && dias < 0) return { key: 'vencido', label: 'Vencido' };
  if (Number(m.quantidade) <= 0) return { key: 'zerado', label: 'Sem estoque' };
  if (m.validade && dias <= 30) return { key: 'vencendo', label: `Vence em ${dias}d` };
  if (Number(m.quantidade) <= Number(m.minimo || 0)) return { key: 'baixo', label: 'Estoque baixo' };
  return { key: 'ok', label: 'Em estoque' };
}

/* ---------- Persistência ---------- */
function save() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(meds));
  localStorage.setItem(MOVES_KEY, JSON.stringify(moves));
}

function load() {
  try { meds = JSON.parse(localStorage.getItem(STORAGE_KEY)) || null; } catch { meds = null; }
  try { moves = JSON.parse(localStorage.getItem(MOVES_KEY)) || []; } catch { moves = []; }
  if (!meds) { meds = seed(); moves = seedMoves(); save(); }
}

/* ---------- Dados iniciais (exemplo) ---------- */
function seed() {
  const d = (offsetDays) => new Date(Date.now() + offsetDays * 86400000).toISOString().slice(0, 10);
  return [
    { id: uid(), nome: 'Amoxicilina 250mg', principio: 'Amoxicilina', categoria: 'Antibiótico', fabricante: 'Zoetis', lote: 'LT-2045', quantidade: 48, minimo: 20, preco: 3.5, validade: d(180), obs: 'Comprimidos' },
    { id: uid(), nome: 'Meloxicam 2mg/mL', principio: 'Meloxicam', categoria: 'Anti-inflamatório', fabricante: 'Ourofino', lote: 'LT-8830', quantidade: 6, minimo: 10, preco: 42.9, validade: d(90), obs: 'Injetável 10mL' },
    { id: uid(), nome: 'Dipirona 500mg/mL', principio: 'Dipirona sódica', categoria: 'Analgésico', fabricante: 'Vetnil', lote: 'LT-1190', quantidade: 22, minimo: 15, preco: 18.0, validade: d(20), obs: 'Frasco 20mL' },
    { id: uid(), nome: 'Cetamina 100mg/mL', principio: 'Cetamina', categoria: 'Anestésico', fabricante: 'Syntec', lote: 'LT-5521', quantidade: 3, minimo: 5, preco: 89.9, validade: d(300), obs: 'Controlado — cofre' },
    { id: uid(), nome: 'Soro Fisiológico 0,9%', principio: 'Cloreto de sódio', categoria: 'Fluidoterapia', fabricante: 'Eurofarma', lote: 'LT-3302', quantidade: 120, minimo: 40, preco: 6.5, validade: d(400), obs: 'Bolsa 500mL' },
    { id: uid(), nome: 'Vacina V10', principio: 'Antígenos caninos', categoria: 'Vacina', fabricante: 'Zoetis', lote: 'LT-7781', quantidade: 14, minimo: 10, preco: 55.0, validade: d(-5), obs: 'Refrigerar 2-8°C' },
    { id: uid(), nome: 'Prednisolona 20mg', principio: 'Prednisolona', categoria: 'Corticoide', fabricante: 'Coveli', lote: 'LT-4410', quantidade: 60, minimo: 25, preco: 2.1, validade: d(150), obs: '' },
    { id: uid(), nome: 'Tramadol 50mg/mL', principio: 'Tramadol', categoria: 'Analgésico', fabricante: 'União Química', lote: 'LT-9902', quantidade: 9, minimo: 12, preco: 34.5, validade: d(60), obs: 'Controlado' },
  ];
}

function seedMoves() {
  const now = Date.now();
  return [
    { id: uid(), medNome: 'Soro Fisiológico 0,9%', tipo: 'entrada', qtd: 40, motivo: 'Compra — NF 12043', data: new Date(now - 2 * 864e5).toISOString() },
    { id: uid(), medNome: 'Dipirona 500mg/mL', tipo: 'saida', qtd: 3, motivo: 'Dr. Ana — atendimento', data: new Date(now - 1 * 864e5).toISOString() },
    { id: uid(), medNome: 'Amoxicilina 250mg', tipo: 'saida', qtd: 12, motivo: 'Internação canil B', data: new Date(now - 5 * 36e5).toISOString() },
  ];
}

/* ============================================================
   RENDER
   ============================================================ */

function categorias() {
  return [...new Set(meds.map((m) => m.categoria).filter(Boolean))].sort();
}

function renderDashboard() {
  const total = meds.length;
  const unidades = meds.reduce((s, m) => s + Number(m.quantidade || 0), 0);
  const valor = meds.reduce((s, m) => s + Number(m.quantidade || 0) * Number(m.preco || 0), 0);
  const baixo = meds.filter((m) => ['baixo', 'zerado'].includes(medStatus(m).key)).length;
  const vencendo = meds.filter((m) => ['vencendo', 'vencido'].includes(medStatus(m).key)).length;

  $('#statsGrid').innerHTML = `
    ${statCard('b', '💊', total, 'Medicamentos cadastrados', `${unidades} un. em estoque`, 'up')}
    ${statCard('g', '💰', brl(valor), 'Valor total em estoque', 'Custo do inventário', 'up')}
    ${statCard('a', '📉', baixo, 'Estoque baixo / zerado', baixo ? 'Requer reposição' : 'Tudo abastecido', baixo ? 'warn' : 'up')}
    ${statCard('r', '⏳', vencendo, 'Vencendo ou vencido', vencendo ? 'Atenção à validade' : 'Sem pendências', vencendo ? 'bad' : 'up')}
  `;

  // Chart por categoria (unidades)
  const byCat = {};
  meds.forEach((m) => { byCat[m.categoria] = (byCat[m.categoria] || 0) + Number(m.quantidade || 0); });
  const entries = Object.entries(byCat).sort((a, b) => b[1] - a[1]);
  const max = Math.max(1, ...entries.map((e) => e[1]));
  $('#catChart').innerHTML = entries.length ? entries.map(([c, v]) => `
    <div class="catbar">
      <div class="catbar-name">${esc(c)}</div>
      <div class="catbar-track"><div class="catbar-fill" style="width:${(v / max) * 100}%"></div></div>
      <div class="catbar-val">${v}</div>
    </div>`).join('') : emptyInline('Sem dados de categoria.');

  // Atenção
  const att = meds
    .map((m) => ({ m, s: medStatus(m) }))
    .filter((x) => x.s.key !== 'ok')
    .sort((a, b) => severity(b.s.key) - severity(a.s.key))
    .slice(0, 6);
  $('#attentionList').innerHTML = att.length ? att.map(({ m, s }) => `
    <div class="att-item">
      <span class="att-dot ${['vencido','zerado'].includes(s.key) ? 'r' : 'a'}"></span>
      <div>
        <div class="att-name">${esc(m.nome)}</div>
        <div class="att-meta">${esc(m.categoria)} • Lote ${esc(m.lote || '—')}</div>
      </div>
      <div class="att-right"><span class="tag ${s.key}">${s.label}</span></div>
    </div>`).join('') : `<div class="alert-empty" style="margin:0">✅ Nenhuma pendência no estoque!</div>`;

  // Movimentações recentes
  renderMovesInto('#recentMoves', moves.slice().reverse().slice(0, 5), true);
}

function statCard(color, ico, value, label, chipTxt, chipCls) {
  return `<div class="stat">
    <div class="stat-top">
      <div class="stat-ico ${color}">${ico}</div>
      <span class="stat-chip ${chipCls}">${esc(chipTxt)}</span>
    </div>
    <div class="stat-value">${value}</div>
    <div class="stat-label">${esc(label)}</div>
  </div>`;
}

function severity(key) {
  return { vencido: 5, zerado: 4, vencendo: 3, baixo: 2, ok: 0 }[key] || 1;
}

/* ---------- Tabela de medicamentos ---------- */
function renderMedTable() {
  const q = $('#tableSearch').value.trim().toLowerCase();
  const fc = $('#filterCategoria').value;
  const fs = $('#filterStatus').value;

  let rows = meds.filter((m) => {
    const s = medStatus(m).key;
    if (fc && m.categoria !== fc) return false;
    if (fs && s !== fs) return false;
    if (q) {
      const hay = `${m.nome} ${m.principio} ${m.categoria} ${m.lote} ${m.fabricante}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });

  rows.sort((a, b) => {
    let x = a[sortKey], y = b[sortKey];
    if (['quantidade', 'preco'].includes(sortKey)) { x = Number(x) || 0; y = Number(y) || 0; }
    else { x = (x || '').toString().toLowerCase(); y = (y || '').toString().toLowerCase(); }
    return x < y ? -1 * sortDir : x > y ? 1 * sortDir : 0;
  });

  const tbody = $('#medTbody');
  $('#medEmpty').hidden = rows.length > 0;
  tbody.innerHTML = rows.map((m) => {
    const s = medStatus(m);
    const dias = daysUntil(m.validade);
    const valClass = m.validade && dias < 0 ? 'tag vencido' : m.validade && dias <= 30 ? 'tag vencendo' : 'tag neutral';
    return `<tr>
      <td>
        <div class="med-cell">
          <span class="med-name">${esc(m.nome)}</span>
          <span class="med-sub">${esc(m.principio || m.fabricante || '')}</span>
        </div>
      </td>
      <td><span class="cat-pill">${esc(m.categoria)}</span></td>
      <td>${esc(m.lote || '—')}</td>
      <td class="num"><strong>${m.quantidade}</strong></td>
      <td>${m.validade ? `<span class="${valClass}">${fmtDate(m.validade)}</span>` : '—'}</td>
      <td class="num">${brl(m.preco)}</td>
      <td><span class="tag ${s.key}">${s.label}</span></td>
      <td class="actions-col">
        <div class="row-actions">
          <button class="icon-btn" title="Movimentar" onclick="openMove('${m.id}')">⇅</button>
          <button class="icon-btn" title="Editar" onclick="openEdit('${m.id}')">✎</button>
          <button class="icon-btn" title="Excluir" onclick="removeMed('${m.id}')">🗑</button>
        </div>
      </td>
    </tr>`;
  }).join('');
}

/* ---------- Movimentações ---------- */
function renderMovesInto(sel, list, compact) {
  const wrap = $(sel);
  if (!list.length) {
    wrap.innerHTML = emptyInline('Nenhuma movimentação ainda.');
    return;
  }
  wrap.innerHTML = `<table class="table"><tbody>${list.map((mv) => `
    <tr>
      <td style="color:var(--muted);white-space:nowrap">${fmtDateTime(mv.data)}</td>
      <td><strong>${esc(mv.medNome)}</strong></td>
      <td>${mv.tipo === 'entrada' ? '<span class="move-in">＋ Entrada</span>' : '<span class="move-out">－ Saída</span>'}</td>
      <td class="num"><strong>${mv.tipo === 'entrada' ? '+' : '−'}${mv.qtd}</strong></td>
      ${compact ? '' : `<td style="color:var(--muted)">${esc(mv.motivo || '—')}</td>`}
    </tr>`).join('')}</tbody></table>`;
}

function renderMovesView() {
  const list = moves.slice().reverse();
  $('#movesEmpty').hidden = list.length > 0;
  const tbody = $('#movesTbody');
  tbody.innerHTML = list.map((mv) => `
    <tr>
      <td style="color:var(--muted);white-space:nowrap">${fmtDateTime(mv.data)}</td>
      <td><strong>${esc(mv.medNome)}</strong></td>
      <td>${mv.tipo === 'entrada' ? '<span class="move-in">＋ Entrada</span>' : '<span class="move-out">－ Saída</span>'}</td>
      <td class="num"><strong>${mv.tipo === 'entrada' ? '+' : '−'}${mv.qtd}</strong></td>
      <td style="color:var(--muted)">${esc(mv.motivo || '—')}</td>
    </tr>`).join('');
}

/* ---------- Alertas ---------- */
function renderAlerts() {
  const vencidos = meds.filter((m) => medStatus(m).key === 'vencido');
  const vencendo = meds.filter((m) => medStatus(m).key === 'vencendo');
  const semEstoque = meds.filter((m) => medStatus(m).key === 'zerado');
  const baixo = meds.filter((m) => medStatus(m).key === 'baixo');

  const totalAlerts = vencidos.length + vencendo.length + semEstoque.length + baixo.length;
  const badge = $('#navAlertBadge');
  badge.hidden = totalAlerts === 0;
  badge.textContent = totalAlerts;

  const groups = [
    { title: '🔴 Vencidos', items: vencidos, cls: 'r', desc: (m) => `Venceu em ${fmtDate(m.validade)} • ${m.quantidade} un. — retirar do estoque` },
    { title: '🚫 Sem estoque', items: semEstoque, cls: 'r', desc: (m) => `Estoque zerado • mínimo ${m.minimo || 0} un.` },
    { title: '🟠 Vencendo em 30 dias', items: vencendo, cls: 'a', desc: (m) => `Vence em ${fmtDate(m.validade)} (${daysUntil(m.validade)} dias) • ${m.quantidade} un.` },
    { title: '🟡 Estoque baixo', items: baixo, cls: 'a', desc: (m) => `${m.quantidade} un. em estoque • mínimo ${m.minimo || 0} un.` },
  ];

  const container = $('#alertsContainer');
  if (totalAlerts === 0) {
    container.innerHTML = `<div class="alert-empty">✅ Tudo certo! Nenhum alerta de estoque ou validade no momento.</div>`;
    return;
  }
  container.innerHTML = groups.filter((g) => g.items.length).map((g) => `
    <div class="alert-group">
      <div class="alert-group-title">${g.title} <span class="tag neutral">${g.items.length}</span></div>
      ${g.items.map((m) => `
        <div class="alert-card ${g.cls}">
          <div>
            <div class="a-name">${esc(m.nome)}</div>
            <div class="a-desc">${esc(g.desc(m))}</div>
          </div>
          <div class="a-actions">
            <button class="btn btn-ghost" onclick="openMove('${m.id}')">Movimentar</button>
          </div>
        </div>`).join('')}
    </div>`).join('');
}

/* ---------- Helpers de render ---------- */
function esc(str) {
  return (str ?? '').toString().replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
function emptyInline(txt) {
  return `<div style="padding:24px;text-align:center;color:var(--muted)">${esc(txt)}</div>`;
}

function refreshFilters() {
  const cats = categorias();
  $('#filterCategoria').innerHTML = '<option value="">Todas as categorias</option>' + cats.map((c) => `<option>${esc(c)}</option>`).join('');
  $('#catList').innerHTML = cats.map((c) => `<option value="${esc(c)}">`).join('');
}

function renderAll() {
  refreshFilters();
  renderDashboard();
  renderMedTable();
  renderMovesView();
  renderAlerts();
}

/* ============================================================
   AÇÕES / CRUD
   ============================================================ */

function openNew() {
  $('#medModalTitle').textContent = 'Novo medicamento';
  $('#medForm').reset();
  $('#f-id').value = '';
  $('#f-minimo').value = 10;
  showModal('#medModal');
  setTimeout(() => $('#f-nome').focus(), 50);
}

function openEdit(id) {
  const m = meds.find((x) => x.id === id);
  if (!m) return;
  $('#medModalTitle').textContent = 'Editar medicamento';
  $('#f-id').value = m.id;
  $('#f-nome').value = m.nome;
  $('#f-principio').value = m.principio || '';
  $('#f-categoria').value = m.categoria;
  $('#f-fabricante').value = m.fabricante || '';
  $('#f-lote').value = m.lote || '';
  $('#f-quantidade').value = m.quantidade;
  $('#f-minimo').value = m.minimo ?? '';
  $('#f-preco').value = m.preco ?? '';
  $('#f-validade').value = m.validade || '';
  $('#f-obs').value = m.obs || '';
  showModal('#medModal');
}

function submitMed(e) {
  e.preventDefault();
  const id = $('#f-id').value;
  const data = {
    nome: $('#f-nome').value.trim(),
    principio: $('#f-principio').value.trim(),
    categoria: $('#f-categoria').value.trim(),
    fabricante: $('#f-fabricante').value.trim(),
    lote: $('#f-lote').value.trim(),
    quantidade: Math.max(0, parseInt($('#f-quantidade').value) || 0),
    minimo: Math.max(0, parseInt($('#f-minimo').value) || 0),
    preco: Math.max(0, parseFloat($('#f-preco').value) || 0),
    validade: $('#f-validade').value,
    obs: $('#f-obs').value.trim(),
  };
  if (!data.nome || !data.categoria) return;

  if (id) {
    const i = meds.findIndex((x) => x.id === id);
    meds[i] = { ...meds[i], ...data };
    toast('Medicamento atualizado.');
  } else {
    meds.push({ id: uid(), ...data });
    toast('Medicamento cadastrado.');
  }
  save();
  hideModal('#medModal');
  renderAll();
}

function removeMed(id) {
  const m = meds.find((x) => x.id === id);
  if (!m) return;
  if (!confirm(`Excluir "${m.nome}" do estoque?`)) return;
  meds = meds.filter((x) => x.id !== id);
  save();
  renderAll();
  toast('Medicamento excluído.');
}

/* ---------- Movimentação de estoque ---------- */
let moveTipo = 'entrada';
function openMove(id) {
  const m = meds.find((x) => x.id === id);
  if (!m) return;
  $('#m-id').value = id;
  $('#moveMedName').textContent = `${m.nome} — ${m.quantidade} un. em estoque`;
  $('#moveForm').reset();
  setMoveTipo('entrada');
  showModal('#moveModal');
  setTimeout(() => $('#m-qtd').focus(), 50);
}

function setMoveTipo(t) {
  moveTipo = t;
  $$('#moveTipo .seg-btn').forEach((b) => b.classList.toggle('active', b.dataset.tipo === t));
}

function submitMove(e) {
  e.preventDefault();
  const id = $('#m-id').value;
  const m = meds.find((x) => x.id === id);
  if (!m) return;
  const qtd = Math.max(1, parseInt($('#m-qtd').value) || 0);
  const motivo = $('#m-motivo').value.trim();

  if (moveTipo === 'saida' && qtd > m.quantidade) {
    toast(`Saída maior que o estoque (${m.quantidade} un.).`, true);
    return;
  }
  m.quantidade += moveTipo === 'entrada' ? qtd : -qtd;
  moves.push({ id: uid(), medNome: m.nome, tipo: moveTipo, qtd, motivo, data: new Date().toISOString() });
  save();
  hideModal('#moveModal');
  renderAll();
  toast(moveTipo === 'entrada' ? `Entrada de ${qtd} un. registrada.` : `Saída de ${qtd} un. registrada.`);
}

/* ---------- Exportar ---------- */
function exportData() {
  const blob = new Blob([JSON.stringify({ meds, moves, exportado: new Date().toISOString() }, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `vetsmart-estoque-${todayISO()}.json`;
  a.click();
  URL.revokeObjectURL(url);
  toast('Dados exportados.');
}

/* ============================================================
   UI: modais, navegação, toast
   ============================================================ */
function showModal(sel) { $(sel).hidden = false; }
function hideModal(sel) { $(sel).hidden = true; }

let toastTimer;
function toast(msg, isErr) {
  const t = $('#toast');
  t.textContent = msg;
  t.className = 'toast' + (isErr ? ' err' : '');
  t.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { t.hidden = true; }, 2600);
}

/* ---------- Autenticação ---------- */
function isAuthed() {
  return sessionStorage.getItem(AUTH_KEY) === '1';
}

function enterApp() {
  $('#loginScreen').hidden = true;
  $('#appRoot').hidden = false;
  renderAll();
}

function showLogin() {
  $('#appRoot').hidden = true;
  $('#loginScreen').hidden = false;
  $('#loginErr').hidden = true;
  $('#loginForm').reset();
  setTimeout(() => $('#l-user').focus(), 50);
}

function doLogin(e) {
  e.preventDefault();
  const u = $('#l-user').value.trim();
  const s = $('#l-pass').value;
  if (u === LOGIN_USUARIO && s === LOGIN_SENHA) {
    sessionStorage.setItem(AUTH_KEY, '1');
    enterApp();
    toast('Bem-vindo(a) ao Medical Vet!');
  } else {
    $('#loginErr').hidden = false;
    $('#l-pass').value = '';
    $('#l-pass').focus();
  }
}

function logout() {
  sessionStorage.removeItem(AUTH_KEY);
  showLogin();
}

function switchView(view) {
  $$('.view').forEach((v) => (v.hidden = v.id !== `view-${view}`));
  $$('.nav-item').forEach((n) => n.classList.toggle('active', n.dataset.view === view));
  $('#sidebar').classList.remove('open');
  window.scrollTo(0, 0);
}

/* ============================================================
   INIT / EVENTOS
   ============================================================ */
function init() {
  load();

  // Login / logout
  $('#loginForm').addEventListener('submit', doLogin);
  $('#btnLogout').addEventListener('click', logout);
  if (isAuthed()) enterApp(); else showLogin();

  // Navegação (delegação para nav + botões "ver todos")
  document.addEventListener('click', (e) => {
    const nav = e.target.closest('[data-view]');
    if (nav) switchView(nav.dataset.view);
  });

  // Botões novo medicamento
  $('#btnNovoMed').addEventListener('click', openNew);
  $('#btnNovoMed2').addEventListener('click', openNew);
  $('#btnExport').addEventListener('click', exportData);

  // Modal medicamento
  $('#medForm').addEventListener('submit', submitMed);
  $('#medModalClose').addEventListener('click', () => hideModal('#medModal'));
  $('#medFormCancel').addEventListener('click', () => hideModal('#medModal'));

  // Modal movimentação
  $('#moveForm').addEventListener('submit', submitMove);
  $('#moveModalClose').addEventListener('click', () => hideModal('#moveModal'));
  $('#moveFormCancel').addEventListener('click', () => hideModal('#moveModal'));
  $$('#moveTipo .seg-btn').forEach((b) => b.addEventListener('click', () => setMoveTipo(b.dataset.tipo)));

  // Fechar modal ao clicar no backdrop / ESC
  $$('.modal-backdrop').forEach((bd) => bd.addEventListener('click', (e) => { if (e.target === bd) bd.hidden = true; }));
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') $$('.modal-backdrop').forEach((bd) => (bd.hidden = true)); });

  // Filtros da tabela
  $('#tableSearch').addEventListener('input', renderMedTable);
  $('#filterCategoria').addEventListener('change', renderMedTable);
  $('#filterStatus').addEventListener('change', renderMedTable);

  // Busca global -> filtra tabela e vai pra aba medicamentos
  $('#globalSearch').addEventListener('input', (e) => {
    $('#tableSearch').value = e.target.value;
    switchView('medicamentos');
    renderMedTable();
  });

  // Ordenação da tabela
  $$('#medTable thead th[data-sort]').forEach((th) => th.addEventListener('click', () => {
    const key = th.dataset.sort;
    if (sortKey === key) sortDir *= -1; else { sortKey = key; sortDir = 1; }
    renderMedTable();
  }));

  // Menu mobile
  $('#hamburger').addEventListener('click', () => $('#sidebar').classList.toggle('open'));
}

// expõe funções usadas em onclick inline
window.openMove = openMove;
window.openEdit = openEdit;
window.removeMed = removeMed;

document.addEventListener('DOMContentLoaded', init);
