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
    // Set current date display
    updateCurrentDate();
    
    // Set default date to today
    const today = new Date();
    document.getElementById('date').valueAsDate = today;
    
    // Set default time to current time
    const hours = today.getHours().toString().padStart(2, '0');
    const minutes = today.getMinutes().toString().padStart(2, '0');
    document.getElementById('time').value = `${hours}:${minutes}`;
    
    // Load and display data
    renderTable();
    updateStats();
    renderChart();
    
    // Form submission handler
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        addIncomeEntry();
    });
});

function updateCurrentDate() {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    currentDateEl.textContent = new Date().toLocaleDateString('en-US', options);
}

// Add new income entry
function addIncomeEntry() {
    const date = document.getElementById('date').value;
    const paperMoney = parseFloat(document.getElementById('paper-money').value) || 0;
    const coins = parseFloat(document.getElementById('coins').value) || 0;
    const time = document.getElementById('time').value;
    
    const newEntry = {
        id: Date.now(), // Unique ID for each entry
        date: date,
        day: getDayName(date),
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
    
    // Reset form but keep date and time
    form.reset();
    document.getElementById('date').valueAsDate = new Date();
    const now = new Date();
    document.getElementById('time').value = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    document.getElementById('paper-money').focus();
}

// Render the income table
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
        
        // Find comparison data (same day last month)
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

// Fixed comparison function
function getComparisonData(currentDate, currentDay) {
    const currentDateObj = new Date(currentDate);
    const lastMonth = new Date(currentDateObj);
    lastMonth.setMonth(lastMonth.getMonth() - 1);
    
    // Find all entries from last month with the same day name
    const lastMonthEntries = incomeData.filter(entry => {
        const entryDate = new Date(entry.date);
        return (
            entryDate.getMonth() === lastMonth.getMonth() &&
            entryDate.getFullYear() === lastMonth.getFullYear() &&
            entry.day === currentDay
        );
    });
    
    if (lastMonthEntries.length > 0) {
        // Find the entry closest to the same week number
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

// Helper to get week of month (1-5)
function getWeekOfMonth(date) {
    const firstDay = new Date(date.getFullYear(), date.getMonth(), 1).getDay();
    return Math.ceil((date.getDate() + firstDay) / 7);
}

// Edit an entry
function editEntry(id) {
    const entry = incomeData.find(item => item.id === id);
    if (!entry) return;
    
    document.getElementById('date').value = entry.date;
    document.getElementById('paper-money').value = entry.paperMoney;
    document.getElementById('coins').value = entry.coins;
    document.getElementById('time').value = entry.time;
    
    // Remove the entry being edited
    incomeData = incomeData.filter(item => item.id !== id);
    saveData();
    renderTable();
    updateStats();
    renderChart();
    
    document.getElementById('paper-money').focus();
}

// Delete an entry
function deleteEntry(id) {
    if (confirm('Are you sure you want to delete this entry?')) {
        incomeData = incomeData.filter(item => item.id !== id);
        saveData();
        renderTable();
        updateStats();
        renderChart();
    }
}

// Update the updateStats function in script.js
function updateStats() {
    const today = new Date().toISOString().split('T')[0];
    
    // Today's total - fixed to only include today's date
    const todayEntries = incomeData.filter(entry => entry.date === today);
    const todayTotal = todayEntries.reduce((sum, entry) => sum + entry.total, 0);
    todayTotalEl.textContent = `₱${todayTotal.toFixed(2)}`;
    
    // Weekly total (last 7 days)
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const weeklyTotal = incomeData
        .filter(entry => new Date(entry.date) >= oneWeekAgo)
        .reduce((sum, entry) => sum + entry.total, 0);
    weeklyTotalEl.textContent = `₱${weeklyTotal.toFixed(2)}`;
    
    // Monthly total (current month)
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const monthlyTotal = incomeData
        .filter(entry => {
            const entryDate = new Date(entry.date);
            return entryDate.getMonth() === currentMonth && 
                   entryDate.getFullYear() === currentYear;
        })
        .reduce((sum, entry) => sum + entry.total, 0);
    monthlyTotalEl.textContent = `₱${monthlyTotal.toFixed(2)}`;
}

// Render chart
function renderChart() {
    const ctx = document.getElementById('income-chart').getContext('2d');
    
    // Group data by date for chart
    const labels = incomeData.map(entry => formatDate(entry.date));
    const paperMoneyData = incomeData.map(entry => entry.paperMoney);
    const coinsData = incomeData.map(entry => entry.coins);
    const totalData = incomeData.map(entry => entry.total);
    
    // Destroy previous chart if it exists
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
                legend: {
                    position: 'top',
                },
                tooltip: {
                    callbacks: {
                        afterBody: function(context) {
                            const dataIndex = context[0].dataIndex;
                            const total = totalData[dataIndex];
                            return `Total: ₱${total.toFixed(2)}`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Amount (₱)'
                    },
                    ticks: {
                        callback: function(value) {
                            return '₱' + value;
                        }
                    }
                },
                x: {
                    grid: {
                        display: false
                    }
                }
            },
            animation: {
                duration: 1000
            }
        }
    });
}

// Helper function to get day name from date string
function getDayName(dateString) {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const date = new Date(dateString);
    return days[date.getDay()];
}

// Helper function to format date as MMM DD, YYYY
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
    });
}

// Helper function to format time (convert 24h to 12h)
function formatTime(timeString) {
    const [hours, minutes] = timeString.split(':');
    const period = hours >= 12 ? 'PM' : 'AM';
    const hours12 = hours % 12 || 12;
    return `${hours12}:${minutes} ${period}`;
}

// Save data to localStorage
function saveData() {
    localStorage.setItem('incomeData', JSON.stringify(incomeData));
}