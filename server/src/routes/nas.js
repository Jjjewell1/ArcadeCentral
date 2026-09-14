import { Router } from 'express';
import fs from 'node:fs/promises';
import fsSync from 'node:fs';
import path from 'node:path';
import os from 'node:os';

const router = Router();

// ── NAS configuration ────────────────────────────────────────────────────────
const DEFAULT_NAS_PATH = path.join(os.homedir(), 'arcade-share');

// Determine the NAS share path from environment variables
function getNasPath() {
  // Priority: explicit path > default home folder
  return process.env.NAS_MOUNT_PATH || process.env.NAS_SHARE_PATH || DEFAULT_NAS_PATH;
}

// ── ROM file extensions mapped to platform "slugs" ──────────────────────────
const ROM_EXTENSIONS = {
  nes: '.nes',
  snes: ['.snes', '.smc', '.fig', '.swc'],
  n64: '.n64',
  gbc: '.gbc',
  gba: '.gba',
  genesis: '.gen',
  megadrive: '.gen',
  master_system: '.sms',
  game_gear: '.gg',
  pce: '.pce',
  turbografx16: '.pce',
  ps1: '.cue',
  ps2: '.iso',
  psp: '.iso',
  gamecube: '.gcm',
  wii: '.iso',
  nds: '.nds',
  '3ds': '.3ds',
  switch: '.nsp',
  atari: '.a26',
  arcade: '.zip',
  neo_geo: '.zip',
};

// Friendly display names for each platform slug
const PLATFORM_LABELS = {
  nes: 'NES',
  snes: 'Super NES',
  n64: 'Nintendo 64',
  gbc: 'Game Boy Color',
  gba: 'Game Boy Advance',
  genesis: 'Sega Genesis',
  megadrive: 'Sega Genesis',
  master_system: 'Master System',
  game_gear: 'Game Gear',
  pce: 'TurboGrafx-16',
  turbografx16: 'TurboGrafx-16',
  ps1: 'PlayStation',
  ps2: 'PlayStation 2',
  psp: 'PSP',
  gamecube: 'GameCube',
  wii: 'Wii',
  nds: 'Nintendo DS',
  '3ds': 'Nintendo 3DS',
  switch: 'Nintendo Switch',
  atari: 'Atari',
  arcade: 'Arcade',
  neo_geo: 'Neo Geo',
};

// ── Cover‑art file name priorities ───────────────────────────────────────────
const COVER_PRIORITIES = [
  'cover.png',
  'cover.jpg',
  'cover.jpeg',
  'box.png',
  'box.jpg',
  'box.jpeg',
  'artwork.png',
  'artwork.jpg',
  'artwork.jpeg',
  'poster.png',
  'poster.jpg',
  'poster.jpeg',
  'banner.png',
  'banner.jpg',
  'banner.jpeg',
  'title.png',
  'title.jpg',
  'title.jpeg',
  'thumbnail.png',
  'thumbnail.jpg',
  'fanart.png',
  'fanart.jpg',
];

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Convert a filename to its "platform" slug based on extension. */
function guessPlatformFromExt(filename) {
  const ext = path.extname(filename).toLowerCase();
  for (const [slug, exts] of Object.entries(ROM_EXTENSIONS)) {
    if (Array.isArray(exts)) {
      if (exts.includes(ext)) return slug;
    } else if (ext === exts) return slug;
  }
  return null;
}

/** Convert a filename to its "platform" slug based on folder name heuristics. */
function guessPlatformFromFolder(folderName) {
  const normalized = folderName.toLowerCase().replace(/[-_]/g, ' ');
  for (const [slug] of Object.entries(ROM_EXTENSIONS)) {
    if (normalized.includes(slug)) return slug;
  }
  // Map common folder names
  const folderMap = {
    'nintendo entertainment system': 'nes',
    'super nintendo': 'snes',
    'nintendo 64': 'n64',
    'game boy advance': 'gba',
    'game boy color': 'gbc',
    'game boy': 'gb',
    segagenesis: 'genesis',
    segamastersystem: 'master_system',
    gamegear: 'game_gear',
    segacd: 'pce',
    'sega saturn': 'saturn',
    playstation: 'ps1',
    playstation2: 'ps2', psp: 'psp',
    gamecube: 'gamecube', wii: 'wii',
    'nintendo ds': 'nds',
    'nintendo 3ds': '3ds',
    'nintendo switch': 'switch',
    atari: 'atari', arcade: 'arcade', neogeo: 'neo_geo',
  };
  for (const [key, value] of Object.entries(folderMap)) {
    if (normalized.includes(key)) return value;
  }
  return null;
}

/** Find a cover‑art image for a game directory. */
async function findCoverArt(gameDir) {
  try {
    const entries = await fs.readdir(gameDir, { withFileTypes: true });

    // 1️⃣ Look for named cover files in the root of the game folder
    for (const entry of entries) {
      if (!entry.isFile()) continue;
      const low = entry.name.toLowerCase();
      for (const name of COVER_PRIORITIES) {
        if (low === name) {
          return `/api/nas/cover/${encodeURIComponent(gameDir)}/${encodeURIComponent(entry.name)}`;
        }
      }
    }

    // 2️⃣ Look inside common sub‑folders (Cover, Artwork, Box, Poster)
    const subFolders = ['cover', 'artwork', 'box', 'poster', 'art', 'covers', 'boxes', 'posters'];
    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      const low = entry.name.toLowerCase();
      if (subFolders.some(f => low.includes(f))) {
        try {
          const subEntries = await fs.readdir(path.join(gameDir, entry.name), {
            withFileTypes: true,
          });
          for (const sub of subEntries) {
            if (!sub.isFile()) continue;
            const low2 = sub.name.toLowerCase();
            if (/\.(png|jpe?g)$/i.test(low2)) {
              return `/api/nas/cover/${encodeURIComponent(path.join(gameDir, entry.name))}/${encodeURIComponent(sub.name)}`;
            }
          }
        } catch {
          // ignore
        }
      }
    }

    // 3️⃣ Fall back to any .png/.jpg in the game folder
    for (const entry of entries) {
      if (!entry.isFile()) continue;
      if (/\.(png|jpe?g)$/i.test(entry.name)) {
        return `/api/nas/cover/${encodeURIComponent(gameDir)}/${encodeURIComponent(entry.name)}`;
      }
    }
  } catch {
    // If the folder can’t be read just return null
  }
  return null;
}

/** Scan a directory tree and return games grouped by platform. */
async function scanDirectory(nasPath) {
  const allGames = [];
  const platformsMap = new Map(); // slug -> {slug, name, fs_name}
  const seenIds = new Set();

  try {
    const rootEntries = await fs.readdir(nasPath, { withFileTypes: true });

    for (const rootEntry of rootEntries) {
      if (!rootEntry.isDirectory()) continue;
      const rootPath = path.join(nasPath, rootEntry.name);

      // Treat each top‑level directory as a “console / platform”
      const platform = guessPlatformFromFolder(rootEntry.name) || guessPlatformFromExt(rootEntry.name);
      if (!platform) continue; // skip folders we don’t recognise

      // Ensure the platform is recorded
      if (!platformsMap.has(platform)) {
        platformsMap.set(platform, {
          slug: platform,
          name: PLATFORM_LABELS[platform] || platform.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
          fs_name: rootEntry.name,
        });
      }

      // Scan for ROM files inside this console folder
      try {
        const entries = await fs.readdir(rootPath, { withFileTypes: true });

        for (const entry of entries) {
          if (entry.isDirectory()) {
            // It could be a sub‑folder of ROMs – recurse into it
            const subGames = await scanGameSubdir(path.join(rootPath, entry.name), platform);
            for (const g of subGames) {
              const idKey = `${g.platform}-${g.name}-${g.file_name}`;
              if (!seenIds.has(idKey)) {
                seenIds.add(idKey);
                allGames.push(g);
              }
            }
          } else if (entry.isFile()) {
            const ext = path.extname(entry.name).toLowerCase();
            const romExts = ROM_EXTENSIONS[platform];
            const matchesExt = romExts
              ? (Array.isArray(romExts) ? romExts.includes(ext) : romExts === ext)
              : false;

            if (matchesExt) {
              const gameName = path.basename(entry.name, ext);
              const stat = await fs.stat(path.join(rootPath, entry.name));
              const cover = await findCoverArt(path.join(rootPath, entry.name));

              const game = {
                id: `${platform}-${gameName}`.replace(/[^a-zA-Z0-9]/g, '-'),
                name: gameName,
                file_name: entry.name,
                platform,
                platform_slug: platform,
                platform_display_name: PLATFORM_LABELS[platform] || platform.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
                fs_name: rootEntry.name,
                path_cover: cover,
                size: stat.size,
                fs_size_bytes: stat.size,
                created_at: Math.floor(stat.ctimeMs / 1000),
                modified_at: Math.floor(stat.mtimeMs / 1000),
              };
              allGames.push(game);
            }
          }
        }
      } catch (err) {
        // silently skip folders we can’t read
      }
    }
  } catch (err) {
    // If the root share can’t be read, just return empty results
  }

  return { games: allGames, platforms: Array.from(platformsMap.values()) };
}

/** Recursively scan a sub‑directory for ROM files. */
async function scanGameSubdir(dirPath, platform) {
  const games = [];
  try {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isDirectory()) {
        // Keep recursing
        const subGames = await scanGameSubdir(path.join(dirPath, entry.name), platform);
        games.push(...subGames);
      } else if (entry.isFile()) {
        const ext = path.extname(entry.name).toLowerCase();
        const romExts = ROM_EXTENSIONS[platform];
        const matchesExt = romExts
          ? (Array.isArray(romExts) ? romExts.includes(ext) : romExts === ext)
          : false;

        if (matchesExt) {
          const gameName = path.basename(entry.name, ext);
          const fullPath = path.join(dirPath, entry.name);
          const stat = await fs.stat(fullPath);
          const cover = await findCoverArt(fullPath);

          games.push({
            id: `${platform}-${gameName}`.replace(/[^a-zA-Z0-9]/g, '-'),
            name: gameName,
            file_name: entry.name,
            platform,
            platform_slug: platform,
            platform_display_name: PLATFORM_LABELS[platform] || platform.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
            fs_name: path.basename(dirPath),
            path_cover: cover,
            size: stat.size,
            fs_size_bytes: stat.size,
            created_at: Math.floor(stat.ctimeMs / 1000),
            modified_at: Math.floor(stat.mtimeMs / 1000),
          });
        }
      }
    }
  } catch {
    // silently skip
  }
  return games;
}

// ── API Routes ───────────────────────────────────────────────────────────────

/** GET /api/nas/config – returns NAS share configuration status. */
router.get('/config', (_req, res) => {
  const nasPath = getNasPath();
  res.json({
    configured: nasPath !== DEFAULT_NAS_PATH,
    path: nasPath,
    source: nasPath.startsWith('/') ? 'local-mount' : 'smb-url',
  });
});

/** GET /api/nas/platforms – list all consoles found on the share. */
router.get('/platforms', async (_req, res) => {
  try {
    const nasPath = getNasPath();
    const { platforms } = await scanDirectory(nasPath);
    res.json({ platforms, source: 'filesystem' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/** GET /api/nas/library – list ALL games from the share. */
router.get('/library', async (_req, res) => {
  try {
    const nasPath = getNasPath();
    const { games, platforms } = await scanDirectory(nasPath);
    res.json({ items: games, platforms, source: 'filesystem' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/** GET /api/nas/library/:platform – list games for a specific console. */
router.get('/library/:platform', async (req, res) => {
  try {
    const nasPath = getNasPath();
    const { games } = await scanDirectory(nasPath);
    const filtered = games.filter(g => g.platform === req.params.platform);
    res.json({ items: filtered, source: 'filesystem' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/** GET /api/nas/cover/:path(*) – proxy a cover‑art image from the NAS share. */
router.get('/cover/:path(*)', async (req, res) => {
  try {
    const nasPath = getNasPath();
    if (!nasPath) {
      return res.status(400).json({ error: 'NAS share not configured' });
    }

    // Resolve the full path and guard against path‑traversal
    const fullPath = path.resolve(nasPath, req.params.path);
    if (!fullPath.startsWith(nasPath)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    await fs.access(fullPath);
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Cache-Control', 'public, max-age=86400');
    res.setHeader('Access-Control-Allow-Origin', '*');

    const stream = fsSync.createReadStream(fullPath);
    stream.on('error', () => res.status(404).json({ error: 'Cover not found' }));
    stream.pipe(res);
  } catch (err) {
    res.status(404).json({ error: 'Cover not found' });
  }
});

/** GET /api/nas/share – return the configured NAS share path (masked for security). */
router.get('/share', (_req, res) => {
  const nasPath = getNasPath();
  res.json({ path: nasPath || 'not configured' });
});

export default router;