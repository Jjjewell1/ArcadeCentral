import { Router } from 'express';
import { requireEnv } from '../middleware/auth.js';

const router = Router();

let cookieCache = { cookie: null, expiresAt: 0 };

async function getCookie() {
  if (cookieCache.cookie && Date.now() < cookieCache.expiresAt) {
    return cookieCache.cookie;
  }
  const url = requireEnv('QBIT_URL');
  const user = requireEnv('QBIT_USER');
  const pass = requireEnv('QBIT_PASS');
  const response = await fetch(`${url}/api/v2/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ username: user, password: pass }),
  });
  if (!response.ok) throw new Error('qBittorrent login failed');
  const setCookie = response.headers.get('set-cookie');
  const sid = setCookie?.match(/SID=([^;]+)/)?.[1];
  if (!sid) throw new Error('No SID in qBittorrent response');
  cookieCache.cookie = `SID=${sid}`;
  cookieCache.expiresAt = Date.now() + 30 * 60 * 1000;
  return cookieCache.cookie;
}

router.get('/transfers', async (_req, res) => {
  try {
    const url = requireEnv('QBIT_URL');
    const cookie = await getCookie();
    const response = await fetch(`${url}/api/v2/torrents/info`, {
      headers: { Cookie: cookie },
    });
    if (!response.ok) {
      return res.status(response.status).json({ error: `qBittorrent returned ${response.status}` });
    }
    const data = await response.json();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/pause/:hash', async (req, res) => {
  try {
    const url = requireEnv('QBIT_URL');
    const cookie = await getCookie();
    const response = await fetch(`${url}/api/v2/torrents/pause`, {
      method: 'POST',
      headers: { Cookie: cookie, 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ hashes: req.params.hash }),
    });
    if (!response.ok) {
      return res.status(response.status).json({ error: `qBittorrent returned ${response.status}` });
    }
    res.json({ status: 'paused' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/resume/:hash', async (req, res) => {
  try {
    const url = requireEnv('QBIT_URL');
    const cookie = await getCookie();
    const response = await fetch(`${url}/api/v2/torrents/resume`, {
      method: 'POST',
      headers: { Cookie: cookie, 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ hashes: req.params.hash }),
    });
    if (!response.ok) {
      return res.status(response.status).json({ error: `qBittorrent returned ${response.status}` });
    }
    res.json({ status: 'resumed' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
