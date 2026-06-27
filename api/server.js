const express = require('express');
const fs = require('fs');
const { fetchSheetData, storagePath } = require('./_helpers');

const app = express();
app.use(express.json());

app.get('/api/data', async (req, res) => {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');

    try {
        const payload = await fetchSheetData();
        res.json(payload);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/save-config', (req, res) => {
    const { sheetId } = req.body;
    if (!sheetId) return res.status(400).json({ error: 'Missing sheetId' });

    const data = { SHEET_ID: sheetId, updatedAt: new Date().toISOString() };
    try {
        fs.writeFileSync(storagePath, JSON.stringify(data, null, 2));
    } catch (e) {}

    res.json({ success: true, message: 'Updated in session' });
});

module.exports = app;
