/**
 * Camera Service
 * Handles camera access and image capture
 */

class CameraService {
    constructor(videoElement, canvasElement) {
        this.video = videoElement;
        this.canvas = canvasElement;
        this.ctx = this.canvas.getContext('2d');
        this.stream = null;
    }

    /**
     * Initialize camera stream
     */
    async init() {
        try {
            this.stream = await navigator.mediaDevices.getUserMedia({
                video: { 
                    facingMode: 'environment', 
                    width: { ideal: 1280 }, 
                    height: { ideal: 720 } 
                }
            });
            this.video.srcObject = this.stream;
            return true;
        } catch (error) {
            console.error('Camera access error:', error);
            throw new Error('Camera access denied. Please enable camera permissions.');
        }
    }

    /**
     * Capture current frame as base64 JPEG
     * @returns {string} Base64 encoded image data
     */
    captureFrame() {
        // Set canvas size to match video
        this.canvas.width = this.video.videoWidth;
        this.canvas.height = this.video.videoHeight;

        // Draw current frame
        this.ctx.drawImage(this.video, 0, 0);

        // Convert to base64 JPEG
        const imageData = this.canvas.toDataURL('image/jpeg', 0.8);
        return imageData.split(',')[1]; // Return only base64 part
    }

    /**
     * Stop camera stream
     */
    stop() {
        if (this.stream) {
            this.stream.getTracks().forEach(track => track.stop());
            this.stream = null;
        }
    }
}

export default CameraService;
