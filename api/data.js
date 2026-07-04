const OWNER = 'foast2333310-art';
const REPO = 'compta-rp';
const FILE = 'data-store.json';
const BRANCH = 'data';
const GH = 'https://api.github.com/repos/' + OWNER + '/' + REPO;

const AUTH = process.env.GH_TOKEN ? { Authorization: 'token ' + process.env.GH_TOKEN } : {};

async function gh(path, opts) {
  const r = await fetch(GH + path, { headers: { ...AUTH, 'Content-Type': 'application/json' }, ...opts });
  const j = await r.json();
  if (!r.ok && r.status !== 404) throw new Error('GH ' + r.status + ': ' + (j.message || ''));
  return { status: r.status, data: j };
}

async function ensureBranch() {
  // check if branch exists
  const { status } = await gh('/git/refs/heads/' + BRANCH);
  if (status !== 404) return;
  // get default branch latest
  const { data: ref } = await gh('/git/refs/heads/main');
  if (!ref || !ref.object) throw new Error('Cannot get default branch');
  // create data branch
  await gh('/git/refs', {
    method: 'POST',
    body: JSON.stringify({ ref: 'refs/heads/' + BRANCH, sha: ref.object.sha })
  });
}

async function readFile() {
  const { status, data } = await gh('/contents/' + FILE + '?ref=' + BRANCH);
  if (status === 404) return { sha: null, store: {} };
  return { sha: data.sha, store: JSON.parse(Buffer.from(data.content, 'base64').toString('utf-8')) };
}

async function writeFile(sha, store, msg) {
  const body = { message: msg || 'data sync', content: Buffer.from(JSON.stringify(store)).toString('base64'), branch: BRANCH };
  if (sha) body.sha = sha;
  const { status, data } = await gh('/contents/' + FILE, { method: 'PUT', body: JSON.stringify(body) });
  if (status === 422 && !sha) {
    // branch may not exist yet
    await ensureBranch();
    const { status: s2, data: d2 } = await gh('/contents/' + FILE, { method: 'PUT', body: JSON.stringify(body) });
    if (s2 !== 200 && s2 !== 201) throw new Error('Write failed after branch create: ' + s2);
    return d2;
  }
  if (status !== 200 && status !== 201) throw new Error('Write failed: ' + status);
  return data;
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,DELETE,OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (!AUTH.Authorization) {
    return res.status(503).json({ error: 'GH_TOKEN not set' });
  }

  try {
    if (req.method === 'GET' && req.query.key === 'all') {
      const { store } = await readFile();
      return res.json(store);
    }

    if (req.method === 'GET' && req.query.key) {
      const { store } = await readFile();
      return res.json({ result: store[req.query.key] || null });
    }

    if ((req.method === 'POST' || req.method === 'DELETE') && req.query.key) {
      const { sha, store } = await readFile();

      if (req.method === 'POST') {
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', async () => {
          store[req.query.key] = body;
          await writeFile(sha, store, 'update ' + req.query.key);
          res.json({ ok: true });
        });
        return;
      }

      if (req.method === 'DELETE') {
        delete store[req.query.key];
        await writeFile(sha, store, 'delete ' + req.query.key);
        return res.json({ ok: true });
      }
    }

    res.status(400).json({ error: 'Invalid request' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};
