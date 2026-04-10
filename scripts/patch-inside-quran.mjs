import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const PUBLIC_DATA = path.join(ROOT, 'public', 'data');
const INSIDE_QURAN_JSON = path.join(ROOT, 'Inside-Quran.json');

function slugify(name) {
  return name
    .toLowerCase()
    .replace(/['']/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

async function patch() {
  console.log('Loading Inside-Quran.json...');
  let insideQuran = JSON.parse(fs.readFileSync(INSIDE_QURAN_JSON, 'utf8'));

  // 1. Fetch Roman Urdu bulk data
  console.log('Fetching Roman Urdu bulk translations...');
  const res = await fetch('https://api.quran.com/api/v4/quran/translations/831');
  const urduData = await res.json();
  const urduArray = urduData.translations; // 6236 items

  let globalVerseIndex = 0;
  
  for (const surah of insideQuran.surahs) {
    const sNum = surah.surah_number;
    const sName = surah.surah_name;
    const slug = `${String(sNum).padStart(3, '0')}-${slugify(sName)}.json`;

    // Load local hindi translation file
    let hiWb = {};
    try {
      const hiData = JSON.parse(fs.readFileSync(path.join(PUBLIC_DATA, 'translations', 'hi', slug), 'utf8'));
      hiData.verses.forEach(v => hiWb[v.numberInSurah] = v.text);
    } catch {}

    // Load word-by-word file
    let wbwData = {};
    try {
      const wData = JSON.parse(fs.readFileSync(path.join(PUBLIC_DATA, 'word-by-word', slug), 'utf8'));
      wData.verses.forEach(v => wbwData[v.numberInSurah] = v.words);
    } catch {}

    for (const verse of surah.verses) {
      const vNum = verse.verse;

      // 1. Urdu Translation (Roman)
      if (globalVerseIndex < urduArray.length) {
        verse.translations.ur = urduArray[globalVerseIndex].text;
      }

      // 2. Hindi Translation
      if (hiWb[vNum]) {
        verse.translations.hi = hiWb[vNum];
      }

      // 3. Transliterations
      const enTrans = verse.translations.transliteration?.en || '';
      verse.translations.transliteration = {
        en: enTrans,
        bn: enTrans,
        hi: enTrans,
        ur: enTrans
      };

      // 4. Word-by-word array
      if (wbwData[vNum]) {
        verse.word_by_word = wbwData[vNum];
      }

      globalVerseIndex++;
    }
  }

  console.log(`Updated ${globalVerseIndex} verses in Inside-Quran.json`);
  fs.writeFileSync(INSIDE_QURAN_JSON, JSON.stringify(insideQuran, null, 2), 'utf8');
}

patch().catch(console.error);
