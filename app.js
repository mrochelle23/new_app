class BarcodeParser {
    constructor() {
        this.identifiers = {
            'B': 'BOL_NUMBER',
            'T': 'TRAILER_NUMBER',
            'L': 'LINES',
            'PR': 'ITEM_NUMBER',
            'Q': 'QUANTITY',
            'PN': 'PO_NUMBER'
        };
        
        this.init();
    }
    
    init() {
        this.barcodeInput = document.getElementById('barcodeInput');
        this.statusMessage = document.getElementById('statusMessage');
        this.loadingSpinner = document.getElementById('loadingSpinner');
        this.parsedData = document.getElementById('parsedData');
        this.parsedDataContent = document.getElementById('parsedDataContent');
        this.jsonOutput = document.getElementById('jsonOutput');
        this.jsonContent = document.getElementById('jsonContent');
        this.clearBtn = document.getElementById('clearBtn');
        this.manualEntryBtn = document.getElementById('manualEntryBtn');
        this.submitBtn = document.getElementById('submitBtn');
        
        this.setupEventListeners();
    }
    
    setupEventListeners() {
        this.barcodeInput.addEventListener('input', (e) => {
            const value = e.target.value.trim();
            if (value) {
                this.processBarcodeData(value);
            } else {
                this.clearResults();
            }
        });
        
        this.clearBtn.addEventListener('click', () => {
            this.clearAll();
        });
        
        this.manualEntryBtn.addEventListener('click', () => {
            window.location.href = 'manual-entry.html';
        });
        
        this.submitBtn.addEventListener('click', () => {
            this.requestCredentialsAndSubmit();
        });
    }
    
    processBarcodeData(barcodeData) {
        try {
            this.showLoading();
            
            // Parse the barcode data
            const parsedData = this.parseBarcode(barcodeData);
            
            // Generate JSON for JDE
            const jdeJson = this.generateJDEJson(parsedData);
            
            // Display results
            this.displayParsedData(parsedData);
            this.displayJDEJson(jdeJson);
            
            this.showSuccess('Barcode processed successfully!');
            this.submitBtn.style.display = 'inline-block';
            
            // Auto-submit after 2 seconds (but will prompt for credentials first)
            setTimeout(() => {
                this.requestCredentialsAndSubmit();
            }, 2000);
            
        } catch (error) {
            this.showError(`Error processing barcode: ${error.message}`);
        } finally {
            this.hideLoading();
        }
    }
    
    parseBarcode(barcodeData) {
        const parsed = {};
        const items = [];
        
        // Split by angle brackets and process each segment
        const segments = barcodeData.match(/<([^>]+)>/g);
        
        if (!segments) {
            throw new Error('Invalid barcode format. Expected format: <identifier>value</identifier>');
        }
        
        let currentItem = {};
        
        segments.forEach(segment => {
            const content = segment.slice(1, -1); // Remove < and >
            
            // Check for identifiers
            for (const [id, name] of Object.entries(this.identifiers)) {
                if (content.startsWith(id)) {
                    const value = content.substring(id.length);
                    
                    if (id === 'B') {
                        parsed.BOL_NUMBER = value;
                    } else if (id === 'T') {
                        parsed.TRAILER_NUMBER = value;
                    } else if (id === 'L') {
                        parsed.LINES = parseInt(value);
                    } else if (id === 'PR') {
                        // Start new item
                        if (Object.keys(currentItem).length > 0) {
                            items.push(currentItem);
                        }
                        currentItem = { ITEM_NUMBER: value };
                    } else if (id === 'Q') {
                        currentItem.QUANTITY = parseInt(value);
                    } else if (id === 'PN') {
                        currentItem.PO_NUMBER = value;
                    }
                    break;
                }
            }
        });
        
        // Add the last item
        if (Object.keys(currentItem).length > 0) {
            items.push(currentItem);
        }
        
        parsed.ITEMS = items;
        return parsed;
    }
    
    generateJDEJson(parsedData) {
        const currentDate = new Date().toISOString().split('T')[0].replace(/-/g, '');
        const timestamp = new Date().toISOString().slice(0, 19).replace('T', ':');
        
        // Validate and format data before creating JSON
        const validatedData = this.validateJDEData(parsedData);
        
        // Generate rowset for grid data with proper JDE field format
        const rowset = validatedData.ITEMS.map((item, index) => ({
            "z_DRQJ_165": {
                "title": "Requested Date",
                "value": currentDate
            },
            "z_UOM_52": {
                "title": "UoM",
                "value": JDE_CONFIG.defaults.unitOfMeasure
            },
            "z_UORG_53": {
                "title": "Quantity Ordered",
                "value": item.QUANTITY
            },
            "z_VR01_608": {
                "title": "Customer PO",
                "value": item.PO_NUMBER
            },
            "z_UNCS_836": {
                "title": "Purchase Order Unit Cost",
                "value": JDE_CONFIG.defaults.unitCost
            },
            "z_UITM_89": {
                "title": "Item Number",
                "value": item.ITEM_NUMBER
            },
            "rowIndex": index
        }));
        
        const jdeJson = {
            "ServiceRequest1": {
                "forms": [
                    {
                        "fs_P4210_W4210A": {
                            "title": "Sales Order Detail Revisions",
                            "data": {
                                "z_MCU_11": {
                                    "title": "Business Unit",
                                    "value": JDE_CONFIG.defaults.businessUnit
                                },
                                "z_DCTO_21": {
                                    "title": "Order Type",
                                    "value": JDE_CONFIG.defaults.orderType
                                },
                                "z_TRDJ_748": {
                                    "title": "Date - Order/Transaction",
                                    "value": currentDate
                                },
                                "z_DOCO_757": {
                                    "title": "Document (Order No, Invoice, etc.)",
                                    "value": validatedData.BOL_NUMBER || ""
                                },
                                "z_ALKY_800": {
                                    "title": "Long Address Number",
                                    "value": JDE_CONFIG.defaults.addressNumber1
                                },
                                "z_ALKY_802": {
                                    "title": "Long Address Number",
                                    "value": JDE_CONFIG.defaults.addressNumber2
                                },
                                "gridData": {
                                    "id": 1,
                                    "fullGridId": "1",
                                    "columns": {
                                        "z_DRQJ_165": "Requested Date",
                                        "z_UOM_52": "UoM",
                                        "z_UORG_53": "Quantity Ordered",
                                        "z_VR01_608": "Customer PO",
                                        "z_UNCS_836": "Purchase Order Unit Cost",
                                        "z_UITM_89": "Item Number"
                                    },
                                    "rowset": rowset,
                                    "summary": {
                                        "records": rowset.length,
                                        "moreRecords": false
                                    }
                                }
                            },
                            "errors": [],
                            "warnings": []
                        },
                        "stackId": 21,
                        "stateId": 1,
                        "rid": this.generateRID(),
                        "currentApp": "P4210_W4210A_DETPCA01",
                        "timeStamp": timestamp,
                        "sysErrors": []
                    }
                ]
            }
        };
        
        return jdeJson;
    }
    
    validateJDEData(parsedData) {
        // Create a copy of the data to avoid modifying the original
        const validatedData = {
            BOL_NUMBER: parsedData.BOL_NUMBER || '',
            TRAILER_NUMBER: parsedData.TRAILER_NUMBER || '',
            LINES: parsedData.LINES || 0,
            ITEMS: []
        };
        
        // Validate and format items
        if (parsedData.ITEMS && parsedData.ITEMS.length > 0) {
            parsedData.ITEMS.forEach((item, index) => {
                const validatedItem = {
                    ITEM_NUMBER: (item.ITEM_NUMBER || '').toString().trim(),
                    QUANTITY: parseInt(item.QUANTITY) || 0,
                    PO_NUMBER: (item.PO_NUMBER || '').toString().trim()
                };
                
                // Ensure required fields are not empty
                if (validatedItem.ITEM_NUMBER && validatedItem.QUANTITY > 0) {
                    validatedData.ITEMS.push(validatedItem);
                }
            });
        }
        
        return validatedData;
    }
    
    generateRID() {
        // Generate a random request ID similar to JDE format
        return Math.random().toString(16).substr(2, 16);
    }
    
    displayParsedData(parsedData) {
        let html = '';
        
        // Display basic info
        if (parsedData.BOL_NUMBER) {
            html += `<div class="parsed-item">
                <span class="label">BOL Number:</span>
                <span class="value">${parsedData.BOL_NUMBER}</span>
            </div>`;
        }
        
        if (parsedData.TRAILER_NUMBER) {
            html += `<div class="parsed-item">
                <span class="label">Trailer Number:</span>
                <span class="value">${parsedData.TRAILER_NUMBER}</span>
            </div>`;
        }
        
        if (parsedData.LINES) {
            html += `<div class="parsed-item">
                <span class="label">Lines:</span>
                <span class="value">${parsedData.LINES}</span>
            </div>`;
        }
        
        // Display items
        if (parsedData.ITEMS && parsedData.ITEMS.length > 0) {
            html += '<div class="grid-data"><h4>Items:</h4>';
            parsedData.ITEMS.forEach((item, index) => {
                html += `<div class="grid-item">
                    <strong>Item ${index + 1}:</strong><br>
                    Item Number: ${item.ITEM_NUMBER}<br>
                    Quantity: ${item.QUANTITY}<br>
                    PO Number: ${item.PO_NUMBER}
                </div>`;
            });
            html += '</div>';
        }
        
        this.parsedDataContent.innerHTML = html;
        this.parsedData.style.display = 'block';
    }
    
    displayJDEJson(jdeJson) {
        this.jsonContent.textContent = JSON.stringify(jdeJson, null, 2);
        this.jsonOutput.style.display = 'block';
    }
    
    requestCredentialsAndSubmit() {
        // Show credentials modal before submitting
        window.credentialsModal.show({
            title: '🔐 JDE Authentication Required',
            message: 'Please enter your JDE credentials to submit the barcode data',
            onSuccess: (credentials) => {
                this.submitToJDE(credentials);
            },
            onCancel: () => {
                this.showError('Submission cancelled. Please provide credentials to submit to JDE.');
            }
        });
    }

    async submitToJDE(credentials) {
        try {
            this.showLoading();
            this.submitBtn.disabled = true;
            
            // Check network connectivity first
            this.showSuccess('Checking network connectivity...');
            const isConnected = await checkNetworkConnectivity(credentials);
            
            if (!isConnected) {
                throw new Error('Cannot reach JDE server. Please ensure you are connected to the company network or VPN.');
            }
            
            const jsonData = JSON.parse(this.jsonContent.textContent);
            
            this.showSuccess('Submitting to JDE Orchestrator Studio...');
            
            // Use the JDE configuration helper with user credentials
            const result = await callJDEAPI(jsonData, credentials);
            
            this.showSuccess('Successfully submitted to JDE Orchestrator Studio!');
            console.log('JDE Response:', result);
            
            // Auto-clear after success
            setTimeout(() => {
                this.clearAll();
            }, 3000);
            
        } catch (error) {
            console.error('JDE Submission Error:', error);
            
            // Provide more specific error messages
            let errorMessage = error.message;
            
            if (error.message.includes('ERR_NAME_NOT_RESOLVED')) {
                errorMessage = `Network Error: Cannot resolve hostname 'rglnpweb1.jgi.local'
                
Possible solutions:
• Connect to the company network/VPN
• Check if you're on the correct network
• Contact IT support if the issue persists`;
            }
            
            this.showError(`Error submitting to JDE: ${errorMessage}`);
        } finally {
            this.hideLoading();
            this.submitBtn.disabled = false;
        }
    }
    
    showLoading() {
        this.loadingSpinner.style.display = 'flex';
        this.statusMessage.style.display = 'none';
    }
    
    hideLoading() {
        this.loadingSpinner.style.display = 'none';
    }
    
    showSuccess(message) {
        this.statusMessage.textContent = message;
        this.statusMessage.className = 'status-message success';
        this.statusMessage.style.display = 'block';
    }
    
    showError(message) {
        this.statusMessage.textContent = message;
        this.statusMessage.className = 'status-message error';
        this.statusMessage.style.display = 'block';
    }
    
    clearResults() {
        this.parsedData.style.display = 'none';
        this.jsonOutput.style.display = 'none';
        this.submitBtn.style.display = 'none';
        this.statusMessage.style.display = 'none';
    }
    
    clearAll() {
        this.barcodeInput.value = '';
        this.clearResults();
        this.barcodeInput.focus();
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new BarcodeParser();
});
