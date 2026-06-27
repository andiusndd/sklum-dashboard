const { fetchSheetData } = require('./_helpers');

module.exports = async (req, res) => {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');

    try {
        const overrideSheetId = req.query?.sheetId;
        const payload = await fetchSheetData(overrideSheetId);
        return res.status(200).json(payload);
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
};
