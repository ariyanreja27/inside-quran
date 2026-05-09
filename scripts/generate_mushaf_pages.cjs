const https = require('https');
const fs = require('fs');
const path = require('path');

const OUTPUT_DIR = path.join(__dirname, '../public/data/mushaf');

// Promisify https.get with retry
async function fetchJson(url, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      return await new Promise((resolve, reject) => {
        https.get(url, { headers: { 'User-Agent': 'Node' } }, (res) => {
          if (res.statusCode !== 200) {
            return reject(new Error(`Failed to fetch: ${res.statusCode}`));
          }
          let data = '';
          res.on('data', (chunk) => { data += chunk; });
          res.on('end', () => {
            try {
              resolve(JSON.parse(data));
            } catch (e) {
              reject(e);
            }
          });
        }).on('error', reject);
      });
    } catch (e) {
      if (i === retries - 1) throw e;
      await new Promise(r => setTimeout(r, 1000));
    }
  }
}

async function fetchPage(pageNum) {
  const url = `https://api.quran.com/api/v4/verses/by_page/${pageNum}?words=true&word_fields=text_uthmani,text_uthmani_tajweed,line_number`;
  const data = await fetchJson(url);
  const lines = {};
  data.verses.forEach(verse => {
    verse.words.forEach(word => {
      const ln = word.line_number;
      if (!lines[ln]) lines[ln] = [];
      lines[ln].push({
        id: word.id,
        position: word.position,
        text_uthmani: word.text_uthmani,
        text_tajweed: word.text_uthmani_tajweed,
        char_type_name: word.char_type_name,
        verse_key: verse.verse_key
      });
    });
  });
  const sortedLines = {};
  Object.keys(lines).map(Number).sort((a,b) => a-b).forEach(k => {
    sortedLines[k] = lines[k];
  });
  return { page_number: pageNum, lines: sortedLines };
}

async function main() {
  const meta = { surah_start_pages: {} };
  for (let i = 1; i <= 604; i++) {
    try {
      const res = await fetchPage(i);
      const filePath = path.join(OUTPUT_DIR, `page_${res.page_number}.json`);
      fs.writeFileSync(filePath, JSON.stringify(res, null, 2));
      const firstLine = Object.values(res.lines)[0];
      if (firstLine && firstLine[0]) {
          const firstVerseKey = firstLine[0].verse_key;
          if (firstVerseKey) {
              const [surah] = firstVerseKey.split(':');
              if (!meta.surah_start_pages[surah]) {
                  meta.surah_start_pages[surah] = res.page_number;
              }
          }
      }
      if (i % 20 === 0) console.log(`Fetched page ${i}/604`);
    } catch (err) {
      console.error(`Error on page ${i}:`, err.message);
    }
  }
  const metaPath = path.join(__dirname, '../public/data/mushaf_meta.json');
  fs.writeFileSync(metaPath, JSON.stringify(meta, null, 2));
  console.log('Finished generating Mushaf pages!');
}

main();
