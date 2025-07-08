class ManualEntryForm {
    constructor() {
        this.itemCount = 0;
        this.init();
    }
    
    init() {
        this.form = document.getElementById('manualEntryForm');
        this.itemsContainer = document.getElementById('itemsContainer');
        this.addItemBtn = document.getElementById('addItemBtn');
        this.backBtn = document.getElementById('backBtn');
        this.previewBtn = document.getElementById('previewBtn');
        this.submitBtn = document.getElementById('submitManualBtn');
        this.previewContainer = document.getElementById('previewContainer');
        this.previewJson = document.getElementById('previewJson');
        this.statusMessage = document.getElementById('statusMessage');
        this.loadingSpinner = document.getElementById('loadingSpinner');
        this.linesInput = document.getElementById('lines');
        
        this.setupEventListeners();
        this.addItem(); // Add initial item
    }
    
    setupEventListeners() {
        this.addItemBtn.addEventListener('click', () => {
            this.addItem();
        });
        
        this.backBtn.addEventListener('click', () => {
            window.location.href = 'index.html';
        });
        
        this.previewBtn.addEventListener('click', () => {
            this.generatePreview();
        });
        
        this.form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.submitToJDE();
        });
        
        this.linesInput.addEventListener('input', () => {
            this.adjustItemCount();
        });
    }
    
    addItem() {
        this.itemCount++;
        const itemDiv = document.createElement('div');
        itemDiv.className = 'item-card';
        itemDiv.dataset.itemId = this.itemCount;
        
        itemDiv.innerHTML = `
            <button type="button" class="remove-item" onclick="manualEntry.removeItem(${this.itemCount})">×</button>
            <h4>Item ${this.itemCount}</h4>
            <div class="form-row">
                <div class="form-group">
                    <label for="itemNumber${this.itemCount}">Item Number:</label>
                    <input type="text" id="itemNumber${this.itemCount}" name="itemNumber${this.itemCount}" required>
                </div>
                <div class="form-group">
                    <label for="quantity${this.itemCount}">Quantity:</label>
                    <input type="number" id="quantity${this.itemCount}" name="quantity${this.itemCount}" min="1" required>
                </div>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label for="poNumber${this.itemCount}">PO Number:</label>
                    <input type="text" id="poNumber${this.itemCount}" name="poNumber${this.itemCount}" required>
                </div>
            </div>
        `;
        
        this.itemsContainer.appendChild(itemDiv);
    }
    
    removeItem(itemId) {
        const itemDiv = document.querySelector(`[data-item-id="${itemId}"]`);
        if (itemDiv) {
            itemDiv.remove();
            this.renumberItems();
        }
    }
    
    renumberItems() {
        const items = this.itemsContainer.querySelectorAll('.item-card');
        items.forEach((item, index) => {
            const newItemNumber = index + 1;
            item.dataset.itemId = newItemNumber;
            item.querySelector('h4').textContent = `Item ${newItemNumber}`;
            
            // Update input names and ids
            const inputs = item.querySelectorAll('input');
            inputs.forEach(input => {
                const baseName = input.name.replace(/\d+$/, '');
                const baseId = input.id.replace(/\d+$/, '');
                input.name = baseName + newItemNumber;
                input.id = baseId + newItemNumber;
                
                // Update label
                const label = item.querySelector(`label[for="${baseId}${item.dataset.itemId}"]`);
                if (label) {
                    label.setAttribute('for', baseId + newItemNumber);
                }
            });
            
            // Update remove button
            const removeBtn = item.querySelector('.remove-item');
            removeBtn.setAttribute('onclick', `manualEntry.removeItem(${newItemNumber})`);
        });
        
        this.itemCount = items.length;
    }
    
    adjustItemCount() {
        const desiredLines = parseInt(this.linesInput.value) || 1;
        const currentItems = this.itemsContainer.querySelectorAll('.item-card').length;
        
        if (desiredLines > currentItems) {
            // Add more items
            for (let i = currentItems; i < desiredLines; i++) {
                this.addItem();
            }
        } else if (desiredLines < currentItems) {
            // Remove extra items
            const items = this.itemsContainer.querySelectorAll('.item-card');
            for (let i = currentItems - 1; i >= desiredLines; i--) {
                items[i].remove();
            }
            this.renumberItems();
        }
    }
    
    validateForm() {
        const formData = new FormData(this.form);
        const errors = [];
        
        // Validate basic fields
        if (!formData.get('bolNumber')) {
            errors.push('BOL Number is required');
        }
        if (!formData.get('trailerNumber')) {
            errors.push('Trailer Number is required');
        }
        if (!formData.get('lines') || parseInt(formData.get('lines')) < 1) {
            errors.push('Number of lines must be at least 1');
        }
        
        // Validate items
        const items = this.itemsContainer.querySelectorAll('.item-card');
        items.forEach((item, index) => {
            const itemNumber = index + 1;
            const itemNumberInput = item.querySelector(`input[name="itemNumber${itemNumber}"]`);
            const quantityInput = item.querySelector(`input[name="quantity${itemNumber}"]`);
            const poNumberInput = item.querySelector(`input[name="poNumber${itemNumber}"]`);
            
            if (!itemNumberInput.value) {
                errors.push(`Item ${itemNumber}: Item Number is required`);
            }
            if (!quantityInput.value || parseInt(quantityInput.value) < 1) {
                errors.push(`Item ${itemNumber}: Quantity must be at least 1`);
            }
            if (!poNumberInput.value) {
                errors.push(`Item ${itemNumber}: PO Number is required`);
            }
        });
        
        return errors;
    }
    
    collectFormData() {
        const formData = new FormData(this.form);
        const data = {
            BOL_NUMBER: formData.get('bolNumber'),
            TRAILER_NUMBER: formData.get('trailerNumber'),
            LINES: parseInt(formData.get('lines')),
            ITEMS: []
        };
        
        const items = this.itemsContainer.querySelectorAll('.item-card');
        items.forEach((item, index) => {
            const itemNumber = index + 1;
            const itemData = {
                ITEM_NUMBER: formData.get(`itemNumber${itemNumber}`),
                QUANTITY: parseInt(formData.get(`quantity${itemNumber}`)),
                PO_NUMBER: formData.get(`poNumber${itemNumber}`)
            };
            data.ITEMS.push(itemData);
        });
        
        return data;
    }
    
    generateJDEJson(parsedData) {
        const currentDate = new Date().toISOString().split('T')[0].replace(/-/g, '');
        const timestamp = new Date().toISOString().slice(0, 19).replace('T', ':');
        
        // Generate rowset for grid data
        const rowset = parsedData.ITEMS.map(item => ({
            "z_DRQJ_165": currentDate,
            "z_UOM_52": JDE_CONFIG.defaults.unitOfMeasure,
            "z_UORG_53": item.QUANTITY,
            "z_VR01_608": item.PO_NUMBER,
            "z_UNCS_836": JDE_CONFIG.defaults.unitCost,
            "z_UITM_89": item.ITEM_NUMBER
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
                                    "value": parsedData.BOL_NUMBER || 0
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
                        "rid": "d1917f53c7ea9eb3",
                        "currentApp": "P4210_W4210A_DETPCA01",
                        "timeStamp": timestamp,
                        "sysErrors": []
                    }
                ]
            },
            "jde__status": "SUCCESS",
            "jde__startTimestamp": new Date().toISOString(),
            "jde__endTimestamp": new Date(Date.now() + 2000).toISOString(),
            "jde__serverExecutionSeconds": 2.151
        };
        
        return jdeJson;
    }
    
    generatePreview() {
        const errors = this.validateForm();
        if (errors.length > 0) {
            this.showError('Please fix the following errors:\n' + errors.join('\n'));
            return;
        }
        
        try {
            const formData = this.collectFormData();
            const jdeJson = this.generateJDEJson(formData);
            
            this.previewJson.textContent = JSON.stringify(jdeJson, null, 2);
            this.previewContainer.style.display = 'block';
            this.showSuccess('Preview generated successfully!');
        } catch (error) {
            this.showError(`Error generating preview: ${error.message}`);
        }
    }
    
    async submitToJDE() {
        const errors = this.validateForm();
        if (errors.length > 0) {
            this.showError('Please fix the following errors:\n' + errors.join('\n'));
            return;
        }
        
        try {
            this.showLoading();
            this.submitBtn.disabled = true;
            
            // Check network connectivity first
            this.showSuccess('Checking network connectivity...');
            const isConnected = await checkNetworkConnectivity();
            
            if (!isConnected) {
                throw new Error('Cannot reach JDE server. Please ensure you are connected to the company network or VPN.');
            }
            
            const formData = this.collectFormData();
            const jdeJson = this.generateJDEJson(formData);
            
            this.showSuccess('Submitting to JDE Orchestrator Studio...');
            
            // Use the JDE configuration helper
            const result = await callJDEAPI(jdeJson);
            
            this.showSuccess('Successfully submitted to JDE Orchestrator Studio!');
            console.log('JDE Response:', result);
            
            // Auto-redirect after success
            setTimeout(() => {
                window.location.href = 'index.html';
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
}

// Initialize the application when DOM is loaded
let manualEntry;
document.addEventListener('DOMContentLoaded', () => {
    manualEntry = new ManualEntryForm();
});
