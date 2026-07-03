// ===== STORE API (data sync pour compta-rp) =====
// Copie ce bloc dans bot_complet.js AVANT app2.listen()

const STORE_DIR = path.join(__dirname, 'store_data');
if (!fs.existsSync(STORE_DIR)) fs.mkdirSync(STORE_DIR, { recursive: true });

const STORE_KEYS = [
  'compta_declarations','compta_base','compta_blocnotes',
  'compta_produits','compta_commandes','compta_notifications',
  'compta_darkmode','compta_colors','compta_messages',
  'compta_codes','compta_promo','compta_produits_added'
];

function storeGet(key) {
  const file = path.join(STORE_DIR, key + '.json');
  if (fs.existsSync(file)) return fs.readFileSync(file, 'utf-8');
  return null;
}

function storeSet(key, val) {
  fs.writeFileSync(path.join(STORE_DIR, key + '.json'), val, 'utf-8');
}

function storeDel(key) {
  const file = path.join(STORE_DIR, key + '.json');
  if (fs.existsSync(file)) fs.unlinkSync(file);
}

app2.get('/api/store/all', (req, res) => {
  const data = {};
  STORE_KEYS.forEach(k => { const v = storeGet(k); if (v !== null) data[k] = v; });
  res.json(data);
});

app2.get('/api/store/:key', (req, res) => {
  const val = storeGet(req.params.key);
  res.json({ result: val });
});

app2.post('/api/store/:key', (req, res) => {
  storeSet(req.params.key, req.body);
  res.json({ ok: true });
});

app2.delete('/api/store/:key', (req, res) => {
  storeDel(req.params.key);
  res.json({ ok: true });
});

console.log('💾 Store API prête (' + STORE_KEYS.length + ' clés)');
