/**
 * RhythmTraffic Chatbot Widget - Embeddable Version
 *
 * INSTALLATION:
 * Add this script to your website just before </body>:
 * <script src="https://your-domain.com/chatbot-embed.js" data-webhook="YOUR_N8N_WEBHOOK_URL"></script>
 *
 * Or configure inline:
 * <script>
 *   window.RhythmTrafficConfig = {
 *     webhookUrl: 'YOUR_N8N_WEBHOOK_URL/webhook/chat',
 *     primaryColor: '#2563eb',
 *     companyName: 'RhythmTraffic',
 *     position: 'right' // 'left' or 'right'
 *   };
 * </script>
 * <script src="https://your-domain.com/chatbot-embed.js"></script>
 */

(function() {
    'use strict';

    // Configuration with defaults
    const defaultConfig = {
        webhookUrl: '',
        primaryColor: '#2563eb',
        companyName: 'RhythmTraffic',
        position: 'right',
        welcomeMessage: `Hi there! Welcome to RhythmTraffic! I'm your AI assistant, here to help answer your questions about our services and solutions.

Whether you're curious about what we do, need technical information, or want to schedule a meeting with one of our engineers - I'm here to help!

What can I assist you with today?`,
        quickActions: [
            { label: 'Our Services', message: 'Tell me about your services' },
            { label: 'Book a Meeting', message: 'I want to book a meeting with an engineer' },
            { label: 'Why RhythmTraffic?', message: 'What makes you different?' }
        ]
    };

    // Merge user config
    const config = Object.assign({}, defaultConfig, window.RhythmTrafficConfig || {});

    // Try to get webhook from data attribute
    const scriptTag = document.currentScript;
    if (scriptTag && scriptTag.dataset.webhook) {
        config.webhookUrl = scriptTag.dataset.webhook;
    }

    // Generate or retrieve session ID
    function getSessionId() {
        let sessionId = localStorage.getItem('rt_chat_session');
        if (!sessionId) {
            sessionId = 'rt_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            localStorage.setItem('rt_chat_session', sessionId);
        }
        return sessionId;
    }

    const sessionId = getSessionId();

    // CSS Styles
    const styles = `
        #rt-chatbot-widget * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
        }

        #rt-chat-btn {
            position: fixed;
            bottom: 24px;
            ${config.position}: 24px;
            width: 64px;
            height: 64px;
            border-radius: 50%;
            background: linear-gradient(135deg, ${config.primaryColor} 0%, ${adjustColor(config.primaryColor, -20)} 100%);
            border: none;
            cursor: pointer;
            box-shadow: 0 10px 40px rgba(0,0,0,0.15);
            display: flex;
            align-items: center;
            justify-content: center;
            transition: transform 0.3s ease, box-shadow 0.3s ease;
            z-index: 999999;
        }

        #rt-chat-btn:hover {
            transform: scale(1.1);
            box-shadow: 0 12px 48px rgba(37, 99, 235, 0.4);
        }

        #rt-chat-btn svg {
            width: 28px;
            height: 28px;
            fill: #ffffff;
            transition: transform 0.3s ease;
        }

        #rt-chat-btn.open svg {
            transform: rotate(45deg);
        }

        #rt-chat-window {
            position: fixed;
            bottom: 100px;
            ${config.position}: 24px;
            width: 400px;
            height: 600px;
            max-height: calc(100vh - 140px);
            background: #ffffff;
            border-radius: 16px;
            box-shadow: 0 10px 40px rgba(0,0,0,0.15);
            display: none;
            flex-direction: column;
            overflow: hidden;
            z-index: 999998;
        }

        #rt-chat-window.open {
            display: flex;
            animation: rtSlideUp 0.3s ease;
        }

        @keyframes rtSlideUp {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
        }

        #rt-chat-header {
            background: linear-gradient(135deg, ${config.primaryColor} 0%, ${adjustColor(config.primaryColor, -20)} 100%);
            color: #ffffff;
            padding: 20px;
            display: flex;
            align-items: center;
            gap: 12px;
        }

        #rt-chat-header .rt-avatar {
            width: 48px;
            height: 48px;
            border-radius: 50%;
            background: rgba(255,255,255,0.2);
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 18px;
            font-weight: bold;
        }

        #rt-chat-header .rt-info h3 {
            font-size: 16px;
            font-weight: 600;
            margin-bottom: 2px;
        }

        #rt-chat-header .rt-info p {
            font-size: 13px;
            opacity: 0.9;
            display: flex;
            align-items: center;
            gap: 6px;
        }

        #rt-chat-header .rt-info p::before {
            content: '';
            width: 8px;
            height: 8px;
            background: #22c55e;
            border-radius: 50%;
            animation: rtPulse 2s infinite;
        }

        @keyframes rtPulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
        }

        #rt-chat-messages {
            flex: 1;
            overflow-y: auto;
            padding: 20px;
            display: flex;
            flex-direction: column;
            gap: 16px;
            background: #f8fafc;
        }

        .rt-msg {
            max-width: 85%;
            padding: 12px 16px;
            border-radius: 16px;
            font-size: 14px;
            line-height: 1.5;
            animation: rtFadeIn 0.3s ease;
        }

        @keyframes rtFadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
        }

        .rt-msg.bot {
            background: #ffffff;
            color: #1e293b;
            align-self: flex-start;
            border-bottom-left-radius: 4px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.05);
        }

        .rt-msg.user {
            background: linear-gradient(135deg, ${config.primaryColor} 0%, ${adjustColor(config.primaryColor, -20)} 100%);
            color: #ffffff;
            align-self: flex-end;
            border-bottom-right-radius: 4px;
        }

        .rt-msg .rt-time {
            font-size: 11px;
            opacity: 0.7;
            margin-top: 6px;
            display: block;
        }

        .rt-typing {
            display: flex;
            align-items: center;
            gap: 4px;
            padding: 12px 16px;
            background: #ffffff;
            border-radius: 16px;
            border-bottom-left-radius: 4px;
            align-self: flex-start;
            box-shadow: 0 2px 8px rgba(0,0,0,0.05);
        }

        .rt-typing span {
            width: 8px;
            height: 8px;
            background: #64748b;
            border-radius: 50%;
            animation: rtTyping 1.4s infinite;
        }

        .rt-typing span:nth-child(2) { animation-delay: 0.2s; }
        .rt-typing span:nth-child(3) { animation-delay: 0.4s; }

        @keyframes rtTyping {
            0%, 60%, 100% { transform: translateY(0); }
            30% { transform: translateY(-6px); }
        }

        #rt-quick-actions {
            display: flex;
            gap: 8px;
            flex-wrap: wrap;
            padding: 12px 20px;
            background: #ffffff;
            border-top: 1px solid #e2e8f0;
        }

        .rt-quick-btn {
            padding: 8px 14px;
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 20px;
            font-size: 13px;
            color: #1e293b;
            cursor: pointer;
            transition: all 0.2s ease;
        }

        .rt-quick-btn:hover {
            background: ${config.primaryColor};
            color: #ffffff;
            border-color: ${config.primaryColor};
        }

        #rt-chat-input-area {
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 16px 20px;
            background: #ffffff;
            border-top: 1px solid #e2e8f0;
        }

        #rt-chat-input {
            flex: 1;
            padding: 12px 16px;
            border: 1px solid #e2e8f0;
            border-radius: 24px;
            font-size: 14px;
            outline: none;
            transition: border-color 0.2s ease;
        }

        #rt-chat-input:focus {
            border-color: ${config.primaryColor};
        }

        #rt-send-btn {
            width: 44px;
            height: 44px;
            border-radius: 50%;
            background: linear-gradient(135deg, ${config.primaryColor} 0%, ${adjustColor(config.primaryColor, -20)} 100%);
            border: none;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: transform 0.2s ease;
        }

        #rt-send-btn:hover {
            transform: scale(1.05);
        }

        #rt-send-btn:disabled {
            opacity: 0.5;
            cursor: not-allowed;
        }

        #rt-send-btn svg {
            width: 20px;
            height: 20px;
            fill: #ffffff;
        }

        #rt-powered {
            text-align: center;
            padding: 8px;
            font-size: 11px;
            color: #64748b;
            background: #ffffff;
        }

        @media (max-width: 480px) {
            #rt-chat-window {
                width: calc(100vw - 16px);
                height: calc(100vh - 100px);
                ${config.position}: 8px;
                bottom: 88px;
                border-radius: 12px;
            }

            #rt-chat-btn {
                width: 56px;
                height: 56px;
                ${config.position}: 16px;
                bottom: 16px;
            }
        }
    `;

    // Helper function to darken/lighten colors
    function adjustColor(color, amount) {
        const hex = color.replace('#', '');
        const num = parseInt(hex, 16);
        const r = Math.min(255, Math.max(0, (num >> 16) + amount));
        const g = Math.min(255, Math.max(0, ((num >> 8) & 0x00FF) + amount));
        const b = Math.min(255, Math.max(0, (num & 0x0000FF) + amount));
        return '#' + (0x1000000 + r * 0x10000 + g * 0x100 + b).toString(16).slice(1);
    }

    // Create widget HTML
    function createWidget() {
        // Add styles
        const styleEl = document.createElement('style');
        styleEl.textContent = styles;
        document.head.appendChild(styleEl);

        // Create container
        const container = document.createElement('div');
        container.id = 'rt-chatbot-widget';

        // Quick actions HTML
        const quickActionsHtml = config.quickActions.map(action =>
            `<button class="rt-quick-btn" data-message="${action.message}">${action.label}</button>`
        ).join('');

        container.innerHTML = `
            <button id="rt-chat-btn" aria-label="Open chat">
                <svg viewBox="0 0 24 24">
                    <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H5.17L4 17.17V4h16v12z"/>
                    <path d="M7 9h10v2H7zM7 5h10v2H7z"/>
                </svg>
            </button>
            <div id="rt-chat-window">
                <div id="rt-chat-header">
                    <div class="rt-avatar">RT</div>
                    <div class="rt-info">
                        <h3>${config.companyName} Assistant</h3>
                        <p>Online and ready to help</p>
                    </div>
                </div>
                <div id="rt-chat-messages"></div>
                <div id="rt-quick-actions">${quickActionsHtml}</div>
                <div id="rt-chat-input-area">
                    <input type="text" id="rt-chat-input" placeholder="Type your message...">
                    <button id="rt-send-btn" aria-label="Send">
                        <svg viewBox="0 0 24 24"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
                    </button>
                </div>
                <div id="rt-powered">Powered by ${config.companyName} AI</div>
            </div>
        `;

        document.body.appendChild(container);

        // Initialize event handlers
        initEventHandlers();
    }

    // State
    let isOpen = false;
    let isTyping = false;
    let firstOpen = true;

    // Event handlers
    function initEventHandlers() {
        const chatBtn = document.getElementById('rt-chat-btn');
        const sendBtn = document.getElementById('rt-send-btn');
        const input = document.getElementById('rt-chat-input');
        const quickActions = document.querySelectorAll('.rt-quick-btn');

        chatBtn.addEventListener('click', toggleChat);
        sendBtn.addEventListener('click', sendMessage);
        input.addEventListener('keypress', function(e) {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
            }
        });

        quickActions.forEach(btn => {
            btn.addEventListener('click', function() {
                input.value = this.dataset.message;
                sendMessage();
            });
        });
    }

    function toggleChat() {
        isOpen = !isOpen;
        const window = document.getElementById('rt-chat-window');
        const btn = document.getElementById('rt-chat-btn');

        if (isOpen) {
            window.classList.add('open');
            btn.classList.add('open');
            document.getElementById('rt-chat-input').focus();

            if (firstOpen) {
                addMessage(config.welcomeMessage, 'bot');
                firstOpen = false;
            }
        } else {
            window.classList.remove('open');
            btn.classList.remove('open');
        }
    }

    function formatTime() {
        return new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    }

    function addMessage(content, sender) {
        const messages = document.getElementById('rt-chat-messages');
        const msg = document.createElement('div');
        msg.className = `rt-msg ${sender}`;

        const formatted = content
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/\n/g, '<br>');

        msg.innerHTML = `${formatted}<span class="rt-time">${formatTime()}</span>`;
        messages.appendChild(msg);
        messages.scrollTop = messages.scrollHeight;
    }

    function showTyping() {
        if (isTyping) return;
        isTyping = true;

        const messages = document.getElementById('rt-chat-messages');
        const typing = document.createElement('div');
        typing.className = 'rt-typing';
        typing.id = 'rt-typing';
        typing.innerHTML = '<span></span><span></span><span></span>';
        messages.appendChild(typing);
        messages.scrollTop = messages.scrollHeight;
    }

    function hideTyping() {
        isTyping = false;
        const typing = document.getElementById('rt-typing');
        if (typing) typing.remove();
    }

    async function sendMessage() {
        const input = document.getElementById('rt-chat-input');
        const message = input.value.trim();
        if (!message) return;

        input.value = '';
        document.getElementById('rt-send-btn').disabled = true;
        addMessage(message, 'user');
        showTyping();

        // Hide quick actions
        document.getElementById('rt-quick-actions').style.display = 'none';

        if (!config.webhookUrl) {
            hideTyping();
            addMessage('Chat is not configured yet. Please contact the website administrator.', 'bot');
            document.getElementById('rt-send-btn').disabled = false;
            return;
        }

        try {
            const response = await fetch(config.webhookUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: message,
                    sessionId: sessionId,
                    timestamp: new Date().toISOString(),
                    pageUrl: window.location.href,
                    pageTitle: document.title
                })
            });

            if (!response.ok) throw new Error('Request failed');

            const data = await response.json();
            hideTyping();
            addMessage(data.response, 'bot');

        } catch (error) {
            console.error('Chat error:', error);
            hideTyping();
            addMessage("I apologize, but I'm having trouble connecting right now. Please try again or contact us directly.", 'bot');
        }

        document.getElementById('rt-send-btn').disabled = false;
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', createWidget);
    } else {
        createWidget();
    }

})();
