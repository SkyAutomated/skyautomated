/**
 * Sky Automated — AI Chat Widget
 * Floating chat bubble powered by Cloudflare Worker + GPT-4o-mini
 */

(function () {
  const WORKER_URL = 'https://skyautomated-chat.skylerjohnson26.workers.dev';

  // Inject styles
  const style = document.createElement('style');
  style.textContent = `
    #sky-chat-bubble {
      position: fixed;
      bottom: 28px;
      right: 28px;
      width: 56px;
      height: 56px;
      background: linear-gradient(135deg, #00d4ff, #0099cc);
      border-radius: 50%;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 20px rgba(0, 212, 255, 0.4);
      z-index: 9999;
      transition: transform 0.2s, box-shadow 0.2s;
    }
    #sky-chat-bubble:hover {
      transform: scale(1.08);
      box-shadow: 0 6px 28px rgba(0, 212, 255, 0.6);
    }
    #sky-chat-bubble svg { width: 26px; height: 26px; }
    #sky-chat-bubble .sky-notif {
      position: absolute;
      top: -2px; right: -2px;
      width: 14px; height: 14px;
      background: #ff4757;
      border-radius: 50%;
      border: 2px solid #fff;
      animation: sky-pulse 2s infinite;
    }
    @keyframes sky-pulse {
      0%, 100% { transform: scale(1); opacity: 1; }
      50% { transform: scale(1.2); opacity: 0.8; }
    }
    #sky-chat-window {
      position: fixed;
      bottom: 96px;
      right: 28px;
      width: 360px;
      max-height: 520px;
      background: #0d1117;
      border: 1px solid rgba(0, 212, 255, 0.2);
      border-radius: 16px;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
      z-index: 9998;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      transform: scale(0.9) translateY(10px);
      opacity: 0;
      pointer-events: none;
      transition: transform 0.2s ease, opacity 0.2s ease;
      font-family: 'Inter', -apple-system, sans-serif;
    }
    #sky-chat-window.open {
      transform: scale(1) translateY(0);
      opacity: 1;
      pointer-events: all;
    }
    #sky-chat-header {
      background: linear-gradient(135deg, rgba(0,212,255,0.15), rgba(0,153,204,0.1));
      border-bottom: 1px solid rgba(0, 212, 255, 0.15);
      padding: 14px 16px;
      display: flex;
      align-items: center;
      gap: 10px;
    }
    #sky-chat-header .sky-avatar {
      width: 36px; height: 36px;
      background: linear-gradient(135deg, #00d4ff, #0099cc);
      border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      font-size: 16px; flex-shrink: 0;
    }
    #sky-chat-header .sky-info { flex: 1; }
    #sky-chat-header .sky-name {
      color: #fff;
      font-weight: 600;
      font-size: 14px;
      line-height: 1.2;
    }
    #sky-chat-header .sky-status {
      color: #00d4ff;
      font-size: 11px;
      display: flex;
      align-items: center;
      gap: 4px;
    }
    #sky-chat-header .sky-status::before {
      content: '';
      width: 6px; height: 6px;
      background: #00d4ff;
      border-radius: 50%;
      display: inline-block;
    }
    #sky-chat-close {
      background: none; border: none;
      color: rgba(255,255,255,0.5);
      cursor: pointer; font-size: 20px;
      line-height: 1; padding: 0;
      transition: color 0.2s;
    }
    #sky-chat-close:hover { color: #fff; }
    #sky-chat-messages {
      flex: 1;
      overflow-y: auto;
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 10px;
      scrollbar-width: thin;
      scrollbar-color: rgba(0,212,255,0.2) transparent;
    }
    .sky-msg {
      max-width: 85%;
      padding: 10px 14px;
      border-radius: 12px;
      font-size: 13.5px;
      line-height: 1.5;
      word-break: break-word;
    }
    .sky-msg.bot {
      background: rgba(255,255,255,0.06);
      color: #e2e8f0;
      border-radius: 4px 12px 12px 12px;
      align-self: flex-start;
    }
    .sky-msg.user {
      background: linear-gradient(135deg, #00d4ff, #0099cc);
      color: #000;
      font-weight: 500;
      border-radius: 12px 4px 12px 12px;
      align-self: flex-end;
    }
    .sky-typing {
      align-self: flex-start;
      padding: 10px 14px;
      background: rgba(255,255,255,0.06);
      border-radius: 4px 12px 12px 12px;
      display: flex;
      gap: 4px;
      align-items: center;
    }
    .sky-typing span {
      width: 6px; height: 6px;
      background: rgba(0,212,255,0.6);
      border-radius: 50%;
      animation: sky-bounce 1.2s infinite;
    }
    .sky-typing span:nth-child(2) { animation-delay: 0.2s; }
    .sky-typing span:nth-child(3) { animation-delay: 0.4s; }
    @keyframes sky-bounce {
      0%, 60%, 100% { transform: translateY(0); }
      30% { transform: translateY(-6px); }
    }
    #sky-chat-input-area {
      padding: 12px;
      border-top: 1px solid rgba(0, 212, 255, 0.1);
      display: flex;
      gap: 8px;
    }
    #sky-chat-input {
      flex: 1;
      background: rgba(255,255,255,0.06);
      border: 1px solid rgba(0, 212, 255, 0.2);
      border-radius: 8px;
      padding: 9px 12px;
      color: #fff;
      font-size: 13px;
      font-family: inherit;
      outline: none;
      transition: border-color 0.2s;
      resize: none;
    }
    #sky-chat-input:focus { border-color: rgba(0, 212, 255, 0.5); }
    #sky-chat-input::placeholder { color: rgba(255,255,255,0.3); }
    #sky-chat-send {
      width: 36px; height: 36px;
      background: linear-gradient(135deg, #00d4ff, #0099cc);
      border: none;
      border-radius: 8px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      transition: opacity 0.2s;
      align-self: flex-end;
    }
    #sky-chat-send:hover { opacity: 0.85; }
    #sky-chat-send:disabled { opacity: 0.4; cursor: not-allowed; }
    #sky-chat-send svg { width: 16px; height: 16px; }
    @media (max-width: 480px) {
      #sky-chat-window { width: calc(100vw - 32px); right: 16px; bottom: 88px; }
      #sky-chat-bubble { bottom: 20px; right: 16px; }
    }
  `;
  document.head.appendChild(style);

  // Build HTML
  const bubble = document.createElement('div');
  bubble.id = 'sky-chat-bubble';
  bubble.innerHTML = `
    <div class="sky-notif"></div>
    <svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
    </svg>
  `;

  const chatWindow = document.createElement('div');
  chatWindow.id = 'sky-chat-window';
  chatWindow.innerHTML = `
    <div id="sky-chat-header">
      <div class="sky-avatar">🤖</div>
      <div class="sky-info">
        <div class="sky-name">Sky Assistant</div>
        <div class="sky-status">Online now</div>
      </div>
      <button id="sky-chat-close" aria-label="Close chat">×</button>
    </div>
    <div id="sky-chat-messages"></div>
    <div id="sky-chat-input-area">
      <textarea id="sky-chat-input" placeholder="Ask me anything..." rows="1"></textarea>
      <button id="sky-chat-send" aria-label="Send message">
        <svg viewBox="0 0 24 24" fill="none" stroke="#000" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <line x1="22" y1="2" x2="11" y2="13"/>
          <polygon points="22 2 15 22 11 13 2 9 22 2"/>
        </svg>
      </button>
    </div>
  `;

  document.body.appendChild(bubble);
  document.body.appendChild(chatWindow);

  // State
  const messages = [];
  let isOpen = false;
  let isTyping = false;

  const messagesEl = document.getElementById('sky-chat-messages');
  const inputEl = document.getElementById('sky-chat-input');
  const sendBtn = document.getElementById('sky-chat-send');

  function addMessage(role, text) {
    const div = document.createElement('div');
    div.className = `sky-msg ${role}`;
    div.textContent = text;
    messagesEl.appendChild(div);
    messagesEl.scrollTop = messagesEl.scrollHeight;
    return div;
  }

  function showTyping() {
    const div = document.createElement('div');
    div.className = 'sky-typing';
    div.innerHTML = '<span></span><span></span><span></span>';
    div.id = 'sky-typing-indicator';
    messagesEl.appendChild(div);
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  function removeTyping() {
    const el = document.getElementById('sky-typing-indicator');
    if (el) el.remove();
  }

  async function sendMessage() {
    const text = inputEl.value.trim();
    if (!text || isTyping) return;

    inputEl.value = '';
    inputEl.style.height = 'auto';
    messages.push({ role: 'user', content: text });
    addMessage('user', text);

    isTyping = true;
    sendBtn.disabled = true;
    showTyping();

    try {
      const res = await fetch(WORKER_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages }),
      });
      const data = await res.json();
      const reply = data.reply || "Sorry, I couldn't process that. Please try again!";
      messages.push({ role: 'assistant', content: reply });
      removeTyping();
      addMessage('bot', reply);

      // Show confirmation badge when lead is captured
      if (data.leadCaptured) {
        const badge = document.createElement('div');
        badge.style.cssText = 'text-align:center;padding:6px 12px;background:rgba(0,212,255,0.1);border-radius:8px;color:#00d4ff;font-size:11px;border:1px solid rgba(0,212,255,0.2);';
        badge.textContent = '✓ Our team will be in touch soon!';
        messagesEl.appendChild(badge);
        messagesEl.scrollTop = messagesEl.scrollHeight;
      }
    } catch {
      removeTyping();
      addMessage('bot', "Hmm, I'm having trouble connecting. Try refreshing or contact us directly at hello@skyautomated.com");
    } finally {
      isTyping = false;
      sendBtn.disabled = false;
    }
  }

  function toggleChat() {
    isOpen = !isOpen;
    chatWindow.classList.toggle('open', isOpen);
    // Remove notification dot once opened
    const notif = bubble.querySelector('.sky-notif');
    if (isOpen && notif) notif.remove();
    // Show greeting on first open
    if (isOpen && messagesEl.children.length === 0) {
      setTimeout(() => {
        addMessage('bot', "Hi! 👋 I'm Sky, your AI assistant for Sky Automated. I can answer questions about our services, pricing, and how we help local businesses grow. What can I help you with?");
      }, 300);
    }
    if (isOpen) setTimeout(() => inputEl.focus(), 250);
  }

  bubble.addEventListener('click', toggleChat);
  document.getElementById('sky-chat-close').addEventListener('click', toggleChat);
  sendBtn.addEventListener('click', sendMessage);
  inputEl.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });
  // Auto-resize textarea
  inputEl.addEventListener('input', () => {
    inputEl.style.height = 'auto';
    inputEl.style.height = Math.min(inputEl.scrollHeight, 100) + 'px';
  });
})();
