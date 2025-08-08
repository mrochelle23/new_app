// JDE Credentials Modal Component
class CredentialsModal {
    constructor() {
        this.isVisible = false;
        this.credentials = null;
        this.callbacks = {
            onSuccess: null,
            onCancel: null
        };
        this.createModal();
    }

    createModal() {
        // Create modal HTML structure
        const modalHTML = `
            <div id="credentialsModal" class="credentials-modal" style="display: none;">
                <div class="credentials-modal-overlay"></div>
                <div class="credentials-modal-content">
                    <div class="credentials-modal-header">
                        <h3>🔐 JDE Authentication Required</h3>
                        <p>Please enter your JDE credentials to submit data</p>
                    </div>
                    <form id="credentialsForm" class="credentials-form">
                        <div class="form-group">
                            <label for="jdeUsername">JDE Username:</label>
                            <input type="text" id="jdeUsername" name="username" required autocomplete="username">
                        </div>
                        <div class="form-group">
                            <label for="jdePassword">JDE Password:</label>
                            <input type="password" id="jdePassword" name="password" required autocomplete="current-password">
                        </div>
                        <div class="credentials-modal-buttons">
                            <button type="button" id="cancelCredentials" class="btn btn-secondary">Cancel</button>
                            <button type="submit" id="submitCredentials" class="btn btn-primary">Authenticate & Submit</button>
                        </div>
                    </form>
                    <div id="credentialsError" class="credentials-error" style="display: none;"></div>
                </div>
            </div>
        `;

        // Add modal to body
        document.body.insertAdjacentHTML('beforeend', modalHTML);

        // Add CSS styles
        this.addStyles();

        // Setup event listeners
        this.setupEventListeners();
    }

    addStyles() {
        const styles = `
            <style id="credentialsModalStyles">
                .credentials-modal {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    z-index: 10000;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .credentials-modal-overlay {
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: rgba(0, 0, 0, 0.5);
                    backdrop-filter: blur(2px);
                }

                .credentials-modal-content {
                    position: relative;
                    background: white;
                    border-radius: 8px;
                    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3);
                    padding: 30px;
                    width: 90%;
                    max-width: 450px;
                    max-height: 90vh;
                    overflow-y: auto;
                }

                .credentials-modal-header {
                    text-align: center;
                    margin-bottom: 25px;
                }

                .credentials-modal-header h3 {
                    margin: 0 0 10px 0;
                    color: #333;
                    font-size: 1.4em;
                }

                .credentials-modal-header p {
                    margin: 0;
                    color: #666;
                    font-size: 0.9em;
                }

                .credentials-form .form-group {
                    margin-bottom: 20px;
                }

                .credentials-form label {
                    display: block;
                    margin-bottom: 5px;
                    font-weight: 500;
                    color: #333;
                }

                .credentials-form input[type="text"],
                .credentials-form input[type="password"] {
                    width: 100%;
                    padding: 10px;
                    border: 1px solid #ddd;
                    border-radius: 4px;
                    font-size: 14px;
                    box-sizing: border-box;
                }

                .credentials-form input[type="text"]:focus,
                .credentials-form input[type="password"]:focus {
                    outline: none;
                    border-color: #007bff;
                    box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25);
                }

                .credentials-modal-buttons {
                    display: flex;
                    gap: 10px;
                    justify-content: flex-end;
                    margin-top: 25px;
                }

                .credentials-modal-buttons .btn {
                    padding: 10px 20px;
                    border: none;
                    border-radius: 4px;
                    cursor: pointer;
                    font-size: 14px;
                    transition: background-color 0.2s;
                }

                .btn-secondary {
                    background: #6c757d;
                    color: white;
                }

                .btn-secondary:hover {
                    background: #5a6268;
                }

                .btn-primary {
                    background: #007bff;
                    color: white;
                }

                .btn-primary:hover {
                    background: #0056b3;
                }

                .btn:disabled {
                    opacity: 0.6;
                    cursor: not-allowed;
                }

                .credentials-error {
                    background: #f8d7da;
                    color: #721c24;
                    padding: 10px;
                    border-radius: 4px;
                    margin-top: 15px;
                    border: 1px solid #f5c6cb;
                }

                @media (max-width: 600px) {
                    .credentials-modal-content {
                        padding: 20px;
                        margin: 20px;
                    }
                    
                    .credentials-modal-buttons {
                        flex-direction: column;
                    }
                    
                    .credentials-modal-buttons .btn {
                        width: 100%;
                    }
                }
            </style>
        `;

        document.head.insertAdjacentHTML('beforeend', styles);
    }

    setupEventListeners() {
        const modal = document.getElementById('credentialsModal');
        const form = document.getElementById('credentialsForm');
        const cancelBtn = document.getElementById('cancelCredentials');
        const overlay = modal.querySelector('.credentials-modal-overlay');

        // Handle form submission
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleSubmit();
        });

        // Handle cancel button
        cancelBtn.addEventListener('click', () => {
            this.cancel();
        });

        // Handle overlay click (close modal)
        overlay.addEventListener('click', () => {
            this.cancel();
        });

        // Handle ESC key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isVisible) {
                this.cancel();
            }
        });
    }

    show(options = {}) {
        const {
            onSuccess = null,
            onCancel = null,
            title = '🔐 JDE Authentication Required',
            message = 'Please enter your JDE credentials to submit data'
        } = options;

        this.callbacks.onSuccess = onSuccess;
        this.callbacks.onCancel = onCancel;

        // Update title and message if provided
        const modal = document.getElementById('credentialsModal');
        const header = modal.querySelector('.credentials-modal-header');
        header.querySelector('h3').textContent = title;
        header.querySelector('p').textContent = message;

        // Clear previous values and errors
        this.clearForm();
        this.clearError();

        // Show modal
        modal.style.display = 'flex';
        this.isVisible = true;

        // Focus on username field
        document.getElementById('jdeUsername').focus();
    }

    hide() {
        const modal = document.getElementById('credentialsModal');
        modal.style.display = 'none';
        this.isVisible = false;
    }

    async handleSubmit() {
        const form = document.getElementById('credentialsForm');
        const submitBtn = document.getElementById('submitCredentials');
        const username = document.getElementById('jdeUsername').value.trim();
        const password = document.getElementById('jdePassword').value;

        if (!username || !password) {
            this.showError('Please enter both username and password.');
            return;
        }

        // Disable form during validation
        submitBtn.disabled = true;
        submitBtn.textContent = 'Validating...';

        try {
            // Validate credentials by making a test call
            const isValid = await this.validateCredentials(username, password);
            
            if (isValid) {
                this.credentials = { username, password };
                
                this.hide();
                
                // Call success callback
                if (this.callbacks.onSuccess) {
                    this.callbacks.onSuccess(this.credentials);
                }
            } else {
                this.showError('Invalid credentials. Please check your username and password.');
            }
        } catch (error) {
            this.showError(`Authentication failed: ${error.message}`);
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Authenticate & Submit';
        }
    }

    async validateCredentials(username, password) {
        try {
            // Test credentials against JDE base URL
            const response = await fetch(JDE_CONFIG.baseUrl, {
                method: 'GET',
                headers: {
                    'Authorization': 'Basic ' + btoa(username + ':' + password)
                },
                signal: AbortSignal.timeout(10000)
            });

            // If we get 200-299 or 404 (endpoint doesn't exist but auth worked), credentials are valid
            // If we get 401/403, credentials are invalid
            return response.status !== 401 && response.status !== 403;
        } catch (error) {
            // If it's a network error, we can't validate, so assume valid
            if (error.name === 'TypeError' || error.name === 'AbortError') {
                return true;
            }
            throw error;
        }
    }

    cancel() {
        this.hide();
        if (this.callbacks.onCancel) {
            this.callbacks.onCancel();
        }
    }

    showError(message) {
        const errorDiv = document.getElementById('credentialsError');
        errorDiv.textContent = message;
        errorDiv.style.display = 'block';
    }

    clearError() {
        const errorDiv = document.getElementById('credentialsError');
        errorDiv.style.display = 'none';
    }

    clearForm() {
        document.getElementById('jdeUsername').value = '';
        document.getElementById('jdePassword').value = '';
    }

    getCredentials() {
        return this.credentials;
    }
}

// Create global instance
window.credentialsModal = new CredentialsModal();
