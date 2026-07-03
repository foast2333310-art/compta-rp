const ALL_KEYS = [
  'compta_declarations','compta_base','compta_blocnotes',
  'compta_produits','compta_commandes','compta_notifications',
  'compta_darkmode','compta_colors','compta_messages',
  'compta_codes','compta_promo','compta_produits_added'
];

const UPSTASH_URL = process.env.UPSTASH_REDIS_REST_URL;
const UPSTASH_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;
const AUTH = { Authorization: `Bearer ${UPSTASH_TOKEN}` };

async function upstash(cmd, ...args) {
  const url = `${UPSTASH_URL}/${cmd}/${args.map(encodeURIComponent).join('/')}`;
  const res = await fetch(url, { headers: AUTH });
  return res.json();
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,DELETE,OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (!UPSTASH_URL || !UPSTASH_TOKEN) {
    return res.status(503).json({ error: 'Upstash not configured' });
  }

  try {
    if (req.method === 'GET' && req.query.key === 'all') {
      const results = await Promise.all(ALL_KEYS.map(k =>
        fetch(`${UPSTASH_URL}/get/${k}`, { headers: AUTH }).then(r => r.json())
      ));
      const data = {};
      ALL_KEYS.forEach((k, i) => {
        if (results[i]?.result !== null && results[i]?.result !== undefined) data[k] = results[i].result;
      });
      return res.json(data);
    }

    if (req.method === 'GET' && req.query.key) {
      const r = await upstash('GET', req.query.key);
      return res.json({ result: r.result });
    }

    if (req.method === 'POST' && req.query.key) {
      let body = '';
      req.on('data', chunk => body += chunk);
      req.on('end', async () => {
        await upstash('SET', req.query.key, body);
        res.json({ ok: true });
      });
      return;
    }

    if (req.method === 'DELETE' && req.query.key) {
      await upstash('DEL', req.query.key);
      return res.json({ ok: true });
    }

    res.status(400).json({ error: 'Invalid request' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};
