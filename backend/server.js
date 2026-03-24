import express from 'express';
import cors from 'cors';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import multer from 'multer';
import csv from 'csv-parser';
import { Readable } from 'stream';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;
const MAX_ROWS = 5000; // [E] Row limit guard

app.use(cors());
app.use(express.json());

const DATA_FILE = path.join(__dirname, 'data.json');
const USERS_FILE = path.join(__dirname, 'users.json');

const EMPTY_DB = {
  stats: [], transactions: [], uploads: [],
  cashflow: { monthlyData: [], stats: [] },
  expenses: { categories: [], monthlyTrend: [] },
  runway: [], alerts: [], recommendations: [], revenueExpense: []
};

// ─── DB Helpers ───────────────────────────────────────────────────────────────
async function getDbData() {
  try { return JSON.parse(await fs.readFile(DATA_FILE, 'utf-8')); }
  catch { return { ...EMPTY_DB }; }
}
async function writeDbData(data) {
  await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
}
async function getUsers() {
  try { return JSON.parse(await fs.readFile(USERS_FILE, 'utf-8')); }
  catch { return []; }
}
async function writeUsers(data) {
  await fs.writeFile(USERS_FILE, JSON.stringify(data, null, 2), 'utf-8');
}

// ─── [A] Smart Column Detection ───────────────────────────────────────────────
const ALIASES = {
  date:        ['date', 'trans_date', 'transaction_date', 'time', 'timestamp', 'created_at', 'posting_date', 'value_date', 'txn_date', 'trxn_date'],
  description: ['description', 'narration', 'particulars', 'note', 'details', 'merchant', 'payee', 'remarks', 'desc', 'memo'],
  category:    ['category', 'cat', 'type_category', 'label', 'sub_category', 'expense_type'],
  amount:      ['amount', 'value', 'price', 'total', 'sum', 'trans_amt', 'txn_amount', 'net_amount', 'transaction_amount'],
  type:        ['type', 'transaction_type', 'kind', 'cr_dr', 'dr_cr', 'credit_debit'],
  debit:       ['debit', 'dr', 'withdrawal', 'expense', 'out'],
  credit:      ['credit', 'cr', 'deposit', 'income', 'in'],
};

function detectColumn(headers, fieldAliases) {
  const lHeaders = headers.map(h => h.toLowerCase().trim());
  for (const alias of fieldAliases) {
    const idx = lHeaders.findIndex(h => h === alias || h.includes(alias));
    if (idx !== -1) return headers[idx];
  }
  return null;
}

function detectMapping(headers) {
  return {
    date:        detectColumn(headers, ALIASES.date),
    description: detectColumn(headers, ALIASES.description),
    category:    detectColumn(headers, ALIASES.category),
    amount:      detectColumn(headers, ALIASES.amount),
    type:        detectColumn(headers, ALIASES.type),
    debit:       detectColumn(headers, ALIASES.debit),
    credit:      detectColumn(headers, ALIASES.credit),
  };
}

function resolveRow(row, mapping) {
  const today = new Date().toISOString().split('T')[0];
  let amount = 0;
  let type = 'expense';

  if (mapping.amount) {
    amount = parseFloat(String(row[mapping.amount] || '0').replace(/[₹,$,\s]/g, '')) || 0;
    if (mapping.type) {
      const t = String(row[mapping.type] || '').toLowerCase();
      type = (t.includes('income') || t.includes('credit') || t.includes('cr') || t.includes('in')) ? 'income' : 'expense';
    }
  } else if (mapping.credit || mapping.debit) {
    const creditAmt = parseFloat(String(row[mapping.credit] || '0').replace(/[₹,$,\s]/g, '')) || 0;
    const debitAmt  = parseFloat(String(row[mapping.debit]  || '0').replace(/[₹,$,\s]/g, '')) || 0;
    if (creditAmt > 0) { amount = creditAmt; type = 'income'; }
    else { amount = debitAmt; type = 'expense'; }
  }

  return {
    date:        mapping.date        ? (row[mapping.date] || today).split('T')[0] : today,
    description: mapping.description ? (row[mapping.description] || 'Transaction') : 'Transaction',
    category:    mapping.category    ? (row[mapping.category]    || 'Other')       : 'Other',
    amount, type,
  };
}

// ─── [C] Auto-Calculate Runway ────────────────────────────────────────────────
function calcRunway(transactions) {
  // Group into months → running cash balance → months left
  const monthMap = {};
  transactions.forEach(tx => {
    const m = (tx.date || '').slice(0, 7) || 'Unknown';
    if (!monthMap[m]) monthMap[m] = { inflow: 0, outflow: 0 };
    if (tx.type === 'income') monthMap[m].inflow += tx.amount;
    else monthMap[m].outflow += tx.amount;
  });

  const months = Object.keys(monthMap).sort();
  let balance = 0;
  const runway = [];
  months.forEach(m => {
    balance += monthMap[m].inflow - monthMap[m].outflow;
    runway.push({ month: m.slice(5), balance });
  });

  // Project future months based on avg burn
  const avgBurn = months.length > 0
    ? months.reduce((s, m) => s + monthMap[m].outflow, 0) / months.length
    : 0;
  const lastBalance = runway.length ? runway[runway.length - 1].balance : 0;
  const monthsLeft = avgBurn > 0 ? parseFloat((lastBalance / avgBurn).toFixed(1)) : 0;

  // Build runway chart data (last 6 months + 2 projected)
  const chartData = months.slice(-6).map((m, i) => ({
    month: m.slice(5),
    runway: parseFloat((runway[runway.length - months.slice(-6).length + i]?.balance / (avgBurn || 1)).toFixed(1))
  }));
  if (avgBurn > 0 && lastBalance > 0) {
    chartData.push({ month: 'Proj.1*', runway: parseFloat(Math.max(0, monthsLeft - 1).toFixed(1)) });
    chartData.push({ month: 'Proj.2*', runway: parseFloat(Math.max(0, monthsLeft - 2).toFixed(1)) });
  }
  return { chartData, monthsLeft };
}

// ─── [D] Auto-Generate Alerts ─────────────────────────────────────────────────
function generateAlerts(db) {
  const alerts = [];
  const txs = db.transactions;
  if (!txs || txs.length === 0) return alerts;

  const stats = db.stats || [];
  const marginStat = stats.find(s => s.label === 'Net Margin');
  const margin = marginStat ? parseFloat(marginStat.value) : 0;

  // Alert 1: Negative net margin
  if (margin < 0) {
    alerts.push({
      type: 'anomaly', icon: 'AlertTriangle', emoji: '🔴',
      title: 'Negative Net Margin',
      description: `Your current net margin is ${margin.toFixed(1)}%. Expenses exceed revenue. Immediate cost review is recommended.`,
      colorClass: 'border-danger/30 bg-danger/5', iconColor: 'text-danger'
    });
  }

  // Alert 2: Category spike (category > 40% of total expenses)
  const expCats = db.expenses?.categories || [];
  const totalExp = expCats.reduce((s, c) => s + c.value, 0);
  expCats.forEach(cat => {
    if (totalExp > 0 && (cat.value / totalExp) > 0.4) {
      alerts.push({
        type: 'warning', icon: 'TrendingDown', emoji: '🟡',
        title: `High "${cat.name}" Spend`,
        description: `"${cat.name}" accounts for ${((cat.value / totalExp) * 100).toFixed(0)}% of total expenses (₹${cat.value.toLocaleString('en-IN')}). Consider reviewing this category.`,
        colorClass: 'border-warning/30 bg-warning/5', iconColor: 'text-warning'
      });
    }
  });

  // Alert 3: Positive insight if margin is healthy
  if (margin >= 20) {
    alerts.push({
      type: 'recommendation', icon: 'Lightbulb', emoji: '🟢',
      title: 'Healthy Profit Margin',
      description: `Great work! Your net margin is ${margin.toFixed(1)}%, which is strong for an SME. Consider reinvesting surplus into growth.`,
      colorClass: 'border-success/30 bg-success/5', iconColor: 'text-success'
    });
  }

  // Alert 4: Low runway warning
  if (db.runwayMonths > 0 && db.runwayMonths < 4) {
    alerts.push({
      type: 'anomaly', icon: 'AlertTriangle', emoji: '🔴',
      title: 'Low Cash Runway',
      description: `At current burn rate, you have approximately ${db.runwayMonths} month(s) of runway remaining. Immediate action needed.`,
      colorClass: 'border-danger/30 bg-danger/5', iconColor: 'text-danger'
    });
  }

  return alerts.slice(0, 4); // max 4 alerts
}

// ─── Master Recalculate ───────────────────────────────────────────────────────────────────
function recalculateDb(db) {
  const txs = db.transactions || [];
  let totalRevenue = 0;
  let totalExpenses = 0;
  txs.forEach(tx => {
    if (tx.type === 'income') totalRevenue += tx.amount;
    else totalExpenses += tx.amount;
  });

  const netMargin = totalRevenue > 0
    ? ((totalRevenue - totalExpenses) / totalRevenue * 100).toFixed(1)
    : 0;

  db.stats = [
    { label: 'Total Revenue', value: `₹${totalRevenue.toLocaleString('en-IN')}`, change: '-', positive: true, icon: 'TrendingUp', glow: 'stat-glow-green' },
    { label: 'Total Expenses', value: `₹${totalExpenses.toLocaleString('en-IN')}`, change: '-', positive: false, icon: 'TrendingDown', glow: 'stat-glow-red' },
    { label: 'Net Margin', value: `${netMargin}%`, change: '-', positive: parseFloat(netMargin) >= 0, icon: 'Percent', glow: parseFloat(netMargin) >= 0 ? 'stat-glow-green' : 'stat-glow-red' }
  ];

  // Expense categories
  const catMap = {};
  txs.filter(tx => tx.type === 'expense').forEach(tx => {
    catMap[tx.category] = (catMap[tx.category] || 0) + tx.amount;
  });
  db.expenses = db.expenses || {};
  db.expenses.categories = Object.entries(catMap)
    .sort((a, b) => b[1] - a[1])
    .map(([name, value], i) => ({ name, value, color: `hsl(${i * 55} 70% 50%)` }));

  // Monthly cashflow grouping
  const monthMap = {};
  txs.forEach(tx => {
    const m = (tx.date || '').slice(0, 7) || 'Unknown';
    if (!monthMap[m]) monthMap[m] = { inflow: 0, outflow: 0 };
    if (tx.type === 'income') monthMap[m].inflow += tx.amount;
    else monthMap[m].outflow += tx.amount;
  });

  db.cashflow = db.cashflow || {};
  db.cashflow.monthlyData = Object.entries(monthMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-6)
    .map(([m, v]) => ({ month: m.slice(5), inflow: v.inflow, outflow: v.outflow }));

  db.cashflow.stats = [
    { label: 'Total Inflow', value: `₹${totalRevenue.toLocaleString('en-IN')}`, trend: '-', positive: true },
    { label: 'Total Outflow', value: `₹${totalExpenses.toLocaleString('en-IN')}`, trend: '-', positive: false },
    { label: 'Net Cash Flow', value: `₹${(totalRevenue - totalExpenses).toLocaleString('en-IN')}`, trend: '-', positive: totalRevenue >= totalExpenses },
  ];

  db.revenueExpense = db.cashflow.monthlyData.map(m => ({
    month: m.month, revenue: m.inflow, expenses: m.outflow
  }));

  // [C] Runway
  const { chartData, monthsLeft } = calcRunway(txs);
  db.runway = chartData;
  db.runwayMonths = monthsLeft;

  // [D] Alerts
  db.alerts = generateAlerts(db);

  return db;
}

// ─── AUTH ─────────────────────────────────────────────────────────────────────
app.post('/api/auth/signup', async (req, res) => {
  const { fullName, email, password, companyName } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' });
  const users = await getUsers();
  if (users.find(u => u.email === email)) return res.status(400).json({ error: 'User already exists' });
  const newUser = { id: Date.now().toString(), fullName, email, password, companyName };
  users.push(newUser);
  await writeUsers(users);
  res.json({ token: `mock-jwt-${newUser.id}`, user: { email, fullName, companyName } });
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' });
  const users = await getUsers();
  const user = users.find(u => u.email === email && u.password === password);
  if (!user) return res.status(401).json({ error: 'Invalid email or password' });
  res.json({ token: `mock-jwt-${user.id}`, user: { email: user.email, fullName: user.fullName, companyName: user.companyName } });
});

// ─── CSV UPLOAD ───────────────────────────────────────────────────────────────
const upload = multer({ storage: multer.memoryStorage() });

app.post('/api/upload', upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No CSV file uploaded' });

  const rawRows = [];
  const bufferStream = new Readable();
  bufferStream.push(req.file.buffer);
  bufferStream.push(null);

  bufferStream
    .pipe(csv())
    .on('data', (row) => { if (rawRows.length < MAX_ROWS) rawRows.push(row); }) // [E] Limit
    .on('end', async () => {
      if (rawRows.length === 0) return res.status(400).json({ error: 'CSV has no rows.' });

      // [A] Detect columns — but allow query-param override from mapping modal
      const headers = Object.keys(rawRows[0]);
      let mapping = detectMapping(headers);

      if (req.query.mappingConfirmed === 'true') {
        // Override with user-confirmed mapping from the modal
        const fields = ['date', 'description', 'category', 'amount', 'type', 'debit', 'credit'];
        fields.forEach(f => { if (req.query[f]) mapping[f] = req.query[f]; });
      }

      // Check if we need to ask the user for mapping (only when not manually confirmed)
      const unmapped = [];
      if (!mapping.date) unmapped.push('Date');
      if (!mapping.amount && !mapping.credit && !mapping.debit) unmapped.push('Amount');

      if (unmapped.length > 0) {
        // Return the headers so frontend can show mapping UI
        return res.status(422).json({
          needsMapping: true,
          headers,
          detectedMapping: mapping,
          message: `Could not auto-detect columns: ${unmapped.join(', ')}. Please map them.`
        });
      }

      const validRows = rawRows
        .map(r => resolveRow(r, mapping))
        .filter(r => r.amount > 0);

      if (validRows.length === 0) {
        return res.status(400).json({ error: 'No valid rows found in CSV. Ensure Amount column has numeric values > 0.' });
      }

      let db = await getDbData();

      // [B] Track upload history
      if (!db.uploads) db.uploads = [];
      const uploadId = Date.now().toString();
      db.uploads.push({
        id: uploadId,
        filename: req.file.originalname,
        uploadedAt: new Date().toISOString(),
        rowCount: validRows.length
      });

      // Append new transactions (preserve existing ones from other uploads)
      const existingIds = new Set((db.transactions || []).map(t => t.uploadId));
      db.transactions = [
        ...(db.transactions || []).filter(t => t.uploadId !== uploadId),
        ...validRows.map((r, i) => ({ id: Date.now() + i, uploadId, ...r }))
      ];

      db = recalculateDb(db);
      await writeDbData(db);

      res.json({
        success: true,
        imported: validRows.length,
        skipped: rawRows.length - validRows.length,
        uploadId
      });
    })
    .on('error', err => res.status(500).json({ error: `CSV parse error: ${err.message}` }));
});

// Delete a specific upload by ID (removes its transactions, recalculates)
app.delete('/api/upload/:id', async (req, res) => {
  const { id } = req.params;
  let db = await getDbData();
  db.uploads = (db.uploads || []).filter(u => u.id !== id);
  db.transactions = (db.transactions || []).filter(t => t.uploadId !== id);
  db = recalculateDb(db);
  await writeDbData(db);
  res.json({ success: true });
});

// Delete ALL data
app.delete('/api/upload', async (req, res) => {
  await writeDbData({ ...EMPTY_DB });
  res.json({ success: true });
});

// delete single transaction
app.delete('/api/dashboard/transactions/:id', async (req, res) => {
  const { id } = req.params;
  let db = await getDbData();
  db.transactions = (db.transactions || []).filter(t => t.id.toString() !== id);
  db = recalculateDb(db);
  await writeDbData(db);
  res.json({ success: true, message: 'Transaction deleted' });
});

// GET /api/export
app.get('/api/export', async (req, res) => {
  const db = await getDbData();
  const txs = db.transactions || [];
  let csv = "Date,Description,Category,Amount,Type\n";
  txs.forEach(tx => {
    const desc = `"${(tx.description || '').replace(/"/g, '""')}"`;
    const cat = `"${(tx.category || '').replace(/"/g, '""')}"`;
    csv += `${tx.date},${desc},${cat},${tx.amount},${tx.type}\n`;
  });
  res.header('Content-Type', 'text/csv');
  res.attachment('financial_data_export.csv');
  return res.send(csv);
});

// ─── DASHBOARD ROUTES ─────────────────────────────────────────────────────────

function getFilteredDb(db, filter) {
  if (!filter || filter === 'all') return db;
  const today = new Date();
  
  let startDate = null;
  if (filter === 'this_month') {
    startDate = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
  } else if (filter === 'last_3_months') {
    startDate = new Date(today.getFullYear(), today.getMonth() - 2, 1).toISOString().split('T')[0];
  } else if (filter === 'this_year') {
    startDate = new Date(today.getFullYear(), 0, 1).toISOString().split('T')[0];
  }
  
  if (!startDate) return db;
  
  const filteredTxs = (db.transactions || []).filter(tx => tx.date >= startDate);
  
  const tempDb = {
    transactions: filteredTxs,
    uploads: db.uploads,
    stats: [], cashflow: { monthlyData: [], stats: [] },
    expenses: { categories: [], monthlyTrend: [] },
    runway: [], alerts: [], recommendations: [], revenueExpense: []
  };
  
  return recalculateDb(tempDb);
}

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));
app.get('/api/dashboard/stats', async (req, res) => { const db = getFilteredDb(await getDbData(), req.query.filter); res.json(db.stats || []); });
app.get('/api/dashboard/transactions', async (req, res) => { const db = getFilteredDb(await getDbData(), req.query.filter); res.json(db.transactions || []); });
app.get('/api/dashboard/cashflow', async (req, res) => { const db = getFilteredDb(await getDbData(), req.query.filter); res.json(db.cashflow || {}); });
app.get('/api/dashboard/expenses', async (req, res) => { const db = getFilteredDb(await getDbData(), req.query.filter); res.json(db.expenses || {}); });
app.get('/api/dashboard/runway', async (req, res) => { const db = getFilteredDb(await getDbData(), req.query.filter); res.json(db.runway || []); });
app.get('/api/dashboard/revenue-expense', async (req, res) => { const db = getFilteredDb(await getDbData(), req.query.filter); res.json(db.revenueExpense || []); });
app.get('/api/dashboard/alerts', async (req, res) => { const db = getFilteredDb(await getDbData(), req.query.filter); res.json(db.alerts || []); });
app.get('/api/ai/recommendations', async (req, res) => { const db = await getDbData(); res.json(db.recommendations || []); });
app.get('/api/uploads', async (req, res) => { const db = await getDbData(); res.json(db.uploads || []); });

app.get('/api/dashboard/health', async (req, res) => {
  const db = getFilteredDb(await getDbData(), req.query.filter);
  if (!db.transactions || db.transactions.length === 0) return res.json({ score: 0 });

  const marginStat = (db.stats || []).find(s => s.label === 'Net Margin');
  const margin = marginStat ? parseFloat(marginStat.value) : 0;

  // Strict reality check: negative margin = 0 score. Positive margin scales 0→100.
  // Formula: score = clamp(margin * 2, 0, 100)
  // 50% margin → 100 score | 25% margin → 50 score | 0% or negative → 0 score
  const score = Math.min(100, Math.max(0, Math.round(margin * 2)));
  res.json({ score });
});

// Add a single transaction manually
app.post('/api/dashboard/transactions', async (req, res) => {
  const { date, description, category, amount, type } = req.body;
  if (!amount || !date) return res.status(400).json({ error: 'date and amount are required' });

  let db = await getDbData();
  const newTx = { id: Date.now(), uploadId: 'manual', date, description, category: category || 'Other', amount: parseFloat(amount), type: type || 'expense' };
  db.transactions = [...(db.transactions || []), newTx];
  db = recalculateDb(db);
  await writeDbData(db);
  res.status(201).json(newTx);
});

app.listen(PORT, () => {
  console.log(`🚀 Express Backend running on http://localhost:${PORT}`);
  console.log(`✅ Smart CSV detection, auto-alerts, auto-runway enabled.`);
});
