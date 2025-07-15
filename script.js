// Initialize data from localStorage or create empty array
let incomeData = JSON.parse(localStorage.getItem('incomeData')) || [];
let incomeChart = null;

// DOM elements
const form = document.getElementById('income-form');
const tableBody = document.querySelector('#income-table tbody');
const todayTotalEl = document.getElementById('today-total');
const weeklyTotalEl = document.getElementById('weekly-total');
const monthlyTotalEl = document.getElementById('monthly-total');
const currentDateEl = document.getElementById('current-date');

// Initialize the app
document.addEventListener('DOMContentLoaded', function() {
    updateCurrentDate();
    setDefaultDateTime();
    renderTable();
    updateStats();
    renderChart();
    
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        addIncomeEntry();
    });
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
    incomeData.sort((a, b) => new Date(a.date) - new Date(b.date));
    
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
        row.innerHTML = `<td colspan="8" style="text-align: center;">No income entries yet. Add your first entry above.</td>`;
        tableBody.appendChild(row);
        return;
    }
    
    incomeData.forEach(entry => {
        const row = document.createElement('tr');
        const comparison = getComparisonData(entry.date, entry.day);
        let comparisonHtml = '<span class="text-muted">No data</span>';
        
        if (comparison) {
            const diff = entry.total - comparison.total;
            const percentChange = (diff / comparison.total) * 100;
            const changeClass = diff >= 0 ? 'comparison-up' : 'comparison-down';
            const changeSymbol = diff >= 0 ? '↑' : '↓';
            
            comparisonHtml = `
                <div>
                    <small>Last month: ₱${comparison.total.toFixed(2)}</small><br>
                    <span class="${changeClass}">
                        ${changeSymbol} ₱${Math.abs(diff).toFixed(2)} (${Math.abs(percentChange).toFixed(2)}%)
                    </span>
                </div>
            `;
        }
        
        row.innerHTML = `
            <td>${formatDate(entry.date)}</td>
            <td>${entry.day}</td>
            <td>₱${entry.paperMoney.toFixed(2)}</td>
            <td>₱${entry.coins.toFixed(2)}</td>
            <td><strong>₱${entry.total.toFixed(2)}</strong></td>
            <td>${formatTime(entry.time)}</td>
            <td>${comparisonHtml}</td>
            <td>
                <button class="action-btn edit-btn" data-id="${entry.id}">Edit</button>
                <button class="action-btn delete-btn" data-id="${entry.id}">Delete</button>
            </td>
        `;
        
        tableBody.appendChild(row);
    });
    
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

// FIXED: Today's income calculation
function updateStats() {
    // Get today's date in YYYY-MM-DD format
    const today = new Date();
    const todayString = today.toISOString().split('T')[0];
    
    // Today's total - sum all entries for today's date
    const todayTotal = incomeData
        .filter(entry => {
            // Compare dates as strings in YYYY-MM-DD format
            return entry.date === todayString;
        })
        .reduce((sum, entry) => sum + entry.total, 0);
    
    todayTotalEl.textContent = `₱${todayTotal.toFixed(2)}`;
    
    // Weekly total (last 7 days including today)
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 6); // 7 days total (6 days + today)
    
    const weeklyTotal = incomeData
        .filter(entry => {
            const entryDate = new Date(entry.date);
            return entryDate >= oneWeekAgo && entryDate <= today;
        })
        .reduce((sum, entry) => sum + entry.total, 0);
    
    weeklyTotalEl.textContent = `₱${weeklyTotal.toFixed(2)}`;
    
    // Monthly total (current month)
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    const monthlyTotal = incomeData
        .filter(entry => {
            const entryDate = new Date(entry.date);
            return entryDate.getMonth() === currentMonth && 
                   entryDate.getFullYear() === currentYear;
        })
        .reduce((sum, entry) => sum + entry.total, 0);
    
    monthlyTotalEl.textContent = `₱${monthlyTotal.toFixed(2)}`;
}

function renderChart() {
    const ctx = document.getElementById('income-chart').getContext('2d');
    const labels = incomeData.map(entry => formatDate(entry.date));
    const paperMoneyData = incomeData.map(entry => entry.paperMoney);
    const coinsData = incomeData.map(entry => entry.coins);
    const totalData = incomeData.map(entry => entry.total);
    
    if (incomeChart) {
        incomeChart.destroy();
    }
    
    incomeChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Paper Money',
                    data: paperMoneyData,
                    backgroundColor: 'rgba(44, 120, 115, 0.7)',
                    borderColor: 'rgba(44, 120, 115, 1)',
                    borderWidth: 1
                },
                {
                    label: 'Coins',
                    data: coinsData,
                    backgroundColor: 'rgba(255, 154, 86, 0.7)',
                    borderColor: 'rgba(255, 154, 86, 1)',
                    borderWidth: 1
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: 'Daily Income Breakdown',
                    font: {
                        size: 16
                    }
                },
                tooltip: {
                    callbacks: {
                        afterBody: function(context) {
                            const total = totalData[context[0].dataIndex];
                            return `Total: ₱${total.toFixed(2)}`;
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
    if (confirm('Are you sure you want to delete this entry?')) {
        incomeData = incomeData.filter(item => item.id !== id);
        saveData();
        renderTable();
        updateStats();
        renderChart();
    }
}

function getComparisonData(currentDate, currentDay) {
    const currentDateObj = new Date(currentDate);
    const lastMonth = new Date(currentDateObj);
    lastMonth.setMonth(lastMonth.getMonth() - 1);
    
    const lastMonthEntries = incomeData.filter(entry => {
        const entryDate = new Date(entry.date);
        return (
            entryDate.getMonth() === lastMonth.getMonth() &&
            entryDate.getFullYear() === lastMonth.getFullYear() &&
            entry.day === currentDay
        );
    });
    
    if (lastMonthEntries.length > 0) {
        const currentWeek = getWeekOfMonth(currentDateObj);
        lastMonthEntries.sort((a, b) => {
            const aWeek = getWeekOfMonth(new Date(a.date));
            const bWeek = getWeekOfMonth(new Date(b.date));
            return Math.abs(aWeek - currentWeek) - Math.abs(bWeek - currentWeek);
        });
        return lastMonthEntries[0];
    }
    
    return null;
}

function getWeekOfMonth(date) {
    const firstDay = new Date(date.getFullYear(), date.getMonth(), 1).getDay();
    return Math.ceil((date.getDate() + firstDay) / 7);
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

function formatTime(timeString) {
    const [hours, minutes] = timeString.split(':');
    const period = hours >= 12 ? 'PM' : 'AM';
    const hours12 = hours % 12 || 12;
    return `${hours12}:${minutes} ${period}`;
}

function saveData() {
    localStorage.setItem('incomeData', JSON.stringify(incomeData));
}