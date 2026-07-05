const store = {};

function keys(){return['compta_declarations','compta_base','compta_blocnotes','compta_produits','compta_commandes','compta_notifications','compta_darkmode','compta_colors','compta_messages','compta_codes','compta_promo','compta_produits_added'];}

module.exports = function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,DELETE,OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    if (req.method === 'GET' && req.query.key === 'all') {
      const data = {};
      keys().forEach(k => { if (store[k] !== undefined) data[k] = store[k]; });
      return res.json(data);
    }
    if (req.method === 'GET' && req.query.key) {
      return res.json({ result: store[req.query.key] || null });
    }
    if (req.method === 'POST' && req.query.key) {
      let body = '';
      req.on('data', chunk => body += chunk);
      req.on('end', () => {
        store[req.query.key] = body;
        res.json({ ok: true });
      });
      return;
    }
    if (req.method === 'DELETE' && req.query.key) {
      delete store[req.query.key];
      return res.json({ ok: true });
    }
    res.status(400).json({ error: 'Invalid request' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};
