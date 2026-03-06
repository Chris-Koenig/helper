/**
 * API Service
 * Handles all API calls to OpenAI and Perplexity
 */

class APIService {
    constructor() {
        this.providers = {
            openai: 'https://api.openai.com/v1/chat/completions',
            perplexity: 'https://api.perplexity.ai/chat/completions'
        };
        this.models = {
            openai: 'gpt-5.2',
            perplexity: 'sonar-pro'
        };
    }

    /**
     * Extract text from image using AI vision
     * @param {string} base64Image - Base64 encoded image
     * @param {string} prompt - Extraction prompt
     * @param {string} provider - 'openai' or 'perplexity'
     * @param {string} apiKey - API key
     */
    async extractText(base64Image, prompt, provider, apiKey) {
        const url = this.providers[provider];
        const model = this.models[provider];

        const requestBody = {
            model,
            messages: [
                {
                    role: 'user',
                    content: [
                        {
                            type: 'text',
                            text: prompt
                        },
                        {
                            type: 'image_url',
                            image_url: {
                                url: `data:image/jpeg;base64,${base64Image}`
                            }
                        }
                    ]
                }
            ]
        };

        if (provider === 'openai') {
            requestBody.max_completion_tokens = 1024;
        }

        const response = await this._makeRequest(url, requestBody, apiKey);
        return response.choices[0].message.content;
    }

    /**
     * Validate if extracted text is a question or status message
     * @param {string} extractedText - Text to validate
     * @param {string} prompt - Validation prompt
     * @param {string} provider - 'openai' or 'perplexity'
     * @param {string} apiKey - API key
     */
    async validateText(extractedText, prompt, provider, apiKey) {
        const url = this.providers[provider];
        const model = this.models[provider];

        const requestBody = {
            model,
            messages: [
                {
                    role: 'user',
                    content: `${prompt}\n\nText:\n${extractedText}`
                }
            ]
        };

        if (provider === 'openai') {
            requestBody.max_completion_tokens = 60;
        }

        const response = await this._makeRequest(url, requestBody, apiKey);
        return response.choices[0].message.content.trim();
    }

    /**
     * Get answer from extracted question text
     * @param {string} extractedText - Question text
     * @param {string} prompt - Answer prompt
     * @param {string} provider - 'openai' or 'perplexity'
     * @param {string} apiKey - API key
     */
    async getAnswer(extractedText, prompt, provider, apiKey) {
        const url = this.providers[provider];
        const model = this.models[provider];

        const requestBody = {
            model,
            messages: [
                {
                    role: 'user',
                    content: `${prompt}\n\nText:\n${extractedText}`
                }
            ]
        };

        if (provider === 'openai') {
            requestBody.max_completion_tokens = 100;
        } else if (provider === 'perplexity') {
            requestBody.temperature = 0;
            requestBody.top_p = 1;
            requestBody.web_search_options = {
                search_context_size: "high"
            };
            requestBody.return_citations = true;
        }

        const response = await this._makeRequest(url, requestBody, apiKey);
        return response.choices[0].message.content;
    }

    /**
     * Make API request
     * @private
     */
    async _makeRequest(url, body, apiKey) {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify(body)
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error?.message || `API error: ${response.status}`);
        }

        return await response.json();
    }
}

export default APIService;
