/**
 * misconceptions-module.js
 * Handles loading and displaying misconceptions from misconceptions.json
 * Adapted to use native SpeechSynthesis and Global AIEngine
 */

const MisconceptionsModule = (function() {
  let data = null;
  let currentCategory = null;
  let currentQuestion = null;

  const mainContainer = document.getElementById('misconceptionsContainer');
  let categoryGrid, questionList, detailView;

  function ensureContainers() {
    if (!mainContainer) return false;
    
    if (!document.getElementById('catGrid-mc')) {
      categoryGrid = document.createElement('div');
      categoryGrid.id = 'catGrid-mc';
      categoryGrid.className = 'grid';
      mainContainer.appendChild(categoryGrid);
    } else {
      categoryGrid = document.getElementById('catGrid-mc');
    }
    
    if (!document.getElementById('qList-mc')) {
      questionList = document.createElement('div');
      questionList.id = 'qList-mc';
      questionList.style.display = 'none';
      questionList.className = 'grid';
      mainContainer.appendChild(questionList);
    } else {
      questionList = document.getElementById('qList-mc');
    }
    
    if (!document.getElementById('detailView-mc')) {
      detailView = document.createElement('div');
      detailView.id = 'detailView-mc';
      detailView.style.display = 'none';
      mainContainer.appendChild(detailView);
    } else {
      detailView = document.getElementById('detailView-mc');
    }
    return true;
  }

  async function loadData() {
    if (data) return data;
    try {
      const res = await fetch('misconceptions.json');
      data = await res.json();
      return data;
    } catch (e) {
      console.error("Failed to load misconceptions.json", e);
      return null;
    }
  }

  async function renderCategories() {
    if (!ensureContainers()) return;
    if (!data) await loadData();
    if (!data || !data.categories) {
      categoryGrid.innerHTML = '<div class="error-msg">ডেটা লোড হয়নি</div>';
      return;
    }

    let html = '';
    data.categories.forEach(cat => {
      html += `
        <div class="q-card" style="border-left: 5px solid ${cat.color};" onclick="MisconceptionsModule.showCategory('${cat.id}')">
          <span style="font-size: 36px; margin-bottom: 8px; display:block;">${cat.icon}</span>
          <h3 style="margin: 0; color: var(--text-primary); font-size:16px;">${cat.name}</h3>
          <span style="font-size: 13px; color: var(--text-secondary);">${cat.questions.length} টি বিষয়</span>
        </div>
      `;
    });
    categoryGrid.innerHTML = html;
    categoryGrid.style.display = 'grid';
    questionList.style.display = 'none';
    detailView.style.display = 'none';
  }

  async function showCategory(catId) {
    if (!data) await loadData();
    const cat = data.categories.find(c => c.id === catId);
    if (!cat) return;

    currentCategory = cat;
    categoryGrid.style.display = 'none';
    questionList.style.display = 'grid';
    detailView.style.display = 'none';

    let html = `
      <div style="grid-column: 1 / -1; margin-bottom: 12px; display:flex; align-items:center; gap:12px;">
        <button class="icon-btn" onclick="MisconceptionsModule.backToCategories()" style="background:var(--bg-surface); box-shadow:var(--shadow-sm);"><span class="material-symbols-rounded">arrow_back</span></button>
        <h2 style="color:${cat.color}; margin:0;">${cat.name}</h2>
      </div>
    `;
    
    cat.questions.forEach(q => {
      html += `
        <div class="q-card" style="border-left: 4px solid ${cat.color}; padding:16px; text-align:left; display:block;" onclick="MisconceptionsModule.showQuestion('${q.id}')">
          <div style="font-weight: 600; margin-bottom: 8px; color: var(--text-primary);">${q.q}</div>
          <div style="display: flex; justify-content: space-between; align-items: center; margin-top:12px;">
            <span style="background: ${getTrustColor(q.trust_rating)}; color: #fff; padding: 2px 8px; border-radius: 12px; font-size: 11px; font-weight:bold;">★ ${q.trust_rating}/10</span>
          </div>
        </div>
      `;
    });
    questionList.innerHTML = html;
  }

  function getTrustColor(rating) {
    if (rating >= 9) return '#10b981';
    if (rating >= 7) return '#f59e0b';
    return '#ef4444';
  }

  async function showQuestion(qid) {
    if (!currentCategory) return;
    const q = currentCategory.questions.find(q => q.id === qid);
    if (!q) return;

    currentQuestion = q;
    questionList.style.display = 'none';
    detailView.style.display = 'block';

    let madhabHtml = '';
    if (q.madhhab) {
      let options = '<option value="">মাযহাব নির্বাচন করুন</option>';
      for (let mad in q.madhhab) {
        options += `<option value="${mad}">${mad}</option>`;
      }
      madhabHtml = `
        <div style="margin: 16px 0;">
          <select id="madhabSelect" onchange="MisconceptionsModule.showMadhabNote(this.value)" style="width: 100%; padding: 10px; border-radius: 8px; border: 1px solid var(--border-color); background: var(--bg-main); color: var(--text-primary); font-family:inherit;">
            ${options}
          </select>
          <div id="madhabNote" style="margin-top: 12px; padding: 12px; background: var(--bg-main); border-radius: 8px; display: none; font-size:14px; border-left:3px solid var(--accent-primary);"></div>
        </div>
      `;
    }

    const answerHtml = q.a.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br>');

    detailView.innerHTML = `
      <div style="margin-bottom: 20px;">
        <button class="btn-outline" onclick="MisconceptionsModule.backToQuestions()">
          <span class="material-symbols-rounded">arrow_back</span> প্রশ্ন তালিকায় ফিরুন
        </button>
      </div>
      <div class="mag-section" style="border-left-color: ${currentCategory.color}; box-shadow:var(--shadow-md);">
        <div class="mag-header" style="color:var(--text-primary);">
          <span class="material-symbols-rounded" style="color:${currentCategory.color};">help</span>
          ${q.q}
        </div>
        <div class="mag-body">
          <div style="font-size:16px; line-height:1.7;">${answerHtml}</div>
          <div style="margin-top: 20px; font-size: 14px; color: var(--text-secondary); background:rgba(0,0,0,0.03); padding:10px; border-radius:8px;">
            <strong>তথ্যসূত্র:</strong> ${q.ref || 'উল্লেখিত নয়'}
          </div>
          
          ${madhabHtml}
          
          <div style="margin-top: 24px; padding-top:16px; border-top:1px dashed var(--border-color); display: flex; gap: 10px; flex-wrap: wrap;">
            <button class="embed-btn" onclick="MisconceptionsModule.playTTS(this)">
              <span class="material-symbols-rounded">volume_up</span> উত্তর শুনুন
            </button>
            <button class="embed-btn" style="color:#2563eb; border-color:#bfdbfe;" onclick="MisconceptionsModule.expandAnswer(this)">
              <span class="material-symbols-rounded">auto_awesome</span> AI বিস্তারিত
            </button>
            <button class="embed-btn" onclick="navigator.clipboard.writeText('${q.a.replace(/'/g, "\\'")}')">
              <span class="material-symbols-rounded">content_copy</span> কপি
            </button>
          </div>
        </div>
      </div>
    `;
  }

  function showMadhabNote(madhab) {
    const noteDiv = document.getElementById('madhabNote');
    if (!madhab || !currentQuestion || !currentQuestion.madhhab) {
      noteDiv.style.display = 'none';
      return;
    }
    const note = currentQuestion.madhhab[madhab];
    if (note) {
      noteDiv.innerHTML = `<strong>${madhab}:</strong> ${note}`;
      noteDiv.style.display = 'block';
    } else {
      noteDiv.style.display = 'none';
    }
  }

  function backToQuestions() {
    if(window.speechSynthesis) window.speechSynthesis.cancel();
    detailView.style.display = 'none';
    questionList.style.display = 'grid';
  }

  function backToCategories() {
    if(window.speechSynthesis) window.speechSynthesis.cancel();
    detailView.style.display = 'none';
    questionList.style.display = 'none';
    categoryGrid.style.display = 'grid';
  }

  // Native SpeechSynthesis (No ResponsiveVoice)
  function playTTS(btnElement) {
    if (!currentQuestion) return;
    
    if (!('speechSynthesis' in window)) {
      if(typeof UI !== 'undefined') UI.showToast("আপনার ব্রাউজারে ভয়েস সাপোর্ট নেই");
      else alert("আপনার ব্রাউজারে ভয়েস সাপোর্ট নেই");
      return;
    }

    if (window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
      if (btnElement) btnElement.innerHTML = `<span class="material-symbols-rounded">volume_up</span> উত্তর শুনুন`;
      return;
    }

    const cleanText = currentQuestion.a.replace(/\*/g, '').replace(/<[^>]*>/g, ' ').trim();
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = 'bn-BD';
    utterance.rate = 0.9;
    
    if (btnElement) btnElement.innerHTML = '<span class="material-symbols-rounded">stop_circle</span> থামুন';

    utterance.onend = () => {
      if (btnElement) btnElement.innerHTML = `<span class="material-symbols-rounded">volume_up</span> উত্তর শুনুন`;
    };
    
    window.speechSynthesis.speak(utterance);
  }

  async function expandAnswer(btnElement) {
    if (!currentQuestion) return;
    if (typeof AIEngine === 'undefined') {
      alert('AI ইঞ্জিন লোড হয়নি। দয়া করে পেজটি রিফ্রেশ করুন।');
      return;
    }
    
    const originalHTML = btnElement.innerHTML;
    btnElement.disabled = true;
    btnElement.innerHTML = '<span class="material-symbols-rounded">hourglass_top</span> লোড হচ্ছে...';
    
    const prompt = `প্রশ্ন: ${currentQuestion.q}\n\nসংক্ষিপ্ত উত্তর:\n${currentQuestion.a}\n\nউপরের উত্তরটি আরও বিস্তারিতভাবে ব্যাখ্যা করুন, কুরআন ও হাদিসের দলিলসহ। যদি সমাজে এ নিয়ে কোনো প্রচলিত কুসংস্কার থাকে, তবে তা কেন ভুল সেটিও লজিক দিয়ে বুঝিয়ে বলুন। পয়েন্ট আকারে বাংলায় সুন্দর করে লিখুন।`;
    
    try {
      const ans = await AIEngine.run(prompt);
      
      // Use existing Modal from UI if available
      if (typeof UI !== 'undefined' && UI.createModal) {
         UI.createModal(`AI বিস্তারিত: ${currentQuestion.q}`, ans.text);
      } else {
         // Fallback basic modal
         alert(ans.text.replace(/<[^>]*>/g, ''));
      }
    } catch (e) {
      if(typeof UI !== 'undefined') UI.showToast('AI কল ব্যর্থ হয়েছে: ' + e.message);
      else alert('AI কল ব্যর্থ হয়েছে: ' + e.message);
    } finally {
      btnElement.disabled = false;
      btnElement.innerHTML = originalHTML;
    }
  }

  return {
    init: async function() {
      ensureContainers();
      await loadData();
      renderCategories();
    },
    renderCategories,
    showCategory,
    showQuestion,
    backToQuestions,
    backToCategories,
    showMadhabNote,
    expandAnswer,
    playTTS
  };
})();

// Expose globally
window.MisconceptionsModule = MisconceptionsModule;
