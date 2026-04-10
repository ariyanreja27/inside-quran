import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const PUBLIC_DATA = path.join(ROOT, 'public', 'data');
const INSIDE_QURAN_JSON = path.join(ROOT, 'Inside-Quran.json');
const ALQURAN_BASE = 'https://api.alquran.cloud/v1';

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

const BISMILLAH_1 = 'بِسۡمِ ٱللَّهِ ٱلرَّحۡمَـٰنِ ٱلرَّحِیمِ';
const BISMILLAH_2 = 'بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ';

function stripBismillah(text, surahNumber, verseInSurah) {
  if (surahNumber !== 1 && verseInSurah === 1) {
    if (text.startsWith(BISMILLAH_1)) return text.substring(BISMILLAH_1.length).trim();
    if (text.startsWith(BISMILLAH_2)) return text.substring(BISMILLAH_2.length).trim();
    // Tajweed bismillah might have tags like:
    // بِسْمِ [h:1[ٱ]للَّهِ [h:2[ٱ][l[ل]رَّحْمَ[n[ـٰ]نِ [h:3[ٱ][l[ل]رَّح[p[ِي]مِ
    const bismillahTajweed = 'بِسْمِ [h:1[ٱ]للَّهِ [h:2[ٱ][l[ل]رَّحْمَ[n[ـٰ]نِ [h:3[ٱ][l[ل]رَّح[p[ِي]مِ';
    if (text.startsWith(bismillahTajweed)) return text.substring(bismillahTajweed.length).trim();
    
    // Also try removing bismillah without tajweed
    // In tajweed string it is literally string matched
    const bn = 'بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ'.replace(/\u0652/g, '\u06E1').replace(/\u064A/g, '\u06CC').replace(/\u0649/g, '\u06CC').replace(/\u0653/g, '\u06E4');
    if (text.startsWith(bn)) return text.substring(bn.length).trim();
  }
  return text;
}

async function patch() {
  console.log('Loading Inside-Quran.json...');
  let insideQuran = JSON.parse(fs.readFileSync(INSIDE_QURAN_JSON, 'utf8'));

  ensureDir(path.join(PUBLIC_DATA, 'tajweed'));

  for (const surah of insideQuran.surahs) {
    const n = surah.surah_number;
    const name = surah.surah_name;
    const slug = `${String(n).padStart(3, '0')}-${slugify(name)}.json`;

    console.log(`[${n}] Fetching tajweed text...`);
    const tajweedData = await fetchWithRetry(`${ALQURAN_BASE}/surah/${n}/quran-tajweed`);
    
    const tajweedVerses = tajweedData.data.ayahs.map(a => ({
      numberInSurah: a.numberInSurah,
      text: stripBismillah(a.text, n, a.numberInSurah)
    }));

    writeJson(path.join(PUBLIC_DATA, 'tajweed', slug), {
       surahNumber: n,
       edition: 'quran-tajweed',
       verses: tajweedVerses
    });

    const tajweedMap = {};
    tajweedVerses.forEach(v => tajweedMap[v.numberInSurah] = v.text);

    for (const verse of surah.verses) {
      if (tajweedMap[verse.verse]) {
        verse.arabic_tajweed = tajweedMap[verse.verse];
      }
    }

    await delay(300); // Polite delay
  }

  console.log('Updating Inside-Quran.json with arabic_tajweed...');
  fs.writeFileSync(INSIDE_QURAN_JSON, JSON.stringify(insideQuran, null, 2), 'utf8');
  console.log('Done!');
}

patch().catch(console.error);
