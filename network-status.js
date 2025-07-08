// Network Status Checker
class NetworkStatus {
    constructor() {
        this.isJDEReachable = false;
        this.checkInterval = 30000; // Check every 30 seconds
        this.init();
    }
    
    init() {
        this.createStatusIndicator();
        this.startPeriodicCheck();
        this.checkNow();
    }
    
    createStatusIndicator() {
        const statusDiv = document.createElement('div');
        statusDiv.id = 'networkStatus';
        statusDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #f8f9fa;
            border: 1px solid #dee2e6;
            border-radius: 6px;
            padding: 8px 12px;
            font-size: 12px;
            z-index: 1000;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            display: flex;
            align-items: center;
            gap: 6px;
        `;
        
        statusDiv.innerHTML = `
            <div id="statusIndicator" style="width: 8px; height: 8px; border-radius: 50%; background: #ffc107;"></div>
            <span id="statusText">Checking network...</span>
        `;
        
        document.body.appendChild(statusDiv);
    }
    
    async checkNow() {
        const indicator = document.getElementById('statusIndicator');
        const text = document.getElementById('statusText');
        
        if (!indicator || !text) return;
        
        try {
            // Try to reach the JDE server
            const response = await fetch(JDE_CONFIG.url.replace('/jderest/orchestrator/EnterSalesOrders', ''), {
                method: 'HEAD',
                mode: 'no-cors',
                cache: 'no-cache',
                signal: AbortSignal.timeout(5000)
            });
            
            this.isJDEReachable = true;
            indicator.style.background = '#28a745';
            text.textContent = 'JDE Server: Online';
            
        } catch (error) {
            this.isJDEReachable = false;
            indicator.style.background = '#dc3545';
            text.textContent = 'JDE Server: Offline';
        }
    }
    
    startPeriodicCheck() {
        setInterval(() => {
            this.checkNow();
        }, this.checkInterval);
    }
    
    getStatus() {
        return this.isJDEReachable;
    }
}

// Initialize network status checker when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.networkStatus = new NetworkStatus();
});
