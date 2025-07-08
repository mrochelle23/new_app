#!/usr/bin/env python3
"""
Simple HTTP server for the BOL Barcode Scanner application.
This serves the static files and can be extended with API endpoints for JDE integration.
"""

import http.server
import socketserver
import json
from pathlib import Path

PORT = 8000

class BOLHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=Path(__file__).parent, **kwargs)
    
    def do_POST(self):
        """Handle POST requests for JDE API simulation"""
        if self.path == '/api/jde/submit':
            self.handle_jde_submit()
        else:
            self.send_error(404, "Not Found")
    
    def handle_jde_submit(self):
        """Simulate JDE Orchestrator Studio API endpoint"""
        try:
            # Read the JSON payload
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            json_data = json.loads(post_data.decode('utf-8'))
            
            # Log the received data (in production, you'd process this)
            print(f"📦 Received JDE payload: {len(json_data)} bytes")
            
            # Simulate processing time
            import time
            time.sleep(1)
            
            # Simulate successful response
            response = {
                "success": True,
                "message": "Sales order created successfully",
                "order_number": "SO-2025-001234",
                "timestamp": time.strftime("%Y-%m-%dT%H:%M:%S")
            }
            
            # Send response
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.send_header('Access-Control-Allow-Methods', 'POST, GET, OPTIONS')
            self.send_header('Access-Control-Allow-Headers', 'Content-Type')
            self.end_headers()
            
            self.wfile.write(json.dumps(response).encode('utf-8'))
            
        except (json.JSONDecodeError, ValueError, KeyError) as e:
            self.send_error(400, f"Bad Request: {str(e)}")
        except Exception as e:
            self.send_error(500, f"Server Error: {str(e)}")
    
    def do_OPTIONS(self):
        """Handle CORS preflight requests"""
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, GET, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()
    
    def end_headers(self):
        # Add CORS headers to all responses
        self.send_header('Access-Control-Allow-Origin', '*')
        super().end_headers()

def main():
    """Start the HTTP server"""
    with socketserver.TCPServer(("", PORT), BOLHandler) as httpd:
        print(f"🚀 BOL Barcode Scanner server running at http://localhost:{PORT}")
        print(f"📁 Serving files from: {Path(__file__).parent}")
        print("💡 Press Ctrl+C to stop the server")
        
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\n🛑 Server stopped by user")
            httpd.shutdown()

if __name__ == "__main__":
    main()
