const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const DATA_DIR = path.join(__dirname, 'data');

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

const STORE_KEYS = [
  'compta_declarations','compta_base','compta_blocnotes',
  'compta_produits','compta_commandes','compta_notifications',
  'compta_darkmode','compta_colors','compta_messages'
];

app.use(express.static(__dirname));

app.get('/api/data/all', (req, res) => {
  const data = {};
  STORE_KEYS.forEach(key => {
    const file = path.join(DATA_DIR, key + '.json');
    if (fs.existsSync(file)) data[key] = fs.readFileSync(file, 'utf-8');
  });
  res.json(data);
});

app.post('/api/data/:key', (req, res) => {
  const key = req.params.key;
  if (!STORE_KEYS.includes(key)) return res.status(400).json({ error: 'Invalid key' });
  let body = '';
  req.on('data', chunk => body += chunk);
  req.on('end', () => {
    fs.writeFileSync(path.join(DATA_DIR, key + '.json'), body, 'utf-8');
    res.json({ ok: true });
  });
});

app.delete('/api/data/:key', (req, res) => {
  const key = req.params.key;
  if (!STORE_KEYS.includes(key)) return res.status(400).json({ error: 'Invalid key' });
  const file = path.join(DATA_DIR, key + '.json');
  if (fs.existsSync(file)) fs.unlinkSync(file);
  res.json({ ok: true });
});

app.get('/api/data/:key', (req, res) => {
  const key = req.params.key;
  if (!STORE_KEYS.includes(key)) return res.status(400).json({ error: 'Invalid key' });
  const file = path.join(DATA_DIR, key + '.json');
  if (!fs.existsSync(file)) return res.json(null);
  res.set('Content-Type', 'application/json');
  res.send(fs.readFileSync(file, 'utf-8'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log('┌───────────────────────────────────────────┐');
  console.log('│  Saveurs & Délices - Serveur de données   │');
  console.log('│  http://localhost:' + String(PORT).padEnd(5) + '                    │');
  console.log('│  Données sauvegardées dans data/          │');
  console.log('└───────────────────────────────────────────┘');
});
