import { Router } from 'express';
import { requireEnv } from '../middleware/auth.js';

const router = Router();

function getConfig() {
  return {
    url: requireEnv('PROWLARR_URL'),
    apiKey: requireEnv('PROWLARR_API_KEY'),
  };
}

router.get('/search', async (req, res) => {
  try {
    const { url, apiKey } = getConfig();
    const q = req.query.q || '';
    const response = await fetch(
      `${url}/api/v1/search?query=${encodeURIComponent(q)}&apikey=${apiKey}&type=search`
    );
    if (!response.ok) {
      return res.status(response.status).json({ error: `Prowlarr returned ${response.status}` });
    }
    const data = await response.json();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/indexers', async (_req, res) => {
  try {
    const { url, apiKey } = getConfig();
    const response = await fetch(`${url}/api/v1/indexer?apikey=${apiKey}`);
    if (!response.ok) {
      return res.status(response.status).json({ error: `Prowlarr returned ${response.status}` });
    }
    const data = await response.json();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
