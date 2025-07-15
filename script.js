// Initialize data from localStorage or create empty array
let incomeData = JSON.parse(localStorage.getItem('incomeData')) || [];
let incomeChart = null;

// DOM elements
const form = document.getElementById('income-form');
const tableBody = document.querySelector('#income-table tbody');
const monthlyTotalEl = document.getElementById('monthly-total');
const lastMonthTotalEl = document.getElementById('last-month-total');
const growthPercentageEl = document.getElementById('growth-percentage');
const currentDateEl = document.getElementById('current-date');
const currentYearEl = document.getElementById('current-year');
const clearDataBtn = document.getElementById('clear-data');
const exportDataBtn = document.getElementById('export-data');

// Initialize the app
document.addEventListener('DOMContentLoaded', function() {
    // Set current year in footer
    currentYearEl.textContent = new Date().getFullYear();
    
    // Set current date display
    updateCurrentDate();
    
    // Set default date/time
    setDefaultDateTime();
    
    // Load data
    renderTable();
    updateStats();
    renderChart();
    
    // Event listeners
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        addIncomeEntry();
    });
    
    clearDataBtn.addEventListener('click', clearAllData);
    exportDataBtn.addEventListener('click', exportData);
});

function updateCurrentDate() {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    currentDateEl.textContent = new Date().toLocaleDateString('en-US', options);
}

function setDefaultDateTime() {
    const today = new Date();
    document.getElementById('date').valueAsDate = today;
    
    const hours = today.getHours().toString().padStart(2, '0');
    const minutes = today.getMinutes().toString().padStart(2, '0');
    document.getElementById('time').value = `${hours}:${minutes}`;
}

function addIncomeEntry() {
    const dateInput = document.getElementById('date');
    const paperMoney = parseFloat(document.getElementById('paper-money').value) || 0;
    const coins = parseFloat(document.getElementById('coins').value) || 0;
    const time = document.getElementById('time').value;
    
    // Format date as YYYY-MM-DD
    const date = new Date(dateInput.value);
    const dateString = date.toISOString().split('T')[0];
    
    const newEntry = {
        id: Date.now(),
        date: dateString,
        day: getDayName(dateString),
        paperMoney: paperMoney,
        coins: coins,
        total: paperMoney + coins,
        time: time
    };
    
    incomeData.push(newEntry);
    saveData();
    renderTable();
    updateStats();
    renderChart();
    
    form.reset();
    setDefaultDateTime();
    document.getElementById('paper-money').focus();
}

function renderTable() {
    tableBody.innerHTML = '';
    
    if (incomeData.length === 0) {
        const row = document.createElement('tr');
        row.innerHTML = `<td colspan="6" style="text-align: center;">No transactions yet</td>`;
        tableBody.appendChild(row);
        return;
    }
    
    // Sort by date descending (newest first)
    incomeData.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    incomeData.forEach(entry => {
        const row = document.createElement('tr');
        
        row.innerHTML = `
            <td>${formatDate(entry.date)}</td>
            <td>${entry.day}</td>
            <td>₱${entry.paperMoney.toFixed(2)}</td>
            <td>₱${entry.coins.toFixed(2)}</td>
            <td><strong>₱${entry.total.toFixed(2)}</strong></td>
            <td>
                <button class="edit-btn" data-id="${entry.id}">Edit</button>
                <button class="delete-btn" data-id="${entry.id}">Delete</button>
            </td>
        `;
        
        tableBody.appendChild(row);
    });
    
    // Add event listeners to action buttons
    document.querySelectorAll('.edit-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            editEntry(parseInt(this.getAttribute('data-id')));
        });
    });
    
    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            deleteEntry(parseInt(this.getAttribute('data-id')));
        });
    });
}

function updateStats() {
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    
    // Current month total
    const currentMonthTotal = incomeData
        .filter(entry => {
            const entryDate = new Date(entry.date);
            return entryDate.getMonth() === currentMonth && 
                   entryDate.getFullYear() === currentYear;
        })
        .reduce((sum, entry) => sum + entry.total, 0);
    
    monthlyTotalEl.textContent = `₱${currentMonthTotal.toFixed(2)}`;
    
    // Last month total
    const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;
    
    const lastMonthTotal = incomeData
        .filter(entry => {
            const entryDate = new Date(entry.date);
            return entryDate.getMonth() === lastMonth && 
                   entryDate.getFullYear() === lastMonthYear;
        })
        .reduce((sum, entry) => sum + entry.total, 0);
    
    lastMonthTotalEl.textContent = `₱${lastMonthTotal.toFixed(2)}`;
    
    // Growth percentage
    const growthPercentage = lastMonthTotal > 0 
        ? ((currentMonthTotal - lastMonthTotal) / lastMonthTotal * 100).toFixed(2)
        : currentMonthTotal > 0 ? '100.00' : '0.00';
    
    growthPercentageEl.textContent = `${growthPercentage}%`;
    growthPercentageEl.style.color = growthPercentage >= 0 ? 'var(--success)' : 'var(--danger)';
}

function renderChart() {
    const ctx = document.getElementById('income-chart').getContext('2d');
    const labels = [];
    const totals = [];
    
    // Group by month for the chart
    const monthlyData = {};
    
    incomeData.forEach(entry => {
        const date = new Date(entry.date);
        const monthYear = `${date.toLocaleString('default', { month: 'short' })} ${date.getFullYear()}`;
        
        if (!monthlyData[monthYear]) {
            monthlyData[monthYear] = 0;
        }
        monthlyData[monthYear] += entry.total;
    });
    
    for (const [monthYear, total] of Object.entries(monthlyData)) {
        labels.push(monthYear);
        totals.push(total);
    }
    
    if (incomeChart) {
        incomeChart.destroy();
    }
    
    incomeChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Monthly Income',
                data: totals,
                backgroundColor: 'rgba(26, 187, 156, 0.7)',
                borderColor: 'rgba(26, 187, 156, 1)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: 'Monthly Income Overview',
                    font: {
                        size: 16
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `₱${context.raw.toFixed(2)}`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return '₱' + value;
                        }
                    }
                }
            }
        }
    });
}

function editEntry(id) {
    const entry = incomeData.find(item => item.id === id);
    if (!entry) return;
    
    document.getElementById('date').value = entry.date;
    document.getElementById('paper-money').value = entry.paperMoney;
    document.getElementById('coins').value = entry.coins;
    document.getElementById('time').value = entry.time;
    
    incomeData = incomeData.filter(item => item.id !== id);
    saveData();
    renderTable();
    updateStats();
    renderChart();
}

function deleteEntry(id) {
    if (confirm('Are you sure you want to delete this transaction?')) {
        incomeData = incomeData.filter(item => item.id !== id);
        saveData();
        renderTable();
        updateStats();
        renderChart();
    }
}

function clearAllData() {
    if (confirm('Are you sure you want to delete ALL transaction data? This cannot be undone!')) {
        localStorage.removeItem('incomeData');
        incomeData = [];
        renderTable();
        updateStats();
        renderChart();
        alert('All data has been cleared!');
    }
}

function exportData() {
    if (incomeData.length === 0) {
        alert('No data to export!');
        return;
    }
    
    const dataStr = JSON.stringify(incomeData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `wealthtracker-data-${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
}

function getDayName(dateString) {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[new Date(dateString).getDay()];
}

function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
    });
}

function saveData() {
    localStorage.setItem('incomeData', JSON.stringify(incomeData));
}