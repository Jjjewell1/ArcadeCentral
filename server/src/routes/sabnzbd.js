import { Router } from 'express';
import { requireEnv } from '../middleware/auth.js';

const router = Router();

function getConfig() {
  return {
    url: requireEnv('SABNZBD_URL'),
    apiKey: requireEnv('SABNZBD_API_KEY'),
  };
}

router.get('/queue', async (_req, res) => {
  try {
    const { url, apiKey } = getConfig();
    const response = await fetch(`${url}/sabnzbd/api?mode=queue&output=json&apikey=${apiKey}`);
    if (!response.ok) {
      return res.status(response.status).json({ error: `SABnzbd returned ${response.status}` });
    }
    const data = await response.json();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/history', async (_req, res) => {
  try {
    const { url, apiKey } = getConfig();
    const response = await fetch(`${url}/sabnzbd/api?mode=history&output=json&apikey=${apiKey}`);
    if (!response.ok) {
      return res.status(response.status).json({ error: `SABnzbd returned ${response.status}` });
    }
    const data = await response.json();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
