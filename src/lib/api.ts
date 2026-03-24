const API_BASE_URL = 'http://localhost:5000/api';

const getFilterQuery = () => {
  const params = new URLSearchParams(window.location.search);
  const filter = params.get('filter');
  return filter && filter !== 'all' ? `?filter=${filter}` : '';
};

export async function fetchHealth() {
  const res = await fetch(`${API_BASE_URL}/dashboard/health${getFilterQuery()}`);
  if (!res.ok) throw new Error('Failed to fetch health score');
  return res.json();
}

export async function fetchStats() {
  const res = await fetch(`${API_BASE_URL}/dashboard/stats${getFilterQuery()}`);
  if (!res.ok) throw new Error('Failed to fetch stats');
  return res.json();
}

export async function fetchTransactions() {
  const res = await fetch(`${API_BASE_URL}/dashboard/transactions${getFilterQuery()}`);
  if (!res.ok) throw new Error('Failed to fetch transactions');
  return res.json();
}

export async function fetchCashFlow() {
  const res = await fetch(`${API_BASE_URL}/dashboard/cashflow${getFilterQuery()}`);
  if (!res.ok) throw new Error('Failed to fetch cash flow data');
  return res.json();
}

export async function fetchExpenses() {
  const res = await fetch(`${API_BASE_URL}/dashboard/expenses${getFilterQuery()}`);
  if (!res.ok) throw new Error('Failed to fetch expenses data');
  return res.json();
}

export async function fetchRunway() {
  const res = await fetch(`${API_BASE_URL}/dashboard/runway${getFilterQuery()}`);
  if (!res.ok) throw new Error('Failed to fetch runway data');
  return res.json();
}

export async function fetchRevenueExpense() {
  const res = await fetch(`${API_BASE_URL}/dashboard/revenue-expense${getFilterQuery()}`);
  if (!res.ok) throw new Error('Failed to fetch revenue/expense data');
  return res.json();
}

export async function fetchAlerts() {
  const res = await fetch(`${API_BASE_URL}/dashboard/alerts${getFilterQuery()}`);
  if (!res.ok) throw new Error('Failed to fetch alerts');
  return res.json();
}

export async function fetchAIRecommendations() {
  const res = await fetch(`${API_BASE_URL}/ai/recommendations`);
  if (!res.ok) throw new Error('Failed to fetch AI recommendations');
  return res.json();
}

export async function deleteAllData() {
  const res = await fetch(`${API_BASE_URL}/upload`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete data');
  return res.json();
}

export async function deleteUpload(id: string) {
  const res = await fetch(`${API_BASE_URL}/upload/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete upload');
  return res.json();
}

export async function fetchUploads() {
  const res = await fetch(`${API_BASE_URL}/uploads`);
  if (!res.ok) throw new Error('Failed to fetch uploads');
  return res.json();
}

export async function addTransaction(tx: { date: string; description: string; category: string; amount: number; type: string }) {
  const res = await fetch(`${API_BASE_URL}/dashboard/transactions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(tx),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to add transaction');
  return data;
}

export async function deleteTransaction(id: string | number) {
  const res = await fetch(`${API_BASE_URL}/dashboard/transactions/${id}`, { method: 'DELETE' });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to delete transaction');
  return data;
}
