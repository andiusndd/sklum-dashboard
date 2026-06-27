const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

const storagePath = path.join(process.cwd(), 'localstorage.json');
const DEFAULT_SHEET_ID = '1vR6ZhTMotNPxzuReclqE7DUBF9EsjiofVjQqEDIurEc';
const DEFAULT_SHEET_TITLE = 'Project Timeline';
const KV_KEY = 'sklum_sheet_id';

function hasKv() {
    return Boolean(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);
}

async function kvRequest(method, key, value) {
    if (!hasKv()) return null;
    const url = `${process.env.KV_REST_API_URL}/${encodeURIComponent(key)}`;
    const headers = {
        Authorization: `Bearer ${process.env.KV_REST_API_TOKEN}`,
        'Content-Type': 'application/json',
    };
    const res = await fetch(url, {
        method,
        headers,
        body: method === 'GET' ? undefined : JSON.stringify(value),
    });
    if (!res.ok) {
        const text = await res.text();
        throw new Error(`KV ${method} failed: ${res.status} ${text}`);
    }
    return res.json();
}

async function getStoredSheetId() {
    try {
        const result = await kvRequest('GET', KV_KEY);
        if (result && typeof result.result === 'string' && result.result.trim()) {
            return result.result.trim();
        }
    } catch (e) {}
    if (fs.existsSync(storagePath)) {
        try {
            const data = JSON.parse(fs.readFileSync(storagePath, 'utf8'));
            if (data.SHEET_ID) return data.SHEET_ID;
        } catch (e) {}
    }
    return null;
}

async function getSheetId(overrideSheetId) {
    if (overrideSheetId) return overrideSheetId;
    return (await getStoredSheetId()) || process.env.SHEET_ID || DEFAULT_SHEET_ID;
}

function getCredentials() {
    if (!process.env.GOOGLE_CREDENTIALS) return null;
    const credentials = JSON.parse(process.env.GOOGLE_CREDENTIALS);
    if (credentials.private_key) {
        credentials.private_key = credentials.private_key.replace(/\\n/g, '\n');
    }
    return credentials;
}

function normalizeKey(header) {
    return String(header || '')
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '_')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[đĐ]/g, m => (m === 'đ' ? 'd' : 'D'))
        .replace(/[^a-z0-9_]/g, '');
}

function rowToObject(headers, row) {
    const obj = {};
    headers.forEach((header, index) => {
        if (!header) return;
        const key = normalizeKey(header);
        obj[key] = row[index] || '';
        if (index < 26) obj[`col_${String.fromCharCode(97 + index)}`] = row[index] || '';
    });
    return obj;
}

function chooseSheet(meta) {
    const sheet = meta?.data?.sheets?.find(s => s.properties.title === DEFAULT_SHEET_TITLE) || meta?.data?.sheets?.[0];
    if (!sheet?.properties?.title) {
        throw new Error('No worksheet found in spreadsheet');
    }
    return sheet.properties.title;
}

function normalizeStatus(value) {
    return String(value || '')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[đĐ]/g, 'd')
        .trim();
}

function calculateSummary(rows) {
    const summary = {
        total: rows.length,
        hoanThanh: 0,
        dangThucHien: 0,
        sanSangCheck: 0,
        chuaBatDau: 0,
        feedback: 0,
    };

    for (const row of rows) {
        const status = normalizeStatus(row.trang_thai || row.col_j || row.status || row.state);
        const customer = normalizeStatus(row.customer || row.col_q);
        const feedback = normalizeStatus(row.link_qa || row.col_n || row.feedback || row.phan_hoi);

        if (status.includes('hoan thanh')) summary.hoanThanh++;
        else if (status.includes('dang thuc hien')) summary.dangThucHien++;
        else if (status.includes('san sang check')) summary.sanSangCheck++;
        else if (!status) summary.chuaBatDau++;

        if (customer === 'feedback' || feedback === 'feedback') summary.feedback++;
    }

    return summary;
}

function buildModelerChart(rows) {
    const counts = {};
    for (const row of rows) {
        const name = String(row.modeler || row.col_i || '').trim();
        if (!name || name === 'Unassigned') continue;
        counts[name] = (counts[name] || 0) + 1;
    }

    return Object.entries(counts)
        .sort((a, b) => b[1] - a[1])
        .map(([name, count]) => ({ name, count }))
        .slice(0, 12);
}

function buildTaskView(rows) {
    return rows.map((t) => {
        const name = t.model_id || t.sku || t.collection || t.task_name || 'Untitled';
        const rawStatus = String(t.col_j || t.trang_thai || t.status || t.state || 'Unknown').trim();
        const normalizedStatus = normalizeStatus(rawStatus);
        let status = rawStatus || 'Unknown';

        if (normalizedStatus.includes('hoan thanh')) status = 'Completed';
        else if (normalizedStatus.includes('dang thuc hien')) status = 'In Progress';
        else if (normalizedStatus.includes('san sang check')) status = 'Ready for Review';
        else if (normalizedStatus.includes('chua bat dau')) status = 'Not Started';

        return {
            name,
            status,
            feedback_status: String(t.col_q || t.giai_doan_feedback || t.feedback || t.phan_hoi || '').trim(),
            progress: t.progress || t.tien_do || t.percent || '0%',
            assignee: t.modeler || t.assignee || t.nguoi_thuc_hien || 'Unassigned',
            date: String(t.col_r || t.ngay_accepted || t.ngay_gui_l1 || t.due_date || 'TBD').trim(),
        };
    });
}

async function fetchSheetData(overrideSheetId) {
    const credentials = getCredentials();
    if (!credentials) throw new Error('Missing GOOGLE_CREDENTIALS');

    const auth = new google.auth.GoogleAuth({
        credentials,
        scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
    });
    const sheets = google.sheets({ version: 'v4', auth });
    const sheetId = await getSheetId(overrideSheetId);

    const meta = await sheets.spreadsheets.get({ spreadsheetId: sheetId });
    const sheetName = chooseSheet(meta);
    const response = await sheets.spreadsheets.values.get({
        spreadsheetId: sheetId,
        range: `${sheetName}!A1:AZ5000`,
    });

    const rows = response.data.values || [];
    const headers = rows[0] || [];
    const data = rows.slice(1)
        .filter(row => row.length > 0 && row.some(cell => cell && String(cell).trim() !== ''))
        .map(row => rowToObject(headers, row));

    const summary = calculateSummary(data);
    const chartData = {
        modelerCounts: buildModelerChart(data),
    };

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

    return { data, metadata, summary, chartData };
}

async function saveSheetId(sheetId) {
    if (hasKv()) {
        await kvRequest('POST', KV_KEY, { value: sheetId });
        return { stored: 'kv' };
    }
    fs.writeFileSync(storagePath, JSON.stringify({ SHEET_ID: sheetId, updatedAt: new Date().toISOString() }, null, 2));
    return { stored: 'file' };
}

module.exports = {
    DEFAULT_SHEET_ID,
    DEFAULT_SHEET_TITLE,
    storagePath,
    getSheetId,
    getCredentials,
    normalizeKey,
    rowToObject,
    calculateSummary,
    buildModelerChart,
    buildTaskView,
    fetchSheetData,
    saveSheetId,
    hasKv,
};
