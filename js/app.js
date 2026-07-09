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

/* ---------- Dados iniciais (catálogo real da farmácia) ----------
   Importado da planilha 'controle_farmacia_medvet.xlsx' (aba Produtos, 368 itens).
   Quantidade, mínimo e preço começam zerados — a planilha não trazia estoque
   atual, apenas o cadastro de produtos. unidadeUso/qtdPorCompra foram
   detectados a partir do texto do nome (ex.: 'Frasco 20ml' -> compra em UN,
   uso em ml, fator 20) quando possível; revise os itens que precisar. */
function seed() {
  return [
    { id: uid(), nome: 'Ac Ursodesoxicol 810mg c/60 cap', principio: '', categoria: 'Farmácia Central', fabricante: '', lote: '', quantidade: 0, minimo: 0, preco: 0, validade: '', unidadeUso: 'un', unidadeCompra: 'UN', qtdPorCompra: 1, controlado: false, obs: 'Cód. 814' },
    { id: uid(), nome: 'Acepran 0,2% 20ml', principio: '', categoria: 'Farmácia Central', fabricante: '', lote: '', quantidade: 0, minimo: 0, preco: 0, validade: '', unidadeUso: 'ml', unidadeCompra: 'ML', qtdPorCompra: 1, controlado: false, obs: 'Cód. 304' },
    { id: uid(), nome: 'Acetilcisteína 100mg/ml 3ml', principio: '', categoria: 'Farmácia Central', fabricante: '', lote: '', quantidade: 0, minimo: 0, preco: 0, validade: '', unidadeUso: 'ml', unidadeCompra: 'ML', qtdPorCompra: 1, controlado: false, obs: 'Cód. 523' },
    { id: uid(), nome: 'Acetilcisteína Xarope 40mg/ml 120ml', principio: '', categoria: 'Farmácia Central', fabricante: '', lote: '', quantidade: 0, minimo: 0, preco: 0, validade: '', unidadeUso: 'ml', unidadeCompra: 'ML', qtdPorCompra: 1, controlado: false, obs: 'Cód. 793' },
    { id: uid(), nome: 'Ad Pele Esparadrapo 20cm', principio: '', categoria: 'Farmácia Central', fabricante: '', lote: '', quantidade: 0, minimo: 0, preco: 0, validade: '', unidadeUso: 'un', unidadeCompra: 'UN', qtdPorCompra: 1, controlado: false, obs: 'Cód. 464' },
    { id: uid(), nome: 'Ad Pele Fita Microporos 10cm', principio: '', categoria: 'Farmácia Central', fabricante: '', lote: '', quantidade: 0, minimo: 0, preco: 0, validade: '', unidadeUso: 'un', unidadeCompra: 'UN', qtdPorCompra: 1, controlado: false, obs: 'Cód. 465' },
    { id: uid(), nome: 'Adren (Epinefrina) 1mg/ml 1ml', principio: '', categoria: 'Farmácia Central', fabricante: '', lote: '', quantidade: 0, minimo: 0, preco: 0, validade: '', unidadeUso: 'ml', unidadeCompra: 'UN', qtdPorCompra: 1, controlado: false, obs: 'Cód. 322' },
    { id: uid(), nome: 'Agemoxi 100ml', principio: '', categoria: 'Farmácia Central', fabricante: '', lote: '', quantidade: 0, minimo: 0, preco: 0, validade: '', unidadeUso: 'ml', unidadeCompra: 'ML', qtdPorCompra: 1, controlado: false, obs: 'Cód. 308' },
    { id: uid(), nome: 'AGUA DESTILADA', principio: '', categoria: 'Farmácia Central', fabricante: '', lote: '', quantidade: 0, minimo: 0, preco: 0, validade: '', unidadeUso: 'un', unidadeCompra: 'UN', qtdPorCompra: 1, controlado: false, obs: 'Cód. 698' },
    { id: uid(), nome: 'AGUA DESTILADA 10ML', principio: '', categoria: 'Farmácia Central', fabricante: '', lote: '', quantidade: 0, minimo: 0, preco: 0, validade: '', unidadeUso: 'cx', unidadeCompra: 'CX', qtdPorCompra: 1, controlado: false, obs: 'Cód. 1036' },
    { id: uid(), nome: 'AGUA PARA INJECAO 10ML (FARMACE)', principio: '', categoria: 'Farmácia Central', fabricante: '', lote: '', quantidade: 0, minimo: 0, preco: 0, validade: '', unidadeUso: 'ml', unidadeCompra: 'UN', qtdPorCompra: 10, controlado: false, obs: 'Cód. 686' },
    { id: uid(), nome: 'AGUA SANITARIA - KIJOIA - 5L', principio: '', categoria: 'Farmácia Central', fabricante: '', lote: '', quantidade: 0, minimo: 0, preco: 0, validade: '', unidadeUso: 'un', unidadeCompra: 'UN', qtdPorCompra: 1, controlado: false, obs: 'Cód. 1004' },
    { id: uid(), nome: 'AGULHA 25X8', principio: '', categoria: 'Farmácia Central', fabricante: '', lote: '', quantidade: 0, minimo: 0, preco: 0, validade: '', unidadeUso: 'cx', unidadeCompra: 'CX', qtdPorCompra: 1, controlado: false, obs: 'Cód. 1037' },
    { id: uid(), nome: 'Agulha Hipodérmica 24G Roxa 20mm x 0,55m', principio: '', categoria: 'Farmácia Central', fabricante: '', lote: '', quantidade: 0, minimo: 0, preco: 0, validade: '', unidadeUso: 'un', unidadeCompra: 'UN', qtdPorCompra: 1, controlado: false, obs: 'Cód. 394' },
    { id: uid(), nome: 'Agulha Hipodérmica Cinza 0,7 x 30mm', principio: '', categoria: 'Farmácia Central', fabricante: '', lote: '', quantidade: 0, minimo: 0, preco: 0, validade: '', unidadeUso: 'un', unidadeCompra: 'UN', qtdPorCompra: 1, controlado: false, obs: 'Cód. 913' },
    { id: uid(), nome: 'Agulha Hipodérmica Cinza 22G 25 x 0,7mm', principio: '', categoria: 'Farmácia Central', fabricante: '', lote: '', quantidade: 0, minimo: 0, preco: 0, validade: '', unidadeUso: 'un', unidadeCompra: 'UN', qtdPorCompra: 1, controlado: false, obs: 'Cód. 393' },
    { id: uid(), nome: 'Agulha Hipodérmica Rosa 18G 40 x 1,20mm', principio: '', categoria: 'Farmácia Central', fabricante: '', lote: '', quantidade: 0, minimo: 0, preco: 0, validade: '', unidadeUso: 'un', unidadeCompra: 'UN', qtdPorCompra: 1, controlado: false, obs: 'Cód. 392' },
    { id: uid(), nome: 'Agulha Hipodérmica Verde 21G 0,8 x 30mm', principio: '', categoria: 'Farmácia Central', fabricante: '', lote: '', quantidade: 0, minimo: 0, preco: 0, validade: '', unidadeUso: 'un', unidadeCompra: 'UN', qtdPorCompra: 1, controlado: false, obs: 'Cód. 502' },
    { id: uid(), nome: 'AGULHA PERIDURAL TUOHY 16G', principio: '', categoria: 'Farmácia Central', fabricante: '', lote: '', quantidade: 0, minimo: 0, preco: 0, validade: '', unidadeUso: 'un', unidadeCompra: 'UN', qtdPorCompra: 1, controlado: false, obs: 'Cód. 903' },
    { id: uid(), nome: 'Alcool 70 INPM 5L', principio: '', categoria: 'Farmácia Central', fabricante: '', lote: '', quantidade: 0, minimo: 0, preco: 0, validade: '', unidadeUso: 'un', unidadeCompra: 'UN', qtdPorCompra: 1, controlado: false, obs: 'Cód. 443' },
    { id: uid(), nome: 'ALCOOL IODADO 100ML ALMOTOLIA TWIST OFF', principio: '', categoria: 'Farmácia Central', fabricante: '', lote: '', quantidade: 0, minimo: 0, preco: 0, validade: '', unidadeUso: 'ml', unidadeCompra: 'UN', qtdPorCompra: 100, controlado: false, obs: 'Cód. 904' },
    { id: uid(), nome: 'Algodão Hidrófilo', principio: '', categoria: 'Farmácia Central', fabricante: '', lote: '', quantidade: 0, minimo: 0, preco: 0, validade: '', unidadeUso: 'un', unidadeCompra: 'UN', qtdPorCompra: 1, controlado: false, obs: 'Cód. 484' },
    { id: uid(), nome: 'Aminofilina 24mg/ml 10ml', principio: '', categoria: 'Farmácia Central', fabricante: '', lote: '', quantidade: 0, minimo: 0, preco: 0, validade: '', unidadeUso: 'ml', unidadeCompra: 'ML', qtdPorCompra: 1, controlado: false, obs: 'Cód. 781' },
    { id: uid(), nome: 'AMIODARONA 50MG/ML INJ 3ML', principio: '', categoria: 'Farmácia Central', fabricante: '', lote: '', quantidade: 0, minimo: 0, preco: 0, validade: '', unidadeUso: 'ml', unidadeCompra: 'ML', qtdPorCompra: 1, controlado: false, obs: 'Cód. 1038' },
    { id: uid(), nome: 'Amoxicilina 250mg/5ml 150ml', principio: '', categoria: 'Farmácia Central', fabricante: '', lote: '', quantidade: 0, minimo: 0, preco: 0, validade: '', unidadeUso: 'ml', unidadeCompra: 'UN', qtdPorCompra: 5, controlado: false, obs: 'Cód. 556' },
    { id: uid(), nome: 'Ampicilina Sódica 1g', principio: '', categoria: 'Farmácia Central', fabricante: '', lote: '', quantidade: 0, minimo: 0, preco: 0, validade: '', unidadeUso: 'ml', unidadeCompra: 'ML', qtdPorCompra: 1, controlado: false, obs: 'Cód. 305' },
    { id: uid(), nome: 'AMPICILINA+SULBACTAM 2G+1G', principio: '', categoria: 'Farmácia Central', fabricante: '', lote: '', quantidade: 0, minimo: 0, preco: 0, validade: '', unidadeUso: 'ml', unidadeCompra: 'ML', qtdPorCompra: 1, controlado: false, obs: 'Cód. 1063' },
    { id: uid(), nome: 'Analgex V (Dipirona) Frasco 50ml', principio: '', categoria: 'Farmácia Central', fabricante: '', lote: '', quantidade: 0, minimo: 0, preco: 0, validade: '', unidadeUso: 'ml', unidadeCompra: 'ML', qtdPorCompra: 1, controlado: false, obs: 'Cód. 306' },
    { id: uid(), nome: 'Apevitin 240ml', principio: '', categoria: 'Farmácia Central', fabricante: '', lote: '', quantidade: 0, minimo: 0, preco: 0, validade: '', unidadeUso: 'ml', unidadeCompra: 'ML', qtdPorCompra: 1, controlado: false, obs: 'Cód. 309' },
    { id: uid(), nome: 'AT. CREPE 13F 15CMX1,8MT C/12', principio: '', categoria: 'Farmácia Central', fabricante: '', lote: '', quantidade: 0, minimo: 0, preco: 0, validade: '', unidadeUso: 'pct', unidadeCompra: 'PCT', qtdPorCompra: 1, controlado: false, obs: 'Cód. 906' },
    { id: uid(), nome: 'Atadura 1,8m', principio: '', categoria: 'Farmácia Central', fabricante: '', lote: '', quantidade: 0, minimo: 0, preco: 0, validade: '', unidadeUso: 'un', unidadeCompra: 'UN', qtdPorCompra: 1, controlado: false, obs: 'Cód. 634' },
    { id: uid(), nome: 'AVENTAL', principio: '', categoria: 'Farmácia Central', fabricante: '', lote: '', quantidade: 0, minimo: 0, preco: 0, validade: '', unidadeUso: 'pct', unidadeCompra: 'PCT', qtdPorCompra: 1, controlado: false, obs: 'Cód. 966' },
    { id: uid(), nome: 'Avental de TNT 40g Básico', principio: '', categoria: 'Farmácia Central', fabricante: '', lote: '', quantidade: 0, minimo: 0, preco: 0, validade: '', unidadeUso: 'un', unidadeCompra: 'UN', qtdPorCompra: 1, controlado: false, obs: 'Cód. 530' },
    { id: uid(), nome: 'BAMBU - TEKLEAN - DESINFETANE - 5L CONC 1/20', principio: '', categoria: 'Farmácia Central', fabricante: '', lote: '', quantidade: 0, minimo: 0, preco: 0, validade: '', unidadeUso: 'un', unidadeCompra: 'UN', qtdPorCompra: 1, controlado: false, obs: 'Cód. 953' },
    { id: uid(), nome: 'Bandagem Elástica', principio: '', categoria: 'Farmácia Central', fabricante: '', lote: '', quantidade: 0, minimo: 0, preco: 0, validade: '', unidadeUso: 'un', unidadeCompra: 'UN', qtdPorCompra: 1, controlado: false, obs: 'Cód. 622' },
    { id: uid(), nome: 'Baytril 5% 10ml', principio: '', categoria: 'Farmácia Central', fabricante: '', lote: '', quantidade: 0, minimo: 0, preco: 0, validade: '', unidadeUso: 'ml', unidadeCompra: 'ML', qtdPorCompra: 1, controlado: false, obs: 'Cód. 468' },
    { id: uid(), nome: 'Besilato de Anlodipino 10mg c/30 Comprimidos', principio: '', categoria: 'Farmácia Central', fabricante: '', lote: '', quantidade: 0, minimo: 0, preco: 0, validade: '', unidadeUso: 'un', unidadeCompra: 'UN', qtdPorCompra: 1, controlado: false, obs: 'Cód. 794' },
    { id: uid(), nome: 'Besilato de Anlodipino 2,5mg', principio: '', categoria: 'Farmácia Central', fabricante: '', lote: '', quantidade: 0, minimo: 0, preco: 0, validade: '', unidadeUso: 'un', unidadeCompra: 'UN', qtdPorCompra: 1, controlado: false, obs: 'Cód. 474' },
    { id: uid(), nome: 'Besilato de Anlodipino 5mg c/30 Comprimidos', principio: '', categoria: 'Farmácia Central', fabricante: '', lote: '', quantidade: 0, minimo: 0, preco: 0, validade: '', unidadeUso: 'cx', unidadeCompra: 'CX', qtdPorCompra: 1, controlado: false, obs: 'Cód. 467' },
    { id: uid(), nome: 'Bicarbonato de Sódio 10ml', principio: '', categoria: 'Farmácia Central', fabricante: '', lote: '', quantidade: 0, minimo: 0, preco: 0, validade: '', unidadeUso: 'ml', unidadeCompra: 'UN', qtdPorCompra: 10, controlado: false, obs: 'Cód. 451' },
    { id: uid(), nome: 'Bicarbonato de Sódio 8,4% 250ml', principio: '', categoria: 'Farmácia Central', fabricante: '', lote: '', quantidade: 0, minimo: 0, preco: 0, validade: '', unidadeUso: 'ml', unidadeCompra: 'UN', qtdPorCompra: 250, controlado: false, obs: 'Cód. 539' },
    { id: uid(), nome: 'Biodex à base de Dexametasona 5,0mg 50ml', principio: '', categoria: 'Farmácia Central', fabricante: '', lote: '', quantidade: 0, minimo: 0, preco: 0, validade: '', unidadeUso: 'ml', unidadeCompra: 'ML', qtdPorCompra: 1, controlado: false, obs: 'Cód. 795' },
    { id: uid(), nome: 'Bionew 100ml', principio: '', categoria: 'Farmácia Central', fabricante: '', lote: '', quantidade: 0, minimo: 0, preco: 0, validade: '', unidadeUso: 'ml', unidadeCompra: 'ML', qtdPorCompra: 1, controlado: false, obs: 'Cód. 312' },
    { id: uid(), nome: 'Bissulfato de Clopidogrel 75mg c/28 Comprimidos', principio: '', categoria: 'Farmácia Central', fabricante: '', lote: '', quantidade: 0, minimo: 0, preco: 0, validade: '', unidadeUso: 'un', unidadeCompra: 'UN', qtdPorCompra: 1, controlado: false, obs: 'Cód. 801' },
    { id: uid(), nome: 'BOBINA EST 20CMX100MT', principio: '', categoria: 'Farmácia Central', fabricante: '', lote: '', quantidade: 0, minimo: 0, preco: 0, validade: '', unidadeUso: 'un', unidadeCompra: 'UN', qtdPorCompra: 1, controlado: false, obs: 'Cód. 1071' },
    { id: uid(), nome: 'BOBINA EST 35CMX100MT', principio: '', categoria: 'Farmácia Central', fabricante: '', lote: '', quantidade: 0, minimo: 0, preco: 0, validade: '', unidadeUso: 'un', unidadeCompra: 'UN', qtdPorCompra: 1, controlado: false, obs: 'Cód. 1072' },
    { id: uid(), nome: 'BOLSA P/ SANGUE SIMPLES 500ML CPDA', principio: '', categoria: 'Farmácia Central', fabricante: '', lote: '', quantidade: 0, minimo: 0, preco: 0, validade: '', unidadeUso: 'ml', unidadeCompra: 'UN', qtdPorCompra: 500, controlado: false, obs: 'Cód. 735' },
    { id: uid(), nome: 'Borgal 50ml', principio: '', categoria: 'Farmácia Central', fabricante: '', lote: '', quantidade: 0, minimo: 0, preco: 0, validade: '', unidadeUso: 'ml', unidadeCompra: 'ML', qtdPorCompra: 1, controlado: false, obs: 'Cód. 532' },
    { id: uid(), nome: 'Buscofin Frasco 50ml', principio: '', categoria: 'Farmácia Central', fabricante: '', lote: '', quantidade: 0, minimo: 0, preco: 0, validade: '', unidadeUso: 'ml', unidadeCompra: 'ML', qtdPorCompra: 1, controlado: false, obs: 'Cód. 313' },
    { id: uid(), nome: 'BUSTER Cat Catheter, side holes', principio: '', categoria: 'Farmácia Central', fabricante: '', lote: '', quantidade: 0, minimo: 0, preco: 0, validade: '', unidadeUso: 'un', unidadeCompra: 'UN', qtdPorCompra: 1, controlado: false, obs: 'Cód. 716' },
    { id: uid(), nome: 'Butorfanol 10ml', principio: '', categoria: 'Farmácia Central', fabricante: '', lote: '', quantidade: 0, minimo: 0, preco: 0, validade: '', unidadeUso: 'ml', unidadeCompra: 'ML', qtdPorCompra: 1, controlado: true, obs: 'Cód. 614 · CONTROLADO' },
    { id: uid(), nome: 'Caixa Coletora Perfurocortante', principio: '', categoria: 'Farmácia Central', fabricante: '', lote: '', quantidade: 0, minimo: 0, preco: 0, validade: '', unidadeUso: 'un', unidadeCompra: 'UN', qtdPorCompra: 1, controlado: false, obs: 'Cód. 498' },
    { id: uid(), nome: 'Cal Sodada 5L', principio: '', categoria: 'Farmácia Central', fabricante: '', lote: '', quantidade: 0, minimo: 0, preco: 0, validade: '', unidadeUso: 'un', unidadeCompra: 'UN', qtdPorCompra: 1, controlado: false, obs: 'Cód. 486' },
    { id: uid(), nome: 'CALSODADA 5L (FREE)', principio: '', categoria: 'Farmácia Central', fabricante: '', lote: '', quantidade: 0, minimo: 0, preco: 0, validade: '', unidadeUso: 'gl', unidadeCompra: 'GL', qtdPorCompra: 1, controlado: false, obs: 'Cód. 873' },
    { id: uid(), nome: 'Campo Operat 25x28 15g Estéril', principio: '', categoria: 'Farmácia Central', fabricante: '', lote: '', quantidade: 0, minimo: 0, preco: 0, validade: '', unidadeUso: 'un', unidadeCompra: 'UN', qtdPorCompra: 1, controlado: false, obs: 'Cód. 501' },
    { id: uid(), nome: 'CAMPO OPERATORIO 45X50CM C/RX 15G HELENA NAO ESTERIL COM 50 UNIDADES', principio: '', categoria: 'Farmácia Central', fabricante: '', lote: '', quantidade: 0, minimo: 0, preco: 0, validade: '', unidadeUso: 'un', unidadeCompra: 'UN', qtdPorCompra: 1, controlado: false, obs: 'Cód. 1027' },
    { id: uid(), nome: 'Cateter Intravenosa Rosa 20G', principio: '', categoria: 'Farmácia Central', fabricante: '', lote: '', quantidade: 0, minimo: 0, preco: 0, validade: '', unidadeUso: 'un', unidadeCompra: 'UN', qtdPorCompra: 1, controlado: false, obs: 'Cód. 397' },
    { id: uid(), nome: 'Cateter Intravenoso Amarelo 24G', principio: '', categoria: 'Farmácia Central', fabricante: '', lote: '', quantidade: 0, minimo: 0, preco: 0, validade: '', unidadeUso: 'un', unidadeCompra: 'UN', qtdPorCompra: 1, controlado: false, obs: 'Cód. 395' },
    { id: uid(), nome: 'Cateter Intravenoso Azul 22G', principio: '', categoria: 'Farmácia Central', fabricante: '', lote: '', quantidade: 0, minimo: 0, preco: 0, validade: '', unidadeUso: 'un', unidadeCompra: 'UN', qtdPorCompra: 1, controlado: false, obs: 'Cód. 396' },
    { id: uid(), nome: 'Cateter Intravenoso Roxo 26G', principio: '', categoria: 'Farmácia Central', fabricante: '', lote: '', quantidade: 0, minimo: 0, preco: 0, validade: '', unidadeUso: 'un', unidadeCompra: 'UN', qtdPorCompra: 1, controlado: false, obs: 'Cód. 648' },
    { id: uid(), nome: 'Cefalotina Sódica 1g', principio: '', categoria: 'Farmácia Central', fabricante: '', lote: '', quantidade: 0, minimo: 0, preco: 0, validade: '', unidadeUso: 'ml', unidadeCompra: 'ML', qtdPorCompra: 1, controlado: false, obs: 'Cód. 315' },
    { id: uid(), nome: 'Ceftriaxona dissódica hemieptaidratada 1000mg', principio: '', categoria: 'Farmácia Central', fabricante: '', lote: '', quantidade: 0, minimo: 0, preco: 0, validade: '', unidadeUso: 'ml', unidadeCompra: 'ML', qtdPorCompra: 1, controlado: false, obs: 'Cód. 314' },
    { id: uid(), nome: 'CERENIA 0,1 ML', principio: '', categoria: 'Farmácia Central', fabricante: '', lote: '', quantidade: 0, minimo: 0, preco: 0, validade: '', unidadeUso: 'ml', unidadeCompra: 'ML', qtdPorCompra: 1, controlado: false, obs: 'Cód. 376' },
    { id: uid(), nome: 'Churu Cheese Dog', principio: '', categoria: 'Farmácia Central', fabricante: '', lote: '', quantidade: 0, minimo: 0, preco: 0, validade: '', unidadeUso: 'un', unidadeCompra: 'UN', qtdPorCompra: 1, controlado: false, obs: 'Cód. 387' },
    { id: uid(), nome: 'Churu Dogs', principio: '', categoria: 'Farmácia Central', fabricante: '', lote: '', quantidade: 0, minimo: 0, preco: 0, validade: '', unidadeUso: 'un', unidadeCompra: 'UN', qtdPorCompra: 1, controlado: false, obs: 'Cód. 386' },
    { id: uid(), nome: 'Churu Poulet Cat', principio: '', categoria: 'Farmácia Central', fabricante: '', lote: '', quantidade: 0, minimo: 0, preco: 0, validade: '', unidadeUso: 'un', unidadeCompra: 'UN', qtdPorCompra: 1, controlado: false, obs: 'Cód. 385' },
    { id: uid(), nome: 'Churu Saumon Cat', principio: '', categoria: 'Farmácia Central', fabricante: '', lote: '', quantidade: 0, minimo: 0, preco: 0, validade: '', unidadeUso: 'un', unidadeCompra: 'UN', qtdPorCompra: 1, controlado: false, obs: 'Cód. 384' },
    { id: uid(), nome: 'Cimetidina 150mg 2ml', principio: '', categoria: 'Farmácia Central', fabricante: '', lote: '', quantidade: 0, minimo: 0, preco: 0, validade: '', unidadeUso: 'ml', unidadeCompra: 'ML', qtdPorCompra: 1, controlado: false, obs: 'Cód. 455' },
    { id: uid(), nome: 'Clindamicina Ampola 4ml', principio: '', categoria: 'Farmácia Central', fabricante: '', lote: '', quantidade: 0, minimo: 0, preco: 0, validade: '', unidadeUso: 'ml', unidadeCompra: 'ML', qtdPorCompra: 1, controlado: false, obs: 'Cód. 525' },
    { id: uid(), nome: 'Cloreto de Potássio 19,1%', principio: '', categoria: 'Farmácia Central', fabricante: '', lote: '', quantidade: 0, minimo: 0, preco: 0, validade: '', unidadeUso: 'un', unidadeCompra: 'UN', qtdPorCompra: 1, controlado: false, obs: 'Cód. 429' },
    { id: uid(), nome: 'Cloreto de Sódio 20% 10ml (Solução fisiológica)', principio: '', categoria: 'Farmácia Central', fabricante: '', lote: '', quantidade: 0, minimo: 0, preco: 0, validade: '', unidadeUso: 'ml', unidadeCompra: 'UN', qtdPorCompra: 10, controlado: false, obs: 'Cód. 473' },
    { id: uid(), nome: 'CLOREXIDINA 0,5% ALCOOLICA 100ML', principio: '', categoria: 'Farmácia Central', fabricante: '', lote: '', quantidade: 0, minimo: 0, preco: 0, validade: '', unidadeUso: 'fr', unidadeCompra: 'FR', qtdPorCompra: 1, controlado: false, obs: 'Cód. 874' },
    { id: uid(), nome: 'Clorexidina 1L 2% DEGERMANTE', principio: '', categoria: 'Farmácia Central', fabricante: '', lote: '', quantidade: 0, minimo: 0, preco: 0, validade: '', unidadeUso: 'un', unidadeCompra: 'UN', qtdPorCompra: 1, controlado: false, obs: 'Cód. 435' },
    { id: uid(), nome: 'Cloridrato de Amantadina 100mg c/30 Comprimidos', principio: '', categoria: 'Farmácia Central', fabricante: '', lote: '', quantidade: 0, minimo: 0, preco: 0, validade: '', unidadeUso: 'un', unidadeCompra: 'UN', qtdPorCompra: 1, controlado: false, obs: 'Cód. 796' },
    { id: uid(), nome: 'Cloridrato de Benazepril 5,0mg c/10 Comprimidos', principio: '', categoria: 'Farmácia Central', fabricante: '', lote: '', quantidade: 0, minimo: 0, preco: 0, validade: '', unidadeUso: 'un', unidadeCompra: 'UN', qtdPorCompra: 1, controlado: false, obs: 'Cód. 533' },
    { id: uid(), nome: 'Cloridrato de Bupivacaína 5mg/ml 20 ml', principio: '', categoria: 'Farmácia Central', fabricante: '', lote: '', quantidade: 0, minimo: 0, preco: 0, validade: '', unidadeUso: 'ml', unidadeCompra: 'ML', qtdPorCompra: 1, controlado: false, obs: 'Cód. 311' },
    { id: uid(), nome: 'Cloridrato de Ciprofloxacino 3,5mg/g + Dexametasona 1mg/g', principio: '', categoria: 'Farmácia Central', fabricante: '', lote: '', quantidade: 0, minimo: 0, preco: 0, validade: '', unidadeUso: 'un', unidadeCompra: 'UN', qtdPorCompra: 1, controlado: false, obs: 'Cód. 802' },
    { id: uid(), nome: 'Cloridrato de Ondansetrona 8mg', principio: '', categoria: 'Farmácia Central', fabricante: '', lote: '', quantidade: 0, minimo: 0, preco: 0, validade: '', unidadeUso: 'un', unidadeCompra: 'UN', qtdPorCompra: 1, controlado: false, obs: 'Cód. 806' },
    { id: uid(), nome: 'Clotrimazol (Aurivet) 13g', principio: '', categoria: 'Farmácia Central', fabricante: '', lote: '', quantidade: 0, minimo: 0, preco: 0, validade: '', unidadeUso: 'un', unidadeCompra: 'UN', qtdPorCompra: 1, controlado: false, obs: 'Cód. 456' },
    { id: uid(), nome: 'Coletor Universal', principio: '', categoria: 'Farmácia Central', fabricante: '', lote: '', quantidade: 0, minimo: 0, preco: 0, validade: '', unidadeUso: 'un', unidadeCompra: 'UN', qtdPorCompra: 1, controlado: false, obs: 'Cód. 441' },
    { id: uid(), nome: 'COMPRESSA 13F 7,5X7,5 C/500 I (GARDENIA)', principio: '', categoria: 'Farmácia Central', fabricante: '', lote: '', quantidade: 0, minimo: 0, preco: 0, validade: '', unidadeUso: 'pct', unidadeCompra: 'PCT', qtdPorCompra: 1, controlado: false, obs: 'Cód. 973' },
    { id: uid(), nome: 'COMPRESSA DE GAZE 11 FIOS C/500', principio: '', categoria: 'Farmácia Central', fabricante: '', lote: '', quantidade: 0, minimo: 0, preco: 0, validade: '', unidadeUso: 'pt', unidadeCompra: 'PT', qtdPorCompra: 1, controlado: false, obs: 'Cód. 1028' },
    { id: uid(), nome: 'Compressa Estéril para Cirurgia', principio: '', categoria: 'Farmácia Central', fabricante: '', lote: '', quantidade: 0, minimo: 0, preco: 0, validade: '', unidadeUso: 'un', unidadeCompra: 'UN', qtdPorCompra: 1, controlado: false, obs: 'Cód. 495' },
    { id: uid(), nome: 'Compressa Estéril para Curativo', principio: '', categoria: 'Farmácia Central', fabricante: '', lote: '', quantidade: 0, minimo: 0, preco: 0, validade: '', unidadeUso: 'un', unidadeCompra: 'UN', qtdPorCompra: 1, controlado: false, obs: 'Cód. 422' },
    { id: uid(), nome: 'COMPRESSA GAZE 11F 7,5X7,5CM CX/240PCT (ESTERIL)', principio: '', categoria: 'Farmácia Central', fabricante: '', lote: '', quantidade: 0, minimo: 0, preco: 0, validade: '', unidadeUso: 'cx', unidadeCompra: 'CX', qtdPorCompra: 1, controlado: false, obs: 'Cód. 1039' },
    { id: uid(), nome: 'Cortador de Comprimido', principio: '', categoria: 'Farmácia Central', fabricante: '', lote: '', quantidade: 0, minimo: 0, preco: 0, validade: '', unidadeUso: 'un', unidadeCompra: 'UN', qtdPorCompra: 1, controlado: false, obs: 'Cód. 431' },
    { id: uid(), nome: 'Cotonete', principio: '', categoria: 'Farmácia Central', fabricante: '', lote: '', quantidade: 0, minimo: 0, preco: 0, validade: '', unidadeUso: 'un', unidadeCompra: 'UN', qtdPorCompra: 1, controlado: false, obs: 'Cód. 402' },
    { id: uid(), nome: 'Cronidor Cloridrato de Tramadol 2% 20ml', principio: '', categoria: 'Farmácia Central', fabricante: '', lote: '', quantidade: 0, minimo: 0, preco: 0, validade: '', unidadeUso: 'ml', unidadeCompra: 'UN', qtdPorCompra: 20, controlado: true, obs: 'Cód. 825 · CONTROLADO' },
    { id: uid(), nome: 'Deca-Durabolin 50mg 1ml', principio: '', categoria: 'Farmácia Central', fabricante: '', lote: '', quantidade: 0, minimo: 0, preco: 0, validade: '', unidadeUso: 'ml', unidadeCompra: 'UN', qtdPorCompra: 1, controlado: false, obs: 'Cód. 670' },
    { id: uid(), nome: 'Desmopet', principio: '', categoria: 'Farmácia Central', fabricante: '', lote: '', quantidade: 0, minimo: 0, preco: 0, validade: '', unidadeUso: 'un', unidadeCompra: 'UN', qtdPorCompra: 1, controlado: false, obs: 'Cód. 469' },
    { id: uid(), nome: 'Dexametasona 4mg/ml 2,5ml', principio: '', categoria: 'Farmácia Central', fabricante: '', lote: '', quantidade: 0, minimo: 0, preco: 0, validade: '', unidadeUso: 'ml', unidadeCompra: 'ML', qtdPorCompra: 1, controlado: false, obs: 'Cód. 327' },
    { id: uid(), nome: 'Dexametasona 5mg/1ml 50ml', principio: '', categoria: 'Farmácia Central', fabricante: '', lote: '', quantidade: 0, minimo: 0, preco: 0, validade: '', unidadeUso: 'ml', unidadeCompra: 'UN', qtdPorCompra: 1, controlado: false, obs: 'Cód. 659' },
    { id: uid(), nome: 'Dexmedetomidina 100mcg 2ml', principio: '', categoria: 'Farmácia Central', fabricante: '', lote: '', quantidade: 0, minimo: 0, preco: 0, validade: '', unidadeUso: 'ml', unidadeCompra: 'ML', qtdPorCompra: 1, controlado: false, obs: 'Cód. 369' },
    { id: uid(), nome: 'DEXPANTENOL 50MG/G PDA 30GR (BEPANTRIZ)', principio: '', categoria: 'Farmácia Central', fabricante: '', lote: '', quantidade: 0, minimo: 0, preco: 0, validade: '', unidadeUso: 'cx', unidadeCompra: 'CX', qtdPorCompra: 1, controlado: false, obs: 'Cód. 972' },
    { id: uid(), nome: 'Diazepam 10mg - 2ml', principio: '', categoria: 'Farmácia Central', fabricante: '', lote: '', quantidade: 0, minimo: 0, preco: 0, validade: '', unidadeUso: 'ml', unidadeCompra: 'UN', qtdPorCompra: 2, controlado: true, obs: 'Cód. 325 · CONTROLADO' },
    { id: uid(), nome: 'Diazepam 5mg/ml 2ml', principio: '', categoria: 'Farmácia Central', fabricante: '', lote: '', quantidade: 0, minimo: 0, preco: 0, validade: '', unidadeUso: 'ml', unidadeCompra: 'UN', qtdPorCompra: 2, controlado: true, obs: 'Cód. 816 · CONTROLADO' },
    { id: uid(), nome: 'Diazeprim Frasco 20ml', principio: '', categoria: 'Farmácia Central', fabricante: '', lote: '', quantidade: 0, minimo: 0, preco: 0, validade: '', unidadeUso: 'ml', unidadeCompra: 'UN', qtdPorCompra: 20, controlado: false, obs: 'Cód. 543' },
    { id: uid(), nome: 'Dicloridrato de Flunarizina 5mg/ml 30ml', principio: '', categoria: 'Farmácia Central', fabricante: '', lote: '', quantidade: 0, minimo: 0, preco: 0, validade: '', unidadeUso: 'ml', unidadeCompra: 'UN', qtdPorCompra: 30, controlado: false, obs: 'Cód. 571' },
    { id: uid(), nome: 'DM-Gel 50g', principio: '', categoria: 'Farmácia Central', fabricante: '', lote: '', quantidade: 0, minimo: 0, preco: 0, validade: '', unidadeUso: 'un', unidadeCompra: 'UN', qtdPorCompra: 1, controlado: false, obs: 'Cód. 319' },
    { id: uid(), nome: 'Dobutamina 250mg 20ml', principio: '', categoria: 'Farmácia Central', fabricante: '', lote: '', quantidade: 0, minimo: 0, preco: 0, validade: '', unidadeUso: 'ml', unidadeCompra: 'ML', qtdPorCompra: 1, controlado: false, obs: 'Cód. 317' },
    { id: uid(), nome: 'Doxiciclina Vetnil Injetavel 20ml', principio: '', categoria: 'Farmácia Central', fabricante: '', lote: '', quantidade: 0, minimo: 0, preco: 0, validade: '', unidadeUso: 'ml', unidadeCompra: 'ML', qtdPorCompra: 1, controlado: false, obs: 'Cód. 318' },
    { id: uid(), nome: 'Dreno de Tórax N 12', principio: '', categoria: 'Farmácia Central', fabricante: '', lote: '', quantidade: 0, minimo: 0, preco: 0, validade: '', unidadeUso: 'un', unidadeCompra: 'UN', qtdPorCompra: 1, controlado: false, obs: 'Cód. 652' },
    { id: uid(), nome: 'Eletrolítico 10g', principio: '', categoria: 'Farmácia Central', fabricante: '', lote: '', quantidade: 0, minimo: 0, preco: 0, validade: '', unidadeUso: 'un', unidadeCompra: 'UN', qtdPorCompra: 1, controlado: false, obs: 'Cód. 547' },
    { id: uid(), nome: 'Emedron (Ondansetrona) 1% 10ml', principio: '', categoria: 'Farmácia Central', fabricante: '', lote: '', quantidade: 0, minimo: 0, preco: 0, validade: '', unidadeUso: 'ml', unidadeCompra: 'ML', qtdPorCompra: 1, controlado: false, obs: 'Cód. 321' },
    { id: uid(), nome: 'Enrofloxacino Comprimidos 50mg', principio: '', categoria: 'Farmácia Central', fabricante: '', lote: '', quantidade: 0, minimo: 0, preco: 0, validade: '', unidadeUso: 'un', unidadeCompra: 'UN', qtdPorCompra: 1, controlado: false, obs: 'Cód. 535' },
    { id: uid(), nome: 'Enterex 8g c/10 sachês', principio: '', categoria: 'Farmácia Central', fabricante: '', lote: '', quantidade: 0, minimo: 0, preco: 0, validade: '', unidadeUso: 'un', unidadeCompra: 'UN', qtdPorCompra: 1, controlado: false, obs: 'Cód. 320' },
    { id: uid(), nome: 'Epiotic 100ml', principio: '', categoria: 'Farmácia Central', fabricante: '', lote: '', quantidade: 0, minimo: 0, preco: 0, validade: '', unidadeUso: 'ml', unidadeCompra: 'UN', qtdPorCompra: 100, controlado: false, obs: 'Cód. 554' },
    { id: uid(), nome: 'Equipo Completo Microgotas', principio: '', categoria: 'Farmácia Central', fabricante: '', lote: '', quantidade: 0, minimo: 0, preco: 0, validade: '', unidadeUso: 'un', unidadeCompra: 'UN', qtdPorCompra: 1, controlado: false, obs: 'Cód. 439' },
    { id: uid(), nome: 'Equipo de Infusão Macro Fotossensível', principio: '', categoria: 'Farmácia Central', fabricante: '', lote: '', quantidade: 0, minimo: 0, preco: 0, validade: '', unidadeUso: 'un', unidadeCompra: 'UN', qtdPorCompra: 1, controlado: false, obs: 'Cód. 434' },
    { id: uid(), nome: 'Equipo de Transfusão', principio: '', categoria: 'Farmácia Central', fabricante: '', lote: '', quantidade: 0, minimo: 0, preco: 0, validade: '', unidadeUso: 'un', unidadeCompra: 'UN', qtdPorCompra: 1, controlado: false, obs: 'Cód. 912' },
    { id: uid(), nome: 'Equipo Macrogotas Completo', principio: '', categoria: 'Farmácia Central', fabricante: '', lote: '', quantidade: 0, minimo: 0, preco: 0, validade: '', unidadeUso: 'un', unidadeCompra: 'UN', qtdPorCompra: 1, controlado: false, obs: 'Cód. 433' },
    { id: uid(), nome: 'Eritrós Cat pasta 3ml', principio: '', categoria: 'Farmácia Central', fabricante: '', lote: '', quantidade: 0, minimo: 0, preco: 0, validade: '', unidadeUso: 'ml', unidadeCompra: 'UN', qtdPorCompra: 3, controlado: false, obs: 'Cód. 341' },
    { id: uid(), nome: 'Escalpe 19G', principio: '', categoria: 'Farmácia Central', fabricante: '', lote: '', quantidade: 0, minimo: 0, preco: 0, validade: '', unidadeUso: 'un', unidadeCompra: 'UN', qtdPorCompra: 1, controlado: false, obs: 'Cód. 541' },
    { id: uid(), nome: 'Escalpe 21G', principio: '', categoria: 'Farmácia Central', fabricante: '', lote: '', quantidade: 0, minimo: 0, preco: 0, validade: '', unidadeUso: 'un', unidadeCompra: 'UN', qtdPorCompra: 1, controlado: false, obs: 'Cód. 542' },
    { id: uid(), nome: 'Escalpe 23G', principio: '', categoria: 'Farmácia Central', fabricante: '', lote: '', quantidade: 0, minimo: 0, preco: 0, validade: '', unidadeUso: 'un', unidadeCompra: 'UN', qtdPorCompra: 1, controlado: false, obs: 'Cód. 399' },
    { id: uid(), nome: 'Escalpe 25G', principio: '', categoria: 'Farmácia Central', fabricante: '', lote: '', quantidade: 0, minimo: 0, preco: 0, validade: '', unidadeUso: 'un', unidadeCompra: 'UN', qtdPorCompra: 1, controlado: false, obs: 'Cód. 400' },
    { id: uid(), nome: 'Escalpe 27G', principio: '', categoria: 'Farmácia Central', fabricante: '', lote: '', quantidade: 0, minimo: 0, preco: 0, validade: '', unidadeUso: 'un', unidadeCompra: 'UN', qtdPorCompra: 1, controlado: false, obs: 'Cód. 401' },
    { id: uid(), nome: 'Esponja Clorex 2% 22ml', principio: '', categoria: 'Farmácia Central', fabricante: '', lote: '', quantidade: 0, minimo: 0, preco: 0, validade: '', unidadeUso: 'ml', unidadeCompra: 'UN', qtdPorCompra: 22, controlado: false, obs: 'Cód. 689' },
    { id: uid(), nome: 'EXTENSOR DE EQUIPO ADULTO', principio: '', categoria: 'Farmácia Central', fabricante: '', lote: '', quantidade: 0, minimo: 0, preco: 0, validade: '', unidadeUso: 'un', unidadeCompra: 'UN', qtdPorCompra: 1, controlado: false, obs: 'Cód. 710' },
    { id: uid(), nome: 'EXTENSOR DE EQUIPO NEONATAL 4FR 120CM SLIP', principio: '', categoria: 'Farmácia Central', fabricante: '', lote: '', quantidade: 0, minimo: 0, preco: 0, validade: '', unidadeUso: 'un', unidadeCompra: 'UN', qtdPorCompra: 1, controlado: false, obs: 'Cód. 975' },
    { id: uid(), nome: 'EXTENSOR DE PERFUSAO NEONATAL (3FR) 1.20M', principio: '', categoria: 'Farmácia Central', fabricante: '', lote: '', quantidade: 0, minimo: 0, preco: 0, validade: '', unidadeUso: 'un', unidadeCompra: 'UN', qtdPorCompra: 1, controlado: false, obs: 'Cód. 438' },
    { id: uid(), nome: 'EXTENSOR P/EQUIPO FOTO NEO 1,2MT LL PGC', principio: '', categoria: 'Farmácia Central', fabricante: '', lote: '', quantidade: 0, minimo: 0, preco: 0, validade: '', unidadeUso: 'un', unidadeCompra: 'UN', qtdPorCompra: 1, controlado: false, obs: 'Cód. 872' },
    { id: uid(), nome: 'Fenobarbital Sódico 200mg/ml 2ml', principio: '', categoria: 'Farmácia Central', fabricante: '', lote: '', quantidade: 0, minimo: 0, preco: 0, validade: '', unidadeUso: 'ml', unidadeCompra: 'UN', qtdPorCompra: 2, controlado: true, obs: 'Cód. 324 · CONTROLADO' },
    { id: uid(), nome: 'Fentanil 0,0785mg/ml 10ml', principio: '', categoria: 'Farmácia Central', fabricante: '', lote: '', quantidade: 0, minimo: 0, preco: 0, validade: '', unidadeUso: 'ml', unidadeCompra: 'ML', qtdPorCompra: 1, controlado: true, obs: 'Cód. 326 · CONTROLADO' },
    { id: uid(), nome: 'Fentanil 50mg/ml 10ml', principio: '', categoria: 'Farmácia Central', fabricante: '', lote: '', quantidade: 0, minimo: 0, preco: 0, validade: '', unidadeUso: 'ml', unidadeCompra: 'ML', qtdPorCompra: 1, controlado: true, obs: 'Cód. 815 · CONTROLADO' },
    { id: uid(), nome: 'Fentanil 50mg/ml 2ml', principio: '', categoria: 'Farmácia Central', fabricante: '', lote: '', quantidade: 0, minimo: 0, preco: 0, validade: '', unidadeUso: 'ml', unidadeCompra: 'UN', qtdPorCompra: 2, controlado: true, obs: 'Cód. 749 · CONTROLADO' },
    { id: uid(), nome: 'Ferrodex Injetável 50ml', principio: '', categoria: 'Farmácia Central', fabricante: '', lote: '', quantidade: 0, minimo: 0, preco: 0, validade: '', unidadeUso: 'ml', unidadeCompra: 'ML', qtdPorCompra: 1, controlado: false, obs: 'Cód. 647' },
    { id: uid(), nome: 'FILGRASTINE (FILGRASTIM) 300MCG/ML AMP 1ML (2 A 8 GRAUS)', principio: '', categoria: 'Farmácia Central', fabricante: '', lote: '', quantidade: 0, minimo: 0, preco: 0, validade: '', unidadeUso: 'ml', unidadeCompra: 'UN', qtdPorCompra: 1, controlado: false, obs: 'Cód. 711' },
    { id: uid(), nome: 'Firovet Dog Pasta Oral 35g', principio: '', categoria: 'Farmácia Central', fabricante: '', lote: '', quantidade: 0, minimo: 0, preco: 0, validade: '', unidadeUso: 'un', unidadeCompra: 'UN', qtdPorCompra: 1, controlado: false, obs: 'Cód. 607' },
    { id: uid(), nome: 'Fita de Glicose', principio: '', categoria: 'Farmácia Central', fabricante: '', lote: '', quantidade: 0, minimo: 0, preco: 0, validade: '', unidadeUso: 'un', unidadeCompra: 'UN', qtdPorCompra: 1, controlado: false, obs: 'Cód. 375' },
    { id: uid(), nome: 'Flamavet (Meloxicam) 0,2% 20ml', principio: '', categoria: 'Farmácia Central', fabricante: '', lote: '', quantidade: 0, minimo: 0, preco: 0, validade: '', unidadeUso: 'ml', unidadeCompra: 'ML', qtdPorCompra: 1, controlado: false, obs: 'Cód. 342' },
    { id: uid(), nome: 'Flumazenil 0,1mg/ml 5ml', principio: '', categoria: 'Farmácia Central', fabricante: '', lote: '', quantidade: 0, minimo: 0, preco: 0, validade: '', unidadeUso: 'ml', unidadeCompra: 'ML', qtdPorCompra: 1, controlado: false, obs: 'Cód. 489' },
    { id: uid(), nome: 'Fosfato dissódico de Dexametasona 2mg/ml 1ml', principio: '', categoria: 'Farmácia Central', fabricante: '', lote: '', quantidade: 0, minimo: 0, preco: 0, validade: '', unidadeUso: 'ml', unidadeCompra: 'UN', qtdPorCompra: 1, controlado: false, obs: 'Cód. 660' },
    { id: uid(), nome: 'Fosfato Sódico de Prednisolona 3mg/ml 60ml', principio: '', categoria: 'Farmácia Central', fabricante: '', lote: '', quantidade: 0, minimo: 0, preco: 0, validade: '', unidadeUso: 'ml', unidadeCompra: 'ML', qtdPorCompra: 1, controlado: false, obs: 'Cód. 537' },
    { id: uid(), nome: 'FRONTLINE SPRAY  250 ML', principio: '', categoria: 'Farmácia Central', fabricante: '', lote: '', quantidade: 0, minimo: 0, preco: 0, validade: '', unidadeUso: 'fr', unidadeCompra: 'FR', qtdPorCompra: 1, controlado: false, obs: 'Cód. 889' },
    { id: uid(), nome: 'FUROSEMIDA 10mg/ml 2ml', principio: '', categoria: 'Farmácia Central', fabricante: '', lote: '', quantidade: 0, minimo: 0, preco: 0, validade: '', unidadeUso: 'ml', unidadeCompra: 'UN', qtdPorCompra: 2, controlado: false, obs: 'Cód. 323' },
    { id: uid(), nome: 'FUROSEMIDA 20MG/2ML INJ', principio: '', categoria: 'Farmácia Central', fabricante: '', lote: '', quantidade: 0, minimo: 0, preco: 0, validade: '', unidadeUso: 'ml', unidadeCompra: 'UN', qtdPorCompra: 2, controlado: false, obs: 'Cód. 976' },
    { id: uid(), nome: 'Gabapentina 100mg/1ml 60ml', principio: '', categoria: 'Farmácia Central', fabricante: '', lote: '', quantidade: 0, minimo: 0, preco: 0, validade: '', unidadeUso: 'ml', unidadeCompra: 'ML', qtdPorCompra: 1, controlado: false, obs: 'Cód. 573' },
    { id: uid(), nome: 'Gabapentina Cápsula 100mg', principio: '', categoria: 'Farmácia Central', fabricante: '', lote: '', quantidade: 0, minimo: 0, preco: 0, validade: '', unidadeUso: 'un', unidadeCompra: 'UN', qtdPorCompra: 1, controlado: false, obs: 'Cód. 704' },
    { id: uid(), nome: 'Gabapentina Cápsula 200mg', principio: '', categoria: 'Farmácia Central', fabricante: '', lote: '', quantidade: 0, minimo: 0, preco: 0, validade: '', unidadeUso: 'un', unidadeCompra: 'UN', qtdPorCompra: 1, controlado: false, obs: 'Cód. 705' },
    { id: uid(), nome: 'Gabapentina Cápsula 50mg', principio: '', categoria: 'Farmácia Central', fabricante: '', lote: '', quantidade: 0, minimo: 0, preco: 0, validade: '', unidadeUso: 'un', unidadeCompra: 'UN', qtdPorCompra: 1, controlado: false, obs: 'Cód. 706' },
    { id: uid(), nome: 'Gaze Estéril', principio: '', categoria: 'Farmácia Central', fabricante: '', lote: '', quantidade: 0, minimo: 0, preco: 0, validade: '', unidadeUso: 'un', unidadeCompra: 'UN', qtdPorCompra: 1, controlado: false, obs: 'Cód. 377' },
    { id: uid(), nome: 'Gaze Não esteril - c/500', principio: '', categoria: 'Farmácia Central', fabricante: '', lote: '', quantidade: 0, minimo: 0, preco: 0, validade: '', unidadeUso: 'un', unidadeCompra: 'UN', qtdPorCompra: 1, controlado: false, obs: 'Cód. 458' },
    { id: uid(), nome: 'Gel Condutor 5Kg', principio: '', categoria: 'Farmácia Central', fabricante: '', lote: '', quantidade: 0, minimo: 0, preco: 0, validade: '', unidadeUso: 'un', unidadeCompra: 'UN', qtdPorCompra: 1, controlado: false, obs: 'Cód. 440' },
    { id: uid(), nome: 'Gel para Ultrassonografia', principio: '', categoria: 'Farmácia Central', fabricante: '', lote: '', quantidade: 0, minimo: 0, preco: 0, validade: '', unidadeUso: 'un', unidadeCompra: 'UN', qtdPorCompra: 1, controlado: false, obs: 'Cód. 914' },
    { id: uid(), nome: 'Glicol Suplemento 10ml', principio: '', categoria: 'Farmácia Central', fabricante: '', lote: '', quantidade: 0, minimo: 0, preco: 0, validade: '', unidadeUso: 'ml', unidadeCompra: 'UN', qtdPorCompra: 10, controlado: false, obs: 'Cód. 445' },
    { id: uid(), nome: 'Gliconato de cálcio 10% 10ml', principio: '', categoria: 'Farmácia Central', fabricante: '', lote: '', quantidade: 0, minimo: 0, preco: 0, validade: '', unidadeUso: 'ml', unidadeCompra: 'UN', qtdPorCompra: 10, controlado: false, obs: 'Cód. 483' },
    { id: uid(), nome: 'Glicose 50% 10ml', principio: '', categoria: 'Farmácia Central', fabricante: '', lote: '', quantidade: 0, minimo: 0, preco: 0, validade: '', unidadeUso: 'ml', unidadeCompra: 'UN', qtdPorCompra: 10, controlado: false, obs: 'Cód. 452' },
    { id: uid(), nome: 'Gluconato e Lactato de Cálcio + Glicose + Magnésio 500ml', principio: '', categoria: 'Farmácia Central', fabricante: '', lote: '', quantidade: 0, minimo: 0, preco: 0, validade: '', unidadeUso: 'ml', unidadeCompra: 'UN', qtdPorCompra: 500, controlado: false, obs: 'Cód. 657' },
    { id: uid(), nome: 'Glycoxil 5mg/1ml 30ml', principio: '', categoria: 'Farmácia Central', fabricante: '', lote: '', quantidade: 0, minimo: 0, preco: 0, validade: '', unidadeUso: 'ml', unidadeCompra: 'UN', qtdPorCompra: 1, controlado: false, obs: 'Cód. 804' },
    { id: uid(), nome: 'GP SH GMT CAO AD CAR CX18X100G - CX', principio: '', categoria: 'Farmácia Central', fabricante: '', lote: '', quantidade: 0, minimo: 0, preco: 0, validade: '', unidadeUso: 'cx', unidadeCompra: 'CX', qtdPorCompra: 1, controlado: false, obs: 'Cód. 1014' },
    { id: uid(), nome: 'GP SH GMT GATO AD CAR CX18X85G - CX', principio: '', categoria: 'Farmácia Central', fabricante: '', lote: '', quantidade: 0, minimo: 0, preco: 0, validade: '', unidadeUso: 'cx', unidadeCompra: 'CX', qtdPorCompra: 1, controlado: false, obs: 'Cód. 1015' },
    { id: uid(), nome: 'GP SH GMT GATO CAST OVE CX18X85G - CX', principio: '', categoria: 'Farmácia Central', fabricante: '', lote: '', quantidade: 0, minimo: 0, preco: 0, validade: '', unidadeUso: 'cx', unidadeCompra: 'CX', qtdPorCompra: 1, controlado: false, obs: 'Cód. 1016' },
    { id: uid(), nome: 'HEAL MANGA PROT PATAS DIANTEIRAS TAM 03', principio: '', categoria: 'Farmácia Central', fabricante: '', lote: '', quantidade: 0, minimo: 0, preco: 0, validade: '', unidadeUso: 'un', unidadeCompra: 'UN', qtdPorCompra: 1, controlado: false, obs: 'Cód. 894' },
    { id: uid(), nome: 'HEAL MANGA PROT PATAS DIANTEIRAS TAM 05', principio: '', categoria: 'Farmácia Central', fabricante: '', lote: '', quantidade: 0, minimo: 0, preco: 0, validade: '', unidadeUso: 'un', unidadeCompra: 'UN', qtdPorCompra: 1, controlado: false, obs: 'Cód. 895' },
    { id: uid(), nome: 'HEAL MANGA PROT PATAS DIANTEIRAS TAM 06', principio: '', categoria: 'Farmácia Central', fabricante: '', lote: '', quantidade: 0, minimo: 0, preco: 0, validade: '', unidadeUso: 'un', unidadeCompra: 'UN', qtdPorCompra: 1, controlado: false, obs: 'Cód. 896' },
    { id: uid(), nome: 'HEAL MANGA PROT PATAS DIANTEIRAS TAM 09', principio: '', categoria: 'Farmácia Central', fabricante: '', lote: '', quantidade: 0, minimo: 0, preco: 0, validade: '', unidadeUso: 'un', unidadeCompra: 'UN', qtdPorCompra: 1, controlado: false, obs: 'Cód. 897' },
    { id: uid(), nome: 'HEMOSPON ESPONJA C/10 UNIDS', principio: '', categoria: 'Farmácia Central', fabricante: '', lote: '', quantidade: 0, minimo: 0, preco: 0, validade: '', unidadeUso: 'cx', unidadeCompra: 'CX', qtdPorCompra: 1, controlado: false, obs: 'Cód. 907' },
    { id: uid(), nome: 'Heparina 0,25ml', principio: '', categoria: 'Farmácia Central', fabricante: '', lote: '', quantidade: 0, minimo: 0, preco: 0, validade: '', unidadeUso: 'ml', unidadeCompra: 'ML', qtdPorCompra: 1, controlado: false, obs: 'Cód. 663' },
    { id: uid(), nome: 'Heparina sódica suína 25.000UI/5ml 5ml', principio: '', categoria: 'Farmácia Central', fabricante: '', lote: '', quantidade: 0, minimo: 0, preco: 0, validade: '', unidadeUso: 'ml', unidadeCompra: 'ML', qtdPorCompra: 1, controlado: false, obs: 'Cód. 335' },
    { id: uid(), nome: 'Hepvet 60ml', principio: '', categoria: 'Farmácia Central', fabricante: '', lote: '', quantidade: 0, minimo: 0, preco: 0, validade: '', unidadeUso: 'ml', unidadeCompra: 'UN', qtdPorCompra: 60, controlado: false, obs: 'Cód. 333' },
    { id: uid(), nome: 'HIDROCORTISONA 100MG', principio: '', categoria: 'Farmácia Central', fabricante: '', lote: '', quantidade: 0, minimo: 0, preco: 0, validade: '', unidadeUso: 'un', unidadeCompra: 'UN', qtdPorCompra: 1, controlado: false, obs: 'Cód. 709' },
    { id: uid(), nome: 'Hidrocortisona 500mg', principio: '', categoria: 'Farmácia Central', fabricante: '', lote: '', quantidade: 0, minimo: 0, preco: 0, validade: '', unidadeUso: 'ml', unidadeCompra: 'ML', qtdPorCompra: 1, controlado: false, obs: 'Cód. 330' },
    { id: uid(), nome: 'Hidróxido de Alumínio 37mg/ml + Hidróxido de Magnésio 40mg/ml + Simeticona 5mg/ml 240ml', principio: '', categoria: 'Farmácia Central', fabricante: '', lote: '', quantidade: 0, minimo: 0, preco: 0, validade: '', unidadeUso: 'ml', unidadeCompra: 'ML', qtdPorCompra: 1, controlado: false, obs: 'Cód. 332' },
    { id: uid(), nome: 'Hidróxido de Alumínio 6% 240ml', principio: '', categoria: 'Farmácia Central', fabricante: '', lote: '', quantidade: 0, minimo: 0, preco: 0, validade: '', unidadeUso: 'ml', unidadeCompra: 'ML', qtdPorCompra: 1, controlado: false, obs: 'Cód. 331' },
    { id: uid(), nome: 'Hidróxido de Alumínio pasta oral 301,5mg 30g', principio: '', categoria: 'Farmácia Central', fabricante: '', lote: '', quantidade: 0, minimo: 0, preco: 0, validade: '', unidadeUso: 'un', unidadeCompra: 'UN', qtdPorCompra: 1, controlado: false, obs: 'Cód. 805' },
    { id: uid(), nome: 'Hirudoid pomada Hematomas 3mg/g 40g', principio: '', categoria: 'Farmácia Central', fabricante: '', lote: '', quantidade: 0, minimo: 0, preco: 0, validade: '', unidadeUso: 'un', unidadeCompra: 'UN', qtdPorCompra: 1, controlado: false, obs: 'Cód. 673' },
    { id: uid(), nome: 'Imizol Injetável 15ml', principio: '', categoria: 'Farmácia Central', fabricante: '', lote: '', quantidade: 0, minimo: 0, preco: 0, validade: '', unidadeUso: 'ml', unidadeCompra: 'ML', qtdPorCompra: 1, controlado: false, obs: 'Cód. 364' },
    { id: uid(), nome: 'Insulina Ampola 10ml', principio: '', categoria: 'Farmácia Central', fabricante: '', lote: '', quantidade: 0, minimo: 0, preco: 0, validade: '', unidadeUso: 'ml', unidadeCompra: 'UN', qtdPorCompra: 10, controlado: false, obs: 'Cód. 337' },
    { id: uid(), nome: 'Isoflurano 1mL/ml 240ml', principio: '', categoria: 'Farmácia Central', fabricante: '', lote: '', quantidade: 0, minimo: 0, preco: 0, validade: '', unidadeUso: 'ml', unidadeCompra: 'ML', qtdPorCompra: 1, controlado: false, obs: 'Cód. 490' },
    { id: uid(), nome: 'Kit Avental Cirúrgico', principio: '', categoria: 'Farmácia Central', fabricante: '', lote: '', quantidade: 0, minimo: 0, preco: 0, validade: '', unidadeUso: 'un', unidadeCompra: 'UN', qtdPorCompra: 1, controlado: false, obs: 'Cód. 457' },
    { id: uid(), nome: 'Lactobac Cat 3ml', principio: '', categoria: 'Farmácia Central', fabricante: '', lote: '', quantidade: 0, minimo: 0, preco: 0, validade: '', unidadeUso: 'ml', unidadeCompra: 'UN', qtdPorCompra: 3, controlado: false, obs: 'Cód. 463' },
    { id: uid(), nome: 'Lactobac Dog 3ml', principio: '', categoria: 'Farmácia Central', fabricante: '', lote: '', quantidade: 0, minimo: 0, preco: 0, validade: '', unidadeUso: 'ml', unidadeCompra: 'UN', qtdPorCompra: 3, controlado: false, obs: 'Cód. 338' },
    { id: uid(), nome: 'Lactulose 667mg/ml 120ml', principio: '', categoria: 'Farmácia Central', fabricante: '', lote: '', quantidade: 0, minimo: 0, preco: 0, validade: '', unidadeUso: 'ml', unidadeCompra: 'ML', qtdPorCompra: 1, controlado: false, obs: 'Cód. 339' },
    { id: uid(), nome: 'LAMINA BISTURI N.24 C/100', principio: '', categoria: 'Farmácia Central', fabricante: '', lote: '', quantidade: 0, minimo: 0, preco: 0, validade: '', unidadeUso: 'cx', unidadeCompra: 'CX', qtdPorCompra: 1, controlado: false, obs: 'Cód. 1040' },
    { id: uid(), nome: 'Lamina de Bisturi', principio: '', categoria: 'Farmácia Central', fabricante: '', lote: '', quantidade: 0, minimo: 0, preco: 0, validade: '', unidadeUso: 'un', unidadeCompra: 'UN', qtdPorCompra: 1, controlado: false, obs: 'Cód. 340' },
    { id: uid(), nome: 'LAMINA DE BISTURI DESCART ACO CARB N 15', principio: '', categoria: 'Farmácia Central', fabricante: '', lote: '', quantidade: 0, minimo: 0, preco: 0, validade: '', unidadeUso: 'un', unidadeCompra: 'UN', qtdPorCompra: 1, controlado: false, obs: 'Cód. 1043' },
    { id: uid(), nome: 'Lamínula 24x24mm', principio: '', categoria: 'Farmácia Central', fabricante: '', lote: '', quantidade: 0, minimo: 0, preco: 0, validade: '', unidadeUso: 'un', unidadeCompra: 'UN', qtdPorCompra: 1, controlado: false, obs: 'Cód. 519' },
    { id: uid(), nome: 'Leucogen (Timomodulina) 20mg/5ml 120ml', principio: '', categoria: 'Farmácia Central', fabricante: '', lote: '', quantidade: 0, minimo: 0, preco: 0, validade: '', unidadeUso: 'ml', unidadeCompra: 'ML', qtdPorCompra: 1, controlado: false, obs: 'Cód. 664' },
    { id: uid(), nome: 'Levetiracetam 100mg/ml 150ml', principio: '', categoria: 'Farmácia Central', fabricante: '', lote: '', quantidade: 0, minimo: 0, preco: 0, validade: '', unidadeUso: 'ml', unidadeCompra: 'ML', qtdPorCompra: 1, controlado: false, obs: 'Cód. 792' },
    { id: uid(), nome: 'Lidocaína 20mg/ml 20ml', principio: '', categoria: 'Farmácia Central', fabricante: '', lote: '', quantidade: 0, minimo: 0, preco: 0, validade: '', unidadeUso: 'ml', unidadeCompra: 'ML', qtdPorCompra: 1, controlado: false, obs: 'Cód. 334' },
    { id: uid(), nome: 'LUVA - AMARELA - M - (HIPOALERGICA)', principio: '', categoria: 'Farmácia Central', fabricante: '', lote: '', quantidade: 0, minimo: 0, preco: 0, validade: '', unidadeUso: 'un', unidadeCompra: 'UN', qtdPorCompra: 1, controlado: false, obs: 'Cód. 954' },
    { id: uid(), nome: 'Luva cirúrgica 6+-', principio: '', categoria: 'Farmácia Central', fabricante: '', lote: '', quantidade: 0, minimo: 0, preco: 0, validade: '', unidadeUso: 'un', unidadeCompra: 'UN', qtdPorCompra: 1, controlado: false, obs: 'Cód. 916' },
    { id: uid(), nome: 'Luva cirúrgica 7', principio: '', categoria: 'Farmácia Central', fabricante: '', lote: '', quantidade: 0, minimo: 0, preco: 0, validade: '', unidadeUso: 'un', unidadeCompra: 'UN', qtdPorCompra: 1, controlado: false, obs: 'Cód. 917' },
    { id: uid(), nome: 'Luva cirúrgica 8', principio: '', categoria: 'Farmácia Central', fabricante: '', lote: '', quantidade: 0, minimo: 0, preco: 0, validade: '', unidadeUso: 'un', unidadeCompra: 'UN', qtdPorCompra: 1, controlado: false, obs: 'Cód. 918' },
    { id: uid(), nome: 'Luva Cirúrgica Esterilizada', principio: '', categoria: 'Farmácia Central', fabricante: '', lote: '', quantidade: 0, minimo: 0, preco: 0, validade: '', unidadeUso: 'un', unidadeCompra: 'UN', qtdPorCompra: 1, controlado: false, obs: 'Cód. 442' },
    { id: uid(), nome: 'Luva Latex Não Cirúrgica P', principio: '', categoria: 'Farmácia Central', fabricante: '', lote: '', quantidade: 0, minimo: 0, preco: 0, validade: '', unidadeUso: 'un', unidadeCompra: 'UN', qtdPorCompra: 1, controlado: false, obs: 'Cód. 487' },
    { id: uid(), nome: 'Luva Latex Não Cirúrgico M', principio: '', categoria: 'Farmácia Central', fabricante: '', lote: '', quantidade: 0, minimo: 0, preco: 0, validade: '', unidadeUso: 'un', unidadeCompra: 'UN', qtdPorCompra: 1, controlado: false, obs: 'Cód. 529' },
    { id: uid(), nome: 'Luva Não cirúrgica G', principio: '', categoria: 'Farmácia Central', fabricante: '', lote: '', quantidade: 0, minimo: 0, preco: 0, validade: '', unidadeUso: 'un', unidadeCompra: 'UN', qtdPorCompra: 1, controlado: false, obs: 'Cód. 381' },
    { id: uid(), nome: 'Lâminas BIOMASS BISTURI AÇO CARBONO', principio: '', categoria: 'Farmácia Central', fabricante: '', lote: '', quantidade: 0, minimo: 0, preco: 0, validade: '', unidadeUso: 'un', unidadeCompra: 'UN', qtdPorCompra: 1, controlado: false, obs: 'Cód. 569' },
    { id: uid(), nome: 'Lâminas Ponta Fosca', principio: '', categoria: 'Farmácia Central', fabricante: '', lote: '', quantidade: 0, minimo: 0, preco: 0, validade: '', unidadeUso: 'un', unidadeCompra: 'UN', qtdPorCompra: 1, controlado: false, obs: 'Cód. 518' },
    { id: uid(), nome: 'MALHA TUBULAR ORTOPEDICA 08CM X 15M', principio: '', categoria: 'Farmácia Central', fabricante: '', lote: '', quantidade: 0, minimo: 0, preco: 0, validade: '', unidadeUso: 'un', unidadeCompra: 'UN', qtdPorCompra: 1, controlado: false, obs: 'Cód. 798' },
    { id: uid(), nome: 'MANITOL 500ml', principio: '', categoria: 'Farmácia Central', fabricante: '', lote: '', quantidade: 0, minimo: 0, preco: 0, validade: '', unidadeUso: 'ml', unidadeCompra: 'UN', qtdPorCompra: 500, controlado: false, obs: 'Cód. 1034' },
    { id: uid(), nome: 'Marovet (Citrato de Maropitant) 10mg/ml 20ml', principio: '', categoria: 'Farmácia Central', fabricante: '', lote: '', quantidade: 0, minimo: 0, preco: 0, validade: '', unidadeUso: 'ml', unidadeCompra: 'ML', qtdPorCompra: 1, controlado: false, obs: 'Cód. 606' },
    { id: uid(), nome: 'METADONA / ML', principio: '', categoria: 'Farmácia Central', fabricante: '', lote: '', quantidade: 0, minimo: 0, preco: 0, validade: '', unidadeUso: 'ml', unidadeCompra: 'ML', qtdPorCompra: 1, controlado: true, obs: 'Cód. 707 · CONTROLADO' },
    { id: uid(), nome: 'Metadona 10mg/ml 1ml', principio: '', categoria: 'Farmácia Central', fabricante: '', lote: '', quantidade: 0, minimo: 0, preco: 0, validade: '', unidadeUso: 'ml', unidadeCompra: 'UN', qtdPorCompra: 1, controlado: true, obs: 'Cód. 301 · CONTROLADO' },
    { id: uid(), nome: 'Metilprednisolona 40mg/ml 2ml', principio: '', categoria: 'Farmácia Central', fabricante: '', lote: '', quantidade: 0, minimo: 0, preco: 0, validade: '', unidadeUso: 'ml', unidadeCompra: 'ML', qtdPorCompra: 1, controlado: false, obs: 'Cód. 540' },
    { id: uid(), nome: 'Metoclopramida 10mg/2ml', principio: '', categoria: 'Farmácia Central', fabricante: '', lote: '', quantidade: 0, minimo: 0, preco: 0, validade: '', unidadeUso: 'ml', unidadeCompra: 'UN', qtdPorCompra: 2, controlado: false, obs: 'Cód. 343' },
    { id: uid(), nome: 'Metronidazol 100ml', principio: '', categoria: 'Farmácia Central', fabricante: '', lote: '', quantidade: 0, minimo: 0, preco: 0, validade: '', unidadeUso: 'ml', unidadeCompra: 'UN', qtdPorCompra: 100, controlado: false, obs: 'Cód. 504' },
    { id: uid(), nome: 'MICROPIPETA VOLUME VARIAVEL 100-1000UL', principio: '', categoria: 'Farmácia Central', fabricante: '', lote: '', quantidade: 0, minimo: 0, preco: 0, validade: '', unidadeUso: 'pc', unidadeCompra: 'PC', qtdPorCompra: 1, controlado: false, obs: 'Cód. 1076' },
    { id: uid(), nome: 'Midazolam 15mg/3ml 3ml', principio: '', categoria: 'Farmácia Central', fabricante: '', lote: '', quantidade: 0, minimo: 0, preco: 0, validade: '', unidadeUso: 'ml', unidadeCompra: 'UN', qtdPorCompra: 3, controlado: true, obs: 'Cód. 354 · CONTROLADO' },
    { id: uid(), nome: 'Midazolam 1mg 5ml', principio: '', categoria: 'Farmácia Central', fabricante: '', lote: '', quantidade: 0, minimo: 0, preco: 0, validade: '', unidadeUso: 'ml', unidadeCompra: 'UN', qtdPorCompra: 5, controlado: true, obs: 'Cód. 818 · CONTROLADO' },
    { id: uid(), nome: 'Midazolam 5mg 3ml', principio: '', categoria: 'Farmácia Central', fabricante: '', lote: '', quantidade: 0, minimo: 0, preco: 0, validade: '', unidadeUso: 'ml', unidadeCompra: 'UN', qtdPorCompra: 3, controlado: true, obs: 'Cód. 817 · CONTROLADO' },
    { id: uid(), nome: 'Mirtazapina 2mg c/9 Comprimidos', principio: '', categoria: 'Farmácia Central', fabricante: '', lote: '', quantidade: 0, minimo: 0, preco: 0, validade: '', unidadeUso: 'un', unidadeCompra: 'UN', qtdPorCompra: 1, controlado: false, obs: 'Cód. 353' },
    { id: uid(), nome: 'Monovin B12 20ml', principio: '', categoria: 'Farmácia Central', fabricante: '', lote: '', quantidade: 0, minimo: 0, preco: 0, validade: '', unidadeUso: 'ml', unidadeCompra: 'ML', qtdPorCompra: 1, controlado: false, obs: 'Cód. 643' },
    { id: uid(), nome: 'Máscara Tripla Camada Não Estéril', principio: '', categoria: 'Farmácia Central', fabricante: '', lote: '', quantidade: 0, minimo: 0, preco: 0, validade: '', unidadeUso: 'un', unidadeCompra: 'UN', qtdPorCompra: 1, controlado: false, obs: 'Cód. 528' },
    { id: uid(), nome: 'Naloxona 0,4mg/ml 1ml', principio: '', categoria: 'Farmácia Central', fabricante: '', lote: '', quantidade: 0, minimo: 0, preco: 0, validade: '', unidadeUso: 'ml', unidadeCompra: 'UN', qtdPorCompra: 1, controlado: false, obs: 'Cód. 351' },
    { id: uid(), nome: 'NASO CURTA N06', principio: '', categoria: 'Farmácia Central', fabricante: '', lote: '', quantidade: 0, minimo: 0, preco: 0, validade: '', unidadeUso: 'pct', unidadeCompra: 'PCT', qtdPorCompra: 1, controlado: false, obs: 'Cód. 1067' },
    { id: uid(), nome: 'NASOA CURTA N12', principio: '', categoria: 'Farmácia Central', fabricante: '', lote: '', quantidade: 0, minimo: 0, preco: 0, validade: '', unidadeUso: 'pct', unidadeCompra: 'PCT', qtdPorCompra: 1, controlado: false, obs: 'Cód. 1066' },
    { id: uid(), nome: 'Nitenpiram (Capstar) 11,4mg Comprimido', principio: '', categoria: 'Farmácia Central', fabricante: '', lote: '', quantidade: 0, minimo: 0, preco: 0, validade: '', unidadeUso: 'un', unidadeCompra: 'UN', qtdPorCompra: 1, controlado: false, obs: 'Cód. 454' },
    { id: uid(), nome: 'NOBIVAC DHPPI+L 25X1 DOSES - CX', principio: '', categoria: 'Farmácia Central', fabricante: '', lote: '', quantidade: 0, minimo: 0, preco: 0, validade: '', unidadeUso: 'cx', unidadeCompra: 'CX', qtdPorCompra: 1, controlado: false, obs: 'Cód. 776' },
    { id: uid(), nome: 'Norepinefrina 2mg/ml 4ml', principio: '', categoria: 'Farmácia Central', fabricante: '', lote: '', quantidade: 0, minimo: 0, preco: 0, validade: '', unidadeUso: 'ml', unidadeCompra: 'ML', qtdPorCompra: 1, controlado: false, obs: 'Cód. 345' },
    { id: uid(), nome: 'NOREPINEFRINA 8MG/4ML', principio: '', categoria: 'Farmácia Central', fabricante: '', lote: '', quantidade: 0, minimo: 0, preco: 0, validade: '', unidadeUso: 'ml', unidadeCompra: 'ML', qtdPorCompra: 1, controlado: false, obs: 'Cód. 1064' },
    { id: uid(), nome: 'Nutralife Intensive 300G', principio: '', categoria: 'Farmácia Central', fabricante: '', lote: '', quantidade: 0, minimo: 0, preco: 0, validade: '', unidadeUso: 'un', unidadeCompra: 'UN', qtdPorCompra: 1, controlado: false, obs: 'Cód. 477' },
    { id: uid(), nome: 'NYLON PRETO 4-0 45CM', principio: '', categoria: 'Farmácia Central', fabricante: '', lote: '', quantidade: 0, minimo: 0, preco: 0, validade: '', unidadeUso: 'cx', unidadeCompra: 'CX', qtdPorCompra: 1, controlado: false, obs: 'Cód. 757' },
    { id: uid(), nome: 'NYLON PT 2-0 45CM 3/8 TRG AG 3,0CM C/24', principio: '', categoria: 'Farmácia Central', fabricante: '', lote: '', quantidade: 0, minimo: 0, preco: 0, validade: '', unidadeUso: 'cx', unidadeCompra: 'CX', qtdPorCompra: 1, controlado: false, obs: 'Cód. 758' },
    { id: uid(), nome: 'NYLON PT 3-0 45CM 3/8 TRG AG 3,0CM C/24', principio: '', categoria: 'Farmácia Central', fabricante: '', lote: '', quantidade: 0, minimo: 0, preco: 0, validade: '', unidadeUso: 'cx', unidadeCompra: 'CX', qtdPorCompra: 1, controlado: false, obs: 'Cód. 759' },
    { id: uid(), nome: 'NYLON PT 4-0 45CM 3/8 TRG AG 4,0CM', principio: '', categoria: 'Farmácia Central', fabricante: '', lote: '', quantidade: 0, minimo: 0, preco: 0, validade: '', unidadeUso: 'cx', unidadeCompra: 'CX', qtdPorCompra: 1, controlado: false, obs: 'Cód. 1042' },
    { id: uid(), nome: 'Omeprazol 125mg', principio: '', categoria: 'Farmácia Central', fabricante: '', lote: '', quantidade: 0, minimo: 0, preco: 0, validade: '', unidadeUso: 'un', unidadeCompra: 'UN', qtdPorCompra: 1, controlado: false, obs: 'Cód. 562' },
    { id: uid(), nome: 'Omeprazol Comprimidos 10mg', principio: '', categoria: 'Farmácia Central', fabricante: '', lote: '', quantidade: 0, minimo: 0, preco: 0, validade: '', unidadeUso: 'un', unidadeCompra: 'UN', qtdPorCompra: 1, controlado: false, obs: 'Cód. 538' },
    { id: uid(), nome: 'Omeprazol Sódico 40mg - Ampola 10ml', principio: '', categoria: 'Farmácia Central', fabricante: '', lote: '', quantidade: 0, minimo: 0, preco: 0, validade: '', unidadeUso: 'ml', unidadeCompra: 'ML', qtdPorCompra: 1, controlado: false, obs: 'Cód. 346' },
    { id: uid(), nome: 'Onsior 20mg/ml (Robenacoxibe)', principio: '', categoria: 'Farmácia Central', fabricante: '', lote: '', quantidade: 0, minimo: 0, preco: 0, validade: '', unidadeUso: 'un', unidadeCompra: 'UN', qtdPorCompra: 1, controlado: false, obs: 'Cód. 476' },
    { id: uid(), nome: 'Optocare colírio lubrificante 15ml', principio: '', categoria: 'Farmácia Central', fabricante: '', lote: '', quantidade: 0, minimo: 0, preco: 0, validade: '', unidadeUso: 'ml', unidadeCompra: 'UN', qtdPorCompra: 15, controlado: false, obs: 'Cód. 349' },
    { id: uid(), nome: 'Ornitil 100ml', principio: '', categoria: 'Farmácia Central', fabricante: '', lote: '', quantidade: 0, minimo: 0, preco: 0, validade: '', unidadeUso: 'ml', unidadeCompra: 'ML', qtdPorCompra: 1, controlado: false, obs: 'Cód. 347' },
    { id: uid(), nome: 'PANO - MULTIUSO - 600 PANOS - AZUL', principio: '', categoria: 'Farmácia Central', fabricante: '', lote: '', quantidade: 0, minimo: 0, preco: 0, validade: '', unidadeUso: 'un', unidadeCompra: 'UN', qtdPorCompra: 1, controlado: false, obs: 'Cód. 1006' },
    { id: uid(), nome: 'Papel-toalha Interfolhas Branca', principio: '', categoria: 'Farmácia Central', fabricante: '', lote: '', quantidade: 0, minimo: 0, preco: 0, validade: '', unidadeUso: 'un', unidadeCompra: 'UN', qtdPorCompra: 1, controlado: false, obs: 'Cód. 444' },
    { id: uid(), nome: 'Peg-Lax 8,5g', principio: '', categoria: 'Farmácia Central', fabricante: '', lote: '', quantidade: 0, minimo: 0, preco: 0, validade: '', unidadeUso: 'un', unidadeCompra: 'UN', qtdPorCompra: 1, controlado: false, obs: 'Cód. 574' },
    { id: uid(), nome: 'Peg-Lax 8,75g', principio: '', categoria: 'Farmácia Central', fabricante: '', lote: '', quantidade: 0, minimo: 0, preco: 0, validade: '', unidadeUso: 'un', unidadeCompra: 'UN', qtdPorCompra: 1, controlado: false, obs: 'Cód. 360' },
    { id: uid(), nome: 'Periogard', principio: '', categoria: 'Farmácia Central', fabricante: '', lote: '', quantidade: 0, minimo: 0, preco: 0, validade: '', unidadeUso: 'un', unidadeCompra: 'UN', qtdPorCompra: 1, controlado: false, obs: 'Cód. 450' },
    { id: uid(), nome: 'Phisio-antiodor limpador auricular 10ml', principio: '', categoria: 'Farmácia Central', fabricante: '', lote: '', quantidade: 0, minimo: 0, preco: 0, validade: '', unidadeUso: 'ml', unidadeCompra: 'UN', qtdPorCompra: 10, controlado: false, obs: 'Cód. 558' },
    { id: uid(), nome: 'Phisioderm Banho seco 50ml', principio: '', categoria: 'Farmácia Central', fabricante: '', lote: '', quantidade: 0, minimo: 0, preco: 0, validade: '', unidadeUso: 'ml', unidadeCompra: 'UN', qtdPorCompra: 50, controlado: false, obs: 'Cód. 807' },
    { id: uid(), nome: 'Phisioderm Condicionador 50ml', principio: '', categoria: 'Farmácia Central', fabricante: '', lote: '', quantidade: 0, minimo: 0, preco: 0, validade: '', unidadeUso: 'ml', unidadeCompra: 'UN', qtdPorCompra: 50, controlado: false, obs: 'Cód. 808' },
    { id: uid(), nome: 'Phisioderm Shampoo pele normal 50ml', principio: '', categoria: 'Farmácia Central', fabricante: '', lote: '', quantidade: 0, minimo: 0, preco: 0, validade: '', unidadeUso: 'ml', unidadeCompra: 'UN', qtdPorCompra: 50, controlado: false, obs: 'Cód. 809' },
    { id: uid(), nome: 'Phisioderm Shampoo pele seca 50ml', principio: '', categoria: 'Farmácia Central', fabricante: '', lote: '', quantidade: 0, minimo: 0, preco: 0, validade: '', unidadeUso: 'ml', unidadeCompra: 'UN', qtdPorCompra: 50, controlado: false, obs: 'Cód. 810' },
    { id: uid(), nome: 'Pipette Laboratório', principio: '', categoria: 'Farmácia Central', fabricante: '', lote: '', quantidade: 0, minimo: 0, preco: 0, validade: '', unidadeUso: 'un', unidadeCompra: 'UN', qtdPorCompra: 1, controlado: false, obs: 'Cód. 472' },
    { id: uid(), nome: 'POLIGLECAPRONE 0 C/AG.2,6CM 1/2 70CMC/24', principio: '', categoria: 'Farmácia Central', fabricante: '', lote: '', quantidade: 0, minimo: 0, preco: 0, validade: '', unidadeUso: 'cx', unidadeCompra: 'CX', qtdPorCompra: 1, controlado: false, obs: 'Cód. 760' },
    { id: uid(), nome: 'POLIGLECAPRONE 2-0 70CM 3/8 C/AG. 3,1CM C/24', principio: '', categoria: 'Farmácia Central', fabricante: '', lote: '', quantidade: 0, minimo: 0, preco: 0, validade: '', unidadeUso: 'un', unidadeCompra: 'UN', qtdPorCompra: 1, controlado: false, obs: 'Cód. 884' },
    { id: uid(), nome: 'POLIGLECAPRONE 2-0 C/AG. 3.0CM 1/2 70CM', principio: '', categoria: 'Farmácia Central', fabricante: '', lote: '', quantidade: 0, minimo: 0, preco: 0, validade: '', unidadeUso: 'cx', unidadeCompra: 'CX', qtdPorCompra: 1, controlado: false, obs: 'Cód. 1041' },
    { id: uid(), nome: 'POLIGLECAPRONE 3-0 70CM 3/8 AG 3,1CM C/24', principio: '', categoria: 'Farmácia Central', fabricante: '', lote: '', quantidade: 0, minimo: 0, preco: 0, validade: '', unidadeUso: 'un', unidadeCompra: 'UN', qtdPorCompra: 1, controlado: false, obs: 'Cód. 885' },
    { id: uid(), nome: 'POLIGLECAPRONE 4-0 70CM 3/8 C/AG. 3,1CM C/24', principio: '', categoria: 'Farmácia Central', fabricante: '', lote: '', quantidade: 0, minimo: 0, preco: 0, validade: '', unidadeUso: 'cx', unidadeCompra: 'CX', qtdPorCompra: 1, controlado: false, obs: 'Cód. 761' },
    { id: uid(), nome: 'Pomada Bepantol Derma 20g e 30g', principio: '', categoria: 'Farmácia Central', fabricante: '', lote: '', quantidade: 0, minimo: 0, preco: 0, validade: '', unidadeUso: 'un', unidadeCompra: 'UN', qtdPorCompra: 1, controlado: false, obs: 'Cód. 672' },
    { id: uid(), nome: 'Pomada de Lidocaína 2% 20mg/g 10g', principio: '', categoria: 'Farmácia Central', fabricante: '', lote: '', quantidade: 0, minimo: 0, preco: 0, validade: '', unidadeUso: 'un', unidadeCompra: 'UN', qtdPorCompra: 1, controlado: false, obs: 'Cód. 611' },
    { id: uid(), nome: 'PONTEIRA AMARELA BIOQUÍMICO', principio: '', categoria: 'Farmácia Central', fabricante: '', lote: '', quantidade: 0, minimo: 0, preco: 0, validade: '', unidadeUso: 'cx', unidadeCompra: 'CX', qtdPorCompra: 1, controlado: false, obs: 'Cód. 932' },
    { id: uid(), nome: 'PONTEIRA P/ MICROPIPETADORES TP PP UNIVERSAL 200 A 1000UL C/500 - AZUL', principio: '', categoria: 'Farmácia Central', fabricante: '', lote: '', quantidade: 0, minimo: 0, preco: 0, validade: '', unidadeUso: 'cx', unidadeCompra: 'CX', qtdPorCompra: 1, controlado: false, obs: 'Cód. 1075' },
    { id: uid(), nome: 'Porta Lâmina tipo Frasco 3', principio: '', categoria: 'Farmácia Central', fabricante: '', lote: '', quantidade: 0, minimo: 0, preco: 0, validade: '', unidadeUso: 'un', unidadeCompra: 'UN', qtdPorCompra: 1, controlado: false, obs: 'Cód. 520' },
    { id: uid(), nome: 'Prednisolona 20mg c/10 Comprimidos', principio: '', categoria: 'Farmácia Central', fabricante: '', lote: '', quantidade: 0, minimo: 0, preco: 0, validade: '', unidadeUso: 'un', unidadeCompra: 'UN', qtdPorCompra: 1, controlado: false, obs: 'Cód. 563' },
    { id: uid(), nome: 'Pregabalina 100mg 60ml', principio: '', categoria: 'Farmácia Central', fabricante: '', lote: '', quantidade: 0, minimo: 0, preco: 0, validade: '', unidadeUso: 'ml', unidadeCompra: 'ML', qtdPorCompra: 1, controlado: false, obs: 'Cód. 561' },
    { id: uid(), nome: 'PRN', principio: '', categoria: 'Farmácia Central', fabricante: '', lote: '', quantidade: 0, minimo: 0, preco: 0, validade: '', unidadeUso: 'un', unidadeCompra: 'UN', qtdPorCompra: 1, controlado: false, obs: 'Cód. 398' },
    { id: uid(), nome: 'Probiótico Vetnil 14g', principio: '', categoria: 'Farmácia Central', fabricante: '', lote: '', quantidade: 0, minimo: 0, preco: 0, validade: '', unidadeUso: 'un', unidadeCompra: 'UN', qtdPorCompra: 1, controlado: false, obs: 'Cód. 551' },
    { id: uid(), nome: 'Probiótico Vetnil 34g', principio: '', categoria: 'Farmácia Central', fabricante: '', lote: '', quantidade: 0, minimo: 0, preco: 0, validade: '', unidadeUso: 'un', unidadeCompra: 'UN', qtdPorCompra: 1, controlado: false, obs: 'Cód. 358' },
    { id: uid(), nome: 'Prometazina 25mg/ml 2ml', principio: '', categoria: 'Farmácia Central', fabricante: '', lote: '', quantidade: 0, minimo: 0, preco: 0, validade: '', unidadeUso: 'ml', unidadeCompra: 'UN', qtdPorCompra: 2, controlado: false, obs: 'Cód. 357' },
    { id: uid(), nome: 'PROMETAZINA 50MG/2ML', principio: '', categoria: 'Farmácia Central', fabricante: '', lote: '', quantidade: 0, minimo: 0, preco: 0, validade: '', unidadeUso: 'ml', unidadeCompra: 'ML', qtdPorCompra: 1, controlado: false, obs: 'Cód. 1065' },
    { id: uid(), nome: 'Promun defense boost cat 3ml', principio: '', categoria: 'Farmácia Central', fabricante: '', lote: '', quantidade: 0, minimo: 0, preco: 0, validade: '', unidadeUso: 'ml', unidadeCompra: 'UN', qtdPorCompra: 3, controlado: false, obs: 'Cód. 462' },
    { id: uid(), nome: 'Promun Dog 3ml', principio: '', categoria: 'Farmácia Central', fabricante: '', lote: '', quantidade: 0, minimo: 0, preco: 0, validade: '', unidadeUso: 'ml', unidadeCompra: 'UN', qtdPorCompra: 3, controlado: false, obs: 'Cód. 359' },
    { id: uid(), nome: 'PROPOFOL 10MG/ML 20ML', principio: '', categoria: 'Farmácia Central', fabricante: '', lote: '', quantidade: 0, minimo: 0, preco: 0, validade: '', unidadeUso: 'ml', unidadeCompra: 'ML', qtdPorCompra: 1, controlado: true, obs: 'Cód. 977 · CONTROLADO' },
    { id: uid(), nome: 'Propofol Frasco-ampola 20ml', principio: '', categoria: 'Farmácia Central', fabricante: '', lote: '', quantidade: 0, minimo: 0, preco: 0, validade: '', unidadeUso: 'ml', unidadeCompra: 'UN', qtdPorCompra: 20, controlado: true, obs: 'Cód. 356 · CONTROLADO' },
    { id: uid(), nome: 'Propé', principio: '', categoria: 'Farmácia Central', fabricante: '', lote: '', quantidade: 0, minimo: 0, preco: 0, validade: '', unidadeUso: 'un', unidadeCompra: 'UN', qtdPorCompra: 1, controlado: false, obs: 'Cód. 496' },
    { id: uid(), nome: 'PT - MC - TS - 5000 FOLHAS - 20G', principio: '', categoria: 'Farmácia Central', fabricante: '', lote: '', quantidade: 0, minimo: 0, preco: 0, validade: '', unidadeUso: 'un', unidadeCompra: 'UN', qtdPorCompra: 1, controlado: false, obs: 'Cód. 1007' },
    { id: uid(), nome: 'Quetamina 10% 10ml', principio: '', categoria: 'Farmácia Central', fabricante: '', lote: '', quantidade: 0, minimo: 0, preco: 0, validade: '', unidadeUso: 'ml', unidadeCompra: 'ML', qtdPorCompra: 1, controlado: false, obs: 'Cód. 478' },
    { id: uid(), nome: 'Regepil 50ml', principio: '', categoria: 'Farmácia Central', fabricante: '', lote: '', quantidade: 0, minimo: 0, preco: 0, validade: '', unidadeUso: 'ml', unidadeCompra: 'UN', qtdPorCompra: 50, controlado: false, obs: 'Cód. 560' },
    { id: uid(), nome: 'Remifentanila 2mg', principio: '', categoria: 'Farmácia Central', fabricante: '', lote: '', quantidade: 0, minimo: 0, preco: 0, validade: '', unidadeUso: 'ml', unidadeCompra: 'ML', qtdPorCompra: 1, controlado: true, obs: 'Cód. 494 · CONTROLADO' },
    { id: uid(), nome: 'Ringer Solução Lactacto 250ml', principio: '', categoria: 'Farmácia Central', fabricante: '', lote: '', quantidade: 0, minimo: 0, preco: 0, validade: '', unidadeUso: 'ml', unidadeCompra: 'UN', qtdPorCompra: 250, controlado: false, obs: 'Cód. 488' },
    { id: uid(), nome: 'Ringer Solução Lactato 500ml', principio: '', categoria: 'Farmácia Central', fabricante: '', lote: '', quantidade: 0, minimo: 0, preco: 0, validade: '', unidadeUso: 'ml', unidadeCompra: 'UN', qtdPorCompra: 500, controlado: false, obs: 'Cód. 403' },
    { id: uid(), nome: 'ROCURONIO 10MG/ML, BROMETO (CRISTALIA)', principio: '', categoria: 'Farmácia Central', fabricante: '', lote: '', quantidade: 0, minimo: 0, preco: 0, validade: '', unidadeUso: 'ml', unidadeCompra: 'ML', qtdPorCompra: 1, controlado: false, obs: 'Cód. 789' },
    { id: uid(), nome: 'RP PATA TRASEIRA TAM 7', principio: '', categoria: 'Farmácia Central', fabricante: '', lote: '', quantidade: 0, minimo: 0, preco: 0, validade: '', unidadeUso: 'un', unidadeCompra: 'UN', qtdPorCompra: 1, controlado: false, obs: 'Cód. 893' },
    { id: uid(), nome: 'SABONETE - PREMISSE - ERVA DOCE - 5/LT', principio: '', categoria: 'Farmácia Central', fabricante: '', lote: '', quantidade: 0, minimo: 0, preco: 0, validade: '', unidadeUso: 'un', unidadeCompra: 'UN', qtdPorCompra: 1, controlado: false, obs: 'Cód. 1005' },
    { id: uid(), nome: 'SACO LIXO 40 L - BRANCO - PC/ COM 100 UND', principio: '', categoria: 'Farmácia Central', fabricante: '', lote: '', quantidade: 0, minimo: 0, preco: 0, validade: '', unidadeUso: 'pc', unidadeCompra: 'PC', qtdPorCompra: 1, controlado: false, obs: 'Cód. 955' },
    { id: uid(), nome: 'SACO LIXO 60 L - PRETO - PC/ COM 100 UND', principio: '', categoria: 'Farmácia Central', fabricante: '', lote: '', quantidade: 0, minimo: 0, preco: 0, validade: '', unidadeUso: 'pc', unidadeCompra: 'PC', qtdPorCompra: 1, controlado: false, obs: 'Cód. 952' },
    { id: uid(), nome: 'Same 1080mg 120cap', principio: '', categoria: 'Farmácia Central', fabricante: '', lote: '', quantidade: 0, minimo: 0, preco: 0, validade: '', unidadeUso: 'un', unidadeCompra: 'UN', qtdPorCompra: 1, controlado: false, obs: 'Cód. 811' },
    { id: uid(), nome: 'Same 167,2mg/ml 150ml', principio: '', categoria: 'Farmácia Central', fabricante: '', lote: '', quantidade: 0, minimo: 0, preco: 0, validade: '', unidadeUso: 'ml', unidadeCompra: 'UN', qtdPorCompra: 150, controlado: false, obs: 'Cód. 645' },
    { id: uid(), nome: 'Same 90mg 30cap', principio: '', categoria: 'Farmácia Central', fabricante: '', lote: '', quantidade: 0, minimo: 0, preco: 0, validade: '', unidadeUso: 'un', unidadeCompra: 'UN', qtdPorCompra: 1, controlado: false, obs: 'Cód. 646' },
    { id: uid(), nome: 'Sedanew (Xilazina) 2% 50ml', principio: '', categoria: 'Farmácia Central', fabricante: '', lote: '', quantidade: 0, minimo: 0, preco: 0, validade: '', unidadeUso: 'ml', unidadeCompra: 'ML', qtdPorCompra: 1, controlado: false, obs: 'Cód. 363' },
    { id: uid(), nome: 'Seringa 10ml', principio: '', categoria: 'Farmácia Central', fabricante: '', lote: '', quantidade: 0, minimo: 0, preco: 0, validade: '', unidadeUso: 'ml', unidadeCompra: 'UN', qtdPorCompra: 10, controlado: false, obs: 'Cód. 426' },
    { id: uid(), nome: 'Seringa 1ml', principio: '', categoria: 'Farmácia Central', fabricante: '', lote: '', quantidade: 0, minimo: 0, preco: 0, validade: '', unidadeUso: 'ml', unidadeCompra: 'UN', qtdPorCompra: 1, controlado: false, obs: 'Cód. 423' },
    { id: uid(), nome: 'Seringa 20ml', principio: '', categoria: 'Farmácia Central', fabricante: '', lote: '', quantidade: 0, minimo: 0, preco: 0, validade: '', unidadeUso: 'ml', unidadeCompra: 'UN', qtdPorCompra: 20, controlado: false, obs: 'Cód. 427' },
    { id: uid(), nome: 'Seringa 3ml', principio: '', categoria: 'Farmácia Central', fabricante: '', lote: '', quantidade: 0, minimo: 0, preco: 0, validade: '', unidadeUso: 'ml', unidadeCompra: 'UN', qtdPorCompra: 3, controlado: false, obs: 'Cód. 424' },
    { id: uid(), nome: 'Seringa 5ml', principio: '', categoria: 'Farmácia Central', fabricante: '', lote: '', quantidade: 0, minimo: 0, preco: 0, validade: '', unidadeUso: 'ml', unidadeCompra: 'UN', qtdPorCompra: 5, controlado: false, obs: 'Cód. 425' },
    { id: uid(), nome: 'Silimarina 1620mg 120cap', principio: '', categoria: 'Farmácia Central', fabricante: '', lote: '', quantidade: 0, minimo: 0, preco: 0, validade: '', unidadeUso: 'un', unidadeCompra: 'UN', qtdPorCompra: 1, controlado: false, obs: 'Cód. 813' },
    { id: uid(), nome: 'Silimarina 1900mg 300ml', principio: '', categoria: 'Farmácia Central', fabricante: '', lote: '', quantidade: 0, minimo: 0, preco: 0, validade: '', unidadeUso: 'ml', unidadeCompra: 'UN', qtdPorCompra: 300, controlado: false, obs: 'Cód. 812' },
    { id: uid(), nome: 'Silimarina 300mg 180ml', principio: '', categoria: 'Farmácia Central', fabricante: '', lote: '', quantidade: 0, minimo: 0, preco: 0, validade: '', unidadeUso: 'ml', unidadeCompra: 'UN', qtdPorCompra: 180, controlado: false, obs: 'Cód. 575' },
    { id: uid(), nome: 'Simeticona (Luftal) 75mg/ml 15ml', principio: '', categoria: 'Farmácia Central', fabricante: '', lote: '', quantidade: 0, minimo: 0, preco: 0, validade: '', unidadeUso: 'ml', unidadeCompra: 'ML', qtdPorCompra: 1, controlado: false, obs: 'Cód. 316' },
    { id: uid(), nome: 'Solução Digliconato Vermelho 1L 0,5%', principio: '', categoria: 'Farmácia Central', fabricante: '', lote: '', quantidade: 0, minimo: 0, preco: 0, validade: '', unidadeUso: 'un', unidadeCompra: 'UN', qtdPorCompra: 1, controlado: false, obs: 'Cód. 436' },
    { id: uid(), nome: 'SONDA END.C/BL 7,5MM COMPER', principio: '', categoria: 'Farmácia Central', fabricante: '', lote: '', quantidade: 0, minimo: 0, preco: 0, validade: '', unidadeUso: 'pc', unidadeCompra: 'PC', qtdPorCompra: 1, controlado: false, obs: 'Cód. 782' },
    { id: uid(), nome: 'Sonda Endotraqueal 2.0 S/ Balão', principio: '', categoria: 'Farmácia Central', fabricante: '', lote: '', quantidade: 0, minimo: 0, preco: 0, validade: '', unidadeUso: 'cx', unidadeCompra: 'CX', qtdPorCompra: 1, controlado: false, obs: 'Cód. 911' },
    { id: uid(), nome: 'Sonda Endotraqueal 2.5', principio: '', categoria: 'Farmácia Central', fabricante: '', lote: '', quantidade: 0, minimo: 0, preco: 0, validade: '', unidadeUso: 'un', unidadeCompra: 'UN', qtdPorCompra: 1, controlado: false, obs: 'Cód. 406' },
    { id: uid(), nome: 'Sonda Endotraqueal 3.0', principio: '', categoria: 'Farmácia Central', fabricante: '', lote: '', quantidade: 0, minimo: 0, preco: 0, validade: '', unidadeUso: 'un', unidadeCompra: 'UN', qtdPorCompra: 1, controlado: false, obs: 'Cód. 644' },
    { id: uid(), nome: 'Sonda Endotraqueal 3.5', principio: '', categoria: 'Farmácia Central', fabricante: '', lote: '', quantidade: 0, minimo: 0, preco: 0, validade: '', unidadeUso: 'un', unidadeCompra: 'UN', qtdPorCompra: 1, controlado: false, obs: 'Cód. 407' },
    { id: uid(), nome: 'Sonda Endotraqueal 4.0', principio: '', categoria: 'Farmácia Central', fabricante: '', lote: '', quantidade: 0, minimo: 0, preco: 0, validade: '', unidadeUso: 'un', unidadeCompra: 'UN', qtdPorCompra: 1, controlado: false, obs: 'Cód. 408' },
    { id: uid(), nome: 'Sonda Endotraqueal 4.5', principio: '', categoria: 'Farmácia Central', fabricante: '', lote: '', quantidade: 0, minimo: 0, preco: 0, validade: '', unidadeUso: 'un', unidadeCompra: 'UN', qtdPorCompra: 1, controlado: false, obs: 'Cód. 409' },
    { id: uid(), nome: 'Sonda Endotraqueal 5.0', principio: '', categoria: 'Farmácia Central', fabricante: '', lote: '', quantidade: 0, minimo: 0, preco: 0, validade: '', unidadeUso: 'un', unidadeCompra: 'UN', qtdPorCompra: 1, controlado: false, obs: 'Cód. 410' },
    { id: uid(), nome: 'Sonda Endotraqueal 5.5', principio: '', categoria: 'Farmácia Central', fabricante: '', lote: '', quantidade: 0, minimo: 0, preco: 0, validade: '', unidadeUso: 'un', unidadeCompra: 'UN', qtdPorCompra: 1, controlado: false, obs: 'Cód. 555' },
    { id: uid(), nome: 'Sonda Endotraqueal 6.0', principio: '', categoria: 'Farmácia Central', fabricante: '', lote: '', quantidade: 0, minimo: 0, preco: 0, validade: '', unidadeUso: 'un', unidadeCompra: 'UN', qtdPorCompra: 1, controlado: false, obs: 'Cód. 640' },
    { id: uid(), nome: 'Sonda Endotraqueal 6.5', principio: '', categoria: 'Farmácia Central', fabricante: '', lote: '', quantidade: 0, minimo: 0, preco: 0, validade: '', unidadeUso: 'un', unidadeCompra: 'UN', qtdPorCompra: 1, controlado: false, obs: 'Cód. 604' },
    { id: uid(), nome: 'Sonda Endotraqueal 7.0', principio: '', categoria: 'Farmácia Central', fabricante: '', lote: '', quantidade: 0, minimo: 0, preco: 0, validade: '', unidadeUso: 'un', unidadeCompra: 'UN', qtdPorCompra: 1, controlado: false, obs: 'Cód. 411' },
    { id: uid(), nome: 'Sonda Endotraqueal 7.5', principio: '', categoria: 'Farmácia Central', fabricante: '', lote: '', quantidade: 0, minimo: 0, preco: 0, validade: '', unidadeUso: 'un', unidadeCompra: 'UN', qtdPorCompra: 1, controlado: false, obs: 'Cód. 412' },
    { id: uid(), nome: 'Sonda Endotraqueal 8.0', principio: '', categoria: 'Farmácia Central', fabricante: '', lote: '', quantidade: 0, minimo: 0, preco: 0, validade: '', unidadeUso: 'un', unidadeCompra: 'UN', qtdPorCompra: 1, controlado: false, obs: 'Cód. 568' },
    { id: uid(), nome: 'Sonda Endotraqueal 8.5', principio: '', categoria: 'Farmácia Central', fabricante: '', lote: '', quantidade: 0, minimo: 0, preco: 0, validade: '', unidadeUso: 'un', unidadeCompra: 'UN', qtdPorCompra: 1, controlado: false, obs: 'Cód. 413' },
    { id: uid(), nome: 'Sonda Endotraqueal 9.0', principio: '', categoria: 'Farmácia Central', fabricante: '', lote: '', quantidade: 0, minimo: 0, preco: 0, validade: '', unidadeUso: 'un', unidadeCompra: 'UN', qtdPorCompra: 1, controlado: false, obs: 'Cód. 414' },
    { id: uid(), nome: 'Sonda Endotraqueal 9.5', principio: '', categoria: 'Farmácia Central', fabricante: '', lote: '', quantidade: 0, minimo: 0, preco: 0, validade: '', unidadeUso: 'un', unidadeCompra: 'UN', qtdPorCompra: 1, controlado: false, obs: 'Cód. 415' },
    { id: uid(), nome: 'SONDA FOLEY 2 VIAS N.12', principio: '', categoria: 'Farmácia Central', fabricante: '', lote: '', quantidade: 0, minimo: 0, preco: 0, validade: '', unidadeUso: 'pct', unidadeCompra: 'PCT', qtdPorCompra: 1, controlado: false, obs: 'Cód. 1046' },
    { id: uid(), nome: 'SONDA FOLEY LATEX 2 VIAS N 14 BALAO 30ML', principio: '', categoria: 'Farmácia Central', fabricante: '', lote: '', quantidade: 0, minimo: 0, preco: 0, validade: '', unidadeUso: 'ml', unidadeCompra: 'UN', qtdPorCompra: 30, controlado: false, obs: 'Cód. 713' },
    { id: uid(), nome: 'SONDA FOLEY LATEX 2 VIAS N 16 BALAO 30ML', principio: '', categoria: 'Farmácia Central', fabricante: '', lote: '', quantidade: 0, minimo: 0, preco: 0, validade: '', unidadeUso: 'ml', unidadeCompra: 'UN', qtdPorCompra: 30, controlado: false, obs: 'Cód. 752' },
    { id: uid(), nome: 'SONDA FOLEY LATEX 2 VIAS N 18 BALAO 30ML', principio: '', categoria: 'Farmácia Central', fabricante: '', lote: '', quantidade: 0, minimo: 0, preco: 0, validade: '', unidadeUso: 'ml', unidadeCompra: 'UN', qtdPorCompra: 30, controlado: false, obs: 'Cód. 714' },
    { id: uid(), nome: 'SONDA FOLEY LATEX 2 VIAS N 20 BALAO 30ML', principio: '', categoria: 'Farmácia Central', fabricante: '', lote: '', quantidade: 0, minimo: 0, preco: 0, validade: '', unidadeUso: 'ml', unidadeCompra: 'UN', qtdPorCompra: 30, controlado: false, obs: 'Cód. 715' },
    { id: uid(), nome: 'Sonda Naso Curta N08', principio: '', categoria: 'Farmácia Central', fabricante: '', lote: '', quantidade: 0, minimo: 0, preco: 0, validade: '', unidadeUso: 'un', unidadeCompra: 'UN', qtdPorCompra: 1, controlado: false, obs: 'Cód. 616' },
    { id: uid(), nome: 'Sonda Naso Curta N10', principio: '', categoria: 'Farmácia Central', fabricante: '', lote: '', quantidade: 0, minimo: 0, preco: 0, validade: '', unidadeUso: 'un', unidadeCompra: 'UN', qtdPorCompra: 1, controlado: false, obs: 'Cód. 866' },
    { id: uid(), nome: 'Sonda Naso Curta N14', principio: '', categoria: 'Farmácia Central', fabricante: '', lote: '', quantidade: 0, minimo: 0, preco: 0, validade: '', unidadeUso: 'un', unidadeCompra: 'UN', qtdPorCompra: 1, controlado: false, obs: 'Cód. 867' },
    { id: uid(), nome: 'SONDA NASO LONGA N06', principio: '', categoria: 'Farmácia Central', fabricante: '', lote: '', quantidade: 0, minimo: 0, preco: 0, validade: '', unidadeUso: 'pct', unidadeCompra: 'PCT', qtdPorCompra: 1, controlado: false, obs: 'Cód. 1068' },
    { id: uid(), nome: 'Sonda Naso Longa N08', principio: '', categoria: 'Farmácia Central', fabricante: '', lote: '', quantidade: 0, minimo: 0, preco: 0, validade: '', unidadeUso: 'un', unidadeCompra: 'UN', qtdPorCompra: 1, controlado: false, obs: 'Cód. 576' },
    { id: uid(), nome: 'Sonda Naso Longa N10', principio: '', categoria: 'Farmácia Central', fabricante: '', lote: '', quantidade: 0, minimo: 0, preco: 0, validade: '', unidadeUso: 'un', unidadeCompra: 'UN', qtdPorCompra: 1, controlado: false, obs: 'Cód. 417' },
    { id: uid(), nome: 'Sonda Naso N04', principio: '', categoria: 'Farmácia Central', fabricante: '', lote: '', quantidade: 0, minimo: 0, preco: 0, validade: '', unidadeUso: 'un', unidadeCompra: 'UN', qtdPorCompra: 1, controlado: false, obs: 'Cód. 416' },
    { id: uid(), nome: 'Sonda Naso N06', principio: '', categoria: 'Farmácia Central', fabricante: '', lote: '', quantidade: 0, minimo: 0, preco: 0, validade: '', unidadeUso: 'un', unidadeCompra: 'UN', qtdPorCompra: 1, controlado: false, obs: 'Cód. 566' },
    { id: uid(), nome: 'Sonda Naso N14', principio: '', categoria: 'Farmácia Central', fabricante: '', lote: '', quantidade: 0, minimo: 0, preco: 0, validade: '', unidadeUso: 'un', unidadeCompra: 'UN', qtdPorCompra: 1, controlado: false, obs: 'Cód. 419' },
    { id: uid(), nome: 'Sonda Nasogastrica Longa N12', principio: '', categoria: 'Farmácia Central', fabricante: '', lote: '', quantidade: 0, minimo: 0, preco: 0, validade: '', unidadeUso: 'un', unidadeCompra: 'UN', qtdPorCompra: 1, controlado: false, obs: 'Cód. 418' },
    { id: uid(), nome: 'Sonda Uretral N04', principio: '', categoria: 'Farmácia Central', fabricante: '', lote: '', quantidade: 0, minimo: 0, preco: 0, validade: '', unidadeUso: 'un', unidadeCompra: 'UN', qtdPorCompra: 1, controlado: false, obs: 'Cód. 420' },
    { id: uid(), nome: 'Sonda Uretral N10', principio: '', categoria: 'Farmácia Central', fabricante: '', lote: '', quantidade: 0, minimo: 0, preco: 0, validade: '', unidadeUso: 'un', unidadeCompra: 'UN', qtdPorCompra: 1, controlado: false, obs: 'Cód. 421' },
    { id: uid(), nome: 'SONDA URETRAL N18', principio: '', categoria: 'Farmácia Central', fabricante: '', lote: '', quantidade: 0, minimo: 0, preco: 0, validade: '', unidadeUso: 'pct', unidadeCompra: 'PCT', qtdPorCompra: 1, controlado: false, obs: 'Cód. 1069' },
    { id: uid(), nome: 'Sonda Uretral N6', principio: '', categoria: 'Farmácia Central', fabricante: '', lote: '', quantidade: 0, minimo: 0, preco: 0, validade: '', unidadeUso: 'un', unidadeCompra: 'UN', qtdPorCompra: 1, controlado: false, obs: 'Cód. 641' },
    { id: uid(), nome: 'Sonda Uretral N8', principio: '', categoria: 'Farmácia Central', fabricante: '', lote: '', quantidade: 0, minimo: 0, preco: 0, validade: '', unidadeUso: 'un', unidadeCompra: 'UN', qtdPorCompra: 1, controlado: false, obs: 'Cód. 466' },
    { id: uid(), nome: 'Soro antiofídico 50ml 1 kit tratamento polivalente', principio: '', categoria: 'Farmácia Central', fabricante: '', lote: '', quantidade: 0, minimo: 0, preco: 0, validade: '', unidadeUso: 'ml', unidadeCompra: 'UN', qtdPorCompra: 50, controlado: false, obs: 'Cód. 374' },
    { id: uid(), nome: 'Soro Fisiológico 100ml', principio: '', categoria: 'Farmácia Central', fabricante: '', lote: '', quantidade: 0, minimo: 0, preco: 0, validade: '', unidadeUso: 'ml', unidadeCompra: 'UN', qtdPorCompra: 100, controlado: false, obs: 'Cód. 404' },
    { id: uid(), nome: 'Soro Fisiológico 500ml', principio: '', categoria: 'Farmácia Central', fabricante: '', lote: '', quantidade: 0, minimo: 0, preco: 0, validade: '', unidadeUso: 'ml', unidadeCompra: 'UN', qtdPorCompra: 500, controlado: false, obs: 'Cód. 405' },
    { id: uid(), nome: 'Still Colírio 0,1% 5ml', principio: '', categoria: 'Farmácia Central', fabricante: '', lote: '', quantidade: 0, minimo: 0, preco: 0, validade: '', unidadeUso: 'ml', unidadeCompra: 'UN', qtdPorCompra: 5, controlado: false, obs: 'Cód. 448' },
    { id: uid(), nome: 'Stomorgyl 10', principio: '', categoria: 'Farmácia Central', fabricante: '', lote: '', quantidade: 0, minimo: 0, preco: 0, validade: '', unidadeUso: 'un', unidadeCompra: 'UN', qtdPorCompra: 1, controlado: false, obs: 'Cód. 480' },
    { id: uid(), nome: 'Stomorgyl 2', principio: '', categoria: 'Farmácia Central', fabricante: '', lote: '', quantidade: 0, minimo: 0, preco: 0, validade: '', unidadeUso: 'un', unidadeCompra: 'UN', qtdPorCompra: 1, controlado: false, obs: 'Cód. 479' },
    { id: uid(), nome: 'Sucralfato 2g/10ml', principio: '', categoria: 'Farmácia Central', fabricante: '', lote: '', quantidade: 0, minimo: 0, preco: 0, validade: '', unidadeUso: 'ml', unidadeCompra: 'ML', qtdPorCompra: 1, controlado: false, obs: 'Cód. 372' },
    { id: uid(), nome: 'Sulbactam Sódico + Ampicilina Sódica 0,5g + 1g', principio: '', categoria: 'Farmácia Central', fabricante: '', lote: '', quantidade: 0, minimo: 0, preco: 0, validade: '', unidadeUso: 'ml', unidadeCompra: 'ML', qtdPorCompra: 1, controlado: false, obs: 'Cód. 524' },
    { id: uid(), nome: 'Sulfato de Atropina Monoidratada 0.25mg/ml 1ml', principio: '', categoria: 'Farmácia Central', fabricante: '', lote: '', quantidade: 0, minimo: 0, preco: 0, validade: '', unidadeUso: 'ml', unidadeCompra: 'UN', qtdPorCompra: 1, controlado: false, obs: 'Cód. 310' },
    { id: uid(), nome: 'Sulfato de bário 100% 1g/ml 150ml', principio: '', categoria: 'Farmácia Central', fabricante: '', lote: '', quantidade: 0, minimo: 0, preco: 0, validade: '', unidadeUso: 'ml', unidadeCompra: 'UN', qtdPorCompra: 150, controlado: false, obs: 'Cód. 655' },
    { id: uid(), nome: 'Sulfato de Efedrina 50mg/ml 1ml', principio: '', categoria: 'Farmácia Central', fabricante: '', lote: '', quantidade: 0, minimo: 0, preco: 0, validade: '', unidadeUso: 'ml', unidadeCompra: 'UN', qtdPorCompra: 1, controlado: true, obs: 'Cód. 491 · CONTROLADO' },
    { id: uid(), nome: 'Sulfato de Magnésio 10% 10ml', principio: '', categoria: 'Farmácia Central', fabricante: '', lote: '', quantidade: 0, minimo: 0, preco: 0, validade: '', unidadeUso: 'ml', unidadeCompra: 'UN', qtdPorCompra: 10, controlado: false, obs: 'Cód. 526' },
    { id: uid(), nome: 'Sulfato de Morfina pentahidratado 10mg/ml 1ml', principio: '', categoria: 'Farmácia Central', fabricante: '', lote: '', quantidade: 0, minimo: 0, preco: 0, validade: '', unidadeUso: 'ml', unidadeCompra: 'UN', qtdPorCompra: 1, controlado: true, obs: 'Cód. 493 · CONTROLADO' },
    { id: uid(), nome: 'Sulfato de terbutalina 0,5mg/ml 1ml', principio: '', categoria: 'Farmácia Central', fabricante: '', lote: '', quantidade: 0, minimo: 0, preco: 0, validade: '', unidadeUso: 'ml', unidadeCompra: 'UN', qtdPorCompra: 1, controlado: false, obs: 'Cód. 780' },
    { id: uid(), nome: 'Swab Estéril p/coleta', principio: '', categoria: 'Farmácia Central', fabricante: '', lote: '', quantidade: 0, minimo: 0, preco: 0, validade: '', unidadeUso: 'un', unidadeCompra: 'UN', qtdPorCompra: 1, controlado: false, obs: 'Cód. 516' },
    { id: uid(), nome: 'Swab Estéril Ponta Rayon c/meio Stuart', principio: '', categoria: 'Farmácia Central', fabricante: '', lote: '', quantidade: 0, minimo: 0, preco: 0, validade: '', unidadeUso: 'un', unidadeCompra: 'UN', qtdPorCompra: 1, controlado: false, obs: 'Cód. 517' },
    { id: uid(), nome: 'TAMPA LUER C/ MEMBRANA C/250 (BM)', principio: '', categoria: 'Farmácia Central', fabricante: '', lote: '', quantidade: 0, minimo: 0, preco: 0, validade: '', unidadeUso: 'cx', unidadeCompra: 'CX', qtdPorCompra: 1, controlado: false, obs: 'Cód. 736' },
    { id: uid(), nome: 'Tapete Higiênico', principio: '', categoria: 'Farmácia Central', fabricante: '', lote: '', quantidade: 0, minimo: 0, preco: 0, validade: '', unidadeUso: 'un', unidadeCompra: 'UN', qtdPorCompra: 1, controlado: false, obs: 'Cód. 428' },
    { id: uid(), nome: 'TB CAN ND TROPICAL ADT MD/MX FGO 20KG', principio: '', categoria: 'Farmácia Central', fabricante: '', lote: '', quantidade: 0, minimo: 0, preco: 0, validade: '', unidadeUso: 'sc', unidadeCompra: 'SC', qtdPorCompra: 1, controlado: false, obs: 'Cód. 1062' },
    { id: uid(), nome: 'TB ND ANCESTRAL FEL ADT FRANGO 10,1KG', principio: '', categoria: 'Farmácia Central', fabricante: '', lote: '', quantidade: 0, minimo: 0, preco: 0, validade: '', unidadeUso: 'sc', unidadeCompra: 'SC', qtdPorCompra: 1, controlado: false, obs: 'Cód. 1061' },
    { id: uid(), nome: 'Tela protésica  26cm x 36cm', principio: '', categoria: 'Farmácia Central', fabricante: '', lote: '', quantidade: 0, minimo: 0, preco: 0, validade: '', unidadeUso: 'un', unidadeCompra: 'UN', qtdPorCompra: 1, controlado: false, obs: 'Cód. 1021' },
    { id: uid(), nome: 'Tela protésica 10cm x 10cm', principio: '', categoria: 'Farmácia Central', fabricante: '', lote: '', quantidade: 0, minimo: 0, preco: 0, validade: '', unidadeUso: 'un', unidadeCompra: 'UN', qtdPorCompra: 1, controlado: false, obs: 'Cód. 1022' },
    { id: uid(), nome: 'Teofilina', principio: '', categoria: 'Farmácia Central', fabricante: '', lote: '', quantidade: 0, minimo: 0, preco: 0, validade: '', unidadeUso: 'ml', unidadeCompra: 'ML', qtdPorCompra: 1, controlado: false, obs: 'Cód. 656' },
    { id: uid(), nome: 'Tiras de Fluoresceína 10 pares', principio: '', categoria: 'Farmácia Central', fabricante: '', lote: '', quantidade: 0, minimo: 0, preco: 0, validade: '', unidadeUso: 'un', unidadeCompra: 'UN', qtdPorCompra: 1, controlado: false, obs: 'Cód. 328' },
    { id: uid(), nome: 'Tiras de Schirmer 10 pares', principio: '', categoria: 'Farmácia Central', fabricante: '', lote: '', quantidade: 0, minimo: 0, preco: 0, validade: '', unidadeUso: 'un', unidadeCompra: 'UN', qtdPorCompra: 1, controlado: false, obs: 'Cód. 329' },
    { id: uid(), nome: 'TIRAS ON CALL PLUS II C/50 (P.V.C)', principio: '', categoria: 'Farmácia Central', fabricante: '', lote: '', quantidade: 0, minimo: 0, preco: 0, validade: '', unidadeUso: 'cx', unidadeCompra: 'CX', qtdPorCompra: 1, controlado: false, obs: 'Cód. 971' },
    { id: uid(), nome: 'Tobradex 3ml', principio: '', categoria: 'Farmácia Central', fabricante: '', lote: '', quantidade: 0, minimo: 0, preco: 0, validade: '', unidadeUso: 'ml', unidadeCompra: 'UN', qtdPorCompra: 3, controlado: false, obs: 'Cód. 366' },
    { id: uid(), nome: 'Tobramicina Colírio 5ml', principio: '', categoria: 'Farmácia Central', fabricante: '', lote: '', quantidade: 0, minimo: 0, preco: 0, validade: '', unidadeUso: 'ml', unidadeCompra: 'UN', qtdPorCompra: 5, controlado: false, obs: 'Cód. 449' },
    { id: uid(), nome: 'Torneira 3 Vias', principio: '', categoria: 'Farmácia Central', fabricante: '', lote: '', quantidade: 0, minimo: 0, preco: 0, validade: '', unidadeUso: 'un', unidadeCompra: 'UN', qtdPorCompra: 1, controlado: false, obs: 'Cód. 391' },
    { id: uid(), nome: 'Touca Descartável', principio: '', categoria: 'Farmácia Central', fabricante: '', lote: '', quantidade: 0, minimo: 0, preco: 0, validade: '', unidadeUso: 'un', unidadeCompra: 'UN', qtdPorCompra: 1, controlado: false, obs: 'Cód. 499' },
    { id: uid(), nome: 'TRAMADOL 100MG/2ML', principio: '', categoria: 'Farmácia Central', fabricante: '', lote: '', quantidade: 0, minimo: 0, preco: 0, validade: '', unidadeUso: 'ml', unidadeCompra: 'UN', qtdPorCompra: 2, controlado: true, obs: 'Cód. 905 · CONTROLADO' },
    { id: uid(), nome: 'Tramadol 50mg/ml 2ml', principio: '', categoria: 'Farmácia Central', fabricante: '', lote: '', quantidade: 0, minimo: 0, preco: 0, validade: '', unidadeUso: 'ml', unidadeCompra: 'UN', qtdPorCompra: 2, controlado: true, obs: 'Cód. 367 · CONTROLADO' },
    { id: uid(), nome: 'Tramadol Oral (Nulli) 10ml', principio: '', categoria: 'Farmácia Central', fabricante: '', lote: '', quantidade: 0, minimo: 0, preco: 0, validade: '', unidadeUso: 'ml', unidadeCompra: 'UN', qtdPorCompra: 10, controlado: true, obs: 'Cód. 371 · CONTROLADO' },
    { id: uid(), nome: 'Transamin 50mg/ml 5ml', principio: '', categoria: 'Farmácia Central', fabricante: '', lote: '', quantidade: 0, minimo: 0, preco: 0, validade: '', unidadeUso: 'ml', unidadeCompra: 'UN', qtdPorCompra: 5, controlado: false, obs: 'Cód. 368' },
    { id: uid(), nome: 'Tubo Bioquímico 0,5ml', principio: '', categoria: 'Farmácia Central', fabricante: '', lote: '', quantidade: 0, minimo: 0, preco: 0, validade: '', unidadeUso: 'ml', unidadeCompra: 'UN', qtdPorCompra: 0.5, controlado: false, obs: 'Cód. 508' },
    { id: uid(), nome: 'Tubo Bioquímico 4ml', principio: '', categoria: 'Farmácia Central', fabricante: '', lote: '', quantidade: 0, minimo: 0, preco: 0, validade: '', unidadeUso: 'ml', unidadeCompra: 'UN', qtdPorCompra: 4, controlado: false, obs: 'Cód. 509' },
    { id: uid(), nome: 'Tubo Hemograma 0,5ml', principio: '', categoria: 'Farmácia Central', fabricante: '', lote: '', quantidade: 0, minimo: 0, preco: 0, validade: '', unidadeUso: 'ml', unidadeCompra: 'UN', qtdPorCompra: 0.5, controlado: false, obs: 'Cód. 507' },
    { id: uid(), nome: 'Tubo Hemograma 4ml', principio: '', categoria: 'Farmácia Central', fabricante: '', lote: '', quantidade: 0, minimo: 0, preco: 0, validade: '', unidadeUso: 'ml', unidadeCompra: 'UN', qtdPorCompra: 4, controlado: false, obs: 'Cód. 506' },
    { id: uid(), nome: 'Tubo para Coleta de Sangue a vácuo', principio: '', categoria: 'Farmácia Central', fabricante: '', lote: '', quantidade: 0, minimo: 0, preco: 0, validade: '', unidadeUso: 'un', unidadeCompra: 'UN', qtdPorCompra: 1, controlado: false, obs: 'Cód. 505' },
    { id: uid(), nome: 'Vasopressina 20 U/ml 1ml', principio: '', categoria: 'Farmácia Central', fabricante: '', lote: '', quantidade: 0, minimo: 0, preco: 0, validade: '', unidadeUso: 'ml', unidadeCompra: 'UN', qtdPorCompra: 1, controlado: false, obs: 'Cód. 492' },
    { id: uid(), nome: 'Vetaglós pomada 50g', principio: '', categoria: 'Farmácia Central', fabricante: '', lote: '', quantidade: 0, minimo: 0, preco: 0, validade: '', unidadeUso: 'un', unidadeCompra: 'UN', qtdPorCompra: 1, controlado: false, obs: 'Cód. 362' },
    { id: uid(), nome: 'Vetmax Plus Suspensão 30ml', principio: '', categoria: 'Farmácia Central', fabricante: '', lote: '', quantidade: 0, minimo: 0, preco: 0, validade: '', unidadeUso: 'ml', unidadeCompra: 'UN', qtdPorCompra: 30, controlado: false, obs: 'Cód. 370' },
    { id: uid(), nome: 'VICRYL 3-0 70CM 3/8 CIL AG 3,0CM C/36 (AP. DIGEST)', principio: '', categoria: 'Farmácia Central', fabricante: '', lote: '', quantidade: 0, minimo: 0, preco: 0, validade: '', unidadeUso: 'cx', unidadeCompra: 'CX', qtdPorCompra: 1, controlado: false, obs: 'Cód. 762' },
    { id: uid(), nome: 'Vitamina C 20ml', principio: '', categoria: 'Farmácia Central', fabricante: '', lote: '', quantidade: 0, minimo: 0, preco: 0, validade: '', unidadeUso: 'ml', unidadeCompra: 'UN', qtdPorCompra: 20, controlado: false, obs: 'Cód. 365' },
    { id: uid(), nome: 'Vitamina K 10mg/ml 1ml', principio: '', categoria: 'Farmácia Central', fabricante: '', lote: '', quantidade: 0, minimo: 0, preco: 0, validade: '', unidadeUso: 'ml', unidadeCompra: 'ML', qtdPorCompra: 1, controlado: false, obs: 'Cód. 373' },
    { id: uid(), nome: 'Wanpy Churu gato', principio: '', categoria: 'Farmácia Central', fabricante: '', lote: '', quantidade: 0, minimo: 0, preco: 0, validade: '', unidadeUso: 'un', unidadeCompra: 'UN', qtdPorCompra: 1, controlado: false, obs: 'Cód. 879' },
    { id: uid(), nome: 'Água Oxigenada 1L 10V', principio: '', categoria: 'Farmácia Central', fabricante: '', lote: '', quantidade: 0, minimo: 0, preco: 0, validade: '', unidadeUso: 'un', unidadeCompra: 'UN', qtdPorCompra: 1, controlado: false, obs: 'Cód. 437' },
    { id: uid(), nome: 'Óleo de Girassol 200ml', principio: '', categoria: 'Farmácia Central', fabricante: '', lote: '', quantidade: 0, minimo: 0, preco: 0, validade: '', unidadeUso: 'ml', unidadeCompra: 'UN', qtdPorCompra: 200, controlado: false, obs: 'Cód. 610' },
    { id: uid(), nome: 'Óleo Mineral 100% 100ml', principio: '', categoria: 'Farmácia Central', fabricante: '', lote: '', quantidade: 0, minimo: 0, preco: 0, validade: '', unidadeUso: 'ml', unidadeCompra: 'UN', qtdPorCompra: 100, controlado: false, obs: 'Cód. 350' },
  ];
}

function seedMoves() {
  return [];
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
      <td class="num"><strong>${m.quantidade}</strong> ${esc(m.unidadeUso || 'un')}</td>
      <td>${m.validade ? `<span class="${valClass}">${fmtDate(m.validade)}</span>` : '—'}</td>
      <td class="num">${brl(m.preco)}</td>
      <td><span class="tag ${s.key}">${s.label}</span> ${m.controlado ? '<span class="tag controlado">Controlado</span>' : ''}</td>
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
      <td class="num"><strong>${mv.tipo === 'entrada' ? '+' : '−'}${mv.qtd} ${esc(mv.unidade || 'un')}</strong></td>
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
      <td class="num"><strong>${mv.tipo === 'entrada' ? '+' : '−'}${mv.qtd} ${esc(mv.unidade || 'un')}</strong></td>
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
    { title: '🔴 Vencidos', items: vencidos, cls: 'r', desc: (m) => `Venceu em ${fmtDate(m.validade)} • ${m.quantidade} ${m.unidadeUso || 'un'} — retirar do estoque` },
    { title: '🚫 Sem estoque', items: semEstoque, cls: 'r', desc: (m) => `Estoque zerado • mínimo ${m.minimo || 0} ${m.unidadeUso || 'un'}` },
    { title: '🟠 Vencendo em 30 dias', items: vencendo, cls: 'a', desc: (m) => `Vence em ${fmtDate(m.validade)} (${daysUntil(m.validade)} dias) • ${m.quantidade} ${m.unidadeUso || 'un'}` },
    { title: '🟡 Estoque baixo', items: baixo, cls: 'a', desc: (m) => `${m.quantidade} ${m.unidadeUso || 'un'} em estoque • mínimo ${m.minimo || 0} ${m.unidadeUso || 'un'}` },
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
  const nomes = [...new Set(meds.map((m) => m.nome))].sort();
  $('#rep-prod-list').innerHTML = nomes.map((n) => `<option value="${esc(n)}">`).join('');
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
  $('#f-unidadeUso').value = 'un';
  $('#f-unidadeCompra').value = 'Unidade';
  $('#f-qtdPorCompra').value = 1;
  $('#f-controlado').checked = false;
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
  $('#f-unidadeUso').value = m.unidadeUso || 'un';
  $('#f-unidadeCompra').value = m.unidadeCompra || 'Unidade';
  $('#f-qtdPorCompra').value = m.qtdPorCompra || 1;
  $('#f-controlado').checked = !!m.controlado;
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
    quantidade: Math.max(0, parseFloat($('#f-quantidade').value) || 0),
    minimo: Math.max(0, parseFloat($('#f-minimo').value) || 0),
    preco: Math.max(0, parseFloat($('#f-preco').value) || 0),
    validade: $('#f-validade').value,
    obs: $('#f-obs').value.trim(),
    unidadeUso: $('#f-unidadeUso').value.trim() || 'un',
    unidadeCompra: $('#f-unidadeCompra').value.trim() || 'Unidade',
    qtdPorCompra: Math.max(0.01, parseFloat($('#f-qtdPorCompra').value) || 1),
    controlado: $('#f-controlado').checked,
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
let moveMedCurrent = null;

function openMove(id) {
  const m = meds.find((x) => x.id === id);
  if (!m) return;
  moveMedCurrent = m;
  $('#m-id').value = id;
  $('#moveMedName').textContent = `${m.nome} — ${m.quantidade} ${m.unidadeUso || 'un'} em estoque`;
  $('#moveForm').reset();
  setMoveTipo('entrada');
  showModal('#moveModal');
  setTimeout(() => $('#m-qtd').focus(), 50);
}

function setMoveTipo(t) {
  moveTipo = t;
  $$('#moveTipo .seg-btn').forEach((b) => b.classList.toggle('active', b.dataset.tipo === t));
  updateMoveRows();
}

function updateMoveRows() {
  const m = moveMedCurrent;
  if (!m) return;
  const un = m.unidadeUso || 'un';
  $('#moveQtdLabel').textContent = `Quantidade (${un}) *`;

  const temConversao = moveTipo === 'entrada' && Number(m.qtdPorCompra) > 1;
  $('#moveEmbalagemRow').hidden = !temConversao;
  if (temConversao) {
    $('#moveEmbalagemLabel').textContent = `Comprou quantas ${m.unidadeCompra || 'embalagens'}? (1 ${m.unidadeCompra || 'un.'} = ${m.qtdPorCompra} ${un})`;
  }

  $('#moveSaidaRow').hidden = moveTipo !== 'saida';
  $('#moveControladoNote').hidden = !(moveTipo === 'saida' && m.controlado);
}

function submitMove(e) {
  e.preventDefault();
  const id = $('#m-id').value;
  const m = meds.find((x) => x.id === id);
  if (!m) return;
  const un = m.unidadeUso || 'un';
  const qtd = Math.max(0.01, parseFloat($('#m-qtd').value) || 0);
  const motivo = $('#m-motivo').value.trim();
  const idPaciente = $('#m-paciente').value.trim();
  const quemRetirou = $('#m-quem').value.trim();
  const finalidade = $('#m-finalidade').value.trim();

  if (moveTipo === 'saida' && m.controlado && (!idPaciente || !finalidade)) {
    toast('Item controlado: informe paciente e finalidade.', true);
    return;
  }
  if (moveTipo === 'saida' && qtd > m.quantidade) {
    toast(`Saída maior que o estoque (${m.quantidade} ${un}).`, true);
    return;
  }
  m.quantidade = Math.round((m.quantidade + (moveTipo === 'entrada' ? qtd : -qtd)) * 100) / 100;
  moves.push({
    id: uid(), medId: m.id, medNome: m.nome, tipo: moveTipo, qtd, unidade: un, motivo,
    idPaciente, quemRetirou, finalidade, data: new Date().toISOString(),
  });
  save();
  hideModal('#moveModal');
  renderAll();
  toast(moveTipo === 'entrada' ? `Entrada de ${qtd} ${un} registrada.` : `Saída de ${qtd} ${un} registrada.`);
}

/* ---------- Relatórios ---------- */
let ultimoRelatorio = [];

function gerarRelatorio() {
  const inicio = $('#rep-inicio').value;
  const fim = $('#rep-fim').value;
  const produto = $('#rep-produto').value.trim().toLowerCase();
  const quem = $('#rep-quem').value.trim().toLowerCase();

  const rows = moves.filter((mv) => {
    if (mv.tipo !== 'saida') return false;
    const dataISO = mv.data.slice(0, 10);
    if (inicio && dataISO < inicio) return false;
    if (fim && dataISO > fim) return false;
    if (produto && !mv.medNome.toLowerCase().includes(produto)) return false;
    if (quem && !(mv.quemRetirou || '').toLowerCase().includes(quem)) return false;
    return true;
  }).sort((a, b) => a.data < b.data ? 1 : -1);

  ultimoRelatorio = rows;

  $('#repSummaryCard').hidden = rows.length === 0;
  $('#repDetailCard').hidden = rows.length === 0;
  $('#repEmpty').hidden = rows.length > 0;
  if (!rows.length) return;

  const porProduto = {};
  rows.forEach((mv) => {
    const k = mv.medNome;
    if (!porProduto[k]) porProduto[k] = { total: 0, unidade: mv.unidade || 'un', n: 0 };
    porProduto[k].total += Number(mv.qtd) || 0;
    porProduto[k].n += 1;
  });
  const resumoEntries = Object.entries(porProduto).sort((a, b) => b[1].total - a[1].total);
  $('#repSummaryTbody').innerHTML = resumoEntries.map(([nome, r]) => `
    <tr>
      <td><strong>${esc(nome)}</strong></td>
      <td class="num">${r.total}</td>
      <td>${esc(r.unidade)}</td>
      <td class="num">${r.n}</td>
    </tr>`).join('');

  $('#repDetailTbody').innerHTML = rows.map((mv) => `
    <tr>
      <td style="color:var(--muted);white-space:nowrap">${fmtDateTime(mv.data)}</td>
      <td><strong>${esc(mv.medNome)}</strong></td>
      <td class="num">${mv.qtd} ${esc(mv.unidade || 'un')}</td>
      <td>${esc(mv.idPaciente || '—')}</td>
      <td>${esc(mv.quemRetirou || '—')}</td>
      <td>${esc(mv.finalidade || '—')}</td>
      <td style="color:var(--muted)">${esc(mv.motivo || '—')}</td>
    </tr>`).join('');
}

function csvField(v) {
  const s = (v ?? '').toString();
  return /[",;\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
}

function exportarRelatorioCSV() {
  if (!ultimoRelatorio.length) gerarRelatorio();
  if (!ultimoRelatorio.length) { toast('Nenhuma saída para exportar.', true); return; }
  const header = ['Data', 'Hora', 'Produto', 'Quantidade', 'Unidade', 'ID paciente', 'Quem retirou', 'Finalidade', 'Observação'];
  const linhas = ultimoRelatorio.map((mv) => {
    const d = new Date(mv.data);
    return [
      d.toLocaleDateString('pt-BR'), d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      mv.medNome, String(mv.qtd).replace('.', ','), mv.unidade || 'un', mv.idPaciente || '', mv.quemRetirou || '', mv.finalidade || '', mv.motivo || '',
    ].map(csvField).join(';');
  });
  const csv = '﻿' + header.join(';') + '\n' + linhas.join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `medical-vet-relatorio-saidas-${todayISO()}.csv`;
  a.click();
  URL.revokeObjectURL(url);
  toast('Relatório exportado em CSV.');
}

function imprimirRelatorio() {
  if (!ultimoRelatorio.length) gerarRelatorio();
  if (!ultimoRelatorio.length) { toast('Nenhuma saída para imprimir.', true); return; }
  window.print();
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
  if (view === 'relatorios') gerarRelatorio();
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
  $('#m-embalagens').addEventListener('input', () => {
    if (!moveMedCurrent) return;
    const emb = parseFloat($('#m-embalagens').value);
    if (!isNaN(emb)) $('#m-qtd').value = Math.round(emb * Number(moveMedCurrent.qtdPorCompra || 1) * 100) / 100;
  });

  // Relatórios
  $('#btnGerarRelatorio').addEventListener('click', gerarRelatorio);
  $('#btnExportarRelatorioCSV').addEventListener('click', exportarRelatorioCSV);
  $('#btnImprimirRelatorio').addEventListener('click', imprimirRelatorio);

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
