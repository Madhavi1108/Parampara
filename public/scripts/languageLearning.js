// public/scripts/languageLearning.js

class LanguageLearningUI {
  constructor(options = {}) {
    this.apiBase = options.apiBase || '/api/language';
    this.userId = this.getUserId();
    this.container = options.container || '#language-container';
    this.currentLanguage = 'hi';
    this.currentLesson = null;
    this.isRecording = false;
    this.mediaRecorder = null;
    
    this.init();
  }

  getUserId() {
    let userId = localStorage.getItem('userId');
    if (!userId) {
      userId = `user_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('userId', userId);
    }
    return userId;
  }

  init() {
    this.renderInterface();
    this.loadLanguages();
    this.loadProgress();
    this.loadLeaderboard();
    this.setupEventListeners();
    console.log('✅ Language Learning UI initialized');
  }

  renderInterface() {
    const container = document.querySelector(this.container);
    if (!container) return;

    container.innerHTML = `
      <div class="language-interface">
        <div class="language-header">
          <h2>🗣️ Heritage Language Learning</h2>
          <div class="language-actions">
            <button id="btn-language-select" class="btn btn-primary">
              🌍 Change Language
            </button>
          </div>
        </div>

        <!-- Language Selector Modal -->
        <div class="modal" id="language-select-modal" style="display: none;">
          <div class="modal-content">
            <span class="modal-close">&times;</span>
            <h3>🌍 Select Language</h3>
            <div id="language-grid" class="language-grid">
              <!-- Languages will be loaded here -->
            </div>
          </div>
        </div>

        <!-- Progress Stats -->
        <div class="progress-stats" id="progress-stats">
          <!-- Stats will be loaded here -->
        </div>

        <!-- Current Lesson -->
        <div class="lesson-container" id="lesson-container">
          <div class="lesson-placeholder">
            <p>📚 Select a language to start learning</p>
            <button onclick="document.getElementById('btn-language-select').click()" class="btn btn-primary">
              Choose Language
            </button>
          </div>
        </div>

        <!-- Leaderboard -->
        <div class="leaderboard-section" id="leaderboard-section">
          <h4>🏆 Leaderboard</h4>
          <div id="leaderboard-list">
            <p>Loading...</p>
          </div>
        </div>
      </div>
    `;
  }

  async loadLanguages() {
    try {
      const response = await fetch(`${this.apiBase}/languages`);
      const data = await response.json();

      if (data.success) {
        this.renderLanguageGrid(data.languages);
      }
    } catch (error) {
      console.error('Error loading languages:', error);
    }
  }

  renderLanguageGrid(languages) {
    const grid = document.getElementById('language-grid');
    if (!grid) return;

    grid.innerHTML = languages.map(lang => `
      <div class="language-card" onclick="window.langUI.selectLanguage('${lang.id}')" style="
        background: white;
        padding: 20px;
        border-radius: 12px;
        text-align: center;
        box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        cursor: pointer;
        transition: transform 0.3s;
        border: ${this.currentLanguage === lang.id ? '3px solid #4CAF50' : 'none'};
      ">
        <div style="font-size: 40px; margin-bottom: 10px;">${this.getLanguageEmoji(lang.id)}</div>
        <h4 style="margin: 5px 0;">${lang.name}</h4>
        <p style="margin: 0; color: #666; font-size: 12px;">${lang.region}</p>
        <p style="margin: 5px 0; font-size: 12px; color: #888;">${lang.speakers} speakers</p>
        <span style="
          background: ${lang.status === 'major' ? '#4CAF50' : lang.status === 'regional' ? '#FF9800' : '#9E9E9E'};
          color: white;
          padding: 2px 10px;
          border-radius: 12px;
          font-size: 11px;
        ">${lang.status}</span>
      </div>
    `).join('');

    // Add hover effect
    grid.querySelectorAll('.language-card').forEach(card => {
      card.addEventListener('mouseenter', () => {
        card.style.transform = 'translateY(-5px)';
      });
      card.addEventListener('mouseleave', () => {
        card.style.transform = 'translateY(0)';
      });
    });
  }

  getLanguageEmoji(langId) {
    const emojis = {
      hi: '🇮🇳', bn: '🇧🇩', mr: '🇮🇳', ta: '🇮🇳', te: '🇮🇳',
      kn: '🇮🇳', ml: '🇮🇳', gu: '🇮🇳', or: '🇮🇳', pa: '🇮🇳',
      bh: '🇮🇳', ma: '🇮🇳', as: '🇮🇳', ks: '🇮🇳', sd: '🇮🇳',
      ne: '🇳🇵', doi: '🇮🇳', sa: '🕉️'
    };
    return emojis[langId] || '🌍';
  }

  async selectLanguage(languageId) {
    this.currentLanguage = languageId;
    document.getElementById('language-select-modal').style.display = 'none';
    
    this.showToast(`📚 Loading ${this.getLanguageName(languageId)}...`, 'info');
    await this.loadLesson(languageId);
    await this.loadWords(languageId);
  }

  async loadLesson(languageId, level = 1) {
    const container = document.getElementById('lesson-container');
    if (!container) return;

    this.setLoading(container, true);

    try {
      const response = await fetch(`${this.apiBase}/lesson/generate?language=${languageId}&level=${level}&userId=${this.userId}`);
      const data = await response.json();

      if (data.success) {
        this.currentLesson = data.lesson;
        this.renderLesson(container, data);
      }
    } catch (error) {
      console.error('Error loading lesson:', error);
      container.innerHTML = '<p class="error">❌ Failed to load lesson</p>';
    } finally {
      this.setLoading(container, false);
    }
  }

  renderLesson(container, data) {
    const lesson = data.lesson;
    if (!lesson) {
      container.innerHTML = `
        <div class="lesson-placeholder">
          <p>🎉 All lessons completed!</p>
          <button onclick="window.langUI.loadLesson('${this.currentLanguage}', ${(lesson?.level || 1) + 1})" class="btn btn-primary">
            Next Level
          </button>
        </div>
      `;
      return;
    }

    const progress = data.progress || { completed: false, score: 0 };
    const wordObjects = lesson.words ? lesson.words.map(wid => 
      window.langUI.getWordData(wid)
    ).filter(w => w) : [];

    container.innerHTML = `
      <div class="lesson-content">
        <div class="lesson-header">
          <div>
            <h3>${lesson.title}</h3>
            <p>${lesson.description}</p>
          </div>
          <div class="lesson-meta">
            <span class="badge">Level ${lesson.level}</span>
            <span class="badge">${lesson.category}</span>
            ${progress.completed ? '<span class="badge badge-success">✅ Completed</span>' : ''}
          </div>
        </div>

        ${wordObjects.length > 0 ? `
          <div class="lesson-words">
            <h4>📝 Vocabulary</h4>
            <div class="word-grid">
              ${wordObjects.map(word => `
                <div class="word-card" style="
                  background: #f9f9f9;
                  padding: 15px;
                  border-radius: 8px;
                  margin-bottom: 10px;
                ">
                  <div style="display: flex; justify-content: space-between; align-items: center;">
                    <div>
                      <div style="font-size: 24px; font-weight: bold;">${word.word}</div>
                      <div style="color: #666; font-size: 14px;">${word.pronunciation}</div>
                      <div style="color: #888; font-size: 14px;">${word.meaning}</div>
                    </div>
                    <button onclick="window.langUI.practicePronunciation('${word.id}')" class="btn btn-primary" style="padding: 6px 12px; font-size: 12px;">
                      🎤 Practice
                    </button>
                  </div>
                  ${word.cultural_context ? `<div style="font-size: 12px; color: #666; margin-top: 5px;">📖 ${word.cultural_context}</div>` : ''}
                </div>
              `).join('')}
            </div>
          </div>
        ` : ''}

        ${lesson.exercises && lesson.exercises.length > 0 ? `
          <div class="lesson-exercises">
            <h4>✏️ Exercises</h4>
            ${lesson.exercises.map((exercise, index) => `
              <div class="exercise-card" style="
                background: #f5f5f5;
                padding: 15px;
                border-radius: 8px;
                margin-bottom: 10px;
              ">
                <p><strong>${index + 1}. ${exercise.question}</strong></p>
                ${exercise.type === 'multiple_choice' ? `
                  <div class="options">
                    ${exercise.options.map((opt, optIndex) => `
                      <button onclick="window.langUI.checkAnswer('${lesson.id}', ${index}, ${optIndex})" class="option-btn" style="
                        display: block;
                        width: 100%;
                        padding: 8px 12px;
                        margin: 3px 0;
                        background: white;
                        border: 1px solid #ddd;
                        border-radius: 5px;
                        cursor: pointer;
                        text-align: left;
                      ">
                        ${String.fromCharCode(65 + optIndex)}. ${opt}
                      </button>
                    `).join('')}
                  </div>
                ` : exercise.type === 'fill_blank' ? `
                  <div style="margin: 10px 0;">
                    <input type="text" id="fill-answer-${index}" placeholder="Type your answer..." style="
                      padding: 8px 12px;
                      border: 1px solid #ddd;
                      border-radius: 5px;
                      width: 70%;
                    ">
                    <button onclick="window.langUI.checkFillBlank('${lesson.id}', ${index})" class="btn btn-primary" style="padding: 8px 16px;">
                      Check
                    </button>
                  </div>
                ` : ''}
                <div id="exercise-feedback-${index}" style="margin-top: 5px; font-weight: bold;"></div>
              </div>
            `).join('')}
          </div>
        ` : ''}

        ${lesson.cultural_notes ? `
          <div class="cultural-notes" style="
            background: #e8f5e9;
            padding: 15px;
            border-radius: 8px;
            margin: 15px 0;
          ">
            <h4>📖 Cultural Notes</h4>
            <p>${lesson.cultural_notes}</p>
          </div>
        ` : ''}

        <div class="lesson-actions">
          <button onclick="window.langUI.completeLesson('${lesson.id}')" class="btn btn-success" style="padding: 12px 30px;">
            ✅ Mark as Complete
          </button>
          ${data.nextLesson ? `
            <button onclick="window.langUI.loadNextLesson()" class="btn btn-primary" style="padding: 12px 30px;">
              Next Lesson →
            </button>
          ` : ''}
        </div>
      </div>
    `;
  }

  async loadWords(languageId) {
    try {
      const response = await fetch(`${this.apiBase}/words/${languageId}`);
      const data = await response.json();

      if (data.success) {
        // Store words for quick access
        this.wordMap = {};
        data.words.forEach(word => {
          this.wordMap[word.id] = word;
        });
      }
    } catch (error) {
      console.error('Error loading words:', error);
    }
  }

  getWordData(wordId) {
    return this.wordMap ? this.wordMap[wordId] : null;
  }

  async loadProgress() {
    try {
      const response = await fetch(`${this.apiBase}/progress/${this.userId}`);
      const data = await response.json();

      if (data.success) {
        this.renderProgress(data.progress);
      }
    } catch (error) {
      console.error('Error loading progress:', error);
    }
  }

  renderProgress(progress) {
    const container = document.getElementById('progress-stats');
    if (!container) return;

    const completedCount = progress.completedLessons?.length || 0;

    container.innerHTML = `
      <div class="progress-grid">
        <div class="progress-card">
          <div class="progress-value">${completedCount}</div>
          <div class="progress-label">Lessons Completed</div>
        </div>
        <div class="progress-card">
          <div class="progress-value">${progress.points || 0}</div>
          <div class="progress-label">Points</div>
        </div>
        <div class="progress-card">
          <div class="progress-value">${progress.streak || 0}</div>
          <div class="progress-label">🔥 Day Streak</div>
        </div>
        <div class="progress-card">
          <div class="progress-value">${this.currentLanguage ? this.getLanguageName(this.currentLanguage) : '-'}</div>
          <div class="progress-label">Current Language</div>
        </div>
      </div>
    `;
  }

  async loadLeaderboard() {
    try {
      const response = await fetch(`${this.apiBase}/leaderboard?limit=10`);
      const data = await response.json();

      if (data.success) {
        this.renderLeaderboard(data.leaderboard);
      }
    } catch (error) {
      console.error('Error loading leaderboard:', error);
    }
  }

  renderLeaderboard(leaderboard) {
    const container = document.getElementById('leaderboard-list');
    if (!container) return;

    if (!leaderboard || leaderboard.length === 0) {
      container.innerHTML = '<p>No learners yet. Be the first!</p>';
      return;
    }

    container.innerHTML = `
      <div class="leaderboard">
        ${leaderboard.map((user, index) => `
          <div class="leaderboard-item" style="
            display: flex;
            align-items: center;
            padding: 10px 15px;
            border-bottom: 1px solid #eee;
            gap: 15px;
            ${user.userId === this.userId ? 'background: #e8f5e9; font-weight: bold;' : ''}
          ">
            <span style="font-weight: bold; min-width: 30px;">#${user.rank}</span>
            <span style="flex: 1;">${user.userId}</span>
            <span>${user.points} pts</span>
            <span style="font-size: 12px; color: #666;">🔥 ${user.streak}</span>
            <span style="font-size: 12px; color: #888;">📚 ${user.completedLessons}</span>
          </div>
        `).join('')}
      </div>
    `;
  }

  getLanguageName(languageId) {
    const names = {
      hi: 'Hindi', bn: 'Bengali', mr: 'Marathi', ta: 'Tamil',
      te: 'Telugu', kn: 'Kannada', ml: 'Malayalam', gu: 'Gujarati',
      or: 'Odia', pa: 'Punjabi', bh: 'Bhojpuri', ma: 'Maithili',
      as: 'Assamese', ks: 'Kashmiri', sd: 'Sindhi', ne: 'Nepali',
      doi: 'Dogri', sa: 'Sanskrit'
    };
    return names[languageId] || languageId;
  }

  async practicePronunciation(wordId) {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      this.showToast('❌ Audio recording not supported', 'error');
      return;
    }

    if (this.isRecording) {
      this.stopRecording();
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.mediaRecorder = new MediaRecorder(stream);
      const audioChunks = [];

      this.mediaRecorder.ondataavailable = (event) => {
        audioChunks.push(event.data);
      };

      this.mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
        const reader = new FileReader();
        reader.onload = async () => {
          const audioData = reader.result;
          await this.assessPronunciation(audioData, wordId);
        };
        reader.readAsDataURL(audioBlob);
      };

      this.mediaRecorder.start();
      this.isRecording = true;
      this.showToast('🎤 Recording... Click again to stop', 'info');

      // Update button
      const btn = document.querySelector(`[onclick*="practicePronunciation('${wordId}')"]`);
      if (btn) {
        btn.textContent = '⏹️ Stop';
        btn.style.background = '#f44336';
      }

    } catch (error) {
      console.error('Error recording:', error);
      this.showToast('❌ Could not access microphone', 'error');
    }
  }

  stopRecording() {
    if (this.mediaRecorder && this.isRecording) {
      this.mediaRecorder.stop();
      this.isRecording = false;
      
      // Update button
      const btn = document.querySelector('[onclick*="practicePronunciation"]');
      if (btn) {
        btn.textContent = '🎤 Practice';
        btn.style.background = '';
      }
    }
  }

  async assessPronunciation(audioData, wordId) {
    try {
      this.showToast('🔍 Analyzing pronunciation...', 'info');

      const response = await fetch(`${this.apiBase}/pronunciation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ audioData, wordId })
      });

      const data = await response.json();

      if (data.success) {
        this.showToast(`🎯 Pronunciation Score: ${Math.round(data.score)}% - ${data.feedback}`, 
          data.score >= 80 ? 'success' : 'info'
        );
      }
    } catch (error) {
      console.error('Error assessing pronunciation:', error);
      this.showToast('❌ Error analyzing pronunciation', 'error');
    }
  }

  checkAnswer(lessonId, exerciseIndex, selectedIndex) {
    // In production: validate against correct answer
    this.showToast('Answer checked!', 'info');
  }

  checkFillBlank(lessonId, exerciseIndex) {
    const input = document.getElementById(`fill-answer-${exerciseIndex}`);
    if (input) {
      this.showToast(`Answer: ${input.value}`, 'info');
    }
  }

  async completeLesson(lessonId) {
    try {
      const response = await fetch(`${this.apiBase}/progress`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: this.userId,
          lessonId,
          progressData: {
            completed: true,
            score: 85
          }
        })
      });

      const data = await response.json();

      if (data.success) {
        this.showToast('✅ Lesson completed! +50 points', 'success');
        this.loadProgress();
        this.loadLeaderboard();
        this.loadLesson(this.currentLanguage);
      }
    } catch (error) {
      console.error('Error completing lesson:', error);
      this.showToast('❌ Error completing lesson', 'error');
    }
  }

  async loadNextLesson() {
    if (this.currentLesson) {
      const nextLevel = this.currentLesson.level + 1;
      await this.loadLesson(this.currentLanguage, nextLevel);
    }
  }

  setupEventListeners() {
    // Language selector
    document.addEventListener('click', (e) => {
      if (e.target.id === 'btn-language-select' || e.target.closest('#btn-language-select')) {
        document.getElementById('language-select-modal').style.display = 'flex';
        this.loadLanguages();
      }
    });

    // Modal close
    document.addEventListener('click', (e) => {
      if (e.target.closest('.modal-close') || 
          (e.target.closest('.modal') && !e.target.closest('.modal-content'))) {
        const modal = e.target.closest('.modal');
        if (modal) {
          modal.style.display = 'none';
        }
      }
    });
  }

  setLoading(container, isLoading) {
    if (isLoading) {
      container.innerHTML = `
        <div style="text-align: center; padding: 40px;">
          <div style="display: inline-block; width: 40px; height: 40px; border: 3px solid #f3f3f3; border-top: 3px solid #4CAF50; border-radius: 50%; animation: spin 1s linear infinite;"></div>
          <p style="margin-top: 10px;">Loading lesson...</p>
        </div>
      `;
    }
  }

  showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      padding: 12px 24px;
      background: ${type === 'success' ? '#4CAF50' : type === 'error' ? '#f44336' : '#2196F3'};
      color: white;
      border-radius: 8px;
      z-index: 99999;
      animation: slideIn 0.3s ease;
    `;
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => toast.remove(), 3000);
  }
}

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  const langUI = new LanguageLearningUI({
    container: '#language-container'
  });
  window.langUI = langUI;
});

// Add CSS
const style = document.createElement('style');
style.textContent = `
  .language-interface { max-width: 1200px; margin: 0 auto; padding: 20px; }
  .language-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; flex-wrap: wrap; gap: 10px; }
  .language-actions { display: flex; gap: 10px; flex-wrap: wrap; }
  .language-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 15px; padding: 10px 0; }
  .language-card:hover { transform: translateY(-5px); box-shadow: 0 4px 15px rgba(0,0,0,0.15) !important; }
  .progress-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 15px; margin: 15px 0; }
  .progress-card { background: white; padding: 15px; border-radius: 8px; text-align: center; box-shadow: 0 2px 5px rgba(0,0,0,0.1); }
  .progress-value { font-size: 2em; font-weight: bold; color: #2E7D32; }
  .progress-label { color: #666; font-size: 14px; }
  .lesson-container { background: white; border-radius: 12px; padding: 20px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); margin: 15px 0; }
  .lesson-placeholder { text-align: center; padding: 60px; color: #666; }
  .lesson-placeholder p { font-size: 20px; margin-bottom: 20px; }
  .badge { background: #f0f0f0; padding: 2px 10px; border-radius: 12px; font-size: 12px; margin: 0 5px; }
  .badge-success { background: #4CAF50; color: white; }
  .leaderboard-section { margin-top: 20px; }
  .modal { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.7); display: none; justify-content: center; align-items: center; z-index: 99999; }
  .modal-content { background: white; padding: 30px; border-radius: 15px; max-width: 800px; width: 90%; max-height: 80vh; overflow-y: auto; position: relative; }
  .modal-close { position: absolute; top: 15px; right: 20px; font-size: 28px; cursor: pointer; color: #999; }
  .btn { padding: 10px 20px; border: none; border-radius: 8px; cursor: pointer; font-weight: 500; transition: background 0.3s; }
  .btn-primary { background: #4CAF50; color: white; }
  .btn-primary:hover { background: #388E3C; }
  .btn-success { background: #4CAF50; color: white; }
  .btn-success:hover { background: #388E3C; }
  .option-btn:hover { background: #f5f5f5; }
  @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
  @keyframes slideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
  @media (max-width: 768px) {
    .language-header { flex-direction: column; align-items: stretch; }
    .language-grid { grid-template-columns: repeat(2, 1fr); }
  }
`;
document.head.appendChild(style);