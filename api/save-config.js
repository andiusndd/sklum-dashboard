const fs = require('fs');
const { storagePath } = require('./_helpers');

module.exports = async (req, res) => {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { sheetId } = req.body || {};
    if (!sheetId) return res.status(400).json({ error: 'Missing sheetId' });

    const data = { SHEET_ID: sheetId, updatedAt: new Date().toISOString() };
    try {
        fs.writeFileSync(storagePath, JSON.stringify(data, null, 2));
    } catch (e) {}

    return res.status(200).json({ success: true, message: 'Updated in session' });
};
