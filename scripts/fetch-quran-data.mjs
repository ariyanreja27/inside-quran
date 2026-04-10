/**
 * fetch-quran-data.mjs
 *
 * One-time script to export all Quran API data to local JSON files.
 * Run with: node scripts/fetch-quran-data.mjs
 *
 * Outputs:
 *   public/data/meta/surahs.json
 *   public/data/arabic/{NNN}-{slug}.json        (114 files)
 *   public/data/translations/en/{NNN}-{slug}.json  (114 files)
 *   public/data/translations/bn/{NNN}-{slug}.json  (114 files)
 *   public/data/translations/hi/{NNN}-{slug}.json  (114 files)
 *   public/data/translations/ur/{NNN}-{slug}.json  (114 files)
 *   public/data/waqf/{NNN}-{slug}.json          (114 files)
 *   public/data/word-by-word/{NNN}-{slug}.json   (114 files)
 *
 * Also fills: Inside-Quran.json (arabic + waqf_end + bn translation)
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const PUBLIC_DATA = path.join(ROOT, 'public', 'data');
const INSIDE_QURAN_JSON = path.join(ROOT, 'Inside-Quran.json');

// ─── API Base URLs ────────────────────────────────────────────────────────────
const ALQURAN_BASE = 'https://api.alquran.cloud/v1';
const QURANCOM_BASE = 'https://api.quran.com/api/v4';

// ─── Surah metadata (mirrors src/data/quranMeta.ts) ──────────────────────────
const SURAH_LIST = [
  { number: 1,  name: "Al-Fatihah",    nameArabic: "الفاتحة",     meaning: "The Opening",              verseCount: 7,   type: "Meccan",  juz: [1] },
  { number: 2,  name: "Al-Baqarah",    nameArabic: "البقرة",      meaning: "The Cow",                  verseCount: 286, type: "Medinan", juz: [1,2,3] },
  { number: 3,  name: "Ali 'Imran",    nameArabic: "آل عمران",    meaning: "Family of Imran",          verseCount: 200, type: "Medinan", juz: [3,4] },
  { number: 4,  name: "An-Nisa",       nameArabic: "النساء",      meaning: "The Women",                verseCount: 176, type: "Medinan", juz: [4,5,6] },
  { number: 5,  name: "Al-Ma'idah",    nameArabic: "المائدة",     meaning: "The Table Spread",         verseCount: 120, type: "Medinan", juz: [6,7] },
  { number: 6,  name: "Al-An'am",      nameArabic: "الأنعام",     meaning: "The Cattle",               verseCount: 165, type: "Meccan",  juz: [7,8] },
  { number: 7,  name: "Al-A'raf",      nameArabic: "الأعراف",     meaning: "The Heights",              verseCount: 206, type: "Meccan",  juz: [8,9] },
  { number: 8,  name: "Al-Anfal",      nameArabic: "الأنفال",     meaning: "The Spoils of War",        verseCount: 75,  type: "Medinan", juz: [9,10] },
  { number: 9,  name: "At-Tawbah",     nameArabic: "التوبة",      meaning: "The Repentance",           verseCount: 129, type: "Medinan", juz: [10,11] },
  { number: 10, name: "Yunus",         nameArabic: "يونس",        meaning: "Jonah",                    verseCount: 109, type: "Meccan",  juz: [11] },
  { number: 11, name: "Hud",           nameArabic: "هود",          meaning: "Hud",                      verseCount: 123, type: "Meccan",  juz: [11,12] },
  { number: 12, name: "Yusuf",         nameArabic: "يوسف",        meaning: "Joseph",                   verseCount: 111, type: "Meccan",  juz: [12,13] },
  { number: 13, name: "Ar-Ra'd",       nameArabic: "الرعد",       meaning: "The Thunder",              verseCount: 43,  type: "Medinan", juz: [13] },
  { number: 14, name: "Ibrahim",       nameArabic: "إبراهيم",     meaning: "Abraham",                  verseCount: 52,  type: "Meccan",  juz: [13] },
  { number: 15, name: "Al-Hijr",       nameArabic: "الحجر",       meaning: "The Rocky Tract",          verseCount: 99,  type: "Meccan",  juz: [14] },
  { number: 16, name: "An-Nahl",       nameArabic: "النحل",       meaning: "The Bee",                  verseCount: 128, type: "Meccan",  juz: [14] },
  { number: 17, name: "Al-Isra",       nameArabic: "الإسراء",     meaning: "The Night Journey",        verseCount: 111, type: "Meccan",  juz: [15] },
  { number: 18, name: "Al-Kahf",       nameArabic: "الكهف",       meaning: "The Cave",                 verseCount: 110, type: "Meccan",  juz: [15,16] },
  { number: 19, name: "Maryam",        nameArabic: "مريم",        meaning: "Mary",                     verseCount: 98,  type: "Meccan",  juz: [16] },
  { number: 20, name: "Taha",          nameArabic: "طه",           meaning: "Ta-Ha",                    verseCount: 135, type: "Meccan",  juz: [16] },
  { number: 21, name: "Al-Anbiya",     nameArabic: "الأنبياء",    meaning: "The Prophets",             verseCount: 112, type: "Meccan",  juz: [17] },
  { number: 22, name: "Al-Hajj",       nameArabic: "الحج",        meaning: "The Pilgrimage",           verseCount: 78,  type: "Medinan", juz: [17] },
  { number: 23, name: "Al-Mu'minun",   nameArabic: "المؤمنون",    meaning: "The Believers",            verseCount: 118, type: "Meccan",  juz: [18] },
  { number: 24, name: "An-Nur",        nameArabic: "النور",       meaning: "The Light",                verseCount: 64,  type: "Medinan", juz: [18] },
  { number: 25, name: "Al-Furqan",     nameArabic: "الفرقان",     meaning: "The Criterion",            verseCount: 77,  type: "Meccan",  juz: [18,19] },
  { number: 26, name: "Ash-Shu'ara",   nameArabic: "الشعراء",     meaning: "The Poets",                verseCount: 227, type: "Meccan",  juz: [19] },
  { number: 27, name: "An-Naml",       nameArabic: "النمل",       meaning: "The Ant",                  verseCount: 93,  type: "Meccan",  juz: [19,20] },
  { number: 28, name: "Al-Qasas",      nameArabic: "القصص",       meaning: "The Stories",              verseCount: 88,  type: "Meccan",  juz: [20] },
  { number: 29, name: "Al-Ankabut",    nameArabic: "العنكبوت",    meaning: "The Spider",               verseCount: 69,  type: "Meccan",  juz: [20,21] },
  { number: 30, name: "Ar-Rum",        nameArabic: "الروم",       meaning: "The Romans",               verseCount: 60,  type: "Meccan",  juz: [21] },
  { number: 31, name: "Luqman",        nameArabic: "لقمان",       meaning: "Luqman",                   verseCount: 34,  type: "Meccan",  juz: [21] },
  { number: 32, name: "As-Sajdah",     nameArabic: "السجدة",      meaning: "The Prostration",          verseCount: 30,  type: "Meccan",  juz: [21] },
  { number: 33, name: "Al-Ahzab",      nameArabic: "الأحزاب",     meaning: "The Combined Forces",      verseCount: 73,  type: "Medinan", juz: [21,22] },
  { number: 34, name: "Saba",          nameArabic: "سبأ",          meaning: "Sheba",                    verseCount: 54,  type: "Meccan",  juz: [22] },
  { number: 35, name: "Fatir",         nameArabic: "فاطر",        meaning: "Originator",               verseCount: 45,  type: "Meccan",  juz: [22] },
  { number: 36, name: "Ya-Sin",        nameArabic: "يس",           meaning: "Ya Sin",                   verseCount: 83,  type: "Meccan",  juz: [22,23] },
  { number: 37, name: "As-Saffat",     nameArabic: "الصافات",     meaning: "Those who set the Ranks",  verseCount: 182, type: "Meccan",  juz: [23] },
  { number: 38, name: "Sad",           nameArabic: "ص",            meaning: "The Letter Sad",           verseCount: 88,  type: "Meccan",  juz: [23] },
  { number: 39, name: "Az-Zumar",      nameArabic: "الزمر",       meaning: "The Troops",               verseCount: 75,  type: "Meccan",  juz: [23,24] },
  { number: 40, name: "Ghafir",        nameArabic: "غافر",        meaning: "The Forgiver",             verseCount: 85,  type: "Meccan",  juz: [24] },
  { number: 41, name: "Fussilat",      nameArabic: "فصلت",        meaning: "Explained in Detail",      verseCount: 54,  type: "Meccan",  juz: [24,25] },
  { number: 42, name: "Ash-Shura",     nameArabic: "الشورى",      meaning: "The Consultation",         verseCount: 53,  type: "Meccan",  juz: [25] },
  { number: 43, name: "Az-Zukhruf",    nameArabic: "الزخرف",      meaning: "The Ornaments of Gold",    verseCount: 89,  type: "Meccan",  juz: [25] },
  { number: 44, name: "Ad-Dukhan",     nameArabic: "الدخان",      meaning: "The Smoke",                verseCount: 59,  type: "Meccan",  juz: [25] },
  { number: 45, name: "Al-Jathiyah",   nameArabic: "الجاثية",     meaning: "The Crouching",            verseCount: 37,  type: "Meccan",  juz: [25] },
  { number: 46, name: "Al-Ahqaf",      nameArabic: "الأحقاف",     meaning: "The Wind-Curved Sandhills",verseCount: 35,  type: "Meccan",  juz: [26] },
  { number: 47, name: "Muhammad",      nameArabic: "محمد",        meaning: "Muhammad",                 verseCount: 38,  type: "Medinan", juz: [26] },
  { number: 48, name: "Al-Fath",       nameArabic: "الفتح",       meaning: "The Victory",              verseCount: 29,  type: "Medinan", juz: [26] },
  { number: 49, name: "Al-Hujurat",    nameArabic: "الحجرات",     meaning: "The Rooms",                verseCount: 18,  type: "Medinan", juz: [26] },
  { number: 50, name: "Qaf",           nameArabic: "ق",            meaning: "The Letter Qaf",           verseCount: 45,  type: "Meccan",  juz: [26] },
  { number: 51, name: "Adh-Dhariyat",  nameArabic: "الذاريات",    meaning: "The Winnowing Winds",      verseCount: 60,  type: "Meccan",  juz: [26,27] },
  { number: 52, name: "At-Tur",        nameArabic: "الطور",       meaning: "The Mount",                verseCount: 49,  type: "Meccan",  juz: [27] },
  { number: 53, name: "An-Najm",       nameArabic: "النجم",       meaning: "The Star",                 verseCount: 62,  type: "Meccan",  juz: [27] },
  { number: 54, name: "Al-Qamar",      nameArabic: "القمر",       meaning: "The Moon",                 verseCount: 55,  type: "Meccan",  juz: [27] },
  { number: 55, name: "Ar-Rahman",     nameArabic: "الرحمن",      meaning: "The Beneficent",           verseCount: 78,  type: "Medinan", juz: [27] },
  { number: 56, name: "Al-Waqi'ah",    nameArabic: "الواقعة",     meaning: "The Inevitable",           verseCount: 96,  type: "Meccan",  juz: [27] },
  { number: 57, name: "Al-Hadid",      nameArabic: "الحديد",      meaning: "The Iron",                 verseCount: 29,  type: "Medinan", juz: [27] },
  { number: 58, name: "Al-Mujadila",   nameArabic: "المجادلة",    meaning: "The Pleading Woman",       verseCount: 22,  type: "Medinan", juz: [28] },
  { number: 59, name: "Al-Hashr",      nameArabic: "الحشر",       meaning: "The Exile",                verseCount: 24,  type: "Medinan", juz: [28] },
  { number: 60, name: "Al-Mumtahanah", nameArabic: "الممتحنة",    meaning: "She that is to be examined",verseCount: 13, type: "Medinan", juz: [28] },
  { number: 61, name: "As-Saf",        nameArabic: "الصف",        meaning: "The Ranks",                verseCount: 14,  type: "Medinan", juz: [28] },
  { number: 62, name: "Al-Jumu'ah",    nameArabic: "الجمعة",      meaning: "The Congregation",         verseCount: 11,  type: "Medinan", juz: [28] },
  { number: 63, name: "Al-Munafiqun",  nameArabic: "المنافقون",   meaning: "The Hypocrites",           verseCount: 11,  type: "Medinan", juz: [28] },
  { number: 64, name: "At-Taghabun",   nameArabic: "التغابن",     meaning: "The Mutual Disillusion",   verseCount: 18,  type: "Medinan", juz: [28] },
  { number: 65, name: "At-Talaq",      nameArabic: "الطلاق",      meaning: "The Divorce",              verseCount: 12,  type: "Medinan", juz: [28] },
  { number: 66, name: "At-Tahrim",     nameArabic: "التحريم",     meaning: "The Prohibition",          verseCount: 12,  type: "Medinan", juz: [28] },
  { number: 67, name: "Al-Mulk",       nameArabic: "الملك",       meaning: "The Sovereignty",          verseCount: 30,  type: "Meccan",  juz: [29] },
  { number: 68, name: "Al-Qalam",      nameArabic: "القلم",       meaning: "The Pen",                  verseCount: 52,  type: "Meccan",  juz: [29] },
  { number: 69, name: "Al-Haqqah",     nameArabic: "الحاقة",      meaning: "The Reality",              verseCount: 52,  type: "Meccan",  juz: [29] },
  { number: 70, name: "Al-Ma'arij",    nameArabic: "المعارج",     meaning: "The Ascending Stairways",  verseCount: 44,  type: "Meccan",  juz: [29] },
  { number: 71, name: "Nuh",           nameArabic: "نوح",          meaning: "Noah",                     verseCount: 28,  type: "Meccan",  juz: [29] },
  { number: 72, name: "Al-Jinn",       nameArabic: "الجن",        meaning: "The Jinn",                 verseCount: 28,  type: "Meccan",  juz: [29] },
  { number: 73, name: "Al-Muzzammil",  nameArabic: "المزمل",      meaning: "The Enshrouded One",       verseCount: 20,  type: "Meccan",  juz: [29] },
  { number: 74, name: "Al-Muddaththir",nameArabic: "المدثر",      meaning: "The Cloaked One",          verseCount: 56,  type: "Meccan",  juz: [29] },
  { number: 75, name: "Al-Qiyamah",    nameArabic: "القيامة",     meaning: "The Resurrection",         verseCount: 40,  type: "Meccan",  juz: [29] },
  { number: 76, name: "Al-Insan",      nameArabic: "الإنسان",     meaning: "The Man",                  verseCount: 31,  type: "Medinan", juz: [29] },
  { number: 77, name: "Al-Mursalat",   nameArabic: "المرسلات",    meaning: "The Emissaries",           verseCount: 50,  type: "Meccan",  juz: [29] },
  { number: 78, name: "An-Naba",       nameArabic: "النبأ",        meaning: "The Tidings",              verseCount: 40,  type: "Meccan",  juz: [30] },
  { number: 79, name: "An-Nazi'at",    nameArabic: "النازعات",    meaning: "Those who drag forth",     verseCount: 46,  type: "Meccan",  juz: [30] },
  { number: 80, name: "Abasa",         nameArabic: "عبس",          meaning: "He Frowned",               verseCount: 42,  type: "Meccan",  juz: [30] },
  { number: 81, name: "At-Takwir",     nameArabic: "التكوير",     meaning: "The Overthrowing",         verseCount: 29,  type: "Meccan",  juz: [30] },
  { number: 82, name: "Al-Infitar",    nameArabic: "الانفطار",    meaning: "The Cleaving",             verseCount: 19,  type: "Meccan",  juz: [30] },
  { number: 83, name: "Al-Mutaffifin", nameArabic: "المطففين",    meaning: "The Defrauding",           verseCount: 36,  type: "Meccan",  juz: [30] },
  { number: 84, name: "Al-Inshiqaq",   nameArabic: "الانشقاق",    meaning: "The Sundering",            verseCount: 25,  type: "Meccan",  juz: [30] },
  { number: 85, name: "Al-Buruj",      nameArabic: "البروج",      meaning: "The Mansions of the Stars",verseCount: 22,  type: "Meccan",  juz: [30] },
  { number: 86, name: "At-Tariq",      nameArabic: "الطارق",      meaning: "The Morning Star",         verseCount: 17,  type: "Meccan",  juz: [30] },
  { number: 87, name: "Al-A'la",       nameArabic: "الأعلى",      meaning: "The Most High",            verseCount: 19,  type: "Meccan",  juz: [30] },
  { number: 88, name: "Al-Ghashiyah",  nameArabic: "الغاشية",     meaning: "The Overwhelming",         verseCount: 26,  type: "Meccan",  juz: [30] },
  { number: 89, name: "Al-Fajr",       nameArabic: "الفجر",       meaning: "The Dawn",                 verseCount: 30,  type: "Meccan",  juz: [30] },
  { number: 90, name: "Al-Balad",      nameArabic: "البلد",       meaning: "The City",                 verseCount: 20,  type: "Meccan",  juz: [30] },
  { number: 91, name: "Ash-Shams",     nameArabic: "الشمس",       meaning: "The Sun",                  verseCount: 15,  type: "Meccan",  juz: [30] },
  { number: 92, name: "Al-Layl",       nameArabic: "الليل",       meaning: "The Night",                verseCount: 21,  type: "Meccan",  juz: [30] },
  { number: 93, name: "Ad-Duha",       nameArabic: "الضحى",       meaning: "The Morning Hours",        verseCount: 11,  type: "Meccan",  juz: [30] },
  { number: 94, name: "Ash-Sharh",     nameArabic: "الشرح",       meaning: "The Relief",               verseCount: 8,   type: "Meccan",  juz: [30] },
  { number: 95, name: "At-Tin",        nameArabic: "التين",       meaning: "The Fig",                  verseCount: 8,   type: "Meccan",  juz: [30] },
  { number: 96, name: "Al-Alaq",       nameArabic: "العلق",       meaning: "The Clot",                 verseCount: 19,  type: "Meccan",  juz: [30] },
  { number: 97, name: "Al-Qadr",       nameArabic: "القدر",       meaning: "The Power",                verseCount: 5,   type: "Meccan",  juz: [30] },
  { number: 98, name: "Al-Bayyinah",   nameArabic: "البينة",      meaning: "The Clear Proof",          verseCount: 8,   type: "Medinan", juz: [30] },
  { number: 99, name: "Az-Zalzalah",   nameArabic: "الزلزلة",     meaning: "The Earthquake",           verseCount: 8,   type: "Medinan", juz: [30] },
  { number: 100, name: "Al-Adiyat",    nameArabic: "العاديات",    meaning: "The Courser",              verseCount: 11,  type: "Meccan",  juz: [30] },
  { number: 101, name: "Al-Qari'ah",   nameArabic: "القارعة",     meaning: "The Calamity",             verseCount: 11,  type: "Meccan",  juz: [30] },
  { number: 102, name: "At-Takathur",  nameArabic: "التكاثر",     meaning: "The Rivalry in world increase", verseCount: 8, type: "Meccan", juz: [30] },
  { number: 103, name: "Al-Asr",       nameArabic: "العصر",       meaning: "The Declining Day",        verseCount: 3,   type: "Meccan",  juz: [30] },
  { number: 104, name: "Al-Humazah",   nameArabic: "الهمزة",      meaning: "The Traducer",             verseCount: 9,   type: "Meccan",  juz: [30] },
  { number: 105, name: "Al-Fil",       nameArabic: "الفيل",       meaning: "The Elephant",             verseCount: 5,   type: "Meccan",  juz: [30] },
  { number: 106, name: "Quraysh",      nameArabic: "قريش",        meaning: "Quraysh",                  verseCount: 4,   type: "Meccan",  juz: [30] },
  { number: 107, name: "Al-Ma'un",     nameArabic: "الماعون",     meaning: "The Small Kindnesses",     verseCount: 7,   type: "Meccan",  juz: [30] },
  { number: 108, name: "Al-Kawthar",   nameArabic: "الكوثر",      meaning: "The Abundance",            verseCount: 3,   type: "Meccan",  juz: [30] },
  { number: 109, name: "Al-Kafirun",   nameArabic: "الكافرون",    meaning: "The Disbelievers",         verseCount: 6,   type: "Meccan",  juz: [30] },
  { number: 110, name: "An-Nasr",      nameArabic: "النصر",       meaning: "The Divine Support",       verseCount: 3,   type: "Medinan", juz: [30] },
  { number: 111, name: "Al-Masad",     nameArabic: "المسد",       meaning: "The Palm Fiber",           verseCount: 5,   type: "Meccan",  juz: [30] },
  { number: 112, name: "Al-Ikhlas",    nameArabic: "الإخلاص",     meaning: "The Sincerity",            verseCount: 4,   type: "Meccan",  juz: [30] },
  { number: 113, name: "Al-Falaq",     nameArabic: "الفلق",       meaning: "The Daybreak",             verseCount: 5,   type: "Meccan",  juz: [30] },
  { number: 114, name: "An-Nas",       nameArabic: "الناس",       meaning: "Mankind",                  verseCount: 6,   type: "Meccan",  juz: [30] },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
const delay = (ms) => new Promise(res => setTimeout(res, ms));

function slugify(name) {
  return name
    .toLowerCase()
    .replace(/['']/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function surahFileName(surah) {
  const num = String(surah.number).padStart(3, '0');
  return `${num}-${slugify(surah.name)}.json`;
}

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function writeJson(filePath, data) {
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
}

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

// ─── Bismillah stripping (mirrors useQuranData.ts logic) ─────────────────────
const BISMILLAH_1 = 'بِسۡمِ ٱللَّهِ ٱلرَّحۡمَـٰنِ ٱلرَّحِیمِ';
const BISMILLAH_2 = 'بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ';

function stripBismillah(text, surahNumber, verseInSurah) {
  if (surahNumber !== 1 && verseInSurah === 1) {
    if (text.startsWith(BISMILLAH_1)) return text.substring(BISMILLAH_1.length).trim();
    if (text.startsWith(BISMILLAH_2)) return text.substring(BISMILLAH_2.length).trim();
  }
  return text;
}

// ─── Extract waqf markers from Indopak text ──────────────────────────────────
function extractWaqf(text) {
  if (!text) return '';
  const match = (text || '').match(/[\u06D6-\u06E0]+(?=[^\u0621-\u064A]*$)/);
  return match ? match[0] : '';
}

// ─── Main fetch function for one surah ───────────────────────────────────────
async function fetchSurah(surah) {
  const n = surah.number;
  const log = (msg) => process.stdout.write(msg);

  log(`\n[${String(n).padStart(3, '0')}] ${surah.name} — Fetching...`);

  try {
    // 1. Arabic text (standard)
    const arabicData = await fetchWithRetry(`${ALQURAN_BASE}/surah/${n}`);
    log(' arabic✓');
    await delay(300);

    // 2. Bengali translation
    const bnData = await fetchWithRetry(`${ALQURAN_BASE}/surah/${n}/bn.bengali`);
    log(' bn✓');
    await delay(300);

    // 3. Hindi translation
    const hiData = await fetchWithRetry(`${ALQURAN_BASE}/surah/${n}/hi.hindi`);
    log(' hi✓');
    await delay(300);

    // 4. English translation (Sahih)
    const enData = await fetchWithRetry(`${ALQURAN_BASE}/surah/${n}/en.sahih`);
    log(' en✓');
    await delay(300);

    // 5. Roman Urdu translation (quran.com ID 831)
    const urData = await fetchWithRetry(`${QURANCOM_BASE}/verses/by_chapter/${n}?translations=831`);
    log(' ur✓');
    await delay(300);

    // 6. Waqf markers (Indopak)
    const waqfData = await fetchWithRetry(
      `${QURANCOM_BASE}/quran/verses/indopak?chapter_number=${n}`
    );
    log(' waqf✓');
    await delay(300);

    // 7. Word-by-word
    const wbwData = await fetchWithRetry(
      `${QURANCOM_BASE}/verses/by_chapter/${n}?words=true&word_fields=text_uthmani,location,translation,transliteration,root&per_page=500`
    );
    log(' wbw✓');

    // ── Process Arabic ayahs ──────────────────────────────────────────────────
    const arabicAyahs = arabicData.data.ayahs;

    // Build waqf map
    const waqfMap = {};
    if (waqfData.verses) {
      waqfData.verses.forEach(v => {
        const vNum = parseInt(v.verse_key.split(':')[1]);
        waqfMap[vNum] = extractWaqf(v.text_indopak || '');
      });
    }

    // Build wbw map
    const wbwMap = {};
    if (wbwData.verses) {
      wbwData.verses.forEach(v => {
        wbwMap[v.verse_number] = (v.words || []).map(w => ({
          id: w.id,
          position: w.position,
          text: w.text_uthmani || w.text || '',
          transliteration: w.transliteration?.text || '',
          translation: w.translation?.text || '',
          rootLetters: w.root?.text ? w.root.text.trim().split(' ').join('-') : null,
          charTypeName: w.char_type_name || null,
          location: w.location || null,
        }));
      });
    }

    // ── Write: Arabic ─────────────────────────────────────────────────────────
    const arabicVerses = arabicAyahs.map(a => ({
      numberInSurah: a.numberInSurah,
      text: stripBismillah(a.text, n, a.numberInSurah),
      juz: a.juz,
      page: a.page,
      hizbQuarter: a.hizbQuarter,
      ruku: a.ruku,
    }));

    writeJson(
      path.join(PUBLIC_DATA, 'arabic', surahFileName(surah)),
      { surahNumber: n, surahName: surah.name, verses: arabicVerses }
    );

    // ── Write: Translations (EN, BN, HI) ─────────────────────────────────────
    const buildTranslationVerses = (data) =>
      (data.data.ayahs || []).map(a => ({
        numberInSurah: a.numberInSurah,
        text: a.text,
      }));

    writeJson(
      path.join(PUBLIC_DATA, 'translations', 'en', surahFileName(surah)),
      { surahNumber: n, edition: 'en.sahih', verses: buildTranslationVerses(enData) }
    );

    writeJson(
      path.join(PUBLIC_DATA, 'translations', 'bn', surahFileName(surah)),
      { surahNumber: n, edition: 'bn.bengali', verses: buildTranslationVerses(bnData) }
    );

    writeJson(
      path.join(PUBLIC_DATA, 'translations', 'hi', surahFileName(surah)),
      { surahNumber: n, edition: 'hi.hindi', verses: buildTranslationVerses(hiData) }
    );

    // Build Roman Urdu verses structure matching the others
    const urVerses = (urData.verses || []).map(v => ({
      numberInSurah: v.verse_number,
      text: v.translations?.[0]?.text || ''
    }));

    writeJson(
      path.join(PUBLIC_DATA, 'translations', 'ur', surahFileName(surah)),
      { surahNumber: n, edition: 'ur.roman', verses: urVerses }
    );

    // ── Write: Waqf ───────────────────────────────────────────────────────────
    const waqfVerses = arabicAyahs.map(a => ({
      numberInSurah: a.numberInSurah,
      waqfMark: waqfMap[a.numberInSurah] || '',
    }));

    writeJson(
      path.join(PUBLIC_DATA, 'waqf', surahFileName(surah)),
      { surahNumber: n, verses: waqfVerses }
    );

    // ── Write: Word-by-word ───────────────────────────────────────────────────
    const wbwVerses = arabicAyahs.map(a => ({
      numberInSurah: a.numberInSurah,
      words: wbwMap[a.numberInSurah] || [],
    }));

    writeJson(
      path.join(PUBLIC_DATA, 'word-by-word', surahFileName(surah)),
      { surahNumber: n, verses: wbwVerses }
    );

    log(' — ✅ written');

    return {
      surahNumber: n,
      arabicVerses,
      bnVerses: buildTranslationVerses(bnData),
      hiVerses: buildTranslationVerses(hiData),
      urVerses,
      waqfMap,
      wbwMap,
    };

  } catch (err) {
    log(` — ❌ FAILED: ${err.message}`);
    return null;
  }
}

// ─── Update Inside-Quran.json ─────────────────────────────────────────────────
function updateInsideQuranJson(allSurahData) {
  console.log('\n\n📝 Updating Inside-Quran.json...');

  let insideQuran;
  try {
    insideQuran = JSON.parse(fs.readFileSync(INSIDE_QURAN_JSON, 'utf8'));
  } catch (e) {
    console.error('❌ Could not read Inside-Quran.json:', e.message);
    return;
  }

  let updatedCount = 0;

  for (const surahData of allSurahData) {
    if (!surahData) continue;

    const { surahNumber, arabicVerses, bnVerses, hiVerses, urVerses, waqfMap, wbwMap } = surahData;

    // Build lookup maps
    const arabicMap = {};
    arabicVerses.forEach(v => { arabicMap[v.numberInSurah] = v.text; });

    const bnMap = {};
    bnVerses.forEach(v => { bnMap[v.numberInSurah] = v.text; });

    const hiMap = {};
    hiVerses.forEach(v => { hiMap[v.numberInSurah] = v.text; });

    const urMap = {};
    urVerses.forEach(v => { urMap[v.numberInSurah] = v.text; });

    // Find matching surah in Inside-Quran.json
    const surahEntry = insideQuran.surahs.find(s => s.surah_number === surahNumber);
    if (!surahEntry) {
      console.warn(`  ⚠ Surah ${surahNumber} not found in Inside-Quran.json`);
      continue;
    }

    // Update each verse
    for (const verseEntry of surahEntry.verses) {
      const vNum = verseEntry.verse;

      // Fill arabic
      if (arabicMap[vNum] !== undefined) {
        verseEntry.arabic = arabicMap[vNum];
      }

      // Fill waqf_end
      verseEntry.waqf_end = waqfMap[vNum] || '';

      if (!verseEntry.translations) verseEntry.translations = {};

      // Fill translations
      if (bnMap[vNum] !== undefined) verseEntry.translations.bn = bnMap[vNum];
      if (hiMap[vNum] !== undefined) verseEntry.translations.hi = hiMap[vNum];
      if (urMap[vNum] !== undefined) verseEntry.translations.ur = urMap[vNum];

      // Fill transliterations
      const enTrans = verseEntry.translations.transliteration?.en || '';
      verseEntry.translations.transliteration = {
        en: enTrans,
        bn: enTrans,
        hi: enTrans,
        ur: enTrans
      };
      
      // Word Preview (word_by_word)
      if (wbwMap[vNum]) {
        verseEntry.word_by_word = wbwMap[vNum];
      }

      updatedCount++;
    }
  }

  fs.writeFileSync(INSIDE_QURAN_JSON, JSON.stringify(insideQuran, null, 2), 'utf8');
  console.log(`✅ Inside-Quran.json updated — ${updatedCount} verses filled.`);
}

// ─── Write meta/surahs.json ───────────────────────────────────────────────────
function writeMetaFile() {
  writeJson(path.join(PUBLIC_DATA, 'meta', 'surahs.json'), SURAH_LIST);
  console.log('✅ meta/surahs.json written');
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log('╔══════════════════════════════════════════════════════════╗');
  console.log('║         Inside-Quran — API Data Export Script           ║');
  console.log('╚══════════════════════════════════════════════════════════╝');
  console.log(`\nOutput directory: ${PUBLIC_DATA}`);
  console.log(`Inside-Quran.json: ${INSIDE_QURAN_JSON}\n`);

  // Ensure directories exist
  ['meta', 'arabic', 'translations/en', 'translations/bn', 'translations/hi', 'translations/ur', 'waqf', 'word-by-word']
    .forEach(d => ensureDir(path.join(PUBLIC_DATA, d)));

  // Write meta
  writeMetaFile();

  // Fetch all surahs sequentially (with polite delay between each)
  const allSurahData = [];
  const startTime = Date.now();

  for (let i = 0; i < SURAH_LIST.length; i++) {
    const surah = SURAH_LIST[i];
    const result = await fetchSurah(surah);
    allSurahData.push(result);

    // Polite delay between surahs (skip after last)
    if (i < SURAH_LIST.length - 1) {
      await delay(800);
    }
  }

  // Update Inside-Quran.json with fetched data
  updateInsideQuranJson(allSurahData);

  // Summary
  const elapsed = Math.round((Date.now() - startTime) / 1000);
  const succeeded = allSurahData.filter(Boolean).length;
  const failed = allSurahData.filter(v => !v).length;

  console.log('\n╔══════════════════════════════════════════════════════════╗');
  console.log('║                        Summary                          ║');
  console.log('╠══════════════════════════════════════════════════════════╣');
  console.log(`║  Surahs processed:  ${String(succeeded).padEnd(35)}║`);
  console.log(`║  Failed:            ${String(failed).padEnd(35)}║`);
  console.log(`║  Time elapsed:      ${String(elapsed + 's').padEnd(35)}║`);
  console.log(`║  Files written:     ~${String(succeeded * 6 + 1).padEnd(34)}║`);
  console.log('╚══════════════════════════════════════════════════════════╝');

  if (failed > 0) {
    console.log('\n⚠ Some surahs failed. Re-run the script to retry them.');
    process.exit(1);
  } else {
    console.log('\n🎉 All done! Data is ready in public/data/');
  }
}

main().catch(err => {
  console.error('\n\n❌ Fatal error:', err);
  process.exit(1);
});
