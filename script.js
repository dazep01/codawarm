// ===== STATE MANAGEMENT =====
let sessionState = localStorage.getItem('gemini_state') || "{}";
let apiKey = localStorage.getItem('gemini_apikey') || "";
let attachedFile = null;
let pinnedChats = JSON.parse(localStorage.getItem('pinned_chats') || '[]');
let promptBank = JSON.parse(localStorage.getItem('prompt_bank') || '[]');
let chatElements = new Map(); // Store bubble element references

// ===== INITIALIZE DEFAULT PROMPTS =====
if (promptBank.length === 0) {
  promptBank = [{
      id: Date.now(),
      title: "Debug JavaScript",
      content: "Tolong debug kode JavaScript ini. Identifikasi error, berikan solusi, dan jelaskan penyebabnya:",
      createdAt: new Date().toISOString(),
      usedCount: 0
    },
    {
      id: Date.now() + 1,
      title: "Optimasi Python",
      content: "Analisis kode Python ini untuk optimasi. Berikan saran untuk meningkatkan performance dan readability:",
      createdAt: new Date().toISOString(),
      usedCount: 0
    },
    {
      id: Date.now() + 2,
      title: "Explain Algorithm",
      content: "Jelaskan algoritma ini dengan detail: kompleksitas waktu/ruang, cara kerja, dan contoh implementasi:",
      createdAt: new Date().toISOString(),
      usedCount: 0
    }
  ];
  localStorage.setItem('prompt_bank', JSON.stringify(promptBank));
}

// ===== SHEET MANAGEMENT =====
function openSheet(id) {
  document.getElementById(id).classList.add('active');
  document.getElementById('overlay').style.display = 'block';
  document.body.style.overflow = 'hidden';

  // Load content for specific sheets
  if (id === 'pinned-sheet') {
    loadPinnedChats();
  } else if (id === 'prompt-sheet') {
    loadPromptBank();
  }

  setTimeout(() => {
    const sheet = document.getElementById(id);
    const firstInput = sheet.querySelector('input, textarea');
    if (firstInput) firstInput.focus();
  }, 300);
}

function closeAllSheets() {
  document.querySelectorAll('.sheet').forEach(s => s.classList.remove('active'));
  document.getElementById('overlay').style.display = 'none';
  document.body.style.overflow = '';

  setTimeout(() => {
    document.getElementById('userInput').focus();
  }, 200);
}

// ===== INFO MODAL =====
function openInfoModal() {
  document.getElementById('info-modal').style.display = 'flex';
  document.body.style.overflow = 'hidden';
}

function closeInfoModal() {
  document.getElementById('info-modal').style.display = 'none';
  document.body.style.overflow = '';
}

// ===== PINNED CHATS =====
function togglePin(bubbleId, content, sender) {
  const existingIndex = pinnedChats.findIndex(p => p.bubbleId === bubbleId);

  if (existingIndex > -1) {
    // Unpin
    pinnedChats.splice(existingIndex, 1);
    updatePinnedBadge();
    savePinnedChats();
    showToast('Chat tidak lagi disematkan', 'info');
    return false;
  } else {
    // Pin
    const pinnedChat = {
      id: Date.now(),
      bubbleId: bubbleId,
      content: content.length > 200 ? content.substring(0, 200) + '...' : content,
      sender: sender,
      timestamp: new Date().toISOString(),
      position: getBubblePosition(bubbleId)
    };

    pinnedChats.unshift(pinnedChat);
    updatePinnedBadge();
    savePinnedChats();
    showToast('Chat disematkan!', 'success');
    return true;
  }
}

function getBubblePosition(bubbleId) {
  const element = document.getElementById(bubbleId);
  if (!element) return 0;

  const container = document.getElementById('chat-container');
  return element.offsetTop - container.offsetTop;
}

function scrollToPinnedChat(bubbleId, position) {
  const container = document.getElementById('chat-container');
  const element = document.getElementById(bubbleId);

  if (element) {
    container.scrollTo({
      top: position,
      behavior: 'smooth'
    });

    // Highlight effect
    element.style.boxShadow = '0 0 0 4px rgba(255, 149, 0, 0.3)';
    setTimeout(() => {
      element.style.boxShadow = '';
    }, 2000);
  } else {
    container.scrollTo({
      top: position,
      behavior: 'smooth'
    });
  }

  closeAllSheets();
  showToast('Menuju chat yang disematkan', 'info');
}

function loadPinnedChats() {
  const list = document.getElementById('pinned-list');
  const emptyState = list.nextElementSibling;

  if (pinnedChats.length === 0) {
    list.innerHTML = '';
    emptyState.style.display = 'block';
    return;
  }

  emptyState.style.display = 'none';
  list.innerHTML = pinnedChats.map(chat => `
        <div class="pinned-card pinned-${chat.sender}" onclick="scrollToPinnedChat('${chat.bubbleId}', ${chat.position})">
            <div class="pinned-content">${escapeHtml(chat.content)}</div>
            <div class="pinned-meta">
                <span>
                    <i class="ph ph-${chat.sender === 'user' ? 'user' : 'robot'}"></i>
                    ${formatDate(chat.timestamp)}
                </span>
                <button class="pinned-remove" onclick="removePinnedChat(${chat.id}, event)">
                    <i class="ph ph-trash"></i>
                </button>
            </div>
        </div>
    `).join('');
}

function removePinnedChat(chatId, event) {
  event.stopPropagation();

  pinnedChats = pinnedChats.filter(p => p.id !== chatId);
  savePinnedChats();
  loadPinnedChats();
  updatePinnedBadge();
  showToast('Chat dihapus dari sematan', 'info');
}

function updatePinnedBadge() {
  const badge = document.getElementById('pinned-count');
  badge.textContent = pinnedChats.length;
  badge.style.display = pinnedChats.length > 0 ? 'flex' : 'none';
}

function savePinnedChats() {
  localStorage.setItem('pinned_chats', JSON.stringify(pinnedChats));
}

// ===== PROMPT BANK =====
function loadPromptBank() {
  const list = document.getElementById('prompt-list');
  list.innerHTML = promptBank.map(prompt => `
        <div class="prompt-card" data-id="${prompt.id}">
            <div class="prompt-header">
                <input type="text" class="prompt-title" value="${escapeHtml(prompt.title)}" 
                       onblur="updatePrompt(${prompt.id}, 'title', this.value)"
                       onkeypress="if(event.key === 'Enter') this.blur()">
                <div class="prompt-actions">
                    <button class="prompt-btn" onclick="usePrompt(${prompt.id})" title="Gunakan Prompt">
                        <i class="ph ph-play-circle"></i>
                    </button>
                    <button class="prompt-btn" onclick="deletePrompt(${prompt.id})" title="Hapus Prompt">
                        <i class="ph ph-trash"></i>
                    </button>
                </div>
            </div>
            <textarea class="prompt-content" 
                      onblur="updatePrompt(${prompt.id}, 'content', this.value)"
                      onkeydown="if(event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); this.blur(); }">${escapeHtml(prompt.content)}</textarea>
            <div class="prompt-footer">
                <span>Digunakan: ${prompt.usedCount} kali</span>
                <span>${formatDate(prompt.createdAt)}</span>
            </div>
        </div>
    `).join('');
}

function addNewPrompt() {
  const newPrompt = {
    id: Date.now(),
    title: "Prompt Baru",
    content: "Deskripsi prompt...",
    createdAt: new Date().toISOString(),
    usedCount: 0
  };

  promptBank.unshift(newPrompt);
  savePromptBank();
  loadPromptBank();

  // Focus on the new prompt title
  setTimeout(() => {
    const newCard = document.querySelector(`[data-id="${newPrompt.id}"] .prompt-title`);
    if (newCard) {
      newCard.focus();
      newCard.select();
    }
  }, 100);

  showToast('Prompt baru ditambahkan', 'success');
}

function updatePrompt(id, field, value) {
  const prompt = promptBank.find(p => p.id === id);
  if (prompt) {
    prompt[field] = value.trim();
    savePromptBank();
  }
}

function usePrompt(id) {
  const prompt = promptBank.find(p => p.id === id);
  if (prompt) {
    document.getElementById('userInput').value = prompt.content;
    prompt.usedCount = (prompt.usedCount || 0) + 1;
    savePromptBank();
    closeAllSheets();
    document.getElementById('userInput').focus();
    showToast(`Prompt "${prompt.title}" dimuat`, 'success');
  }
}

function deletePrompt(id) {
  if (confirm('Hapus prompt ini?')) {
    promptBank = promptBank.filter(p => p.id !== id);
    savePromptBank();
    loadPromptBank();
    showToast('Prompt dihapus', 'info');
  }
}

function clearAllPrompts() {
  if (promptBank.length === 0) {
    showToast('Tidak ada prompt untuk dihapus', 'info');
    return;
  }

  if (confirm(`Hapus semua ${promptBank.length} prompt?`)) {
    promptBank = [];
    savePromptBank();
    loadPromptBank();
    showToast('Semua prompt dihapus', 'success');
  }
}

function exportPrompts() {
  const dataStr = JSON.stringify(promptBank, null, 2);
  const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);

  const exportFileDefaultName = `codawarm-prompts-${new Date().toISOString().split('T')[0]}.json`;

  const linkElement = document.createElement('a');
  linkElement.setAttribute('href', dataUri);
  linkElement.setAttribute('download', exportFileDefaultName);
  linkElement.click();

  showToast('Prompt diexport', 'success');
}

function savePromptBank() {
  localStorage.setItem('prompt_bank', JSON.stringify(promptBank));
}

// ===== ENHANCED INPUT WITH PROMPT SUGGESTIONS =====
function setupPromptSuggestions() {
  const input = document.getElementById('userInput');

  input.addEventListener('keydown', (e) => {
    if (e.key === '/' && !e.ctrlKey && !e.metaKey) {
      e.preventDefault();
      openSheet('prompt-sheet');
    }
  });

  input.addEventListener('input', () => {
    // Optional: Show prompt suggestions when typing
  });
}

// ==================== FORMAT MESSAGE ====================
function formatMessage(raw) {
  const lines = raw.split('\n');
  let formatted = '';
  let inList = false;

  lines.forEach(line => {
    const trimmed = line.trim();
    if (!trimmed) {
      formatted += '<br>';
      return;
    }

    // Blockquote
    if (trimmed.startsWith('>')) {
      let content = trimmed.slice(1).trim();
      // Bold/Italic di blockquote
      content = content.replace(/\*\*(.*?)\*\*/g, '<b>$1</b>');
      content = content.replace(/\*(.*?)\*/g, '<i>$1</i>');
      content = content.replace(/_(.*?)_/g, '<i>$1</i>');
      formatted += `<blockquote>${content}</blockquote>`;
      return;
    }

    // List items
    const listMatch = trimmed.match(/^[-*]\s+(.*)/);
    if (listMatch) {
      if (!inList) {
        formatted += '<ul>';
        inList = true;
      }
      let content = listMatch[1].trim();
      // Bold/Italic di list item
      content = content.replace(/\*\*(.*?)\*\*/g, '<b>$1</b>');
      content = content.replace(/\*(.*?)\*/g, '<i>$1</i>');
      content = content.replace(/_(.*?)_/g, '<i>$1</i>');
      formatted += `<li>${content}</li>`;
      return; // jangan tambah <br> di list
    } else if (inList) {
      formatted += '</ul>';
      inList = false;
    }

    // Bold/Italic di normal line
    let content = trimmed;
    content = content.replace(/\*\*(.*?)\*\*/g, '<b>$1</b>');
    content = content.replace(/\*(.*?)\*/g, '<i>$1</i>');
    content = content.replace(/_(.*?)_/g, '<i>$1</i>');

    // URL auto-link
    content = content.replace(
      /(https?:\/\/[^\s]+)/g,
      '<a href="$1" target="_blank">$1</a>'
    );

    formatted += content + '<br>';
  });

  // Tutup list jika masih terbuka
  if (inList) formatted += '</ul>';

  return formatted;
}

// ==================== ADD BUBBLE ====================
function addBubble(content, sender) {
    const container = document.getElementById('chat-container');
    const bubbleId = 'bubble-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);

    const wrapper = document.createElement('div');
    wrapper.className = `bubble-wrapper ${sender}-wrapper`;
    wrapper.id = bubbleId;

    const bubble = document.createElement('div');
    bubble.className = `bubble ${sender}`;

    if (sender === 'ai') {
        bubble.innerHTML = marked.parse(content);
        
        // Tunggu sampai DOM selesai dirender sebelum tambahkan event listeners
        setTimeout(() => {
            bubble.querySelectorAll('pre').forEach(pre => {
                const btnContainer = document.createElement('div');
                btnContainer.className = 'code-actions-container';

                // Tombol Copy
                const copyBtn = document.createElement('button');
                copyBtn.innerHTML = '<i class="ph ph-copy"></i>';
                copyBtn.onclick = () => copyText(pre.innerText, copyBtn);

                // Tombol Download
                const dlBtn = document.createElement('button');
                dlBtn.innerHTML = '<i class="ph ph-download-simple"></i>';
                dlBtn.onclick = () => openDownloadModal(pre.innerText);

                btnContainer.appendChild(copyBtn);
                btnContainer.appendChild(dlBtn);
                pre.appendChild(btnContainer);
            });
        }, 100);
    } else {
        bubble.textContent = content;
    }

    // Aksi Bubble (versi lengkap dari versi 1)
    const actions = document.createElement('div');
    actions.className = 'bubble-actions';

    // Tombol Salin Pesan
    const copyMsgBtn = document.createElement('button');
    copyMsgBtn.className = 'bubble-btn';
    copyMsgBtn.innerHTML = '<i class="ph ph-copy"></i> Salin';
    copyMsgBtn.onclick = () => copyText(content, copyMsgBtn);

    // Tombol PIN (fitur penting)
    const pinBtn = document.createElement('button');
    pinBtn.className = 'bubble-btn';
    pinBtn.innerHTML = '<i class="ph ph-push-pin"></i> Sematkan';
    pinBtn.title = "Sematkan pesan"; // ← tambahkan tooltip
    
    const isAlreadyPinned = pinnedChats.some(p => p.bubbleId === bubbleId);
    if (isAlreadyPinned) pinBtn.classList.add('active');

    pinBtn.onclick = () => {
        const isPinned = togglePin(bubbleId, content, sender);
        pinBtn.innerHTML = isPinned ? 
            '<i class="ph ph-push-pin-simple"></i> Tersemat' : 
            '<i class="ph ph-push-pin"></i> Sematkan';
        pinBtn.classList.toggle('active', isPinned);
        pinBtn.title = isPinned ? "Lepaskan sematan" : "Sematkan pesan";
    };

    actions.appendChild(copyMsgBtn);
    actions.appendChild(pinBtn);

    wrapper.appendChild(bubble);
    wrapper.appendChild(actions);
    container.appendChild(wrapper);

    if (window.Prism) Prism.highlightAllUnder(bubble);
    container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' });
}

// ===== UTILITY FUNCTIONS =====
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function formatDate(isoString) {
  const date = new Date(isoString);
  return date.toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function showToast(message, type = 'info') {
  // Remove existing toast
  const existing = document.querySelector('.toast');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `
        <i class="ph ph-${type === 'success' ? 'check-circle' : type === 'error' ? 'warning-circle' : 'info'}"></i>
        <span>${message}</span>
    `;

  // Add toast styles if not already present
  if (!document.querySelector('#toast-styles')) {
    const style = document.createElement('style');
    style.id = 'toast-styles';
    style.textContent = `
            .toast {
                position: fixed;
                top: 80px;
                right: 20px;
                background: var(--surface-primary);
                border: 1px solid var(--border-light);
                border-radius: var(--radius-lg);
                padding: var(--space-3) var(--space-4);
                display: flex;
                align-items: center;
                gap: var(--space-3);
                box-shadow: var(--shadow-lg);
                z-index: 2000;
                animation: slideIn 0.3s ease, fadeOut 0.3s ease 2.7s forwards;
                font-size: var(--font-size-sm);
            }
            .toast-success { 
                border-left: 4px solid var(--success);
                background: linear-gradient(135deg, rgba(52, 199, 89, 0.1) 0%, rgba(52, 199, 89, 0.05) 100%);
            }
            .toast-error { 
                border-left: 4px solid var(--error);
                background: linear-gradient(135deg, rgba(255, 59, 48, 0.1) 0%, rgba(255, 59, 48, 0.05) 100%);
            }
            .toast-info { 
                border-left: 4px solid var(--info);
                background: linear-gradient(135deg, rgba(0, 122, 255, 0.1) 0%, rgba(0, 122, 255, 0.05) 100%);
            }
            @keyframes slideIn {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
            @keyframes fadeOut {
                from { opacity: 1; }
                to { opacity: 0; }
            }
        `;
    document.head.appendChild(style);
  }

  document.body.appendChild(toast);
  setTimeout(() => {
    if (toast.parentNode) {
      toast.parentNode.removeChild(toast);
    }
  }, 3000);
}

// ===== EXPANDED INPUT FUNCTIONS =====
function openExpandedInput() {
  const userInput = document.getElementById('userInput').value;
  const expandedInput = document.getElementById('expandedInput');
  expandedInput.value = userInput;
  openSheet('input-sheet');
  
  // Set cursor to end of text and trigger preview
  setTimeout(() => {
    expandedInput.selectionStart = expandedInput.selectionEnd = expandedInput.value.length;
    expandedInput.style.height = expandedInput.scrollHeight + 'px';
    expandedInput.dispatchEvent(new Event('input'));
  }, 350);
}

function sendFromExpanded() {
  const expandedInput = document.getElementById('expandedInput').value;
  document.getElementById('userInput').value = expandedInput;
  closeAllSheets();

  // Small delay to ensure sheet is closed before sending
  setTimeout(() => {
    sendMessage();
  }, 300);
}

// ===== TOGGLE HELPER FUNCTION =====
function toggleHelper() {
    const helperCont = document.getElementById('input-helper-container');
    if (helperCont) {
        const isVisible = helperCont.style.display !== 'none';
        helperCont.style.display = isVisible ? 'none' : 'block';
    }
}

// ===== CONFIGURATION =====
function saveConfig() {
  apiKey = document.getElementById('apiKeyInput').value.trim();
  localStorage.setItem('gemini_apikey', apiKey);

  // Show success feedback
  const saveBtn = document.querySelector('#settings-sheet .save-btn');
  const originalHTML = saveBtn.innerHTML;
  saveBtn.innerHTML = '<i class="ph ph-check"></i> Tersimpan!';
  saveBtn.style.background = 'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)';

  setTimeout(() => {
    saveBtn.innerHTML = originalHTML;
    saveBtn.style.background = '';
    closeAllSheets();
    showToast('Pengaturan disimpan', 'success');
  }, 1500);
}

function resetSession() {
  if (confirm("Yakin ingin menghapus seluruh memori sesi chat?")) {
    localStorage.removeItem('gemini_state');

    // Visual feedback
    const chatContainer = document.getElementById('chat-container');
    chatContainer.style.opacity = '0.5';
    chatContainer.style.transition = 'opacity 0.3s';

    setTimeout(() => {
      location.reload();
    }, 300);
  }
}

// ===== FILE HANDLING =====
function handleFile(input) {
  const file = input.files[0];
  if (!file) return;

  // Check file size (max 10MB)
  if (file.size > 10 * 1024 * 1024) {
    alert("File terlalu besar. Maksimum 10MB.");
    input.value = '';
    return;
  }

  const reader = new FileReader();
  reader.onload = (e) => {
    attachedFile = {
      mime_type: file.type,
      data: e.target.result.split(',')[1],
      name: file.name
    };

    // Show file preview with animation
    const filePreview = document.getElementById('file-preview');
    document.getElementById('file-name').innerText = file.name;
    filePreview.style.display = 'flex';

    // Scroll to show file preview
    setTimeout(() => {
      filePreview.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest'
      });
    }, 100);
  };
  reader.readAsDataURL(file);
}

function clearFile() {
  attachedFile = null;
  document.getElementById('file-preview').style.display = 'none';
  document.getElementById('fileInput').value = '';
}

// ===== MESSAGE HANDLING =====
async function sendMessage() {
    const input = document.getElementById('userInput');
    const roleSelect = document.getElementById('roleSelect');
    const msg = input.value.trim();
    const selectedRole = roleSelect.value;
    
    if ((!msg && !attachedFile) || !apiKey) {
        if (!apiKey) showToast("API Key belum diatur!", "error");
        return;
    }

    addBubble(msg + (attachedFile ? `\n\n[File: ${attachedFile.name}]` : ""), 'user');
    input.value = '';
    document.getElementById('loader').style.display = 'block';
    document.getElementById('sendBtn').style.display = 'none';

    // ===== SYSTEM PROMPT DENGAN FORMAT JSON SUMMARY =====
    const systemInstruction = `
        IDENTITY: You are CodOt (Code Copilot).
        ROLE: ${selectedRole}.
        
        STRICT OUTPUT FORMAT:
        1. Answer the user inside <UI_RESPONSE> tags using Markdown.
        2. Provide a technical session context inside <STATE_SUMMARY> tags using this EXACT JSON format:
           {
             "v": 1,
             "topic": "Judul topik",
             "user_goal": "Goal user",
             "key_facts": ["Fakta 1", "Fakta 2"],
             "decisions": ["Keputusan teknis"],
             "constraints": ["Batasan/limitasi"],
             "current_direction": "Arah pengerjaan saat ini",
             "open_points": ["Hal yang belum terjawab"],
             "next_step": ["Langkah selanjutnya"]
           }

        IMPORTANT: The <STATE_SUMMARY> must be valid JSON to be re-processed as context.
        CURRENT CONTEXT FROM PREVIOUS MESSAGE: ${sessionState}
    `;

    let parts = [{
        text: `${systemInstruction}\n\nUSER_QUERY: ${msg}`
    }];

    if (attachedFile) {
        parts.push({
            inline_data: {
                mime_type: attachedFile.mime_type,
                data: attachedFile.data
            }
        });
    }

    const modelInventory = ['gemini-3-flash-preview', 'gemini-3-pro-preview', 'gemini-2.5-flash', 'gemini-2.5-pro'];
    let success = false;

    for (const modelId of modelInventory) {
        try {
            const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelId}:generateContent?key=${apiKey}`;
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    contents: [{ parts: parts }],
                    generationConfig: { temperature: 0.7, topP: 0.95, topK: 40, maxOutputTokens: 8192 }
                })
            });

            const data = await response.json();

            if (response.ok) {
                const raw = data.candidates[0].content.parts[0].text;
                
                // Ambil isi di dalam UI_RESPONSE
                const uiMatch = raw.match(/<UI_RESPONSE>([\s\S]*?)<\/UI_RESPONSE>/);
                const stateMatch = raw.match(/<STATE_SUMMARY>([\s\S]*?)<\/STATE_SUMMARY>/);
                
                let ui = "";
                if (uiMatch) {
                    ui = uiMatch[1].trim();
                } else {
                    // FALLBACK: Jika AI lupa kasih tag, kita bersihkan cuma tag CodOt saja, 
                    // JANGAN hapus tag HTML standar agar kode program tidak hilang.
                    ui = raw.replace(/<\/?UI_RESPONSE>|<\/?STATE_SUMMARY>/g, '').trim();
                }
                
                // Simpan State (JSON)
                if (stateMatch) {
                    sessionState = stateMatch[1].trim();
                    localStorage.setItem('gemini_state', sessionState);
                }
                
                addBubble(ui, 'ai');
                clearFile();
                success = true;
                break; 
            }
        } catch (err) { 
            console.error(err); 
        }
    }

    if (!success) addBubble(`❌ **CodOt Error:** Gagal memproses permintaan.`, 'ai');

    document.getElementById('loader').style.display = 'none';
    document.getElementById('sendBtn').style.display = 'flex';
}

// ===== COPY FUNCTIONALITY =====
function copyText(text, btn) {
    if (!navigator.clipboard) {
        // Fallback untuk browser lama atau non-HTTPS
        const textArea = document.createElement("textarea");
        textArea.value = text;
        document.body.appendChild(textArea);
        textArea.select();
        try {
            document.execCommand('copy');
            updateCopyUI(btn);
        } catch (err) {
            showToast("Gagal menyalin", "error");
        }
        document.body.removeChild(textArea);
        return;
    }

    navigator.clipboard.writeText(text).then(() => {
        updateCopyUI(btn);
    }).catch(err => {
        showToast("Gagal menyalin", "error");
    });
}

function updateCopyUI(btn) {
    const original = btn.innerHTML;
    btn.innerHTML = '<i class="ph ph-check"></i> Tersalin!';
    btn.style.color = '#4CAF50';
    setTimeout(() => {
        btn.innerHTML = original;
        btn.style.color = '';
    }, 2000);
}

// ===== UNDUH FILE CODE =====
let currentCodeToDownload = "";

function openDownloadModal(code) {
    currentCodeToDownload = code;
    document.getElementById('downloadModal').style.display = 'flex';
    // Fokus ke input nama file
    document.getElementById('fileNameInput').focus();
}

function closeDownloadModal() {
    document.getElementById('downloadModal').style.display = 'none';
    currentCodeToDownload = "";
}

// ===== PREVIEW DEBOUNCE FUNCTION =====
let previewTimeout = null;

function updatePreview(value) {
    clearTimeout(previewTimeout);
    previewTimeout = setTimeout(() => {
        const previewBox = document.getElementById('inputPreview');
        const helperCont = document.getElementById('input-helper-container');
        
        if (value.includes('```')) {
            helperCont.style.display = 'block';
            previewBox.innerHTML = marked.parse(value);
            if (window.Prism) Prism.highlightAllUnder(previewBox);
        } else {
            helperCont.style.display = 'none';
        }
    }, 300); // Debounce 300ms
}

// ===== INITIALIZATION =====
document.addEventListener('DOMContentLoaded', () => {
  const lsScreen = document.getElementById('ls-screen');
  const lsVideo = document.getElementById('ls-video');

// Opsi A: Hilang Otomatis saat Video Selesai
lsVideo.onended = function() {
    hideLoader();
};

// Opsi B: Bisa dilewati (Skip) kalau diklik (User-Friendly)
lsScreen.onclick = function() {
    hideLoader();
};

function hideLoader() {
    lsScreen.classList.add('loader-hidden');
    
    // Hapus elemen dari DOM setelah animasi fade selesai (untuk hemat RAM)
    setTimeout(() => {
        lsScreen.remove();
    }, 800);
}

// Fallback: Jika video gagal load, tetap hilangkan ls screen setelah 5 detik
setTimeout(() => {
    if (document.getElementById('ls-screen')) {
        hideLoader();
    }
}, 12000); 
  // Load config
  document.getElementById('apiKeyInput').value = apiKey;

  // Initialize pinned badge
  updatePinnedBadge();

  // Setup prompt suggestions
  setupPromptSuggestions();

  // Focus on input
  document.getElementById('userInput').focus();

  // Keyboard shortcuts
  document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') sendMessage();
    if (e.key === 'Escape') {
      closeAllSheets();
      closeInfoModal();
    }
  });

  // Auto-resize textarea and preview handling for expanded input
  const expandedInput = document.getElementById('expandedInput');
  if (expandedInput) {
    expandedInput.addEventListener('input', function() {
      this.style.height = 'auto';
      this.style.height = (this.scrollHeight) + 'px';
      updatePreview(this.value);
    });
  }

  // Setup download modal event listener
  document.getElementById('confirmDownloadBtn').addEventListener('click', function() {
    const name = document.getElementById('fileNameInput').value || 'file_codot';
    const ext = document.getElementById('fileExtInput').value;
    const fullName = name.endsWith(ext) ? name : name + ext;

    const blob = new Blob([currentCodeToDownload], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.download = fullName;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    closeDownloadModal();
    showToast(`Berhasil mengunduh ${fullName}`, "success");
  });

  // Add shake animation for empty input (optional CSS)
  const style = document.createElement('style');
  style.textContent = `
    @keyframes shake {
      0%, 100% { transform: translateX(0); }
      10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
      20%, 40%, 60%, 80% { transform: translateX(5px); }
    }
  `;
  document.head.appendChild(style);

  // Add preview helper CSS if not present
  if (!document.querySelector('#preview-helper-styles')) {
    const helperStyle = document.createElement('style');
    helperStyle.id = 'preview-helper-styles';
    helperStyle.textContent = `
        .helper-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: var(--space-2) var(--space-3);
            background: var(--surface-secondary);
            border-bottom: 1px solid var(--border-light);
            border-radius: var(--radius-md) var(--radius-md) 0 0;
            font-size: var(--font-size-sm);
            font-weight: 600;
            color: var(--text-primary);
        }
        
        .helper-header button {
            background: none;
            border: none;
            color: var(--text-secondary);
            cursor: pointer;
            font-size: 1.25rem;
            padding: var(--space-1);
            border-radius: var(--radius-sm);
            transition: all var(--transition-fast);
        }
        
        .helper-header button:hover {
            background: var(--surface-tertiary);
            color: var(--text-primary);
        }
        
        .preview-box {
            max-height: 200px;
            overflow-y: auto;
            background: var(--surface-tertiary);
            border-radius: 0 0 var(--radius-md) var(--radius-md);
            padding: var(--space-3);
            border: 1px solid var(--border-light);
            font-family: 'SF Mono', Monaco, 'Cascadia Mono', monospace;
            font-size: var(--font-size-sm);
            line-height: var(--line-height-normal);
        }
        
        .preview-box pre {
            margin: 0;
            background: transparent;
            border: none;
            padding: 0;
        }
        
        .preview-box code {
            font-family: inherit;
        }
        
        .code-actions-container {
            position: absolute;
            top: 8px;
            right: 8px;
            display: flex;
            gap: 4px;
            opacity: 0.7;
            transition: opacity 0.2s;
        }
        
        .code-actions-container:hover {
            opacity: 1;
        }
        
        .code-actions-container button {
            background: var(--surface-primary);
            border: 1px solid var(--border-light);
            color: var(--text-secondary);
            padding: 4px 8px;
            border-radius: var(--radius-sm);
            cursor: pointer;
            font-size: 12px;
            display: flex;
            align-items: center;
            gap: 4px;
            transition: all 0.2s;
        }
        
        .code-actions-container button:hover {
            background: var(--surface-secondary);
            color: var(--text-primary);
            transform: translateY(-1px);
        }
    `;
    document.head.appendChild(helperStyle);
  }

  // ==================== WELCOME MESSAGE ====================
  if (sessionState === "{}") {
    setTimeout(() => {
      const rawMessage = `
Halo! Saya **AI CodOt (Code Copilot)**, asisten coding seniormu di **CodaWarm** - *Powered by **Gemini AI***

*Fitur unik yang tersedia:*
- **Sematkan Chat**: Pin conversations yang menurutmu penting agar mudah dicari
- **Prompt Bank**: Simpan prompt favoritmu untuk digunakan di lain waktu
- **Role & Persona**: Pilih role agar saya bertindak sesuai keinginanmu
- **Privasi Lengkap**: Info keamanan dan lainnya tersedia untuk kamu pelajari lebih jelas

> Gunakan menu kanan layar untuk akses cepat ke semua fitur!
> Jangan lupa masukkan API Key-mu dengan mengklik icon user di pojok kanan atas ya! 😁
`;

      addBubble(rawMessage, 'ai');
    }, 800);
  }
});
