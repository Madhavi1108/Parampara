// Chat Page JavaScript

let chatRateLimiter = null;
let isProcessing = false;
let rateLimitTimer = null;

document.addEventListener('DOMContentLoaded', () => {
  if (typeof RateLimiter !== 'undefined') {
    chatRateLimiter = new RateLimiter(5, 10000); // 5 requests per 10 seconds
  }
  setupEventListeners();
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
  const messagesContainer = document.getElementById('chat-messages');
  const messageDiv = document.createElement('div');
  messageDiv.className = `message ${type}-message`;

  const avatar = type === 'bot' ? '👴' : '👤';

  messageDiv.innerHTML = `
        <div class="message-avatar">${avatar}</div>
        <div class="message-content">
            <p>${escapeHtml(text)}</p>
        </div>
    `;

  messagesContainer.appendChild(messageDiv);
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

function addTypingIndicator() {
  const messagesContainer = document.getElementById('chat-messages');
  const typingDiv = document.createElement('div');
  typingDiv.className = 'message bot-message';
  typingDiv.id = 'typing-indicator';

  typingDiv.innerHTML = `
        <div class="message-avatar">👴</div>
        <div class="message-content">
            <p>Thinking...</p>
        </div>
    `;

  messagesContainer.appendChild(typingDiv);
  messagesContainer.scrollTop = messagesContainer.scrollHeight;

  return 'typing-indicator';
}

function removeTypingIndicator(id) {
  const indicator = document.getElementById(id);
  if (indicator) {
    indicator.remove();
  }
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
