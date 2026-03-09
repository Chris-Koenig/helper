/**
 * UI Manager
 * Handles all UI interactions and updates
 */

class UIManager {
    constructor() {
        this.elements = {
            video: document.getElementById('video'),
            goBtn: document.getElementById('go-btn'),
            apiKeyInput: document.getElementById('api-key-input'),
            resultDiv: document.getElementById('result'),
            providerToggle: document.getElementById('provider-toggle'),
            providerName: document.getElementById('provider-name')
        };
        
        this.usePerplexity = false;
        this._setupEventListeners();
    }

    /**
     * Setup event listeners
     * @private
     */
    _setupEventListeners() {
        // Toggle provider
        this.elements.providerToggle.addEventListener('click', () => {
            this.toggleProvider();
        });

        // Prevent zoom on double-tap
        let lastTouchEnd = 0;
        document.addEventListener('touchend', (e) => {
            const now = Date.now();
            if (now - lastTouchEnd <= 300) {
                e.preventDefault();
            }
            lastTouchEnd = now;
        }, false);
    }

    /**
     * Toggle between OpenAI and Perplexity
     */
    toggleProvider() {
        this.usePerplexity = !this.usePerplexity;
        this.elements.providerToggle.classList.toggle('active');
        const provider = this.usePerplexity ? 'perplexity' : 'openai';
        this.elements.providerName.textContent = provider;
    }

    /**
     * Get current provider
     */
    getProvider() {
        return this.usePerplexity ? 'perplexity' : 'openai';
    }

    /**
     * Get API keys from input
     * @returns {{openai: string, perplexity: string}}
     */
    getAPIKeys() {
        let inputText = this.elements.apiKeyInput.value.trim();
        
        if (!inputText) {
            throw new Error('Please enter API keys as JSON');
        }

        // Clean up input - remove BOM, normalize whitespace
        inputText = inputText.replace(/^\uFEFF/, ''); // Remove BOM
        inputText = inputText.replace(/[\r\n]+/g, ''); // Remove line breaks
        inputText = inputText.trim();

        try {
            return JSON.parse(inputText);
        } catch (err) {
            throw new Error(`Invalid JSON format. Expected: {"openai": "key", "perplexity": "key"}<br><br>Error: ${err.message}`);
        }
    }

    /**
     * Get API key for current provider
     */
    getCurrentAPIKey() {
        const apiKeys = this.getAPIKeys();
        const provider = this.getProvider();
        const apiKey = apiKeys[provider];
        
        if (!apiKey) {
            throw new Error(`Missing ${provider} API key in JSON`);
        }
        
        return apiKey;
    }

    /**
     * Show result in UI
     * @param {string} html - HTML content to display
     * @param {string} type - 'success', 'error', or empty
     */
    showResult(html, type = '') {
        this.elements.resultDiv.innerHTML = html;
        this.elements.resultDiv.className = type;
    }

    /**
     * Show loading state
     */
    showLoading(message = 'Capturing and processing...') {
        this.showResult(`<span class="spinner"></span> ${message}`, 'success');
    }

    /**
     * Show error message
     */
    showError(message) {
        this.showResult(`❌ ${message}`, 'error');
    }

    /**
     * Show success result with answer and extracted text
     */
    showAnswerResult(answer, extractedText) {
        const html = `
            <div style="margin-bottom: 20px;">
                <strong>✅ Answer:</strong><br>
                <span style="font-size: 72px; color: #10a37f; font-weight: 700;">${answer}</span>
            </div>
            <div style="border-top: 1px solid #333; padding-top: 15px;">
                <strong>📝 Extracted Text:</strong><br>
                ${extractedText}
            </div>
        `;
        this.showResult(html, 'success');
    }

    /**
     * Format answer text based on question type
     * @private
     */
    _formatAnswerByType(answerText, questionType) {
        // If no answer text, return as-is
        if (!answerText) return answerText;

        switch (questionType) {
            case 'single_choice':
                return `Option(s): ${answerText}`;
            
            case 'multi_select':
                return `Options: ${answerText}`;
            
            case 'yes_no_matrix':
                const matrixAnswers = answerText.split(';').map(a => a.trim());
                return `<div style="margin-top: 5px; font-size: 14px;">
                    ${matrixAnswers.map((answer, i) => 
                        `<div>Statement ${i + 1}: <strong>${answer}</strong></div>`
                    ).join('')}
                </div>`;
            
            case 'hotspot':
                const fieldAnswers = answerText.split(';').map(a => a.trim());
                return `<div style="margin-top: 5px; font-size: 14px;">
                    ${fieldAnswers.map((answer, i) => 
                        `<div>Field ${i + 1}: <strong>${answer}</strong></div>`
                    ).join('')}
                </div>`;
            
            case 'drag_drop':
                const mappings = answerText.split(';').map(a => a.trim());
                return `<div style="margin-top: 5px; font-size: 14px;">
                    ${mappings.map(mapping => 
                        `<div>${mapping}</div>`
                    ).join('')}
                </div>`;
            
            case 'drag_drop_order':
                return `<div style="margin-top: 5px; font-size: 14px;">
                    <strong>${answerText}</strong>
                </div>`;
            
            default:
                return answerText;
        }
    }

    /**
     * Show complete result with Q&A database check, AI answer, and extracted text
     */
    showCompleteResult(qaResult, answer, extractedText, questionType = null) {
        let qaSection = '';
        
        if (qaResult) {
            const isFound = qaResult.toUpperCase().startsWith('FOUND');
            const qaAnswer = isFound ? qaResult.replace(/^FOUND:\s*/i, '').trim() : 'Not found';
            const qaIcon = isFound ? '✅' : '❌';
            const qaColor = isFound ? '#10a37f' : '#ff6b6b';
            
            // Format answer based on question type
            const formattedAnswer = isFound ? this._formatAnswerByType(qaAnswer, questionType) : '';
            
            qaSection = `
                <div style="margin-bottom: 25px; padding: 15px; background: rgba(26, 26, 26, 0.5); border-radius: 8px; border-left: 3px solid ${qaColor};">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                        <strong>${qaIcon} JSON Database:</strong>
                        <span style="font-size: 11px; padding: 4px 8px; background: rgba(100, 100, 100, 0.3); border-radius: 4px; color: #aaa;">📚 Source: JSON Knowledge Base</span>
                    </div>
                    <span style="color: ${qaColor};">Question ${isFound ? 'found' : 'not found'}</span><br>
                    ${isFound ? `<div style="margin-top: 10px; color: ${qaColor}; font-weight: 600;">${formattedAnswer}</div>` : ''}
                </div>
            `;
        }

        const html = `
            ${qaSection}
            <div style="margin-bottom: 20px; padding: 15px; background: rgba(26, 26, 26, 0.5); border-radius: 8px; border-left: 3px solid #10a37f;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                    <strong>🤖 AI Answer:</strong>
                    <span style="font-size: 11px; padding: 4px 8px; background: rgba(16, 163, 127, 0.2); border-radius: 4px; color: #10a37f;">🧠 Source: AI Prompting</span>
                </div>
                <span style="color: #10a37f; font-weight: 600;">${answer}</span>
            </div>
            <div style="border-top: 1px solid #333; padding-top: 15px;">
                <strong>📝 Extracted Text:</strong><br>
                ${extractedText}
            </div>
        `;
        this.showResult(html, 'success');
    }

    /**
     * Show status message (when validation returns status instead of question)
     */
    showStatus(statusMessage) {
        const html = `<div><strong>Status:</strong> ${statusMessage}</div>`;
        this.showResult(html, 'success');
    }

    /**
     * Enable/disable go button
     */
    setGoButtonEnabled(enabled) {
        this.elements.goBtn.disabled = !enabled;
    }

    /**
     * Add click handler to go button
     */
    onGoClick(handler) {
        this.elements.goBtn.addEventListener('click', handler);
    }

    /**
     * Add click handler to video element
     */
    onVideoClick(handler) {
        this.elements.video.addEventListener('click', handler);
    }
}

export default UIManager;
