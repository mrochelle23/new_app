# BOL Barcode Scanner Application

A web application for scanning BOL (Bill of Lading) barcodes and automatically generating JDE Orchestrator Studio compatible JSON payloads.

## Features

- **Automatic Barcode Processing**: Paste or scan 2D barcode data and automatically parse it
- **Real-time JSON Generation**: Converts barcode data to JDE Orchestrator Studio format
- **Auto-Submit**: Automatically submits to JDE after 2 seconds (configurable)
- **Manual Entry**: Alternative form for manual data entry
- **Modern UI**: Clean, responsive interface with loading states and error handling

## Barcode Format

The application expects barcode data in the following format:
```
<B364-99537><T531056><L2><PRFCGT380A><Q33><PN108836><PRFCGT510A><Q12><PN108632>
```

### Identifiers:
- `B` - BOL Number
- `T` - Trailer Number  
- `L` - Lines (number of items)
- `PR` - Item Number
- `Q` - Quantity
- `PN` - PO Number

## File Structure

```
barcode-app/
├── index.html              # Main barcode scanning page
├── manual-entry.html       # Manual data entry form
├── styles.css              # Main stylesheet
├── manual-entry.css        # Manual entry specific styles
├── app.js                  # Main application logic
├── manual-entry.js         # Manual entry form logic
├── jde-config.js           # JDE Orchestrator Studio configuration
├── server.py              # Simple Python server (optional)
├── test.html              # Test suite for barcode parsing
└── README.md              # This file
```

## Usage

### Option 1: Simple File Server (Python)
```bash
python3 server.py
```
Then open http://localhost:8000

### Option 2: Any HTTP Server
You can use any web server to serve the static files:

```bash
# Using Python's built-in server
python3 -m http.server 8000

# Using Node.js http-server
npx http-server

# Using PHP
php -S localhost:8000
```

### Option 3: Open Directly in Browser
Simply open `index.html` in your web browser (some features may be limited due to CORS).

## How to Use

### Barcode Scanning
1. Open the application in your browser
2. Paste or scan the barcode data into the input field
3. The application will automatically parse the data and generate JSON
4. After 2 seconds, it will automatically submit to JDE (simulated)

### Manual Entry
1. Click the "Manual Entry" button
2. Fill in the BOL details and item information
3. Click "Preview JSON" to see the generated payload
4. Click "Submit to JDE" to send the data

## JDE Integration

The application is now configured to connect to your JDE Orchestrator Studio system:

- **URL**: `http://rglnpweb1.jgi.local:8220/jderest/orchestrator/EnterSalesOrders`
- **Environment**: `JDV920`
- **Device**: `rellman01`
- **Role**: `*ALL`

### Configuration

All JDE settings are stored in `jde-config.js` for easy maintenance:

```javascript
const JDE_CONFIG = {
    url: 'http://rglnpweb1.jgi.local:8220/jderest/orchestrator/EnterSalesOrders',
    credentials: {
        email: 'mrochelle@jamesgroupintl.com',
        password: 'wywxi8-qefdez'
    },
    environment: 'JDV920',
    device: 'rellman01',
    role: '*ALL'
};
```

### Security Note

**⚠️ Important**: The configuration file contains sensitive credentials. For production deployment:

1. Move credentials to environment variables
2. Use HTTPS instead of HTTP
3. Implement proper authentication tokens
4. Consider using a backend proxy to hide credentials from the frontend

### Error Handling

The application includes comprehensive error handling for:
- Network timeouts (30-second timeout)
- JDE API errors
- Authentication failures
- Invalid responses

## Customization

### Barcode Format
To modify the barcode parsing logic, edit the `parseBarcode()` method in `app.js`.

### JSON Structure
To change the output JSON format, modify the `generateJDEJson()` method in both JavaScript files.

### UI Styling
Customize the appearance by editing `styles.css` and `manual-entry.css`.

## Browser Compatibility

- Modern browsers (Chrome, Firefox, Safari, Edge)
- Mobile responsive design
- No external dependencies required

## Development

The application uses vanilla JavaScript, HTML, and CSS with no build process required. Simply edit the files and refresh the browser to see changes.

## Security Considerations

- Validate all input data before sending to JDE
- Implement proper authentication for JDE API calls
- Consider HTTPS for production deployment
- Sanitize user inputs to prevent XSS attacks

## Troubleshooting

### Common Issues:
1. **Barcode not parsing**: Check that the format matches the expected pattern with proper angle brackets
2. **Auto-submit not working**: Ensure the barcode data is complete and valid
3. **CORS errors**: Use a proper web server instead of opening files directly

### Debug Mode:
Open browser developer tools (F12) to see console logs and network requests.
