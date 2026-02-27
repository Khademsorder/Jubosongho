--- START OF FILE text/javascript ---

/**
 * Quran & Hadith Module (Cloud + Offline) - v6.0 Complete
 * Fixed TTS, Added Full Surah Download, Chunked Hadith Loading, and AI Expanse
 */

const IslamicModule = (function () {
  const DB_NAME = 'IslamicKnowledgeCoreStore';
  let dbInstance = null;

  const QARI_LIST =[
    { id: 'ar.alafasy', name: 'Mishary Alafasy' },
    { id: 'ar.abdulbasit', name: 'Abdul Basit' },
    { id: 'ar.husary', name: 'Husary' },
    { id: 'ar.parhizgar', name: 'Parhizgar' },
    { id: 'ar.ayman', name: 'Ayman Suwaid' },
    { id: 'ar.minshawi', name: 'Minshawi' }
  ];
  let currentQari = localStorage.getItem('preferredQari') || 'ar.alafasy';
  let autoAdvanceEnabled = localStorage.getItem('autoAdvance') === 'true' ? true : false;

  const HADITH_TOPICS =[
    { id: 'iman', name: 'ঈমান ও আকীদা', keywords:['ঈমান', 'আকীদা', 'তাওহীদ', 'শিরক', 'কুফর', 'মুনাফিক', 'আল্লাহ', 'রাসূল', 'ফেরেশতা', 'কিতাব', 'আখিরাত', 'তকদির', 'ভাগ্য'] },
    { id: 'ilm', name: 'ইল্ম ও জ্ঞান', keywords:['ইল্ম', 'জ্ঞান', 'শিক্ষা', 'আলিম', 'মুহাদ্দিস', 'ফকীহ', 'মাদরাসা', 'দারস', 'তালিব'] },
    { id: 'taharah', name: 'পবিত্রতা', keywords:['পবিত্র', 'ওযু', 'গোসল', 'তায়াম্মুম', 'নাপাক', 'হায়েজ', 'নিফাস', 'ইস্তিনজা', 'মিসওয়াক'] },
    { id: 'salat', name: 'নামাজ', keywords:['নামাজ', 'সালাত', 'ফরজ', 'সুন্নত', 'নফল', 'ওয়াক্ত', 'রুকু', 'সিজদা', 'তাশাহহুদ', 'সালাম', 'আযান', 'ইকামত', 'জামাত', 'মসজিদ', 'কিবলা', 'ইমাম', 'মুক্তাদি', 'কসর', 'জুমা', 'ঈদ', 'জানাজা', 'তাহাজ্জুদ', 'ইশরাক', 'চাশত', 'তারাবীহ', 'বিতর'] },
    { id: 'zakat', name: 'জাকাত ও সদকা', keywords:['জাকাত', 'সদকা', 'ফিতরা', 'দান', 'সাওয়াব', 'গরীব', 'মিসকিন', 'ইবনুস সাবীল'] },
    { id: 'sawm', name: 'রোজা', keywords:['রোজা', 'সিয়াম', 'ইফতার', 'সেহরি', 'রমজান', 'শাওয়াল', 'আশুরা', 'আরাফা', 'কাজা', 'কাফফারা'] },
    { id: 'hajj', name: 'হজ্জ ও উমরাহ', keywords:['হজ্জ', 'উমরাহ', 'কাবা', 'তাওয়াফ', 'সাফা', 'মারওয়া', 'মীকাত', 'ইহরাম', 'আরাফাত', 'মুযদালিফা', 'মিনা', 'জামরাত', 'কুরবানী', 'সায়ী'] },
    { id: 'nikah', name: 'বিবাহ ও পরিবার', keywords:['বিবাহ', 'নিকাহ', 'স্ত্রী', 'স্বামী', 'সন্তান', 'তালাক', 'খুলা', 'ইদ্দত', 'মোহর', 'যিহার', "লি'আন"] },
    { id: 'tijarah', name: 'ব্যবসা ও লেনদেন', keywords:['ক্রয়', 'বিক্রয়', 'ব্যবসা', 'লেনদেন', 'সুদ', 'ঘুষ', 'ইজারা', 'ওয়াকফ', 'উত্তরাধিকার', 'মীরাস', 'ঋণ', 'দেনা', 'প্রতিশ্রুতি'] },
    { id: 'jihad', name: 'জিহাদ ও রাজনীতি', keywords:['জিহাদ', 'যুদ্ধ', 'খিলাফত', 'ইমামত', 'শাসক', 'প্রজা', 'নেতা', 'সেনা', 'গনীমত', 'ফায়'] },
    { id: 'atima', name: 'খাদ্য ও পানীয়', keywords:['খাদ্য', 'পানীয়', 'হালাল', 'হারাম', 'জবাই', 'শিকার', 'দুধ', 'মধু'] },
    { id: 'libas', name: 'পোশাক ও সাজসজ্জা', keywords:['পোশাক', 'কাপড়', 'সতর', 'পর্দা', 'হিজাব', 'সোনা', 'রেশম', 'আংটি', 'মেহেদি'] },
    { id: 'adab', name: 'আদব ও শিষ্টাচার', keywords:['আদব', 'আখলাক', 'শিষ্টাচার', 'সালাম', 'মুসাফাহা', 'হাঁচি', 'হাই তোলা', 'বসা', 'শোয়া', 'ঘুম'] },
    { id: 'dua', name: 'দোয়া ও যিকির', keywords:['দোয়া', 'প্রার্থনা', 'যিকির', 'তাসবীহ', 'তাহলীল', 'তাকবীর', 'তাহমীদ', 'ইস্তিগফার', 'দরূদ'] },
    { id: 'tibb', name: 'চিকিৎসা ও রোগ', keywords:['রোগ', 'চিকিৎসা', 'ঔষধ', 'ঝাড়ফুঁক', 'রুকইয়াহ', 'মৃত্যু', 'জানাযা', 'কবর'] },
    { id: 'fitan', name: 'ফিতনা ও কিয়ামত', keywords:['ফিতনা', 'দাজ্জাল', 'ইয়াজুজ-মাজুজ', 'কিয়ামত', 'মৃত্যু', 'কবর', 'হাশর', 'জান্নাত', 'জাহান্নাম'] },
    { id: 'tafsir', name: 'তাফসীর ও কুরআন', keywords:['তাফসীর', 'কুরআন', 'আয়াত', 'সূরা', 'নাযিল', 'ওহী'] },
    { id: 'akhlaq', name: 'নৈতিকতা ও চরিত্র', keywords:['ভালোবাসা', 'ঘৃণা', 'হিংসা', 'অহংকার', 'বিনয়', 'ক্ষমা', 'রাগ', 'ধৈর্য', 'সত্য', 'মিথ্যা'] }
  ];

  function setQari(qariId) {
    if (QARI_LIST.some(q => q.id === qariId)) {
      currentQari = qariId;
      localStorage.setItem('preferredQari', qariId);
    }
  }

  function toggleAutoAdvance() {
    autoAdvanceEnabled = !autoAdvanceEnabled;
    localStorage.setItem('autoAdvance', autoAdvanceEnabled);
    return autoAdvanceEnabled;
  }

  async function initDB() {
    return new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, 3);
      req.onupgradeneeded = e => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains('surahs')) db.createObjectStore('surahs', { keyPath: 'id' });
        if (!db.objectStoreNames.contains('ayat')) db.createObjectStore('ayat', { keyPath: 'key' });
        if (!db.objectStoreNames.contains('hadith')) db.createObjectStore('hadith', { keyPath: 'key' });
      };
      req.onsuccess = e => { dbInstance = e.target.result; resolve(dbInstance); };
      req.onerror = e => reject(e);
    });
  }

  async function getFromDB(storeName, key) {
    if (!dbInstance) await initDB();
    return new Promise(resolve => {
      const tx = dbInstance.transaction(storeName, 'readonly');
      const req = tx.objectStore(storeName).get(key);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => resolve(null);
    });
  }

  async function saveToDB(storeName, data) {
    if (!dbInstance) await initDB();
    const tx = dbInstance.transaction(storeName, 'readwrite');
    tx.objectStore(storeName).put(data);
  }

  async function deleteFromDB(storeName, keyPattern) {
    if (!dbInstance) await initDB();
    return new Promise((resolve, reject) => {
      const tx = dbInstance.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      const request = store.openCursor();
      request.onsuccess = (event) => {
        const cursor = event.target.result;
        if (cursor) {
          if (cursor.key.toString().startsWith(keyPattern)) cursor.delete();
          cursor.continue();
        } else resolve();
      };
      request.onerror = reject;
    });
  }

  // --- QURAN API ---
  const QuranAPI = {
    _editionId: (entry) => entry?.edition?.identifier || '',
    _byEdition: (entries, wanted) => entries?.find(x => QuranAPI._editionId(x) === wanted) || null,

    _fetchEditions: async (path, editionsCsv) => {
      const url = `https://api.alquran.cloud/v1/${path}/editions/${editionsCsv}`;
      const res = await fetch(url);
      const json = await res.json();
      if (json.code !== 200 || !Array.isArray(json.data)) throw new Error("Edition fetch failed");
      return json.data;
    },

    clearSurahCache: async (surahId) => {
      await deleteFromDB('surahs', `${surahId}`);
      await deleteFromDB('ayat', `${surahId}_`);
    },

    getSurah: async (surahId) => {
      const cached = await getFromDB('surahs', surahId);
      if (cached && cached.isComplete) return cached.data;

      try {
        const audioEdition = currentQari;
        const editions = await QuranAPI._fetchEditions(
          `surah/${surahId}`,
          `quran-uthmani,bn.bengali,en.sahih,en.transliteration,${audioEdition}`
        );

        const ar = QuranAPI._byEdition(editions, 'quran-uthmani') || editions[0];
        const bn = QuranAPI._byEdition(editions, 'bn.bengali') || editions.find(x => QuranAPI._editionId(x).startsWith('bn.'));
        const en = QuranAPI._byEdition(editions, 'en.sahih') || editions.find(x => QuranAPI._editionId(x).startsWith('en.'));
        const tr = QuranAPI._byEdition(editions, 'en.transliteration');
        const aud = QuranAPI._byEdition(editions, audioEdition) || editions.find(x => QuranAPI._editionId(x).startsWith('ar.'));
        if (!ar) throw new Error("Surah not found");

        const data = {
          id: surahId,
          name: ar.name,
          englishName: ar.englishName,
          revelationType: ar.revelationType,
          ayahs:[]
        };

        for (let i = 0; i < ar.ayahs.length; i++) {
          data.ayahs.push({
            numberInSurah: ar.ayahs[i].numberInSurah,
            arabic: ar.ayahs[i].text,
            bangla: bn?.ayahs?.[i]?.text || '',
            english: en?.ayahs?.[i]?.text || '',
            transliteration: tr?.ayahs?.[i]?.text || '',
            audio: aud?.ayahs?.[i]?.audio || ''
          });
        }

        await saveToDB('surahs', { id: surahId, data, isComplete: true });
        return data;
      } catch (e) {
        console.error("Error fetching full Surah:", e);
        return null;
      }
    },

    getMetadata: async () => {
      const cached = await getFromDB('surahs', 'metadata');
      if (cached) return cached.data;
      try {
        const res = await fetch('https://api.alquran.cloud/v1/surah');
        const json = await res.json();
        if (json.code === 200) {
          await saveToDB('surahs', { id: 'metadata', data: json.data });
          return json.data;
        }
        return [];
      } catch (e) {
        return[];
      }
    },

    getQariList: () => QARI_LIST,
    getCurrentQari: () => currentQari,
    setQari,

    // AI Backstory (Modified Prompt for detail context)
    getAyahBackstory: async (surah, ayah, arabic, bangla) => {
      const key = localStorage.getItem('geminiKey');
      const model = localStorage.getItem('geminiModel') || 'gemini-1.5-flash';
      if (!key) return "বিস্তারিত দেখতে সেটিংস থেকে Gemini API Key দিন।";

      const prompt = `তুমি একজন প্রাজ্ঞ ইসলামিক পণ্ডিত। নিচের আয়াতটির বিস্তারিত বিশ্লেষণ দাও:
সূরা: ${surah}, আয়াত: ${ayah}
আরবি: ${arabic}
বাংলা অনুবাদ: ${bangla}

উত্তরে অবশ্যই নিচের বিষয়গুলো অন্তর্ভুক্ত করবে:
১. আয়াতের তরজমা
২. শানে নুযুল (নাযিলের প্রেক্ষাপট)
৩. পটভূমি ও ঐতিহাসিক গুরুত্ব
৪. বর্তমান জীবনে এর প্রয়োগ ও গুরুত্ব

উত্তর বাংলায়, গুছিয়ে এবং সুন্দর পয়েন্ট আকারে দেবে।`;

      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { temperature: 0.2, maxOutputTokens: 800 } })
        });
        const data = await res.json();
        return data?.candidates?.[0]?.content?.parts?.[0]?.text || "ব্যাকস্টোরি পাওয়া যায়নি।";
      } catch (e) {
        return "লোড করতে সমস্যা হয়েছে। ইন্টারনেট সংযোগ ও API Key চেক করুন।";
      }
    }
  };

  // --- HADITH API ---
  const HadithAPI = {
    getBookList: async () => {
      const books =[
        { id: 'bukhari', name: 'সহীহ বুখারী', count: 7563 },
        { id: 'muslim', name: 'সহীহ মুসলিম', count: 3033 },
        { id: 'abudawud', name: 'সুনান আবু দাউদ', count: 5274 },
        { id: 'tirmidhi', name: 'সুনান তিরমিযী', count: 3956 },
        { id: 'nasai', name: 'সুনান নাসাঈ', count: 5758 },
        { id: 'ibnmajah', name: 'সুনান ইবনে মাজাহ', count: 4341 }
      ];

      for (let b of books) {
        const meta = await getFromDB('hadith', `book_meta_${b.id}`);
        b.isDownloaded = !!meta;
      }
      return books;
    },

    downloadBook: async (bookId, progressCallback) => {
      try {
        if (progressCallback) progressCallback(5, "বই খোঁজা হচ্ছে...");
        const url = `https://cdn.jsdelivr.net/gh/fawazahmed0/hadith-api@1/editions/ben-${bookId}.json`;
        const res = await fetch(url);
        if (!res.ok) throw new Error("বই পাওয়া যায়নি");

        if (progressCallback) progressCallback(20, "ডাটা ডাউনলোড হয়েছে, প্রস্তুত করা হচ্ছে...");
        const json = await res.json();
        const hadiths = json.hadiths;
        const total = hadiths.length;

        if (!dbInstance) await initDB();

        let inserted = 0;
        const chunkSize = 200; // Smaller chunk to prevent freezing
        
        for (let i = 0; i < total; i += chunkSize) {
          const chunk = hadiths.slice(i, i + chunkSize);
          
          // Delay to allow UI rendering
          await new Promise(r => setTimeout(r, 50));

          await new Promise((resolve, reject) => {
            const tx = dbInstance.transaction('hadith', 'readwrite');
            tx.oncomplete = resolve;
            tx.onerror = reject;

            const store = tx.objectStore('hadith');
            for (let h of chunk) {
              const text = h.text.toLowerCase();
              const topics = HADITH_TOPICS.filter(t => t.keywords.some(kw => text.includes(kw))).map(t => t.id);

              store.put({
                key: `${bookId}_${h.hadithnumber}`,
                data: {
                  book: bookId,
                  number: h.hadithnumber,
                  bangla: h.text,
                  grade: h.grades?.length > 0 ? h.grades[0].grade : "Not specified",
                  topics
                }
              });
            }
          });

          inserted += chunk.length;
          let percent = 20 + Math.floor((inserted / total) * 80);
          if (progressCallback) progressCallback(percent, `${inserted} / ${total} সেভ হয়েছে`);
        }

        await saveToDB('hadith', { key: `book_meta_${bookId}`, totalCount: total });
        return true;
      } catch (error) {
        console.error("Download Error:", error);
        return false;
      }
    },

    getHadithsByTopic: async (topicId) => {
      if (!dbInstance) await initDB();
      return new Promise((resolve) => {
        const tx = dbInstance.transaction('hadith', 'readonly');
        const req = tx.objectStore('hadith').getAll();
        req.onsuccess = () => {
          const all = req.result;
          resolve(all.filter(item => item.data?.topics?.includes(topicId)).map(i => i.data));
        };
        req.onerror = () => resolve([]);
      });
    },

    getHadithsByBook: async (bookId, limit = 50) => {
      if (!dbInstance) await initDB();
      return new Promise((resolve) => {
        const tx = dbInstance.transaction('hadith', 'readonly');
        const req = tx.objectStore('hadith').getAll();
        req.onsuccess = () => {
          const all = req.result;
          resolve(all.filter(item => item.key.startsWith(`${bookId}_`)).map(i => i.data).slice(0, limit));
        };
        req.onerror = () => resolve([]);
      });
    },

    getTopicListWithCounts: async () => {
      if (!dbInstance) await initDB();
      const topicsWithCount = HADITH_TOPICS.map(t => ({ ...t, count: 0 }));
      return new Promise((resolve) => {
        const tx = dbInstance.transaction('hadith', 'readonly');
        const req = tx.objectStore('hadith').getAll();
        req.onsuccess = () => {
          const all = req.result;
          for (let item of all) {
            if (item.data?.topics) {
              for (let tId of item.data.topics) {
                const t = topicsWithCount.find(x => x.id === tId);
                if (t) t.count++;
              }
            }
          }
          resolve(topicsWithCount);
        };
        req.onerror = () => resolve(topicsWithCount);
      });
    },

    // AI Detailed Explanation for Hadith
    getHadithExplanation: async (book, number, text) => {
      const key = localStorage.getItem('geminiKey');
      const model = localStorage.getItem('geminiModel') || 'gemini-1.5-flash';
      if (!key) return "বিস্তারিত দেখতে সেটিংস থেকে Gemini API Key দিন।";

      const prompt = `তুমি একজন প্রাজ্ঞ ইসলামিক পণ্ডিত। নিচের হাদিসটির বিস্তারিত বিশ্লেষণ দাও:
গ্রন্থ: ${book}, হাদিস নং: ${number}
হাদিস: ${text}

উত্তরে অবশ্যই নিচের বিষয়গুলো অন্তর্ভুক্ত করবে:
১. হাদিসের সারসংক্ষেপ
২. প্রেক্ষাপট বা ঐতিহাসিক পটভূমি (যদি থাকে)
৩. হাদিসের মূল শিক্ষা ও বিধান
৪. বর্তমান সমাজে এর প্রয়োগ ও গুরুত্ব

উত্তর বাংলায়, গুছিয়ে এবং সুন্দর পয়েন্ট আকারে দেবে।`;

      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { temperature: 0.2, maxOutputTokens: 800 } })
        });
        const data = await res.json();
        return data?.candidates?.[0]?.content?.parts?.[0]?.text || "বিস্তারিত তথ্য পাওয়া যায়নি।";
      } catch (e) {
        return "লোড করতে সমস্যা হয়েছে। ইন্টারনেট সংযোগ ও API Key চেক করুন।";
      }
    }
  };

  // --- AUDIO MANAGER (Full Surah Offline Download) ---
  window.AudioManager = {
    cacheName: 'islamic-audio-cache-v1',
    getCacheKey: (s, a) => `offline-audio://${s}:${a}`,
    
    resolveAudioUrl: async (surahId, ayah) => {
      try {
        const res = await fetch(`https://api.alquran.cloud/v1/ayah/${surahId}:${ayah}/${currentQari}`);
        if (res.ok) {
          const json = await res.json();
          if (json.data && json.data.audio) return json.data.audio;
        }
      } catch (e) {}
      // Fallback
      return `https://cdn.islamic.network/quran/audio/128/${currentQari}/${surahId * 1000 + ayah}.mp3`;
    },

    downloadFullSurah: async (surahId, totalAyahs, btn) => {
      const originalText = btn.innerHTML;
      btn.disabled = true;
      try {
        if (!navigator.onLine) throw new Error("offline");
        const cache = await caches.open(AudioManager.cacheName);
        
        for (let i = 1; i <= totalAyahs; i++) {
          btn.innerHTML = `<span class="material-symbols-rounded">hourglass_top</span> নামছে... (${i}/${totalAyahs})`;
          const url = await AudioManager.resolveAudioUrl(surahId, i);
          const key = AudioManager.getCacheKey(surahId, i);
          
          const cached = await cache.match(key);
          if (!cached) {
            const res = await fetch(url);
            if (res.ok) await cache.put(key, res.clone());
          }
        }
        btn.innerHTML = '<span class="material-symbols-rounded">task_alt</span> সেভড';
        alert("সম্পূর্ণ সূরা অফলাইনের জন্য সেভ করা হয়েছে!");
      } catch (error) {
        console.error("Surah Download Error:", error);
        btn.innerHTML = '<span class="material-symbols-rounded">error</span> ব্যর্থ';
      } finally {
        setTimeout(() => {
          btn.disabled = false;
          if(btn.innerHTML.includes('ব্যর্থ') || btn.innerHTML.includes('সেভড')) {
             btn.innerHTML = originalText;
          }
        }, 3000);
      }
    }
  };

  // --- UI RENDERER ---
  const UIRenderer = {
    currentAudio: null,
    currentBtn: null,

    playAudio: (url, btnElement, onEndCallback) => {
      if (UIRenderer.currentAudio) {
        UIRenderer.currentAudio.pause();
        if (UIRenderer.currentBtn) {
          UIRenderer.currentBtn.classList.remove('audio-playing');
          UIRenderer.currentBtn.innerHTML = '<span class="material-symbols-rounded">play_circle</span>';
        }
      }
      if (url) {
        UIRenderer.currentAudio = new Audio(url);
        UIRenderer.currentAudio.play();
        UIRenderer.currentBtn = btnElement;
        
        if (btnElement) {
          btnElement.classList.add('audio-playing');
          btnElement.innerHTML = '<span class="material-symbols-rounded">pause_circle</span>';
        }

        UIRenderer.currentAudio.onended = () => {
          if (btnElement) {
            btnElement.classList.remove('audio-playing');
            btnElement.innerHTML = '<span class="material-symbols-rounded">play_circle</span>';
          }
          UIRenderer.currentBtn = null;
          if (onEndCallback) onEndCallback();
        };
      }
    },

    // Fixed TTS using native SpeechSynthesis
    playTTS: (text, btnElement) => {
      const cleanText = String(text || '').replace(/<[^>]*>/g, ' ').trim();
      if (!cleanText) return;

      if (!('speechSynthesis' in window)) {
        alert("আপনার ব্রাউজারে ভয়েস সাপোর্ট নেই");
        return;
      }

      // If already speaking, stop it
      if (window.speechSynthesis.speaking) {
        window.speechSynthesis.cancel();
        if (btnElement) btnElement.innerHTML = `<span class="material-symbols-rounded">volume_up</span> শুনুন`;
        return;
      }

      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.lang = 'bn-BD';
      utterance.rate = 0.9;
      
      if (btnElement) btnElement.innerHTML = '<span class="material-symbols-rounded">stop_circle</span> থামুন';

      utterance.onend = () => {
        if (btnElement) btnElement.innerHTML = `<span class="material-symbols-rounded">volume_up</span> শুনুন`;
      };
      
      window.speechSynthesis.speak(utterance);
    },

    createModal: (title, content) => {
        const modal = document.createElement('div');
        modal.style.position = 'fixed';
        modal.style.top = '0';
        modal.style.left = '0';
        modal.style.width = '100%';
        modal.style.height = '100%';
        modal.style.backgroundColor = 'rgba(0,0,0,0.6)';
        modal.style.backdropFilter = 'blur(4px)';
        modal.style.zIndex = '10000';
        modal.style.display = 'flex';
        modal.style.justifyContent = 'center';
        modal.style.alignItems = 'center';
        
        const safeContent = String(content).replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        
        modal.innerHTML = `
            <div style="background:var(--bg-surface); width:92%; max-width:500px; padding:24px; border-radius:20px; max-height:85vh; overflow-y:auto; border:2px solid var(--accent-primary); box-shadow:0 10px 25px rgba(0,0,0,0.3);">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px; border-bottom:1px solid var(--border-color); padding-bottom:10px;">
                    <h3 style="color:var(--accent-primary); margin:0; font-size:18px;">${title}</h3>
                    <button class="icon-btn" onclick="this.parentElement.parentElement.parentElement.remove()" style="background:var(--bg-main);"><span class="material-symbols-rounded">close</span></button>
                </div>
                <div style="font-size:15px; line-height:1.7; color:var(--text-primary); white-space:pre-wrap;">${safeContent}</div>
                <button class="embed-btn" style="margin-top:20px; width:100%; justify-content:center; background:var(--accent-primary); color:#fff;" onclick="this.parentElement.parentElement.remove()">বন্ধ করুন</button>
            </div>
        `;
        document.body.appendChild(modal);
    },

    showBackstory: async (surah, ayah, arabic, bangla, btn) => {
      const originalHtml = btn.innerHTML;
      btn.disabled = true;
      btn.innerHTML = '<span class="material-symbols-rounded">hourglass_top</span>';
      try {
        const story = await QuranAPI.getAyahBackstory(surah, ayah, arabic, bangla);
        UIRenderer.createModal(`আয়াতের বিস্তারিত (সূরা: ${surah}, আয়াত: ${ayah})`, story);
      } catch (e) {
        alert("লোড করতে সমস্যা হয়েছে।");
      } finally {
        btn.disabled = false;
        btn.innerHTML = originalHtml;
      }
    },

    showHadithExplanation: async (book, number, text, btn) => {
      const originalHtml = btn.innerHTML;
      btn.disabled = true;
      btn.innerHTML = '<span class="material-symbols-rounded">hourglass_top</span> লোড হচ্ছে...';
      try {
        const exp = await HadithAPI.getHadithExplanation(book, number, text);
        UIRenderer.createModal(`${book} - হাদিস নং ${number}`, exp);
      } catch (e) {
        alert("লোড করতে সমস্যা হয়েছে।");
      } finally {
        btn.disabled = false;
        btn.innerHTML = originalHtml;
      }
    }
  };

  return {
    init: async () => { await initDB(); },
    Quran: {
      ...QuranAPI,
      toggleAutoAdvance,
      getAutoAdvance: () => autoAdvanceEnabled
    },
    Hadith: HadithAPI,
    UI: UIRenderer
  };
})();
