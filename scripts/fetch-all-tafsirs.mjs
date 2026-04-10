import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const PUBLIC_DATA = path.join(ROOT, 'public', 'data');
const QURANCOM_BASE = 'https://api.quran.com/api/v4';
const SPA5K_BASE = 'https://cdn.jsdelivr.net/gh/spa5k/tafsir_api@main/tafsir';

const QURANCOM_TAFSIRS = [
  // English
  { id: 169, slug: 'en-ibn-kathir', lang: 'en', name: 'Ibn Kathir (Abridged)' },
  { id: 168, slug: 'en-maarif-ul-quran', lang: 'en', name: "Ma'arif al-Qur'an" },
  // Bengali
  { id: 164, slug: 'bn-ibn-kathir', lang: 'bn', name: 'Tafseer Ibn Kathir' },
  { id: 166, slug: 'bn-abu-bakr-zakaria', lang: 'bn', name: 'Tafsir Abu Bakr Zakaria' },
  { id: 165, slug: 'bn-ahsanul-bayaan', lang: 'bn', name: 'Tafsir Ahsanul Bayaan' },
  { id: 381, slug: 'bn-fathul-majid', lang: 'bn', name: 'Tafsir Fathul Majid' },
  // Urdu
  { id: 160, slug: 'ur-ibn-kathir', lang: 'ur', name: 'Tafsir Ibn Kathir' }
];

const SPA5K_TAFSIRS = [
  // English
  { sourceId: 'en-al-jalalayn', slug: 'en-al-jalalayn', lang: 'en', name: 'Al-Jalalayn' }
];

const delay = (ms) => new Promise(res => setTimeout(res, ms));

async function fetchWithRetry(url, retries = 3, delayMs = 1500) {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
      return await res.json();
    } catch (err) {
      if (i < retries - 1) {
        console.warn(`  ⚠ Retry ${i + 1} for ${url}`);
        await delay(delayMs * (i + 1));
      } else {
        console.error(`Failed to fetch ${url} completely.`);
        return null; // Don't crash entirely
      }
    }
  }
}

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function writeJson(filePath, data) {
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
}

function slugify(name) {
  return name.toLowerCase().replace(/['']/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

async function run() {
  const surahsFile = path.join(PUBLIC_DATA, 'meta', 'surahs.json');
  if (!fs.existsSync(surahsFile)) {
    console.error("surahs.json not found!");
    process.exit(1);
  }
  const surahList = JSON.parse(fs.readFileSync(surahsFile, 'utf8'));

  // 1. Process quran.com sources
  for (const tConfig of QURANCOM_TAFSIRS) {
    const dir = path.join(PUBLIC_DATA, 'tafsirs', tConfig.slug);
    ensureDir(dir);
    console.log(`\n=== Fetching Quran.com Tafsir: ${tConfig.name} ===`);

    for (const surah of surahList) {
      const n = surah.number;
      const slugName = `${String(n).padStart(3, '0')}-${slugify(surah.name)}.json`;
      const filePath = path.join(dir, slugName);

      // Skip if already downloaded from previous runs correctly
      if (fs.existsSync(filePath)) {
          // Check if valid JSON logic could go here, but bypass for speed for now unless needed
          continue;
      }

      console.log(`[${tConfig.slug}] Surah ${n}...`);
      const url = `${QURANCOM_BASE}/tafsirs/${tConfig.id}/by_chapter/${n}?per_page=500`;
      const data = await fetchWithRetry(url);

      if (data && data.tafsirs) {
        const localized = {
          surahNumber: n,
          edition: tConfig.slug,
          tafsir_id: tConfig.id,
          verses: data.tafsirs.map(t => ({
            verse_number: t.verse_id, 
            verse_key: t.verse_key,
            text: t.text
          }))
        };
        writeJson(filePath, localized);
      }
      await delay(300); // 3 requests per second limit
    }
  }

  // 2. Process spa5k sources
  for (const tConfig of SPA5K_TAFSIRS) {
    const dir = path.join(PUBLIC_DATA, 'tafsirs', tConfig.slug);
    ensureDir(dir);
    console.log(`\n=== Fetching Spa5k Tafsir: ${tConfig.name} ===`);

    for (const surah of surahList) {
      const n = surah.number;
      const slugName = `${String(n).padStart(3, '0')}-${slugify(surah.name)}.json`;
      const filePath = path.join(dir, slugName);

      if (fs.existsSync(filePath)) continue;

      console.log(`[${tConfig.slug}] Surah ${n}...`);
      const url = `${SPA5K_BASE}/${tConfig.sourceId}/${n}.json`;
      const data = await fetchWithRetry(url);

      if (data && data.ayahs) {
        const localized = {
          surahNumber: n,
          edition: tConfig.slug,
          tafsir_id: tConfig.sourceId,
          verses: data.ayahs.map(a => ({
            verse_number: a.ayah,
            verse_key: `${n}:${a.ayah}`,
            text: a.text
          }))
        };
        writeJson(filePath, localized);
      }
      await delay(200);
    }
  }

  console.log('\nAll tafsirs downloaded successfully.');
}

run().catch(console.error);
