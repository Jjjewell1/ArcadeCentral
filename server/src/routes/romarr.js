import { Router } from 'express';
import { requireEnv } from '../middleware/auth.js';

const router = Router();

function getConfig() {
  return {
    url: requireEnv('ROMARR_URL'),
    apiKey: requireEnv('ROMARR_API_KEY'),
  };
}

function headers(apiKey) {
  return { 'Content-Type': 'application/json', 'X-Api-Key': apiKey };
}

async function sendError(res, response, fallback) {
  let detail = fallback;
  try {
    const e = await response.json();
    // pydantic 422 bodies are arrays: detail[0].msg carries the real reason
    detail = e?.detail?.[0]?.msg || e?.detail?.errorMessage || e?.errorMessage || detail;
  } catch {
    // keep fallback
  }
  res.status(response.status).json({ error: detail });
}

router.get('/status', async (_req, res) => {
  try {
    const { url, apiKey } = getConfig();
    const response = await fetch(`${url}/api/v3/system/status`, { headers: headers(apiKey) });
    if (!response.ok) {
      return sendError(res, response, `RomArr returned ${response.status}`);
    }
    res.json(await response.json());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/search', async (req, res) => {
  try {
    const { url, apiKey } = getConfig();
    const query = req.body?.query || req.query.q || '';
    if (!query) {
      return res.status(400).json({ error: 'query is required' });
    }
    const body = { query, strict: !!req.body?.strict };
    const response = await fetch(`${url}/api/v3/rom/search/manual`, {
      method: 'POST',
      headers: headers(apiKey),
      body: JSON.stringify(body),
    });
    if (!response.ok) {
      return sendError(res, response, `RomArr returned ${response.status}`);
    }
    res.json(await response.json());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/grab', async (req, res) => {
  try {
    const { url, apiKey } = getConfig();
    const { indexerId, indexerGuid, downloadUrl, title, gameId, releaseId, force } = req.body;
    if (!indexerId || !indexerGuid || !downloadUrl || !title) {
      return res
        .status(400)
        .json({ error: 'indexerId, indexerGuid, downloadUrl and title are required' });
    }
    // RomArr's grab endpoint enforces max 255 chars on indexer_guid, but Prowlarr
    // magnets are far longer — an oversized guid makes every grab 422 and the
    // torrent never reaches qbit. download_url is what actually fetches the
    // .torrent, so a truncated guid is safe metadata.
    const safeGuid = indexerGuid.length > 255 ? indexerGuid.slice(0, 254) : indexerGuid;
    const body = {
      indexer_id: indexerId,
      indexer_guid: safeGuid,
      download_url: downloadUrl,
      title,
      game_id: gameId ?? undefined,
      release_id: releaseId ?? undefined,
    };
    const query = force ? '?force=true' : '';
    const response = await fetch(`${url}/api/v3/rom/release/grab${query}`, {
      method: 'POST',
      headers: headers(apiKey),
      body: JSON.stringify(body),
    });
    if (!response.ok) {
      return sendError(res, response, `RomArr returned ${response.status}`);
    }
    res.json(await response.json());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;