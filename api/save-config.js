const { saveSheetId } = require('./_helpers');

module.exports = async (req, res) => {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { sheetId } = req.body || {};
    if (!sheetId) return res.status(400).json({ error: 'Missing sheetId' });

    try {
        const result = await saveSheetId(sheetId);
        return res.status(200).json({ success: true, message: 'Sheet ID saved', sheetId, result });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
};
