/**
 * Q&A Manager
 * Loads and manages question/answer JSON files
 */

class QAManager {
    constructor() {
        this.questions = [];
        this.loaded = false;
    }

    /**
     * Load all Q&A JSON files from the q_and_a folder
     */
    async loadAll() {
        try {
            const files = await this._discoverQuestionFiles();

            const promises = files.map(file =>
                fetch(`q_and_a/${file}`).then(response => {
                    if (!response.ok) {
                        throw new Error(`Failed to load ${file}`);
                    }
                    return response.json();
                })
            );

            const results = await Promise.all(promises);
            
            // Flatten all questions from all files
            this.questions = results.flatMap(data => data.questions || []);
            this.loaded = true;
            
            console.log(`Loaded ${this.questions.length} questions from ${files.length} Q&A JSON file(s)`);
        } catch (error) {
            console.error('Error loading Q&A files:', error);
            // Don't throw - allow app to continue without Q&A database
        }
    }

    /**
     * Discover sequential q*.json files (q1.json, q2.json, ...)
     * Stops at the first missing file to avoid endless requests.
     * @private
     */
    async _discoverQuestionFiles() {
        const files = [];
        const maxProbe = 200;

        for (let i = 1; i <= maxProbe; i += 1) {
            const file = `q${i}.json`;
            try {
                const response = await fetch(`q_and_a/${file}`, { method: 'HEAD' });
                if (!response.ok) {
                    break;
                }
                files.push(file);
            } catch {
                break;
            }
        }

        if (files.length === 0) {
            throw new Error('No Q&A JSON files found in q_and_a');
        }

        return files;
    }

    /**
     * Get all questions as a JSON string for AI comparison
     */
    getAllQuestionsJSON() {
        if (!this.loaded || this.questions.length === 0) {
            return null;
        }

        // Return a simplified version of questions for comparison
        return JSON.stringify(this.questions.map(q => ({
            question_text: q.question_text,
            options: q.options,
            answer: q.answer,
            items: q.items
        })), null, 2);
    }

    /**
     * Get total number of loaded questions
     */
    getQuestionCount() {
        return this.questions.length;
    }
}

export default QAManager;
