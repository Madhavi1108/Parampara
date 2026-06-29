// Chat Page JavaScript

let chatRateLimiter = null;
let isProcessing = false;
let rateLimitTimer = null;

let chatState = [
  { id: 'welcome', type: 'bot', text: "Namaste! I'm a cultural curator who has learned from all the stories in our archive. Ask me about rural traditions, why people paint their doors blue, the meaning behind Kantha embroidery, or any village festival. What would you like to know?" }
];
let isTyping = false;
let currentVTree = null;
let chatMessagesNode = null;

// Components
const MessageBubble = ({ msg }) => {
  const { h } = window.vdom;
  const avatar = msg.type === 'bot' ? '👴' : '👤';
  return h('div', { class: `message ${msg.type}-message`, key: msg.id },
    h('div', { class: 'message-avatar' }, avatar),
    h('div', { class: 'message-content' }, 
      h('p', {}, msg.text)
    )
  );
};

const TypingIndicator = () => {
  const { h } = window.vdom;
  return h('div', { class: 'message bot-message', id: 'typing-indicator', key: 'typing' },
    h('div', { class: 'message-avatar' }, '👴'),
    h('div', { class: 'message-content' }, 
      h('p', {}, 'Thinking...')
    )
  );
};

function renderChat() {
  if (!window.vdom) return;
  const { h, diff, scheduleUpdate, render: vdomRender } = window.vdom;
  
  if (!chatMessagesNode) {
    chatMessagesNode = document.getElementById('chat-messages');
  }

  scheduleUpdate(() => {
    const vNodes = chatState.map(msg => h(MessageBubble, { msg, key: msg.id }));

    if (isTyping) {
      vNodes.push(h(TypingIndicator, { key: 'typing' }));
    }

    const newVTree = h('div', { id: 'chat-messages', class: 'chat-messages', key: 'chat-root' }, ...vNodes);

    if (!currentVTree) {
      const newDOM = vdomRender(newVTree);
      chatMessagesNode.replaceWith(newDOM);
      chatMessagesNode = newDOM;
    } else {
      const start = performance.now();
      const newDom = diff(chatMessagesNode, currentVTree, newVTree);
      if (newDom) chatMessagesNode = newDom;
      const end = performance.now();
      
      console.log(`[VDOM] Patched in ${(end - start).toFixed(2)}ms`);
    }
    
    currentVTree = newVTree;
    chatMessagesNode.scrollTop = chatMessagesNode.scrollHeight;
  });
}

document.addEventListener('DOMContentLoaded', () => {
  if (typeof RateLimiter !== 'undefined') {
    chatRateLimiter = new RateLimiter(5, 10000); // 5 requests per 10 seconds
  }
  setupEventListeners();
  renderChat();
});

function setupEventListeners() {
  const chatInput = document.getElementById('chat-input');
  const sendBtn = document.getElementById('send-btn');

  sendBtn.addEventListener('click', sendMessage);
  chatInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      sendMessage();
    }
  });

  // Suggested questions
  document.querySelectorAll('.question-chip').forEach((chip) => {
    chip.addEventListener('click', () => {
      const question = chip.getAttribute('data-question');
      chatInput.value = question;
      sendMessage();
    });
  });
}

async function sendMessage() {
  if (isProcessing) return;

  const chatInput = document.getElementById('chat-input');
  const sendBtn = document.getElementById('send-btn');
  const feedbackDiv = document.getElementById('chat-feedback');
  const question = chatInput.value.trim();

  if (!question) return;

  // Rate Limiter Check
  if (chatRateLimiter) {
    const status = chatRateLimiter.check();
    if (!status.allowed) {
      chatInput.disabled = true;
      sendBtn.disabled = true;
      sendBtn.classList.add('btn-disabled');
      feedbackDiv.style.display = 'block';
      
      let remaining = Math.ceil(status.remainingMs / 1000);
      feedbackDiv.textContent = `Rate limit exceeded. Please wait ${remaining}s...`;
      
      if (rateLimitTimer) clearInterval(rateLimitTimer);
      rateLimitTimer = setInterval(() => {
        remaining--;
        if (remaining <= 0) {
          clearInterval(rateLimitTimer);
          chatInput.disabled = false;
          sendBtn.disabled = false;
          sendBtn.classList.remove('btn-disabled');
          feedbackDiv.style.display = 'none';
        } else {
          feedbackDiv.textContent = `Rate limit exceeded. Please wait ${remaining}s...`;
        }
      }, 1000);
      return;
    }
  }

  isProcessing = true;
  chatInput.disabled = true;
  sendBtn.disabled = true;
  
  // Add user message to chat
  addMessage(question, 'user');
  chatInput.value = '';

  // Show typing indicator
  const typingId = addTypingIndicator();

  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ question }),
    });

    const data = await response.json();

    // Remove typing indicator
    removeTypingIndicator(typingId);

    // Add bot response
    addMessage(data.response, 'bot');
  } catch (error) {
    console.error('Error sending message:', error);
    removeTypingIndicator(typingId);
    addMessage(
      "I apologize, but I'm having trouble connecting right now. Please try again later.",
      'bot'
    );
  } finally {
    isProcessing = false;
    
    // Only re-enable if rate limiting hasn't blocked it in the background
    const feedbackDiv = document.getElementById('chat-feedback');
    if (feedbackDiv.style.display === 'none' || feedbackDiv.style.display === '') {
      document.getElementById('chat-input').disabled = false;
      document.getElementById('send-btn').disabled = false;
      document.getElementById('chat-input').focus();
    }
  }
}

function addMessage(text, type) {
  chatState.push({ id: Date.now().toString(), type, text });
  renderChat();
}

function addTypingIndicator() {
  isTyping = true;
  renderChat();
  return 'typing-indicator';
}

function removeTypingIndicator(id) {
  isTyping = false;
  renderChat();
}

function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Smooth scroll to top
backToTopBtn.addEventListener('click', () => {
  window.scrollTo({
    top: 0,
    behavior: 'smooth',
  });
});
