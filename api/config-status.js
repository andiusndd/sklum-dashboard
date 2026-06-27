const { hasKv } = require('./_helpers');

module.exports = async (req, res) => {
    return res.status(200).json({
        ok: true,
        storage: hasKv() ? 'kv' : 'fallback',
        kvConfigured: hasKv(),
    });
};
