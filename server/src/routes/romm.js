import { Router } from 'express';
import { requireEnv } from '../middleware/auth.js';

const router = Router();

let tokenCache = { token: null, expiresAt: 0 };

async function getToken() {
  if (tokenCache.token && Date.now() < tokenCache.expiresAt) {
    return tokenCache.token;
  }
  const url = requireEnv('ROMM_URL');
  const clientId = requireEnv('ROMM_CLIENT_ID');
  const clientSecret = requireEnv('ROMM_CLIENT_SECRET');
  const response = await fetch(`${url}/api/oauth2/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: 'client_credentials',
    }),
  });
  if (!response.ok) throw new Error('RomM OAuth failed');
  const data = await response.json();
  tokenCache.token = data.access_token;
  tokenCache.expiresAt = Date.now() + (data.expires_in - 60) * 1000;
  return tokenCache.token;
}

router.get('/library', async (_req, res) => {
  try {
    const url = requireEnv('ROMM_URL');
    const token = await getToken();
    const response = await fetch(`${url}/api/v1/rom`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) {
      return res.status(response.status).json({ error: `RomM returned ${response.status}` });
    }
    const data = await response.json();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/library/:platform', async (req, res) => {
  try {
    const url = requireEnv('ROMM_URL');
    const token = await getToken();
    const response = await fetch(`${url}/api/v1/rom?platform=${encodeURIComponent(req.params.platform)}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) {
      return res.status(response.status).json({ error: `RomM returned ${response.status}` });
    }
    const data = await response.json();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/play/:gameId', async (req, res) => {
  try {
    const url = requireEnv('ROMM_URL');
    const token = await getToken();
    res.json({
      playUrl: `${url}/api/v1/game/${req.params.gameId}/play?token=${token}`,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
