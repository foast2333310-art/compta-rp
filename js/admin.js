const ADMIN_PASSWORD = "admin123";
const STORAGE_KEY_DECL = "compta_declarations";
const STORAGE_KEY_NOTES = "compta_blocnotes";
const STORAGE_KEY_PRODS = "compta_produits";
const STORAGE_KEY_CMDS = "compta_commandes";

let currentAccounting = null;
let produitEnEdition = null;

// ===================== STORAGE HELPERS =====================

function getDeclarations() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY_DECL)) || { legal: [], illegal: [] }; }
  catch { return { legal: [], illegal: [] }; }
}
function saveDeclaration(entry, registre) {
  var all = getDeclarations();
  all[registre].push(entry);
  localStorage.setItem(STORAGE_KEY_DECL, JSON.stringify(all));
}
function getAllEntries(type) {
  var base = COMPTA[type];
  var custom = getDeclarations();
  return {
    titre: base.titre,
    soustitre: base.soustitre + " (déclarations incluses)",
    devise: base.devise,
    entrees: (custom[type] || []).concat(base.entrees)
  };
}

function getProduits() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY_PRODS)) || []; }
  catch { return []; }
}
function saveProduits(list) {
  localStorage.setItem(STORAGE_KEY_PRODS, JSON.stringify(list));
}

function getCommandes() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY_CMDS)) || []; }
  catch { return []; }
}
function saveCommandes(list) {
  localStorage.setItem(STORAGE_KEY_CMDS, JSON.stringify(list));
}

// ===================== PRODUITS =====================

function renderProduits() {
  var list = getProduits();
  var el = document.getElementById('produitsList');
  if (list.length === 0) {
    el.innerHTML = '<p style="color:#888;font-size:0.9rem;">Aucun produit pour le moment.</p>';
    document.getElementById('statProduits').textContent = '0';
    return;
  }
  document.getElementById('statProduits').textContent = list.length;
  var html = '<table><thead><tr><th>Icône</th><th>Nom</th><th>Description</th><th>Prix</th><th>Actions</th></tr></thead><tbody>';
  list.forEach(function(p) {
    html += '<tr>' +
      '<td style="font-size:1.5rem;">' + p.icone + '</td>' +
      '<td><strong>' + escapeHtml(p.nom) + '</strong></td>' +
      '<td style="color:#888;">' + escapeHtml(p.description) + '</td>' +
      '<td><strong>' + p.prix + ' $</strong></td>' +
      '<td>' +
        '<button onclick="editerProduit(' + p.id + ')" style="padding:0.3rem 0.8rem;background:#2980b9;color:#fff;border:none;cursor:pointer;font-size:0.75rem;margin-right:0.3rem;">Modifier</button>' +
        '<button onclick="supprimerProduit(' + p.id + ')" style="padding:0.3rem 0.8rem;background:#e74c3c;color:#fff;border:none;cursor:pointer;font-size:0.75rem;">Suppr.</button>' +
      '</td></tr>';
  });
  html += '</tbody></table>';
  el.innerHTML = html;
}

function submitProduit(e) {
  e.preventDefault();
  var icone = document.getElementById('prodIcone').value.trim();
  var nom = document.getElementById('prodNom').value.trim();
  var prix = parseFloat(document.getElementById('prodPrix').value);
  var description = document.getElementById('prodDescription').value.trim();
  if (!icone || !nom || !prix || !description) return;

  var list = getProduits();

  if (produitEnEdition !== null) {
    var idx = list.findIndex(function(p) { return p.id === produitEnEdition; });
    if (idx !== -1) { list[idx] = { id: produitEnEdition, icone: icone, nom: nom, prix: prix, description: description }; }
    produitEnEdition = null;
    document.querySelector('#produitForm button').textContent = 'Ajouter';
  } else {
    var newId = list.length > 0 ? Math.max.apply(null, list.map(function(p) { return p.id; })) + 1 : 1;
    list.push({ id: newId, icone: icone, nom: nom, prix: prix, description: description });
  }

  saveProduits(list);
  renderProduits();
  document.getElementById('produitForm').reset();
}

function editerProduit(id) {
  var list = getProduits();
  var p = list.find(function(x) { return x.id === id; });
  if (!p) return;
  document.getElementById('prodIcone').value = p.icone;
  document.getElementById('prodNom').value = p.nom;
  document.getElementById('prodPrix').value = p.prix;
  document.getElementById('prodDescription').value = p.description;
  produitEnEdition = id;
  document.querySelector('#produitForm button').textContent = 'Enregistrer';
  window.scrollTo(0, 0);
}

function supprimerProduit(id) {
  var list = getProduits().filter(function(p) { return p.id !== id; });
  saveProduits(list);
  renderProduits();
}

// ===================== COMMANDES =====================

function renderCommandes() {
  var list = getCommandes();
  var el = document.getElementById('commandesList');
  if (list.length === 0) {
    el.innerHTML = '<p style="color:#888;font-size:0.9rem;">Aucune commande reçue.</p>';
    document.getElementById('statCommandes').textContent = '0';
    renderDashboardCommandes();
    return;
  }
  var enAttente = list.filter(function(c) { return c.statut === 'En attente'; }).length;
  document.getElementById('statCommandes').textContent = enAttente;
  var badge = document.getElementById('cmdBadge');
  if (badge) { badge.textContent = enAttente; badge.className = 'nav-badge' + (enAttente === 0 ? ' empty' : ''); }

  var html = '<table><thead><tr><th>N°</th><th>Client</th><th>Total</th><th>Date</th><th>Statut</th><th style="text-align:center;">Détail</th><th>Action</th></tr></thead><tbody>';
  list.slice().reverse().forEach(function(c) {
    var articlesStr = (c.articles || []).map(function(a) { return a.quantite + 'x ' + a.nom + ' (' + a.prix + ' $)'; }).join('<br>');
    html += '<tr><td>#' + c.id + '</td>' +
      '<td>' + escapeHtml(c.client) + '</td>' +
      '<td><strong>' + c.total + ' $</strong></td>' +
      '<td>' + c.date + '</td>' +
      '<td><span class="status ' + (c.statut === 'Livré' ? 'completed' : c.statut === 'En cours' ? 'processing' : 'pending') + '">' + c.statut + '</span></td>' +
      '<td style="text-align:center;"><button onclick="toggleDetailCmd(' + c.id + ')" style="padding:0.3rem 0.6rem;background:#27ae60;color:#fff;border:none;cursor:pointer;font-size:0.75rem;border-radius:4px;">👁️</button></td>' +
      '<td style="display:flex;gap:0.3rem;flex-wrap:wrap;">' +
        '<select id="statutSelect_' + c.id + '" style="padding:0.3rem 0.4rem;border:1px solid #ddd;font-size:0.75rem;border-radius:4px;">' +
          '<option value="En attente"' + (c.statut === 'En attente' ? ' selected' : '') + '>En attente</option>' +
          '<option value="En cours"' + (c.statut === 'En cours' ? ' selected' : '') + '>En cours</option>' +
          '<option value="Livré"' + (c.statut === 'Livré' ? ' selected' : '') + '>Livré</option>' +
          '<option value="Annulé"' + (c.statut === 'Annulé' ? ' selected' : '') + '>Annulé</option>' +
        '</select>' +
        '<button onclick="appliquerStatutCmd(' + c.id + ')" style="padding:0.3rem 0.6rem;background:#27ae60;color:#fff;border:none;cursor:pointer;font-size:0.75rem;border-radius:4px;">OK</button></td></tr>' +
    '<tr id="detailCmd_' + c.id + '" style="display:none;"><td colspan="7" style="padding:1rem 1.5rem;background:#fafafa;">' +
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem;max-width:600px;">' +
        '<div><strong style="font-size:0.75rem;color:#888;text-transform:uppercase;letter-spacing:1px;">Téléphone</strong><br>' + escapeHtml(c.telephone || '—') + '</div>' +
        '<div><strong style="font-size:0.75rem;color:#888;text-transform:uppercase;letter-spacing:1px;">Adresse</strong><br>' + escapeHtml(c.adresse || '—') + '</div>' +
        '<div style="grid-column:1/-1;"><strong style="font-size:0.75rem;color:#888;text-transform:uppercase;letter-spacing:1px;">Articles</strong><br>' + articlesStr + '</div>' +
      '</div></td></tr>';
  });
  html += '</tbody></table>';
  el.innerHTML = html;
  renderDashboardCommandes();
}

function toggleDetailCmd(id) {
  var el = document.getElementById('detailCmd_' + id);
  if (el) el.style.display = el.style.display === 'none' ? 'table-row' : 'none';
}

function appliquerStatutCmd(id) {
  var ns = document.getElementById('statutSelect_' + id).value;
  var list = getCommandes();
  var c = list.find(function(x) { return x.id === id; });
  if (c && c.statut !== ns) { c.statut = ns; saveCommandes(list); renderCommandes(); }
}

function renderDashboardCommandes() {
  var list = getCommandes();
  var el = document.getElementById('dashboardCommandes');
  if (list.length === 0) {
    el.innerHTML = '<p style="color:#888;font-size:0.9rem;">Aucune commande pour le moment.</p>';
    return;
  }
  var html = '<table><thead><tr><th>Client</th><th>Total</th><th>Date</th><th>Statut</th></tr></thead><tbody>';
  list.slice(-5).reverse().forEach(function(c) {
    html += '<tr><td>' + escapeHtml(c.client) + '</td><td>' + c.total + ' $</td><td>' + c.date + '</td><td><span class="status ' + (c.statut === 'Livré' ? 'completed' : c.statut === 'En cours' ? 'processing' : 'pending') + '">' + c.statut + '</span></td></tr>';
  });
  html += '</tbody></table>';
  el.innerHTML = html;
}

// ===================== BLOC-NOTES =====================

function saveBlocNotes() {
  var text = document.getElementById('blocnotesText').value;
  localStorage.setItem(STORAGE_KEY_NOTES, text);
  document.getElementById('blocnotesSaved').textContent = new Date().toLocaleString('fr-FR');
}

// ===================== AUTH =====================

function handleLogin() {
  var pwd = document.getElementById('loginPassword').value;
  if (pwd === ADMIN_PASSWORD) {
    document.getElementById('loginScreen').style.display = 'none';
    document.getElementById('dashboard').style.display = 'flex';
    document.getElementById('loginError').classList.remove('visible');
    renderProduits();
    renderCommandes();
  } else {
    document.getElementById('loginError').classList.add('visible');
  }
  document.getElementById('loginPassword').value = '';
}

function handleLogout() {
  document.getElementById('dashboard').style.display = 'none';
  document.getElementById('loginScreen').style.display = 'flex';
  document.getElementById('loginError').classList.remove('visible');
  document.getElementById('comptaTable').classList.remove('visible');
  document.getElementById('illegalWarning').classList.remove('visible');
  document.getElementById('codeError').classList.remove('visible');
  document.getElementById('codeInput').value = '';
  currentAccounting = null;
}

// ===================== NAVIGATION =====================

function showSection(sectionId) {
  document.querySelectorAll('.section-view').forEach(function(el) { el.style.display = 'none'; });
  document.getElementById(sectionId).style.display = 'block';

  document.querySelectorAll('.sidebar nav a, .sidebar nav .submenu-toggle').forEach(function(el) {
    el.classList.remove('active');
  });

  var titles = {
    'dashboard-home': 'Tableau de bord',
    'archives': 'Consultation comptable',
    'declaration': 'Déclaration comptable',
    'blocnotes': 'Bloc-Notes',
    'produits': 'Gestion des produits',
    'gestion-commandes': 'Commandes reçues',
    'settings': 'Paramètres'
  };
  document.getElementById('pageTitle').textContent = titles[sectionId] || 'Tableau de bord';

  var subSections = ['archives', 'declaration', 'blocnotes', 'produits', 'gestion-commandes'];
  if (subSections.indexOf(sectionId) !== -1) {
    openSubmenu();
    setActiveSubmenuItem(sectionId);
  }

  if (sectionId !== 'archives') {
    document.getElementById('comptaTable').classList.remove('visible');
    document.getElementById('illegalWarning').classList.remove('visible');
    document.getElementById('codeError').classList.remove('visible');
  }
  if (sectionId === 'produits') renderProduits();
  if (sectionId === 'gestion-commandes') renderCommandes();
  if (sectionId === 'blocnotes') loadBlocNotes();
  if (sectionId === 'dashboard-home') { renderProduits(); renderCommandes(); }
}

function openSubmenu() {
  var sub = document.getElementById('archiveSubmenu');
  var arrow = document.querySelector('.submenu-toggle .arrow');
  if (sub) sub.classList.add('open');
  if (arrow) arrow.classList.add('open');
}

function setActiveSubmenuItem(sectionId) {
  document.querySelectorAll('#archiveSubmenu a').forEach(function(el) { el.classList.remove('active'); });
  var target = document.querySelector('#archiveSubmenu a[onclick*="' + sectionId + '"]');
  if (target) target.classList.add('active');
}

function toggleSubmenu(e) {
  e.preventDefault();
  var sub = document.getElementById('archiveSubmenu');
  var arrow = document.querySelector('.submenu-toggle .arrow');
  if (sub) sub.classList.toggle('open');
  if (arrow) arrow.classList.toggle('open');
}

// ===================== COMPTABILITÉ =====================

function checkCode() {
  var code = document.getElementById('codeInput').value.trim().toUpperCase();
  var error = document.getElementById('codeError');
  var table = document.getElementById('comptaTable');
  var warning = document.getElementById('illegalWarning');

  error.classList.remove('visible');
  table.classList.remove('visible');
  warning.classList.remove('visible');

  if (code === COMPTA.codes.legal) {
    currentAccounting = 'legal';
    renderCompta(getAllEntries('legal'));
    table.classList.add('visible');
  } else if (code === COMPTA.codes.illegal) {
    currentAccounting = 'illegal';
    renderCompta(getAllEntries('illegal'));
    warning.classList.add('visible');
    table.classList.add('visible');
  } else {
    error.classList.add('visible');
    currentAccounting = null;
  }
  document.getElementById('codeInput').value = '';
}

function renderCompta(data) {
  document.getElementById('comptaTitle').textContent = data.titre;
  document.getElementById('comptaSubtitle').textContent = data.soustitre;
  var totalRecettes = 0, totalDepenses = 0, rows = '';
  data.entrees.forEach(function(entry) {
    totalRecettes += entry.recette;
    totalDepenses += entry.depense;
    var dateF = entry.date.split('-').reverse().join('/');
    rows += '<tr><td>' + dateF + '</td><td>' + entry.description + '</td><td>' + entry.categorie + '</td>' +
      '<td class="amount positive">' + (entry.recette > 0 ? formatMoney(entry.recette) : '-') + '</td>' +
      '<td class="amount negative">' + (entry.depense > 0 ? formatMoney(entry.depense) : '-') + '</td></tr>';
  });
  document.getElementById('comptaBody').innerHTML = rows;
  document.getElementById('totalRecettes').textContent = formatMoney(totalRecettes);
  document.getElementById('totalDepenses').textContent = formatMoney(totalDepenses);
  document.getElementById('totalSolde').textContent = formatMoney(totalRecettes - totalDepenses);
}

function submitDeclaration(e) {
  e.preventDefault();
  var date = document.getElementById('declDate').value;
  var description = document.getElementById('declDescription').value.trim();
  var categorie = document.getElementById('declCategorie').value.trim();
  var montant = parseFloat(document.getElementById('declMontant').value);
  var type = document.querySelector('input[name="declType"]:checked').value;
  var registre = document.querySelector('input[name="declRegistre"]:checked').value;
  if (!date || !description || !categorie || !montant) return;
  saveDeclaration({ date: date, description: description, categorie: categorie, recette: type === 'recette' ? montant : 0, depense: type === 'depense' ? montant : 0 }, registre);
  document.getElementById('declarationForm').reset();
  document.getElementById('declDate').value = new Date().toISOString().split('T')[0];
  document.getElementById('declSuccess').style.display = 'block';
  setTimeout(function() { document.getElementById('declSuccess').style.display = 'none'; }, 3000);
}

function formatMoney(amount) {
  return amount.toLocaleString('fr-FR') + ' $';
}

function escapeHtml(text) {
  var d = document.createElement('div');
  d.textContent = text;
  return d.innerHTML;
}

function loadBlocNotes() {
  var saved = localStorage.getItem(STORAGE_KEY_NOTES);
  if (saved) document.getElementById('blocnotesText').value = saved;
}

// ===================== INIT =====================

document.addEventListener('DOMContentLoaded', function() {
  document.getElementById('loginPassword').addEventListener('keydown', function(e) { if (e.key === 'Enter') handleLogin(); });
  document.getElementById('codeInput').addEventListener('keydown', function(e) { if (e.key === 'Enter') checkCode(); });
  document.getElementById('declarationForm').addEventListener('submit', submitDeclaration);
  document.getElementById('produitForm').addEventListener('submit', submitProduit);
  document.getElementById('declDate').value = new Date().toISOString().split('T')[0];

  // Auto-save bloc-notes
  var bn = document.getElementById('blocnotesText');
  if (bn) {
    bn.addEventListener('input', function() { clearTimeout(bn._timer); bn._timer = setTimeout(saveBlocNotes, 500); });
  }

  renderProduits();
  renderCommandes();
});

function dismiss403(){document.getElementById('fake403').style.display='none';try{playClick();}catch(e){}}
