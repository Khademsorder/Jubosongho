/**
 * misconceptions-module.js
 * Handles loading and displaying misconceptions from misconceptions.json
 * Fully synced with JSON structure: categories, questions, trust_rating, audio_url, madhhab
 * Uses global AudioManager for audio playback and AIEngine for expand/verify (if available)
 */

const MisconceptionsModule = (function() {
  // Private variables
  let data = null;
  let currentCategory = null;
  let currentQuestion = null;

  // Cache DOM elements
  const mainContainer = document.getElementById('misconceptionsContainer');
  const categoryGrid = document.getElementById('categoryGrid');
  const questionList = document.getElementById('questionList');
  const detailView = document.getElementById('detailView');

  // Initialize – create containers if they don't exist
  function ensureContainers() {
    if (!mainContainer) {
      console.error("MisconceptionsModule: #misconceptionsContainer not found");
      return false;
    }
    if (!categoryGrid) {
      const grid = document.createElement('div');
      grid.id = 'categoryGrid';
      grid.className = 'grid'; // reuse app's grid style
      mainContainer.appendChild(grid);
    }
    if (!questionList) {
      const list = document.createElement('div');
      list.id = 'questionList';
      list.style.display = 'none';
      list.className = 'grid'; // reuse grid
      mainContainer.appendChild(list);
    }
    if (!detailView) {
      const detail = document.createElement('div');
      detail.id = 'detailView';
      detail.style.display = 'none';
      detail.className = 'magazine-content'; // reuse magazine style
      mainContainer.appendChild(detail);
    }
    return true;
  }

  // Load data from misconceptions.json
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

  // Render category cards
  async function renderCategories() {
    if (!ensureContainers()) return;
    if (!data) await loadData();
    if (!data || !data.categories) {
      categoryGrid.innerHTML = '<div class="error">ডেটা লোড হয়নি</div>';
      return;
    }

    let html = '';
    data.categories.forEach(cat => {
      html += `
        <div class="category-card" data-cat-id="${cat.id}" style="border-left: 5px solid ${cat.color}; background: var(--bg-surface); border-radius: 16px; padding: 16px; cursor: pointer; transition: all 0.3s; box-shadow: var(--shadow-sm);" onclick="MisconceptionsModule.showCategory('${cat.id}')">
          <div style="display: flex; align-items: center; gap: 12px;">
            <span style="font-size: 32px;">${cat.icon}</span>
            <div>
              <h3 style="margin: 0; color: var(--text-primary);">${cat.name}</h3>
              <span style="font-size: 13px; color: var(--text-secondary);">${cat.questions.length} টি প্রশ্ন</span>
            </div>
          </div>
        </div>
      `;
    });
    categoryGrid.innerHTML = html;
    categoryGrid.style.display = 'grid';
    questionList.style.display = 'none';
    detailView.style.display = 'none';
  }

  // Show questions of a category
  async function showCategory(catId) {
    if (!data) await loadData();
    const cat = data.categories.find(c => c.id === catId);
    if (!cat) return;

    currentCategory = cat;
    categoryGrid.style.display = 'none';
    questionList.style.display = 'grid';
    detailView.style.display = 'none';

    let html = '';
    cat.questions.forEach(q => {
      html += `
        <div class="question-card" data-qid="${q.id}" style="background: var(--bg-surface); border-radius: 16px; padding: 16px; border-left: 4px solid ${cat.color}; cursor: pointer; box-shadow: var(--shadow-sm); transition: transform 0.2s;" onclick="MisconceptionsModule.showQuestion('${q.id}')">
          <div style="font-weight: 600; margin-bottom: 8px; color: var(--text-primary);">${q.q}</div>
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <span class="trust-badge" style="background: ${getTrustColor(q.trust_rating)}; color: #fff; padding: 4px 10px; border-radius: 20px; font-size: 12px;">★ ${q.trust_rating}/10</span>
            ${q.audio_url ? '<span class="material-symbols-rounded" style="color: var(--accent-primary);">volume_up</span>' : ''}
          </div>
        </div>
      `;
    });
    questionList.innerHTML = html;
  }

  // Helper to get color based on trust rating
  function getTrustColor(rating) {
    if (rating >= 9) return '#10b981'; // green
    if (rating >= 7) return '#f59e0b'; // orange
    return '#ef4444'; // red
  }

  // Show detailed answer for a question
  async function showQuestion(qid) {
    if (!currentCategory) return;
    const q = currentCategory.questions.find(q => q.id === qid);
    if (!q) return;

    currentQuestion = q;
    questionList.style.display = 'none';
    detailView.style.display = 'block';

    // Build madhab selector HTML if madhab exists
    let madhabHtml = '';
    if (q.madhhab) {
      if (Array.isArray(q.madhhab)) {
        madhabHtml = `<div class="madhhab-info" style="margin: 16px 0; padding: 12px; background: var(--bg-main); border-radius: 12px;">সকল মাযহাবে প্রযোজ্য: ${q.madhhab.join(', ')}</div>`;
      } else if (typeof q.madhhab === 'object') {
        let options = '<option value="">মাযহাব নির্বাচন করুন</option>';
        for (let mad in q.madhhab) {
          options += `<option value="${mad}">${mad}</option>`;
        }
        madhabHtml = `
          <div class="madhhab-selector" style="margin: 16px 0;">
            <select id="madhabSelect" onchange="MisconceptionsModule.showMadhabNote(this.value)" style="width: 100%; padding: 10px; border-radius: 8px; border: 1px solid var(--border-color); background: var(--bg-surface); color: var(--text-primary);">
              ${options}
            </select>
            <div id="madhabNote" style="margin-top: 12px; padding: 12px; background: var(--bg-main); border-radius: 8px; display: none;"></div>
          </div>
        `;
      }
    }

    // Build answer HTML with markdown-like formatting (bold, etc.)
    const answerHtml = q.a.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br>');

    detailView.innerHTML = `
      <div style="margin-bottom: 20px;">
        <button class="btn-outline" onclick="MisconceptionsModule.backToQuestions()">
          <span class="material-symbols-rounded">arrow_back</span> প্রশ্ন তালিকায় ফিরুন
        </button>
      </div>
      <div class="mag-section" style="border-left-color: ${currentCategory.color};">
        <div class="mag-header">
          <span class="material-symbols-rounded">help</span>
          ${q.q}
        </div>
        <div class="mag-body">
          ${answerHtml}
          <div style="margin-top: 16px; font-size: 14px; color: var(--text-secondary);">
            <strong>তথ্যসূত্র:</strong> ${q.ref || 'উল্লেখিত নয়'}
          </div>
          <div style="margin-top: 8px;">
            <span class="trust-badge" style="background: ${getTrustColor(q.trust_rating)}; color: #fff; padding: 4px 10px; border-radius: 20px; font-size: 12px;">বিশ্বস্ততা: ${q.trust_rating}/10</span>
          </div>
          ${q.audio_url ? `
            <div style="margin-top: 16px;">
              <button class="embed-btn" onclick="AudioManager.play('${q.audio_url}', this)">
                <span class="material-symbols-rounded">play_circle</span> অডিও শুনুন
              </button>
            </div>
          ` : ''}
          ${madhabHtml}
          <div style="margin-top: 20px; display: flex; gap: 12px; flex-wrap: wrap;">
            <button class="btn-outline" onclick="MisconceptionsModule.expandAnswer()">
              <span class="material-symbols-rounded">auto_awesome</span> AI বিস্তারিত
            </button>
            <button class="btn-outline" onclick="MisconceptionsModule.verifyAnswer()">
              <span class="material-symbols-rounded">verified</span> যাচাই
            </button>
          </div>
        </div>
      </div>
    `;
  }

  // Show madhab note when a madhab is selected
  function showMadhabNote(madhab) {
    if (!madhab || !currentQuestion || !currentQuestion.madhhab) return;
    const noteDiv = document.getElementById('madhabNote');
    const note = currentQuestion.madhhab[madhab];
    if (note) {
      noteDiv.innerHTML = note;
      noteDiv.style.display = 'block';
    } else {
      noteDiv.style.display = 'none';
    }
  }

  // Back to question list
  function backToQuestions() {
    detailView.style.display = 'none';
    questionList.style.display = 'grid';
  }

  // Back to main categories
  function backToCategories() {
    detailView.style.display = 'none';
    questionList.style.display = 'none';
    categoryGrid.style.display = 'grid';
  }

  // AI Expand – uses global AIEngine if available
  async function expandAnswer() {
    if (!currentQuestion) return;
    if (typeof AIEngine === 'undefined') {
      alert('AI ইঞ্জিন উপলব্ধ নেই');
      return;
    }
    const prompt = `প্রশ্ন: ${currentQuestion.q}\n\nউত্তর:\n${currentQuestion.a}\n\nউপরের উত্তরটি আরও বিস্তারিতভাবে ব্যাখ্যা করুন, কুরআন ও হাদিসের দলিলসহ।`;
    try {
      const ans = await AIEngine.run(prompt);
      // Show result in a modal or overlay – for simplicity, we append below
      const ansDiv = document.createElement('div');
      ansDiv.className = 'mag-section color-2';
      ansDiv.innerHTML = `
        <div class="mag-header">AI বিস্তারিত উত্তর</div>
        <div class="mag-body">${ans.text.replace(/\n/g, '<br>')}</div>
      `;
      detailView.appendChild(ansDiv);
    } catch (e) {
      alert('AI কল ব্যর্থ হয়েছে');
    }
  }

  // AI Verify – checks authenticity (dummy for now, could call AI with verification prompt)
  async function verifyAnswer() {
    if (!currentQuestion) return;
    if (typeof AIEngine === 'undefined') {
      alert('AI ইঞ্জিন উপলব্ধ নেই');
      return;
    }
    const prompt = `প্রশ্ন: ${currentQuestion.q}\n\nউত্তর:\n${currentQuestion.a}\n\nউপরের উত্তরটির দলিল (কুরআন/হাদিস) যাচাই করুন। কোন হাদিসটি কোথায় আছে, তা উল্লেখ করুন এবং এর বিশুদ্ধতা (সহিহ/হাসান/জইফ) বলুন।`;
    try {
      const ans = await AIEngine.run(prompt);
      const verifyDiv = document.createElement('div');
      verifyDiv.className = 'mag-section color-4';
      verifyDiv.innerHTML = `
        <div class="mag-header">যাচাই ফলাফল</div>
        <div class="mag-body">${ans.text.replace(/\n/g, '<br>')}</div>
      `;
      detailView.appendChild(verifyDiv);
    } catch (e) {
      alert('AI কল ব্যর্থ হয়েছে');
    }
  }

  // Public API
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
    verifyAnswer
  };
})();

// Expose globally
window.MisconceptionsModule = MisconceptionsModule;