/**
 * Main Application
 * Orchestrates camera, API, and UI services
 */

import CameraService from './camera.js';
import APIService from './api.js';
import UIManager from './ui.js';
import PromptsManager from './prompts.js';
import QAManager from './qa.js';

class App {
    constructor() {
        this.camera = null;
        this.api = new APIService();
        this.ui = new UIManager();
        this.prompts = new PromptsManager();
        this.qa = new QAManager();
    }

    /**
     * Initialize the application
     */
    async init() {
        try {
            // Load prompts and Q&A database
            await Promise.all([
                this.prompts.loadAll(),
                this.qa.loadAll()
            ]);

            // Initialize camera
            const videoElement = document.getElementById('video');
            const canvasElement = document.getElementById('canvas');
            this.camera = new CameraService(videoElement, canvasElement);
            
            await this.camera.init();

            // Setup UI event handlers
            this.ui.onGoClick(() => this.handleCapture());
            this.ui.onVideoClick(() => this.handleCapture());

        } catch (error) {
            this.ui.showError(error.message);
            this.ui.setGoButtonEnabled(false);
        }
    }

    /**
     * Handle image capture and processing
     */
    async handleCapture() {
        try {
            // Get API key for current provider
            const apiKey = this.ui.getCurrentAPIKey();
            const provider = this.ui.getProvider();

            // Clear previous results and show loading
            this.ui.showLoading();
            this.ui.setGoButtonEnabled(false);

            // Capture image
            const base64Image = this.camera.captureFrame();

            // Step 1: Extract text from image
            const extractedText = await this.api.extractText(
                base64Image,
                this.prompts.extraction,
                provider,
                apiKey
            );

            // Step 2: Check Q&A database for similar questions
            let qaResult = null;
            const questionsJSON = this.qa.getAllQuestionsJSON();
            if (questionsJSON) {
                this.ui.showLoading('Checking Q&A database...');
                qaResult = await this.api.checkQuestionSimilarity(
                    extractedText,
                    questionsJSON,
                    provider,
                    apiKey
                );
            }

            // Step 3: Validate if it's a question or status message
            this.ui.showLoading('Validating text...');
            const validationResult = await this.api.validateText(
                extractedText,
                this.prompts.validation,
                provider,
                apiKey
            );

            // If it's a status message, show it and stop
            if (validationResult.toUpperCase().startsWith('STATUS')) {
                const statusMessage = validationResult.replace(/^STATUS:\s*/i, '').trim() 
                    || 'Status message received.';
                this.ui.showStatus(statusMessage);
                return;
            }

            // Step 4: Get the answer from AI
            this.ui.showLoading('Getting AI answer...');
            const answer = await this.api.getAnswer(
                extractedText,
                this.prompts.answer,
                provider,
                apiKey
            );

            // Display all results
            this.ui.showCompleteResult(qaResult, answer, extractedText);

        } catch (error) {
            this.ui.showError(error.message);
        } finally {
            this.ui.setGoButtonEnabled(true);
        }
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    const app = new App();
    app.init();
});
