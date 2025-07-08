// JDE Orchestrator Studio Configuration
// This file contains the connection settings for your JDE system

const JDE_CONFIG = {
    // JDE Orchestrator Studio endpoint
    url: 'http://rglnpweb1.jgi.local:8220/jderest/orchestrator/EnterSalesOrders',
    
    // JDE base URL for health checks
    baseUrl: 'http://rglnpweb1.jgi.local:8220/jderest',
    
    // Authentication credentials
    credentials: {
        username: 'mrochelle',
        password: 'hozde6-kyks'
    },
    
    // JDE environment settings
    environment: 'JDV920',
    device: 'rellman01',
    role: '*ALL',
    
    // Request timeout (in milliseconds)
    timeout: 30000,
    
    // Default values for sales orders
    defaults: {
        businessUnit: '53080',
        orderType: 'SA',
        unitOfMeasure: 'EA',
        unitCost: 500,
        addressNumber1: '15212',
        addressNumber2: '15219'
    },
    
    // Field validation rules
    validation: {
        businessUnit: {
            required: true,
            length: 5,
            type: 'string'
        },
        orderType: {
            required: true,
            length: 2,
            type: 'string'
        },
        addressNumber: {
            required: true,
            length: 5,
            type: 'string'
        },
        date: {
            required: true,
            format: 'YYYYMMDD',
            type: 'string'
        }
    }
};

// Helper function to get authorization header
function getAuthHeader() {
    return 'Basic ' + btoa(JDE_CONFIG.credentials.username + ':' + JDE_CONFIG.credentials.password);
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
        // Try to reach the JDE base URL instead of specific endpoint
        const response = await fetch(JDE_CONFIG.baseUrl, {
            method: 'GET',
            headers: {
                'Authorization': getAuthHeader()
            },
            signal: AbortSignal.timeout(10000)
        });
        
        // 200-299 range means server is reachable
        // 401/403 means server is reachable but auth issues
        // 404 might be normal for base URL
        return response.status < 500;
        
    } catch (error) {
        // If it's a network error (can't reach server), return false
        if (error.name === 'TypeError' && error.message.includes('fetch')) {
            return false;
        }
        // For other errors (like timeout), assume server is reachable
        return true;
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
            
            // Try to parse JSON error response
            let errorMessage = errorText;
            try {
                const errorJson = JSON.parse(errorText);
                if (errorJson.message) {
                    errorMessage = errorJson.message;
                }
            } catch (e) {
                // Use raw text if JSON parsing fails
            }
            
            // Provide specific error messages based on status code
            if (response.status === 401) {
                throw new Error(`Authentication failed: ${errorMessage}. Please check your credentials.`);
            } else if (response.status === 403) {
                throw new Error(`Access denied: ${errorMessage}. Please verify your user permissions and credentials.`);
            } else if (response.status === 404) {
                throw new Error(`JDE endpoint not found: ${errorMessage}. Please verify the orchestrator URL.`);
            } else {
                throw new Error(`JDE API Error ${response.status}: ${errorMessage}`);
            }
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
