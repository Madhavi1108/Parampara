/**
 * Parampara - AI Story Generator Script
 */

document.addEventListener('DOMContentLoaded', () => {
  // Elements
  const itemSelect = document.getElementById('item-select');
  const styleSelect = document.getElementById('style-select');
  const generateBtn = document.getElementById('generate-btn');

  const outputSection = document.getElementById('story-display-card')
  const storyTitle = document.getElementById('story-title');
  const styleTag = document.getElementById('style-tag');
  const storyText = document.getElementById('story-text');

  const summarySection = document.getElementById('summary-section');
  const summaryText = document.getElementById('summary-text-content');
  const highlightsList = document.getElementById('highlights-list');

  const statsSection = document.getElementById('stats-section');
  const statLength = document.getElementById('stat-length');
  const statTime = document.getElementById('stat-time');
  const statReferences = document.getElementById('stat-references');
  const statStyleName = document.getElementById('stat-style-name');

  const narrationControls = document.getElementById('narration-controls');
  const btnPlay = document.getElementById('btn-play');
  const btnPause = document.getElementById('btn-pause');
  const btnStop = document.getElementById('btn-stop');

  // State
  let availableItems = [];
  let selectedItemDetails = null;
  let generatedStory = '';
  let speechUtterance = null;
  const synth = window.speechSynthesis;

  // Initialize Speech Voices list
  if (synth && synth.onvoiceschanged !== undefined) {
    synth.onvoiceschanged = () => {
      // Just warms up the voices list cache
      synth.getVoices();
    };
  }

  // Load available items from backend
  async function loadItems() {
    try {
      const response = await fetch('/api/story-generator');
      if (!response.ok) throw new Error('Failed to load cultural items');

      availableItems = await response.json();
      populateItemSelector();
    } catch (err) {
      console.error('Error loading items:', err);
      storyText.innerHTML = `<div class="empty-state" style="color: var(--rust-red);">
        <i class="ti ti-alert-triangle"></i>
        <p>Failed to load cultural items from server. Please verify the server is running.</p>
      </div>`;
    }
  }

  // Populate Item Selector dropdown
  function populateItemSelector() {
    itemSelect.innerHTML =
      '<option value="" disabled selected>-- Select an Item --</option>';
    availableItems.forEach((item) => {
      const option = document.createElement('option');
      option.value = item.name;
      option.textContent = item.name;
      itemSelect.appendChild(option);
    });
  }

  // Event Listeners
  itemSelect.addEventListener('change', () => {
    generateBtn.disabled = !itemSelect.value;
  });

  generateBtn.addEventListener('click', async () => {
    const itemName = itemSelect.value;
    const style = styleSelect.value;

    if (!itemName) return;

    // Show loading state
    generateBtn.disabled = true;
    const originalText = generateBtn.innerHTML;
    generateBtn.innerHTML = `<i class="ti ti-loader animated-spin"></i> <span>${getTranslation('btn_generating')}</span>`;
    storyText.innerHTML =
      '<div class="empty-state"><i class="ti ti-loader animated-spin"></i><p>Consulting historical archives and crafting your narrative...</p></div>';

    // Cancel any ongoing narration
    stopSpeech();

    try {
      const response = await fetch(
        `/api/story-generator?item=${encodeURIComponent(itemName)}`
      );
      if (!response.ok) throw new Error('Failed to fetch details');

      selectedItemDetails = await response.json();
      generateStoryContent(selectedItemDetails, style);
    } catch (err) {
      console.error('Error generating story:', err);
      storyText.innerHTML = `<div class="empty-state" style="color: var(--rust-red);">
        <i class="ti ti-alert-triangle"></i>
        <p>Error generating story: ${err.message}. Please try again.</p>
      </div>`;
    } finally {
      generateBtn.disabled = false;
      generateBtn.innerHTML = originalText;
    }

    scrollToView();
  });

  // Rule-based narrative engine
  function generateStoryContent(data, style) {
    const {
      name,
      village,
      history,
      traditions,
      festivals,
      landmarks,
      culturalSignificance,
      notableFacts,
    } = data;

    let storyHtml = '';

    if (style === 'educational') {
      storyHtml = `
        <p>The historical journey of <strong>${name}</strong> began in the region of <strong>${village}</strong>, serving as a testament to the region's rich cultural fabric. Historically, ${history[0]} As time progressed, ${history[1]} This laid the groundwork for its modern evolution and current preservation practices. Today, ${history[2]}</p>
        <p>This living heritage is kept alive through deeply rooted community traditions. Central to this craft is the fact that ${traditions[0]} Additionally, artisans practice their skills using methods such as ${traditions[1]} The integration of ${traditions[2]} ensures the ongoing authenticity of the practice.</p>
        <p>These cultural expressions are prominently featured during local celebrations, such as ${festivals.join(' and ')}, which serve to unite the community. Important landmarks like ${landmarks.join(' and ')} continue to serve as preservation hubs. Ultimately, this craft is significant because ${culturalSignificance[0]} Furthermore, ${culturalSignificance[1]}</p>
      `;
    } else if (style === 'children') {
      storyHtml = `
        <p>Once upon a time, in a warm, beautiful village called <strong>${village}</strong>, there lived a wonderful tradition known as <strong>${name}</strong>! A very long time ago, ${history[0]} Then, a wonderful thing happened: ${history[1]} Today, children and adults all over the world love it because ${history[2]}</p>
        <p>Inside the village, families work together to make this magic happen. Do you know how? First, ${traditions[0]} The friendly artists also use special techniques like ${traditions[1]} and ${traditions[2]} to tell stories without using any words at all!</p>
        <p>During happy festival days like ${festivals.join(' or ')}, the whole village comes alive with color and music! If you ever travel to ${village}, make sure to visit ${landmarks.join(' or ')} to see these amazing creations. Remember, this beautiful art teaches us that ${culturalSignificance[0]} It also helps us see that ${culturalSignificance[1]}</p>
      `;
    } else if (style === 'tourist') {
      storyHtml = `
        <p>Welcome to <strong>${village}</strong>, the ancestral home of the spectacular craft of <strong>${name}</strong>! As you wander through this culturally rich destination, you will discover that ${history[0]} The craft entered a new era when ${history[1]} Today, visitor interest is higher than ever, as ${history[2]}</p>
        <p>When you visit the local workshops, you will witness masters practicing their age-old traditions. You will observe first-hand that ${traditions[0]} You will also see how they use techniques like ${traditions[1]} or ${traditions[2]} to create masterpieces.</p>
        <p>If you plan your visit during ${festivals.join(' or ')}, you will see the community at its most festive and welcoming. We recommend starting your exploration at landmarks like ${landmarks.join(' or ')}. By exploring this craft, you are participating in a tradition that represents ${culturalSignificance[0]}, and your support directly contributes to ${culturalSignificance[1]}</p>
      `;
    } else if (style === 'documentary') {
      storyHtml = `
        <p>This documentary focuses on the profound cultural legacy of <strong>${name}</strong>, originating in the rural heartlands of <strong>${village}</strong>. Historical archives confirm that ${history[0]} The practice underwent a significant shift when ${history[1]} This transition shaped its contemporary state, where ${history[2]}</p>
        <p>The technical brilliance of the art depends on specialized ancestral knowledge. The methodology begins with ${traditions[0]} It is further defined by ${traditions[1]} and ${traditions[2]}, representing a unique repository of human expression.</p>
        <p>These skills are celebrated during annual events such as ${festivals.join(' and ')}, which reinforce social bonds. Key institutions, including ${landmarks.join(' and ')}, continue to document and preserve this heritage. Ultimately, this craft is of vital importance because ${culturalSignificance[0]} and ${culturalSignificance[1]}</p>
      `;
    }

    // Set generated text (stripped of HTML tags for speech)
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = storyHtml;
    generatedStory = tempDiv.textContent || tempDiv.innerText || '';

    // Update Story Display
    storyTitle.textContent = name;
    styleTag.textContent = getTranslation(`style_${style}`);
    storyText.innerHTML = storyHtml;

    // Update Summary & Highlights
    const summary = `${name} from ${village} is a cherished cultural tradition. It represents ${culturalSignificance[0]}`;
    summaryText.textContent = summary;

    highlightsList.innerHTML = '';
    const highlights = [
      `Deep historical roots in ${village}`,
      traditions[0].replace(/^\w/, (c) => c.toUpperCase()),
      culturalSignificance[1].replace(/^\w/, (c) => c.toUpperCase()),
      notableFacts[0].replace(/^\w/, (c) => c.toUpperCase()),
    ];

    highlights.forEach((hl) => {
      const li = document.createElement('li');
      li.textContent = hl;
      highlightsList.appendChild(li);
    });

    // Compute Stats
    const words = generatedStory
      .split(/\s+/)
      .filter((w) => w.length > 0).length;
    const readingTime = Math.ceil(words / 200);
    const refsCount =
      history.length +
      traditions.length +
      festivals.length +
      landmarks.length +
      notableFacts.length;

    // Update Stats UI
    statLength.innerHTML = `${words} <small style="font-size:0.75rem; color:var(--text-muted);">${getTranslation('words')}</small>`;
    statTime.innerHTML = `${readingTime} <small style="font-size:0.75rem; color:var(--text-muted);">${getTranslation('minutes')}</small>`;
    statReferences.textContent = refsCount;
    statStyleName.textContent = getTranslation(`style_${style}`);

    // Show Output cards
    summarySection.classList.remove('hidden');
    statsSection.classList.remove('hidden');
    narrationControls.classList.remove('hidden');
  }

  function scrollToView() {
    outputSection.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    });
  }

  // TTS Narration Logic
  btnPlay.addEventListener('click', () => {
    if (synth.paused) {
      synth.resume();
      updateNarrationUI('playing');
    } else {
      const currentLang = localStorage.getItem('parampara_lang') || 'en';
      playSpeech(generatedStory, currentLang);
    }
  });

  btnPause.addEventListener('click', () => {
    if (synth.speaking && !synth.paused) {
      synth.pause();
      updateNarrationUI('paused');
    }
  });

  btnStop.addEventListener('click', () => {
    stopSpeech();
  });

  function playSpeech(text, lang) {
    stopSpeech();

    if (!text) return;

    speechUtterance = new SpeechSynthesisUtterance(text);

    // Choose voice matching current UI language
    let targetLocale = 'en-US';
    if (lang === 'hi') targetLocale = 'hi-IN';
    else if (lang === 'mr') targetLocale = 'mr-IN';

    speechUtterance.lang = targetLocale;

    const voices = synth.getVoices();
    const matchingVoice = voices.find(
      (v) => v.lang.startsWith(targetLocale) || v.lang.startsWith(lang)
    );

    if (matchingVoice) {
      speechUtterance.voice = matchingVoice;
    }

    speechUtterance.onend = () => {
      resetNarrationUI();
    };

    speechUtterance.onerror = (e) => {
      console.error('Speech synthesis error:', e);
      resetNarrationUI();
    };

    synth.speak(speechUtterance);
    updateNarrationUI('playing');
  }

  function stopSpeech() {
    if (synth) {
      synth.cancel();
    }
    resetNarrationUI();
  }

  function updateNarrationUI(state) {
    if (state === 'playing') {
      btnPlay.disabled = true;
      btnPlay.classList.add('speaking-active');
      btnPause.disabled = false;
      btnStop.disabled = false;
    } else if (state === 'paused') {
      btnPlay.disabled = false;
      btnPlay.classList.remove('speaking-active');
      btnPause.disabled = true;
      btnStop.disabled = false;
    }
  }

  function resetNarrationUI() {
    btnPlay.disabled = false;
    btnPlay.classList.remove('speaking-active');
    btnPause.disabled = true;
    btnStop.disabled = true;
  }

  // Translation mapping helper
  function getTranslation(key) {
    const lang = localStorage.getItem('parampara_lang') || 'en';
    if (
      typeof PARAMPARA_TRANSLATIONS !== 'undefined' &&
      PARAMPARA_TRANSLATIONS[lang]
    ) {
      return PARAMPARA_TRANSLATIONS[lang][key] || key;
    }
    return key;
  }

  // Listen to Language Change event to keep dynamically generated contents in sync
  window.addEventListener('parampara:langchange', (e) => {
    const newLang = e.detail.lang;

    // Update dropdown select placeholder if no item selected yet
    if (!itemSelect.value) {
      populateItemSelector();
    }

    // Refresh dynamic generated content if story exists
    if (selectedItemDetails) {
      const style = styleSelect.value;
      generateStoryContent(selectedItemDetails, style);
    }

    // Reset TTS on lang switch to prevent speaking old story lang
    stopSpeech();
  });

  // Load items on page entry
  loadItems();
});
