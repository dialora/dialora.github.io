document.addEventListener('DOMContentLoaded', () => {

    // ВАЖНО: Настройка marked.js в точности как ты просил.
    // Эта конфигурация не будет изменяться.
    marked.setOptions({
        breaks: true,
        sanitize: false,
        walkTokens: function(token) {
            if (token.type === 'html') {
                token.text = token.text.replace(/</g, '&lt;').replace(/>/g, '&gt;');
                        token.raw = token.raw.replace(/</g, '&lt;').replace(/>/g, '&gt;');
            }
        }
    });

    const uploadView = document.getElementById('upload-view');
    const resultView = document.getElementById('result-view');
    const fileInput = document.getElementById('file-input');
    const uploadOtherBtn = document.getElementById('upload-other-btn');
    const chatContainer = document.getElementById('chat-container');
    const inputArea = document.querySelector('.input-area');
    
    // --- ОБРАБОТЧИКИ СОБЫТИЙ ---

    inputArea.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) processFile(file);
    });
    
    inputArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        inputArea.classList.add('drag-over');
    });
    inputArea.addEventListener('dragleave', () => inputArea.classList.remove('drag-over'));
    inputArea.addEventListener('drop', (e) => {
        e.preventDefault();
        inputArea.classList.remove('drag-over');
        const file = e.dataTransfer.files[0];
        if (file) processFile(file);
    });
    
    uploadOtherBtn.addEventListener('click', () => {
        // возврат к обычному виду
        uploadView.classList.remove('hidden');
        resultView.classList.add('hidden');
        document.querySelector(".header").classList.add("headBase");
                document.querySelector(".header").classList.remove("headWork");
        fileInput.value = '';
        chatContainer.innerHTML = '';
    });

    // --- ЛОГИКА ---

    function processFile(file) {
        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const jsonData = JSON.parse(event.target.result);
                renderChat(jsonData);
                // новый интерфейс
                document.querySelector(".header").classList.remove("headBase");
                document.querySelector(".header").classList.add("headWork");
                uploadView.classList.add('hidden');
                resultView.classList.remove('hidden');
            } catch (error) {
                alert('Ошибка парсинга JSON. Проверьте корректность данных в файле.');
                console.error('JSON Parsing Error:', error);
            }
        };
        reader.onerror = () => alert('Не удалось прочитать файл.');
        reader.readAsText(file);
    }

    function renderChat(data) {
        chatContainer.innerHTML = '';

        if (!data?.chunkedPrompt?.chunks) {
            chatContainer.innerHTML = '<p>Неверная структура JSON.</p>';
            return;
        }

        const chunks = data.chunkedPrompt.chunks;
        for (let i = 0; i < chunks.length; i++) {
            const chunk = chunks[i];

            if (chunk.role === 'user') {
                appendUserMessage(chunk);
            } else if (chunk.role === 'model') {
                const modelGroup = { thoughts: [], response: null };
                
                while (i < chunks.length && chunks[i].role === 'model') {
                    if (chunks[i].isThought) {
                        modelGroup.thoughts.push(chunks[i]);
                    } else {
                        if (!modelGroup.response) {
                           modelGroup.response = chunks[i];
                        }
                    }
                    i++;
                }
                i--;

                if (modelGroup.thoughts.length > 0 || modelGroup.response) {
                    appendModelGroup(modelGroup);
                }
            }
        }
    }
    
    function appendUserMessage(chunk) {
        const messageEl = document.createElement('div');
        messageEl.className = 'message user-message';

        const avatar = document.createElement('div');
        avatar.className = 'avatar user-avatar';
        avatar.textContent = 'U';
        
        const content = document.createElement('div');
        content.className = 'content md-content';
        content.innerHTML = marked.parse(chunk.text, { breaks: true });
        
        addCopyButtons(content);

        messageEl.appendChild(avatar);
        messageEl.appendChild(content);
        chatContainer.appendChild(messageEl);
    }

    function appendModelGroup(group) {
        const messageEl = document.createElement('div');
        messageEl.className = 'message model-message';
        
        const avatar = document.createElement('div');
        avatar.className = 'avatar model-avatar';
        avatar.textContent = 'G';
        
        const content = document.createElement('div');
        content.className = 'content';

        if (group.thoughts.length > 0) {
            const thoughtSection = document.createElement('div');
            thoughtSection.className = 'thought-section';

            const showBtn = document.createElement('button');
            showBtn.className = 'show-thoughts-btn';
            showBtn.textContent = 'SHOW THOUGHTS';
            
            const thoughtContainer = document.createElement('div');
            thoughtContainer.className = 'thought-container';
            thoughtContainer.innerHTML = group.thoughts
                .map(t => marked.parse(t.text, { breaks: true }))
                .join('');
            
            showBtn.addEventListener('click', () => {
                const isHidden = thoughtContainer.style.display !== 'block';
                thoughtContainer.style.display = isHidden ? 'block' : 'none';
                showBtn.textContent = isHidden ? 'HIDE THOUGHTS' : 'SHOW THOUGHTS';
            });

            thoughtSection.appendChild(showBtn);
            thoughtSection.appendChild(thoughtContainer);
            content.appendChild(thoughtSection);
        }

        if (group.response) {
            const responseContainer = document.createElement('div');
            if (group.thoughts.length > 0) {
                 responseContainer.className = 'content-bubble md-content';
            } else {
                 responseContainer.className = 'md-content content-bubble';
            }
            
            responseContainer.innerHTML = marked.parse(group.response.text, { breaks: true });
            addCopyButtons(responseContainer);
            content.appendChild(responseContainer);
        }
        
        messageEl.appendChild(avatar);
        messageEl.appendChild(content);
        chatContainer.appendChild(messageEl);
    }
    
    // --- ИСПРАВЛЕННАЯ ФУНКЦИЯ КОПИРОВАНИЯ ---

    // Резервная функция копирования для небезопасных контекстов (например, file://)
    function fallbackCopyTextToClipboard(text) {
        const textArea = document.createElement("textarea");
        textArea.value = text;
        
        // Скрываем textarea от пользователя
        textArea.style.top = "0";
        textArea.style.left = "0";
        textArea.style.position = "fixed";
      
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
      
        try {
          const successful = document.execCommand('copy');
          return successful ? Promise.resolve() : Promise.reject();
        } catch (err) {
          return Promise.reject(err);
        } finally {
            document.body.removeChild(textArea);
        }
    }

    function addCopyButtons(element) {
        const codeBlocks = element.querySelectorAll('pre');
        codeBlocks.forEach(pre => {
            const wrapper = document.createElement('div');
            wrapper.className = 'code-block-wrapper';
            
            const btn = document.createElement('button');
            btn.className = 'copy-btn';
            btn.textContent = 'Copy';

            btn.addEventListener('click', () => {
                const code = pre.querySelector('code').innerText;
                
                // Проверяем, доступен ли современный API
                if (navigator.clipboard && window.isSecureContext) {
                    navigator.clipboard.writeText(code).then(() => {
                        btn.textContent = 'Copied!';
                        setTimeout(() => { btn.textContent = 'Copy'; }, 2000);
                    });
                } else {
                    // Используем резервный метод
                    fallbackCopyTextToClipboard(code).then(() => {
                        btn.textContent = 'Copied!';
                        setTimeout(() => { btn.textContent = 'Copy'; }, 2000);
                    });
                }
            });

            pre.parentNode.insertBefore(wrapper, pre);
            wrapper.appendChild(pre);
            wrapper.appendChild(btn);
        });
    }
});