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
        const maxProbe = 20;

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
     * Extract answer text based on question type
     * @private
     */
    _extractAnswerByType(question) {
        if (!question.question_type) return null;

        switch (question.question_type) {
            case 'single_choice':
            case 'multi_select':
                // Extract option IDs from answer.correct_option_ids
                return question.answer?.correct_option_ids?.join(', ') || null;

            case 'yes_no_matrix':
                // Extract answers from statements in order
                if (question.statements && Array.isArray(question.statements)) {
                    return question.statements.map(s => s.answer).join('; ');
                }
                return null;

            case 'hotspot':
                // Extract answers from fields in order
                if (question.fields && Array.isArray(question.fields)) {
                    return question.fields.map(f => f.answer).join('; ');
                }
                return null;

            case 'drag_drop':
                // Extract answer object as entity→value pairs
                if (question.answer && typeof question.answer === 'object') {
                    return Object.entries(question.answer)
                        .map(([key, value]) => `${key}→${value}`)
                        .join('; ');
                }
                return null;

            case 'drag_drop_order':
                // Extract answer_sequence as ordered list
                if (question.answer_sequence && Array.isArray(question.answer_sequence)) {
                    return question.answer_sequence.join(' → ');
                }
                return null;

            default:
                return null;
        }
    }

    /**
     * Get all questions as a JSON string for AI comparison
     * Includes question_type and normalized answer_text for better AI matching
     */
    getAllQuestionsJSON() {
        if (!this.loaded || this.questions.length === 0) {
            return null;
        }

        // Return questions with type information and normalized answers
        return JSON.stringify(this.questions.map(q => ({
            question_id: q.question_id,
            question_type: q.question_type,
            question_text: q.question_text,
            options: q.options,
            answer: q.answer,
            answer_text: this._extractAnswerByType(q),
            statements: q.statements,
            fields: q.fields,
            answer_sequence: q.answer_sequence,
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
