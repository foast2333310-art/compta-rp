const ALL_KEYS = [
  'compta_declarations','compta_base','compta_blocnotes',
  'compta_produits','compta_commandes','compta_notifications',
  'compta_darkmode','compta_colors','compta_messages',
  'compta_codes','compta_promo','compta_produits_added'
];

const BOT_URL = 'http://46.62.230.81:3001';

async function bot(method, path, body) {
  const opts = { method, headers: { 'Content-Type': 'application/json' } };
  if (body !== undefined) {
    // body is raw string from localStorage, send as JSON string value
    opts.body = JSON.stringify(body);
  }
  const r = await fetch(`${BOT_URL}${path}`, opts);
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,DELETE,OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    if (req.method === 'GET' && req.query.key === 'all') {
      const data = await bot('GET', '/api/store/all');
      return res.json(data);
    }
    if (req.method === 'GET' && req.query.key) {
      const data = await bot('GET', '/api/store/' + encodeURIComponent(req.query.key));
      return res.json(data);
    }
    if (req.method === 'POST' && req.query.key) {
      let body = '';
      req.on('data', chunk => body += chunk);
      req.on('end', async () => {
        await bot('POST', '/api/store/' + encodeURIComponent(req.query.key), body);
        res.json({ ok: true });
      });
      return;
    }
    if (req.method === 'DELETE' && req.query.key) {
      await bot('DELETE', '/api/store/' + encodeURIComponent(req.query.key));
      return res.json({ ok: true });
    }
    res.status(400).json({ error: 'Invalid request' });
  } catch (e) {
    res.status(503).json({ error: 'Bot server unreachable', detail: e.message });
  }
};
