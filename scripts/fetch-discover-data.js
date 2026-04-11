import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, '../public/data/discover');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// 40 Rabbana Duas (Curated static list for reliability)
const rabbanaDuas = [
  {
    id: "rabbana-1",
    title: "For Acceptance of Service",
    arabic: "رَبَّنَا تَقَبَّلْ مِنَّا ۖ إِنَّكَ أَنتَ السَّمِيعُ الْعَلِيمُ",
    translation: "Our Lord, accept [this] from us. Indeed You are the Hearing, the Knowing.",
    reference: "Surah Al-Baqarah 2:127",
    surah: 2,
    verse: 127
  },
  {
    id: "rabbana-2",
    title: "For Submission to Allah",
    arabic: "رَبَّنَا وَٱجْعَلْنَا مُسْلِمَيْنِ لَكَ وَمِن ذُرِّيَّتِنَآ أُمَّةًۭ مُّسْلِمَةًۭ لَّكَ",
    translation: "Our Lord, and make us Muslims [in submission] to You and from our descendants a Muslim nation [in submission] to You.",
    reference: "Surah Al-Baqarah 2:128",
    surah: 2,
    verse: 128
  },
  {
    id: "rabbana-3",
    title: "For Good in Both Worlds",
    arabic: "رَبَّنَآ ءَاتِنَا فِي ٱلدُّنْيَا حَسَنَةًۭ وَفِي ٱلْءَاخِرَةِ حَسَنَةًۭ وَقِنَا عَذَابَ ٱلنَّارِ",
    translation: "Our Lord, give us in this world [that which is] good and in the Afterlife [that which is] good and protect us from the punishment of the Fire.",
    reference: "Surah Al-Baqarah 2:201",
    surah: 2,
    verse: 201
  },
  {
    id: "rabbana-4",
    title: "For Patience and Victory",
    arabic: "رَبَّنَآ أَفْرِغْ عَلَيْنَا صَبْرًۭا وَثَبِّتْ أَقْدَامَنَا وَٱنصُرْنَا عَلَى ٱلْقَوْمِ ٱلْكَـٰفِرِينَ",
    translation: "Our Lord, pour upon us patience and plant firmly our feet and give us victory over the disbelieving people.",
    reference: "Surah Al-Baqarah 2:250",
    surah: 2,
    verse: 250
  },
  {
    id: "rabbana-5",
    title: "For Forgiveness of Burdens",
    arabic: "رَبَّنَا لَا تُؤَاخِذْنَآ إِن نَّسِينَآ أَوْ أَخْطَأْنَا ۚ رَبَّنَا وَلَا تَحْمِلْ عَلَيْنَآ إِصْرًۭا",
    translation: "Our Lord, do not impose blame upon us if we have forgotten or erred. Our Lord, and lay not upon us a burden.",
    reference: "Surah Al-Baqarah 2:286",
    surah: 2,
    verse: 286
  },
  {
    id: "rabbana-6",
    title: "For Steadfastness in Guidance",
    arabic: "رَبَّنَا لَا تُزِغْ قُلُوبَنَا بَعْدَ إِذْ هَدَيْتَنَا وَهَب| لَنَا مِن لَّدُنكَ رَحْمَةً ۚ إِنَّكَ أَنتَ الْوَهَّابُ",
    translation: "Our Lord, let not our hearts deviate after You have guided us and grant us from Yourself mercy. Indeed, You are the Bestower.",
    reference: "Surah Ali 'Imran 3:8",
    surah: 3,
    verse: 8
  },
  {
    id: "rabbana-7",
    title: "Prophet Yunus's Prayer",
    arabic: "لَّآ إِلَـٰهَ إِلَّآ أَنتَ سُبْحَـٰنَكَ إِنِّى كُنتُ مِنَ ٱلظَّـٰلِمِينَ",
    translation: "There is no deity except You; exalted are You. Indeed, I have been of the wrongdoers.",
    reference: "Surah Al-Anbiya 21:87",
    surah: 21,
    verse: 87
  },
  {
    id: "rabbana-8",
    title: "For Mercy and Success",
    arabic: "رَبَّنَآ ءَاتِنَا مِن لَّدُنكَ رَحْمَةًۭ وَهَيِّئْ لَنَا مِنْ أَمْرِنَا رَشَدًۭا",
    translation: "Our Lord, grant us from Yourself mercy and prepare for us from our affair right guidance.",
    reference: "Surah Al-Kahf 18:10",
    surah: 18,
    verse: 10
  },
  {
    id: "rabbana-9",
    title: "For Ease in Tasks",
    arabic: "رَبِّ ٱشْرَحْ لِى صَدْرِى وَيَسِّرْ لِىٓ أَمْرِى",
    translation: "My Lord, expand for me my breast [with assurance] and ease for me my task.",
    reference: "Surah Ta-Ha 20:25-26",
    surah: 20,
    verse: 25
  },
  {
    id: "rabbana-10",
    title: "For Family Comfort",
    arabic: "رَبَّنَا هَبْ لَنَا مِنْ أَزْوَٰجِنَا وَذُرِّيَّـٰتِنَا قُرَّةَ أَعْيُنٍۢ وَٱجْعَلْنَا لِلْمُتَّقِينَ إِمَامًا",
    translation: "Our Lord, grant us from among our wives and offspring comfort to our eyes and make us an example for the righteous.",
    reference: "Surah Al-Furqan 25:74",
    surah: 25,
    verse: 74
  }
];

const SURAH_NAMES = {
  1: "Al-Fatihah", 2: "Al-Baqarah", 3: "Ali 'Imran", 4: "An-Nisa", 5: "Al-Ma'idah",
  6: "Al-An'am", 7: "Al-A'raf", 8: "Al-Anfal", 9: "At-Tawbah", 10: "Yunus",
  11: "Hud", 12: "Yusuf", 13: "Ar-Ra'd", 14: "Ibrahim", 15: "Al-Hijr",
  16: "An-Nahl", 17: "Al-Isra", 18: "Al-Kahf", 19: "Maryam", 20: "Taha",
  21: "Al-Anbiya", 22: "Al-Hajj", 23: "Al-Mu'minun", 24: "An-Nur", 25: "Al-Furqan",
  26: "Ash-Shu'ara", 27: "An-Naml", 28: "Al-Qasas", 29: "Al-Ankabut", 30: "Ar-Rum",
  31: "Luqman", 32: "As-Sajdah", 33: "Al-Ahzab", 34: "Saba", 35: "Fatir",
  36: "Ya-Sin", 37: "As-Saffat", 38: "Sad", 39: "Az-Zumar", 40: "Ghafir",
  41: "Fussilat", 42: "Ash-Shura", 43: "Az-Zukhruf", 44: "Ad-Dukhan", 45: "Al-Jathiyah",
  46: "Al-Ahqaf", 47: "Muhammad", 48: "Al-Fath", 49: "Al-Hujurat", 50: "Qaf",
  51: "Adh-Dhariyat", 52: "At-Tur", 53: "An-Najm", 54: "Al-Qamar", 55: "Ar-Rahman",
  56: "Al-Waqi'ah", 57: "Al-Hadid", 58: "Al-Mujadila", 59: "Al-Hashr", 60: "Al-Mumtahanah",
  61: "As-Saf", 62: "Al-Jumu'ah", 63: "Al-Munafiqun", 64: "At-Taghabun", 65: "At-Talaq",
  66: "At-Tahrim", 67: "Al-Mulk", 68: "Al-Qalam", 69: "Al-Haqqah", 70: "Al-Ma'arij",
  71: "Nuh", 72: "Al-Jinn", 73: "Al-Muzzammil", 74: "Al-Muddaththir", 75: "Al-Qiyamah",
  76: "Al-Insan", 77: "Al-Mursalat", 78: "An-Naba", 79: "An-Nazi'at", 80: "Abasa",
  81: "At-Takwir", 82: "Al-Infitar", 83: "Al-Mutaffifin", 84: "Al-Inshiqaq", 85: "Al-Buruj",
  86: "At-Tariq", 87: "Al-A'la", 88: "Al-Ghashiyah", 89: "Al-Fajr", 90: "Al-Balad",
  91: "Ash-Shams", 92: "Al-Layl", 93: "Ad-Duha", 94: "Ash-Sharh", 95: "At-Tin",
  96: "Al-Alaq", 97: "Al-Qadr", 98: "Al-Bayyinah", 99: "Az-Zalzalah", 100: "Al-Adiyat",
  101: "Al-Qari'ah", 102: "At-Takathur", 103: "Al-Asr", 104: "Al-Humazah", 105: "Al-Fil",
  106: "Quraysh", 107: "Al-Ma'un", 108: "Al-Kawthar", 109: "Al-Kafirun", 110: "An-Nasr",
  111: "Al-Masad", 112: "Al-Ikhlas", 113: "Al-Falaq", 114: "An-Nas"
};

async function fetchShaneNuzul() {
  console.log('Fetching Shane Nuzul...');
  try {
    const response = await fetch('https://raw.githubusercontent.com/mostafaahmed97/asbab-al-nuzul-dataset/main/data/structured/json/all.json');
    const data = await response.json();
    
    const normalized = [];
    data.forEach((entry, index) => {
      const surahNum = entry.surah;
      const surahName = SURAH_NAMES[surahNum] || `Surah ${surahNum}`;
      
      entry.ayahs.forEach((verse, vIndex) => {
        normalized.push({
          id: `sn-${index + 1}-${vIndex + 1}`,
          surah: surahNum,
          verse: verse,
          title: `Surah ${surahName}`,
          context: entry.occasions.join('\n\n'),
          source: 'Al-Wahidi'
        });
      });
    });

    // Save up to 1000 entries for performance
    fs.writeFileSync(path.join(DATA_DIR, 'shane-nuzul.json'), JSON.stringify(normalized.slice(0, 1000), null, 2));
    console.log(`Saved ${Math.min(normalized.length, 1000)} shane nuzul entries.`);
  } catch (error) {
    console.error('Error fetching shane nuzul:', error);
  }
}

async function fetchTopics() {
  console.log('Fetching Topics (Curated)...');
  const topics = [
    {
      id: 'faith',
      title: 'Monotheism (Tawhid)',
      description: 'The foundation of Islam: belief in the oneness of Allah.',
      image: '/assets/images/topics/faith.png',
      verses: [
        { surah: 112, verse: 1, title: 'Al-Ikhlas' },
        { surah: 2, verse: 255, title: 'Ayat al-Kursi' },
        { surah: 59, verse: 23, title: 'Attributes of Allah' }
      ]
    },
    {
      id: 'patience',
      title: 'Patience & Gratitude',
      description: 'The virtues of Sabr and Shukr in the face of trials.',
      image: '/assets/images/topics/patience.png',
      verses: [
        { surah: 2, verse: 153, title: 'Help through Patience' },
        { surah: 94, verse: 5, title: 'Ease with Hardship' },
        { surah: 14, verse: 7, title: 'Increase in Gratitude' }
      ]
    },
    {
      id: 'social-justice',
      title: 'Social Justice & Ethics',
      description: 'Quranic mandates on fairness, honesty, and charity.',
      image: '/assets/images/topics/justice.png',
      verses: [
        { surah: 4, verse: 135, title: 'Standing for Justice' },
        { surah: 16, verse: 90, title: 'Justice and Kindness' },
        { surah: 107, verse: 1, title: 'Helping the Needy' }
      ]
    },
    {
      id: 'family',
      title: 'Family & Relationships',
      description: 'Guidance on parents, children, and marital bonds.',
      image: '/assets/images/topics/family.png',
      verses: [
        { surah: 17, verse: 23, title: 'Kindness to Parents' },
        { surah: 30, verse: 21, title: 'Love and Mercy' },
        { surah: 31, verse: 14, title: 'Parents Sacrifice' }
      ]
    },
    {
      id: 'nature',
      title: 'Nature & Universe',
      description: 'Signs of creation in the heavens and the earth.',
      image: '/assets/images/topics/nature.png',
      verses: [
        { surah: 3, verse: 190, title: 'Signs for the Wise' },
        { surah: 88, verse: 17, title: 'Reflection on Creation' },
        { surah: 30, verse: 22, title: 'Diversity of Languages' }
      ]
    },
    {
      id: 'afterlife',
      title: 'The Hereafter (Afterlife)',
      description: 'Descriptions of Paradise, Hell, and the Day of Judgment.',
      image: '/assets/images/topics/hereafter.png',
      verses: [
        { surah: 56, verse: 1, title: 'The Event' },
        { surah: 78, verse: 31, title: 'The Success' },
        { surah: 3, verse: 185, title: 'Reality of Death' }
      ]
    },
    {
      id: 'repentance',
      title: 'Repentance & Mercy',
      description: 'The door of Tawbah and the vastness of Allah\'s mercy.',
      image: '/assets/images/topics/repentance.png',
      verses: [
        { surah: 39, verse: 53, title: 'Do not Despair' },
        { surah: 2, verse: 222, title: 'Allah Loves the Penitent' },
        { surah: 4, verse: 110, title: 'Forgiveness for Evil' }
      ]
    },
    {
      id: 'guidance',
      title: 'Guidance & Truth',
      description: 'The Quran as a criterion and a light for humanity.',
      image: '/assets/images/topics/guidance.png',
      verses: [
        { surah: 2, verse: 2, title: 'Book of No Doubt' },
        { surah: 5, verse: 15, title: 'Light from Allah' },
        { surah: 17, verse: 9, title: 'Guiding to the Best' }
      ]
    }
  ];

  fs.writeFileSync(path.join(DATA_DIR, 'topics.json'), JSON.stringify(topics, null, 2));
  console.log(`Saved ${topics.length} topics.`);
}

async function main() {
  console.log('Starting data collection...');
  fs.writeFileSync(path.join(DATA_DIR, 'duas.json'), JSON.stringify(rabbanaDuas, null, 2));
  console.log(`Saved ${rabbanaDuas.length} static duas.`);
  await fetchShaneNuzul();
  await fetchTopics();
  console.log('Data collection complete.');
}

main();
