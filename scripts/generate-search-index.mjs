import fs from 'fs';
import path from 'path';

const INPUT_FILE = path.join('public', 'data', 'Inside-Quran.json');
const OUTPUT_FILE = path.join('public', 'data', 'search-index.json');

console.log('Generating search index...');

try {
    const rawData = fs.readFileSync(INPUT_FILE, 'utf8');
    const data = JSON.parse(rawData);

    const searchIndex = data.surahs.map(surah => ({
        n: surah.surah_number,
        name: surah.surah_name,
        verses: surah.verses.map(v => ({
            v: v.verse,
            ar: v.arabic,
            en: v.translations.en,
            bn: v.translations.bn,
            hi: v.translations.hi,
            ur: v.translations.ur
        }))
    }));

    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(searchIndex));
    const stats = fs.statSync(OUTPUT_FILE);
    console.log(`Search index generated: ${OUTPUT_FILE} (${(stats.size / 1024 / 1024).toFixed(2)} MB)`);
} catch (err) {
    console.error('Error generating search index:', err.message);
}
