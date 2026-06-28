/**
 * Interactive "Choose Your Own Adventure" Story Engine
 */

class InteractiveStoryEngine {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.storyData = null;
    this.currentNodeId = 'start';
    this.history = []; // Array of { nodeId, choiceText }
    this.storageKey = 'parampara_interactive_story_';

    this.initDOM();
  }

  initDOM() {
    if (!this.container) return;
    this.container.innerHTML = `
      <div class="story-engine-container">
        <div class="story-header">
          <h2 id="story-main-title">Loading Story...</h2>
          <p id="story-main-desc"></p>
          <div class="progress-container">
            <div class="progress-bar" id="story-progress"></div>
          </div>
        </div>

        <div class="story-main" id="story-main-card">
          <div class="story-text-container" id="story-text">
            <!-- Text injected here -->
          </div>
          <div class="choices-grid" id="story-choices">
            <!-- Choice cards injected here -->
          </div>
        </div>

        <div class="story-sidebar">
          <h3>Your Journey <span id="history-count">(0 steps)</span></h3>
          <ul class="history-list" id="history-list">
            <li class="history-item">
              <span class="history-action">The Beginning</span>
              <span class="history-desc">You started the story.</span>
            </li>
          </ul>
          <button class="reset-btn" id="story-reset-btn" style="display:none;">Restart Story</button>
        </div>
      </div>
    `;

    document.getElementById('story-reset-btn').addEventListener('click', () => this.restartStory());
  }

  async loadStory(storyUrlOrObject) {
    try {
      if (typeof storyUrlOrObject === 'string') {
        const response = await fetch(storyUrlOrObject);
        this.storyData = await response.json();
      } else {
        this.storyData = storyUrlOrObject;
      }
      
      this.storageKey = 'parampara_interactive_story_' + this.storyData.id;
      
      document.getElementById('story-main-title').textContent = this.storyData.title;
      document.getElementById('story-main-desc').textContent = this.storyData.description || 'An interactive heritage narrative.';
      
      this.loadProgress();
      this.renderNode(this.currentNodeId);

    } catch (err) {
      console.error('Failed to load interactive story:', err);
      document.getElementById('story-text').innerHTML = `<p style="color:red;">Error loading story data.</p>`;
    }
  }

  loadProgress() {
    const savedData = localStorage.getItem(this.storageKey);
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        if (this.storyData.nodes[parsed.currentNodeId]) {
          this.currentNodeId = parsed.currentNodeId;
          this.history = parsed.history || [];
          document.getElementById('story-reset-btn').style.display = 'block';
        }
      } catch(e) {
        console.warn('Corrupted save data, starting fresh.');
      }
    }
  }

  saveProgress() {
    const data = {
      currentNodeId: this.currentNodeId,
      history: this.history
    };
    localStorage.setItem(this.storageKey, JSON.stringify(data));
    document.getElementById('story-reset-btn').style.display = 'block';
  }

  restartStory() {
    if (confirm('Are you sure you want to restart? All progress will be lost.')) {
      localStorage.removeItem(this.storageKey);
      this.currentNodeId = 'start';
      this.history = [];
      document.getElementById('story-reset-btn').style.display = 'none';
      this.renderNode(this.currentNodeId);
    }
  }

  makeChoice(nextNodeId, choiceText) {
    // Record history
    this.history.push({
      nodeId: this.currentNodeId,
      choiceText: choiceText
    });
    
    this.currentNodeId = nextNodeId;
    this.saveProgress();
    this.renderNode(this.currentNodeId);
  }

  renderNode(nodeId) {
    const node = this.storyData.nodes[nodeId];
    if (!node) {
      console.error(`Story node '${nodeId}' not found!`);
      return;
    }

    // Render Text
    const textContainer = document.getElementById('story-text');
    textContainer.innerHTML = '';
    
    // Split into paragraphs for nice fade-in effect
    const paragraphs = node.text.split('\\n\\n').map(p => p.trim()).filter(p => p);
    paragraphs.forEach((p, index) => {
      const pEl = document.createElement('p');
      pEl.textContent = p;
      pEl.style.animationDelay = `${index * 0.2}s`;
      textContainer.appendChild(pEl);
    });

    // Render Choices
    const choicesContainer = document.getElementById('story-choices');
    choicesContainer.innerHTML = '';

    if (node.choices && node.choices.length > 0) {
      node.choices.forEach(choice => {
        const card = document.createElement('div');
        card.className = 'choice-card';
        card.textContent = choice.text;
        card.onclick = () => this.makeChoice(choice.nextNode, choice.text);
        choicesContainer.appendChild(card);
      });
    } else {
      // It's an ending node
      const card = document.createElement('div');
      card.className = 'choice-card ending-card';
      card.innerHTML = '<strong>The End</strong><br><span style="font-size:0.85em; opacity:0.8;">Play again to discover other paths!</span>';
      card.onclick = () => this.restartStory();
      choicesContainer.appendChild(card);
    }

    this.updateUI();
  }

  updateUI() {
    // Update History Sidebar
    const historyList = document.getElementById('history-list');
    historyList.innerHTML = '';
    
    if (this.history.length === 0) {
      historyList.innerHTML = `
        <li class="history-item">
          <span class="history-action">The Beginning</span>
          <span class="history-desc">You started the story.</span>
        </li>
      `;
    } else {
      this.history.forEach((h, index) => {
        const li = document.createElement('li');
        li.className = 'history-item';
        li.innerHTML = `
          <span class="history-action">Step ${index + 1}</span>
          <span class="history-desc">You chose: "${h.choiceText}"</span>
        `;
        historyList.appendChild(li);
      });
      // Add current node indicator
      const currentLi = document.createElement('li');
      currentLi.className = 'history-item';
      currentLi.innerHTML = `
        <span class="history-action" style="color:var(--theme-primary);">Current Location</span>
      `;
      historyList.appendChild(currentLi);
    }
    
    // Auto-scroll history to bottom
    historyList.scrollTop = historyList.scrollHeight;
    document.getElementById('history-count').textContent = `(${this.history.length} steps)`;

    // Update Progress Bar (heuristic: assuming max depth is ~10 for a simple story, or based on history length)
    // A true progress bar requires computing the longest path in the DAG.
    // We'll use a simpler heuristic based on history length vs arbitrary max (10).
    const isEnding = !(this.storyData.nodes[this.currentNodeId].choices && this.storyData.nodes[this.currentNodeId].choices.length > 0);
    const progress = document.getElementById('story-progress');
    
    if (isEnding) {
      progress.style.width = '100%';
      progress.style.background = '#10b981'; // Green for finish
    } else {
      const estimatedMaxSteps = this.storyData.estimatedSteps || 5;
      const pct = Math.min((this.history.length / estimatedMaxSteps) * 100, 95);
      progress.style.width = `${Math.max(5, pct)}%`;
      progress.style.background = 'var(--theme-primary, #3b82f6)';
    }
  }
}

// Sample Story Data
const weaverStory = {
  id: "weaver_tale_1",
  title: "The Weaver's Journey: Threads of Time",
  description: "Experience the life of a traditional handloom weaver in rural India. Your choices determine the fate of the craft.",
  estimatedSteps: 4,
  nodes: {
    "start": {
      "text": "The rhythmic clack-clack of the wooden loom has been the heartbeat of your village for generations. Today, a merchant from the big city arrives, offering to buy all your woven silk at a high price, provided you switch to using synthetic, machine-spun yarn to speed up production.\\n\\nYour grandfather looks at you, awaiting your decision.",
      "choices": [
        { "text": "Accept the merchant's offer for quick money.", "nextNode": "accept_merchant" },
        { "text": "Refuse and stick to traditional hand-spun silk.", "nextNode": "refuse_merchant" }
      ]
    },
    "accept_merchant": {
      "text": "You accept the merchant's offer. The village transitions to synthetic yarn. Production doubles, and money flows in initially. However, within a few years, the unique quality of your village's silk is lost. You are now competing with massive factories and losing.\\n\\nThe art of traditional weaving is forgotten.",
      "choices": [] // Ending
    },
    "refuse_merchant": {
      "text": "You politely decline. The merchant scoffs and leaves. Times are tough, and several families struggle. However, an independent documentary filmmaker visits the village a month later, fascinated by your authentic methods.",
      "choices": [
        { "text": "Allow her to film the weaving process.", "nextNode": "allow_filming" },
        { "text": "Keep the techniques a secret.", "nextNode": "keep_secret" }
      ]
    },
    "allow_filming": {
      "text": "The documentary goes viral. Suddenly, there is global demand for authentic, hand-woven silk from your village. Artisans from all over travel to learn from you. The village prospers while keeping its heritage alive.\\n\\nYou become a master artisan, preserving the legacy for future generations.",
      "choices": [] // Ending
    },
    "keep_secret": {
      "text": "You keep the techniques hidden, fearing they will be stolen. The village remains poor but proud. Decades later, as the older generation passes, fewer young people want to learn the hard, unprofitable work.\\n\\nThe tradition slowly fades into history, remembered only in old photographs.",
      "choices": [] // Ending
    }
  }
};

document.addEventListener('DOMContentLoaded', () => {
  const engine = new InteractiveStoryEngine('interactive-story-root');
  // Load the sample story
  engine.loadStory(weaverStory);
});
