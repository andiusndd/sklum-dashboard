const express = require('express');
const path = require('path');
const fs = require('fs');

// Simple environment loader for local development
const envPath = path.join(__dirname, '.env.local');
if (fs.existsSync(envPath)) {
    console.log('Loading environment variables from .env.local');
    const envConfig = fs.readFileSync(envPath, 'utf8');
    envConfig.split('\n').forEach(line => {
        // Strip out comments and whitespace
        const cleanLine = line.trim();
        if (!cleanLine || cleanLine.startsWith('#')) return;
        
        const index = cleanLine.indexOf('=');
        if (index > 0) {
            const key = cleanLine.substring(0, index).trim();
            let value = cleanLine.substring(index + 1).trim();
            
            // Remove leading/trailing quotes if present
            if (value.length > 1 && value.startsWith('"') && value.endsWith('"')) {
                value = value.slice(1, -1);
            } else if (value.length > 1 && value.startsWith("'") && value.endsWith("'")) {
                value = value.slice(1, -1);
            }
            
            process.env[key] = value;
        }
    });
}

// Import Express app from api/server.js
const app = require('./api/server.js');

const PORT = process.env.PORT || 3000;

// Serve static files from root directory
app.use(express.static(__dirname));

// Fallback to index.html for SPA-style navigation
app.use((req, res, next) => {
    if (req.path.startsWith('/api/')) {
        return next();
    }
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Server is running locally at http://localhost:${PORT}`);
});
