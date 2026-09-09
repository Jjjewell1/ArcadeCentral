import { Router } from 'express';
import { requireEnv } from '../middleware/auth.js';

const router = Router();

router.get('/wishlist', async (_req, res) => {
  try {
    const url = requireEnv('QUESTARR_URL');
    const response = await fetch(`${url}/api/v1/wishlist`);
    if (!response.ok) {
      return res.status(response.status).json({ error: `Questarr returned ${response.status}` });
    }
    const data = await response.json();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
