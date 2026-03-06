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
