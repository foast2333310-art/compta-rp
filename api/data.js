const store = {};
const KEYS = ['compta_declarations','compta_base','compta_blocnotes','compta_produits','compta_commandes','compta_notifications','compta_darkmode','compta_colors','compta_messages','compta_codes','compta_promo','compta_produits_added'];

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,DELETE,OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const p = req.url.split('?')[0].split('/').filter(Boolean);
  const key = p[2];

  try {
    if (key === 'keepalive') return res.json({ ok: true });

    if (req.method === 'GET' && key === 'all') {
      const data = {};
      KEYS.forEach(k => { if (store[k] !== undefined) data[k] = store[k]; });
      return res.json(data);
    }

    if (req.method === 'GET' && key) {
      return res.json({ result: store[key] || null });
    }

    if (req.method === 'POST' && key) {
      let body = '';
      req.on('data', c => body += c);
      req.on('end', () => { store[key] = body; res.json({ ok: true }); });
      return;
    }

    if (req.method === 'DELETE' && key) {
      delete store[key];
      return res.json({ ok: true });
    }

    res.status(400).json({ error: 'Invalid request' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};
