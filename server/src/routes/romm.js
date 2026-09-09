import { Router } from 'express';
import { requireEnv } from '../middleware/auth.js';

const router = Router();

let authCache = { sessionCookie: null, csrfCookie: null, expiresAt: 0 };

function extractCookies(headers) {
  const setCookie = headers.get('set-cookie') ?? '';
  const get = (name) => {
    const m = setCookie.match(new RegExp(`${name}=([^;]+)`));
    return m ? `${name}=${m[1]}` : null;
  };
  return { sessionCookie: get('romm_session'), csrfCookie: get('romm_csrftoken') };
}

async function getAuth() {
  if (authCache.sessionCookie && Date.now() < authCache.expiresAt) {
    return authCache;
  }
  const url = requireEnv('ROMM_URL');
  const username = requireEnv('ROMM_AUTH_USERNAME');
  const password = requireEnv('ROMM_AUTH_PASSWORD');

  const seedResponse = await fetch(`${url}/api/token`, { method: 'POST' });
  const seedCsrf = extractCookies(seedResponse.headers).csrfCookie;
  if (!seedCsrf) throw new Error('No CSRF token from RomM seed request');

  const basic = Buffer.from(`${username}:${password}`).toString('base64');
  const loginResponse = await fetch(`${url}/api/login`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${basic}`,
      'Content-Type': 'application/json',
      'X-CSRFToken': seedCsrf.split('=')[1],
    },
  });
  if (!loginResponse.ok) {
    throw new Error(`RomM login failed (${loginResponse.status})`);
  }

  const cookies = extractCookies(loginResponse.headers);
  if (!cookies.sessionCookie) throw new Error('No session cookie from RomM login');
  authCache = {
    ...cookies,
    expiresAt: Date.now() + 2 * 60 * 60 * 1000,
  };
  return authCache;
}

async function rommFetch(path, init = {}) {
  const url = requireEnv('ROMM_URL');
  const auth = await getAuth();
  const response = await fetch(`${url}${path}`, {
    ...init,
    headers: {
      ...init.headers,
      Cookie: [auth.sessionCookie, auth.csrfCookie].filter(Boolean).join('; '),
      'X-CSRFToken': auth.csrfCookie?.split('=')[1] ?? '',
    },
  });
  if (response.status === 401) {
    authCache = { sessionCookie: null, csrfCookie: null, expiresAt: 0 };
    return rommFetch(path, init);
  }
  return response;
}

router.get('/library', async (_req, res) => {
  try {
    const response = await rommFetch('/api/roms');
    if (!response.ok) {
      return res.status(response.status).json({ error: `RomM returned ${response.status}` });
    }
    res.json(await response.json());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/library/:platform', async (req, res) => {
  try {
    const response = await rommFetch(
      `/api/roms?platform=${encodeURIComponent(req.params.platform)}`,
    );
    if (!response.ok) {
      return res.status(response.status).json({ error: `RomM returned ${response.status}` });
    }
    res.json(await response.json());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/platforms', async (_req, res) => {
  try {
    const response = await rommFetch('/api/platforms');
    if (!response.ok) {
      return res.status(response.status).json({ error: `RomM returned ${response.status}` });
    }
    res.json(await response.json());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Proxy RomM static assets (covers / screenshots referenced by path_cover)
// so the browser never needs direct access to the NAS.
router.get('/asset/:path(*)', async (req, res) => {
  try {
    const url = requireEnv('ROMM_URL');
    const auth = await getAuth();
    const response = await fetch(`${url}/${req.params.path}`, {
      headers: {
        Cookie: [auth.sessionCookie, auth.csrfCookie].filter(Boolean).join('; '),
        'X-CSRFToken': auth.csrfCookie?.split('=')[1] ?? '',
      },
    });
    if (!response.ok) {
      return res.status(response.status).json({ error: `RomM returned ${response.status}` });
    }
    response.headers.forEach((value, key) => {
      if (
        !['content-length', 'content-encoding', 'transfer-encoding', 'connection'].includes(
          key.toLowerCase(),
        )
      ) {
        res.setHeader(key, value);
      }
    });
    response.body.pipe(res);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/play/:gameId', async (req, res) => {
  try {
    res.json({ playUrl: `/api/romm/proxy/play/${req.params.gameId}` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/proxy/play/:gameId', async (req, res) => {
  try {
    const url = requireEnv('ROMM_URL');
    const auth = await getAuth();
    const response = await fetch(`${url}/api/roms/${encodeURIComponent(req.params.gameId)}/content`, {
      headers: {
        Cookie: [auth.sessionCookie, auth.csrfCookie].filter(Boolean).join('; '),
        'X-CSRFToken': auth.csrfCookie?.split('=')[1] ?? '',
      },
    });
    if (!response.ok) {
      return res.status(response.status).json({ error: `RomM returned ${response.status}` });
    }
    response.headers.forEach((value, key) => {
      if (
        !['content-length', 'content-encoding', 'transfer-encoding', 'connection'].includes(
          key.toLowerCase(),
        )
      ) {
        res.setHeader(key, value);
      }
    });
    response.body.pipe(res);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;