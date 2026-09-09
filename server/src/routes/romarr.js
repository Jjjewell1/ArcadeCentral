import { Router } from 'express';
import { requireEnv } from '../middleware/auth.js';

const router = Router();

function getConfig() {
  return {
    url: requireEnv('ROMARR_URL'),
    apiKey: requireEnv('ROMARR_API_KEY'),
  };
}

router.post('/grab', async (req, res) => {
  try {
    const { url, apiKey } = getConfig();
    const { releaseId } = req.body;
    const response = await fetch(`${url}/api/v1/release/pick`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Api-Key': apiKey },
      body: JSON.stringify({ releaseId }),
    });
    if (!response.ok) {
      return res.status(response.status).json({ error: `RomArr returned ${response.status}` });
    }
    const data = await response.json();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/status', async (_req, res) => {
  try {
    const { url, apiKey } = getConfig();
    const response = await fetch(`${url}/api/v1/system/status`, {
      headers: { 'X-Api-Key': apiKey },
    });
    if (!response.ok) {
      return res.status(response.status).json({ error: `RomArr returned ${response.status}` });
    }
    const data = await response.json();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
