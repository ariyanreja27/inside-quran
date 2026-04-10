import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const PUBLIC_DATA = path.join(ROOT, 'public', 'data');
const QURANCOM_BASE = 'https://api.quran.com/api/v4';

const delay = (ms) => new Promise(res => setTimeout(res, ms));

async function fetchWithRetry(url, retries = 3, delayMs = 1500) {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
      return await res.json();
    } catch (err) {
      if (i < retries - 1) {
        console.warn(`  ⚠ Retry ${i + 1}/${retries - 1} for ${url}: ${err.message}`);
        await delay(delayMs * (i + 1));
      } else {
        throw err;
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
    console.error("surahs.json not found! Please run fetch-quran-data.mjs first.");
    process.exit(1);
  }

  const surahList = JSON.parse(fs.readFileSync(surahsFile, 'utf8'));

  ensureDir(path.join(PUBLIC_DATA, 'tafsirs', 'en-ibn-kathir'));

  for (const surah of surahList) {
    const n = surah.number;
    const slug = `${String(n).padStart(3, '0')}-${slugify(surah.name)}.json`;
    console.log(`[${n}] Fetching Ibn Kathir Tafsir...`);

    // Fetch tafsir for the whole chapter with per_page 500 to get it all in 1 request
    const url = `${QURANCOM_BASE}/tafsirs/169/by_chapter/${n}?per_page=500`;
    const data = await fetchWithRetry(url);

    if (data && data.tafsirs) {
      // Structure the data to match { surahNumber, tafsir_edition: '169', verses: [ { verse_number, text: '...' } ] }
      const localized = {
        surahNumber: n,
        edition: 'en-ibn-kathir',
        tafsir_id: 169,
        verses: data.tafsirs.map(t => ({
          verse_number: t.verse_id, 
          verse_key: t.verse_key,
          text: t.text
        }))
      };

      writeJson(path.join(PUBLIC_DATA, 'tafsirs', 'en-ibn-kathir', slug), localized);
    }

    await delay(300); // Polite rate limit
  }

  console.log('All tafsirs downloaded successfully.');
}

run().catch(console.error);
