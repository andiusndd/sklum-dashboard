const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

const storagePath = path.join(process.cwd(), 'localstorage.json');

function getSheetId() {
    if (fs.existsSync(storagePath)) {
        try {
            const data = JSON.parse(fs.readFileSync(storagePath, 'utf8'));
            if (data.SHEET_ID) return data.SHEET_ID;
        } catch (e) {}
    }
    return process.env.SHEET_ID || '1vR6ZhTMotNPxzuReclqE7DUBF9EsjiofVjQqEDIurEc';
}

function getCredentials() {
    if (!process.env.GOOGLE_CREDENTIALS) return null;
    const credentials = JSON.parse(process.env.GOOGLE_CREDENTIALS);
    if (credentials.private_key) {
        credentials.private_key = credentials.private_key.replace(/\\n/g, '\n');
    }
    return credentials;
}

async function fetchSheetData() {
    const credentials = getCredentials();
    if (!credentials) {
        throw new Error('Missing GOOGLE_CREDENTIALS');
    }

    const auth = new google.auth.GoogleAuth({
        credentials,
        scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
    });
    const sheets = google.sheets({ version: 'v4', auth });
    const sheetId = getSheetId();

    const meta = await sheets.spreadsheets.get({ spreadsheetId: sheetId });
    const targetSheet = meta.data.sheets.find(s => s.properties.title === 'Project Timeline') || meta.data.sheets[0];
    const sheetName = targetSheet.properties.title;

    const response = await sheets.spreadsheets.values.get({
        spreadsheetId: sheetId,
        range: `${sheetName}!A1:AZ5000`,
    });

    const rows = response.data.values || [];
    const headers = rows[0] || [];
    const data = rows.slice(1)
        .filter(row => row.length > 0 && row.some(cell => cell && cell.trim() !== ''))
        .map(row => {
            const obj = {};
            headers.forEach((header, index) => {
                if (!header) return;
                const key = header.toLowerCase()
                    .trim()
                    .replace(/\s+/g, '_')
                    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
                    .replace(/[đĐ]/g, m => m === 'đ' ? 'd' : 'D')
                    .replace(/[^a-z0-9_]/g, '');
                obj[key] = row[index] || '';
                if (index < 26) obj[`col_${String.fromCharCode(97 + index)}`] = row[index] || '';
            });
            return obj;
        });

    const metadata = {
        spreadsheet: meta.data.properties.title,
        sheet: sheetName,
        sheetId,
        count: data.length,
        updatedAt: new Date().toISOString(),
        baselines: {
            total: parseInt(process.env.BASE_TOTAL || '0'),
            hoanThanh: parseInt(process.env.BASE_HOAN_THANH || '0'),
            dangThucHien: parseInt(process.env.BASE_DANG_THUC_HIEN || '0'),
            sanSangCheck: parseInt(process.env.BASE_SAN_SANG_CHECK || '0'),
            chuaBatDau: parseInt(process.env.BASE_CHUA_BAT_DAU || '0'),
            feedback: parseInt(process.env.BASE_FEEDBACK || '0'),
        },
    };

    return { data, metadata };
}

module.exports = { fetchSheetData, getSheetId, storagePath };
