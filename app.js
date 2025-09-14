let transactions = JSON.parse(localStorage.getItem('transactions')) || [];
let editingId = null;

function saveTransactions() {
  localStorage.setItem('transactions', JSON.stringify(transactions));
}

function formatCurrency(amount) {
  return `ZMW ${amount.toFixed(2)}`;
}

// ---- OVERVIEW PAGE ----
function renderOverview() {
  const income = transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const expenses = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const balance = income - expenses;

  if (document.getElementById('total-income')) {
    document.getElementById('total-income').textContent = formatCurrency(income);
    document.getElementById('total-expenses').textContent = formatCurrency(expenses);
    document.getElementById('total-balance').textContent = formatCurrency(balance);

    const ctx = document.getElementById('budget-chart').getContext('2d');
    new Chart(ctx, {
      type: 'doughnut',
      data: { labels: ['Income', 'Expenses'], datasets: [{ data: [income, expenses], backgroundColor: ['#4cc9f0', '#e63946'] }] },
      options: { plugins: { legend: { position: 'bottom' } } }
    });
  }
}

// ---- TRANSACTIONS PAGE ----
function renderTransactionsPage() {
  const form = document.getElementById('add-transaction-form');
  const container = document.getElementById('transactions-container');
  if (!form || !container) return;

  form.addEventListener('submit', e => {
    e.preventDefault();
    const description = document.getElementById('description').value;
    const amount = parseFloat(document.getElementById('amount').value);
    const type = document.getElementById('type').value;
    const date = document.getElementById('date').value;

    if (!description || isNaN(amount) || amount <= 0) return;

    if (editingId) {
      transactions = transactions.map(t => t.id === editingId ? { ...t, description, amount, type, date } : t);
      editingId = null;
    } else {
      transactions.push({ id: Date.now(), description, amount, type, date });
    }

    saveTransactions();
    renderTransactionsList();
    form.reset();
    document.getElementById('date').valueAsDate = new Date();
  });

  renderTransactionsList();
}

function renderTransactionsList() {
  const container = document.getElementById('transactions-container');
  if (!container) return;

  if (transactions.length === 0) {
    container.innerHTML = '<p>No transactions yet.</p>';
    return;
  }

  container.innerHTML = transactions.map(t => `
    <div>
      <strong>${t.description}</strong> (${t.type}) - ${formatCurrency(t.amount)} on ${t.date}
      <button onclick="editTransaction(${t.id})">Edit</button>
      <button onclick="deleteTransaction(${t.id})">Delete</button>
    </div>
  `).join('');
}

function deleteTransaction(id) {
  transactions = transactions.filter(t => t.id !== id);
  saveTransactions();
  renderTransactionsList();
}

function editTransaction(id) {
  const tx = transactions.find(t => t.id === id);
  if (!tx) return;

  document.getElementById('description').value = tx.description;
  document.getElementById('amount').value = tx.amount;
  document.getElementById('type').value = tx.type;
  document.getElementById('date').value = tx.date;
  editingId = id;
}

// ---- SETTINGS ----
function exportData() {
  const blob = new Blob([JSON.stringify(transactions)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'transactions.json';
  a.click();
}

function importData() {
  const fileInput = document.getElementById('import-file');
  const file = fileInput.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = e => {
    transactions = JSON.parse(e.target.result);
    saveTransactions();
    alert('Data imported successfully!');
    location.reload();
  };
  reader.readAsText(file);
}

function resetData() {
  if (confirm('Are you sure you want to reset all data?')) {
    transactions = [];
    saveTransactions();
    location.reload();
  }
}

function renderReports() {
  const categoryCanvas = document.getElementById('category-chart');
  const breakdownContainer = document.getElementById('category-breakdown');
  const incomeElem = document.getElementById('report-income');
  const expensesElem = document.getElementById('report-expenses');
  const totalElem = document.getElementById('report-total');

  if (!categoryCanvas || !breakdownContainer) return;

  const income = transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const expenses = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const balance = income - expenses;

  incomeElem.textContent = formatCurrency(income);
  expensesElem.textContent = formatCurrency(expenses);
  totalElem.textContent = formatCurrency(balance);

  // Group expenses by description (acts like category)
  const categories = {};
  transactions.filter(t => t.type === 'expense').forEach(t => {
    const key = t.description || "Other";
    if (!categories[key]) categories[key] = 0;
    categories[key] += t.amount;
  });

  // Chart
  new Chart(categoryCanvas.getContext('2d'), {
    type: 'doughnut',
    data: {
      labels: Object.keys(categories),
      datasets: [{
        data: Object.values(categories),
        backgroundColor: ['#f72585','#7209b7','#3a0ca3','#4361ee','#4cc9f0','#e63946','#06d6a0','#ffd166']
      }]
    },
    options: { plugins: { legend: { position: 'bottom' } } }
  });

  // Breakdown list
  breakdownContainer.innerHTML = '';
  const totalExpenses = Object.values(categories).reduce((s,v) => s+v,0);
  Object.entries(categories).forEach(([cat, amt]) => {
    const percent = ((amt/totalExpenses)*100).toFixed(1);
    breakdownContainer.innerHTML += `
      <div>
        <span>${cat}</span>
        <span>${percent}% - ${formatCurrency(amt)}</span>
      </div>
    `;
  });
}



// Run appropriate renderers
renderOverview();
renderTransactionsPage();
renderReports();
