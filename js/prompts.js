/**
 * Prompts Manager
 * Loads and manages prompt templates from text files
 */

class PromptsManager {
    constructor() {
        this.prompts = {
            extraction: null,
            validation: null,
            answer: null
        };
    }

    /**
     * Load all prompts from text files
     */
    async loadAll() {
        try {
            const [extraction, validation, answer] = await Promise.all([
                fetch('prompts/extraction_prompt.txt').then(r => r.text()),
                fetch('prompts/validation_prompt.txt').then(r => r.text()),
                fetch('prompts/answer_prompt.txt').then(r => r.text())
            ]);

            this.prompts.extraction = extraction.trim();
            this.prompts.validation = validation.trim();
            this.prompts.answer = answer.trim();

            return true;
        } catch (error) {
            console.error('Failed to load prompts:', error);
            throw new Error('Could not load prompt files');
        }
    }

    get extraction() {
        return this.prompts.extraction;
    }

    get validation() {
        return this.prompts.validation;
    }

    get answer() {
        return this.prompts.answer;
    }
}

export default PromptsManager;
