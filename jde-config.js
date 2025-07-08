// JDE Orchestrator Studio Configuration
// This file contains the connection settings for your JDE system

const JDE_CONFIG = {
    // JDE Orchestrator Studio endpoint
    url: 'http://rglnpweb1.jgi.local:8220/jderest/orchestrator/EnterSalesOrders',
    
    // Authentication credentials
    credentials: {
        email: 'mrochelle@jamesgroupintl.com',
        password: 'wywxi8-qefdez'
    },
    
    // JDE environment settings
    environment: 'JDV920',
    device: 'rellman01',
    role: '*ALL',
    
    // Request timeout (in milliseconds)
    timeout: 30000,
    
    // Default values for sales orders
    defaults: {
        businessUnit: '       53080',
        orderType: 'SA',
        unitOfMeasure: 'EA',
        unitCost: 500,
        addressNumber1: '15212',
        addressNumber2: '15219'
    }
};

// Helper function to get authorization header
function getAuthHeader() {
    return 'Basic ' + btoa(JDE_CONFIG.credentials.email + ':' + JDE_CONFIG.credentials.password);
}

// Helper function to get JDE headers
function getJDEHeaders() {
    return {
        'Content-Type': 'application/json',
        'Authorization': getAuthHeader(),
        'X-JDE-Environment': JDE_CONFIG.environment,
        'X-JDE-Device': JDE_CONFIG.device,
        'X-JDE-Role': JDE_CONFIG.role
    };
}

// Helper function to check network connectivity
async function checkNetworkConnectivity() {
    try {
        // First check if we can reach the JDE server
        const response = await fetch(JDE_CONFIG.url.replace('/jderest/orchestrator/EnterSalesOrders', ''), {
            method: 'HEAD',
            mode: 'no-cors',
            cache: 'no-cache'
        });
        return true;
    } catch (error) {
        return false;
    }
}

// Helper function to make JDE API calls with error handling
async function callJDEAPI(jsonData) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), JDE_CONFIG.timeout);
    
    try {
        const response = await fetch(JDE_CONFIG.url, {
            method: 'POST',
            headers: getJDEHeaders(),
            body: JSON.stringify(jsonData),
            signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`JDE API Error ${response.status}: ${errorText}`);
        }
        
        const result = await response.json();
        
        if (result.jde__status !== 'SUCCESS') {
            throw new Error(`JDE Processing Error: ${result.jde__status || 'Unknown error'}`);
        }
        
        return result;
        
    } catch (error) {
        clearTimeout(timeoutId);
        
        if (error.name === 'AbortError') {
            throw new Error('Request timed out. Please try again.');
        }
        
        // Handle specific network errors
        if (error.message.includes('Failed to fetch')) {
            if (error.message.includes('ERR_NAME_NOT_RESOLVED')) {
                throw new Error('Cannot connect to JDE server. Please ensure you are connected to the company network (rglnpweb1.jgi.local is not reachable).');
            } else {
                throw new Error('Network error: Cannot reach JDE server. Please check your network connection and VPN if required.');
            }
        }
        
        throw error;
    }
}
