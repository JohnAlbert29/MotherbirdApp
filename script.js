// Initialize data from localStorage or create empty array
let incomeData = JSON.parse(localStorage.getItem('incomeData')) || [];
let incomeChart = null;

const transactionsPerPage = 5;
let currentPage = 1;
let currentMonthView = new Date().getMonth();
let currentYearView = new Date().getFullYear();

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
    
    // Check if this is a new month
    const entryMonth = date.getMonth();
    const entryYear = date.getFullYear();
    if (entryMonth !== currentMonthView || entryYear !== currentYearView) {
        currentMonthView = entryMonth;
        currentYearView = entryYear;
        currentPage = 1;
    }
    
    renderTable();
    updateStats();
    renderChart();
    
    form.reset();
    setDefaultDateTime();
    document.getElementById('paper-money').focus();
}

function renderTable(showAll = false) {
    tableBody.innerHTML = '';
    
    if (incomeData.length === 0) {
        const row = document.createElement('tr');
        row.innerHTML = `<td colspan="6" style="text-align: center;">No transactions yet</td>`;
        tableBody.appendChild(row);
        return;
    }
    
    // Sort by date descending (newest first)
    incomeData.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    // Filter transactions for the current viewed month/year
    const filteredData = incomeData.filter(entry => {
        const entryDate = new Date(entry.date);
        return entryDate.getMonth() === currentMonthView && 
               entryDate.getFullYear() === currentYearView;
    });
    
    if (filteredData.length === 0) {
        const row = document.createElement('tr');
        row.innerHTML = `<td colspan="6" style="text-align: center;">No transactions for selected period</td>`;
        tableBody.appendChild(row);
        return;
    }
    
    // Show all transactions if showAll is true or if there are fewer than transactionsPerPage
    const dataToShow = showAll || filteredData.length <= transactionsPerPage 
        ? filteredData 
        : filteredData.slice(0, transactionsPerPage);
    
    // Display transactions
    dataToShow.forEach(entry => {
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
    
    // Add "View All" button if not showing all and there are more transactions
    if (!showAll && filteredData.length > transactionsPerPage) {
        addViewAllButton();
    }
    
    // Add month navigation controls
    addMonthNavigation();
    
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

function addViewAllButton() {
    const row = document.createElement('tr');
    row.innerHTML = `
        <td colspan="6" style="text-align: center;">
            <button id="view-all-btn" class="view-all-btn">View All Transactions</button>
        </td>
    `;
    tableBody.appendChild(row);
    
    document.getElementById('view-all-btn')?.addEventListener('click', function() {
        renderTable(true); // Pass true to show all transactions
    });
}

function addMonthNavigation() {
    const monthNames = ["January", "February", "March", "April", "May", "June",
                       "July", "August", "September", "October", "November", "December"];
    
    // Find the transaction history section
    const historySection = document.querySelector('.transaction-history');
    
    // Create or update month navigation
    let nav = document.querySelector('.month-navigation');
    if (!nav) {
        nav = document.createElement('div');
        nav.className = 'month-navigation';
        historySection.insertBefore(nav, historySection.querySelector('h2').nextSibling);
    }
    
    nav.innerHTML = `
        <button class="month-nav-btn prev-month">&lt; Previous</button>
        <span class="current-month">${monthNames[currentMonthView]} ${currentYearView}</span>
        <button class="month-nav-btn next-month">Next &gt;</button>
    `;
    
    // Add event listeners
    document.querySelector('.prev-month')?.addEventListener('click', function() {
        currentMonthView--;
        if (currentMonthView < 0) {
            currentMonthView = 11;
            currentYearView--;
        }
        currentPage = 1;
        renderTable();
    });
    
    document.querySelector('.next-month')?.addEventListener('click', function() {
        currentMonthView++;
        if (currentMonthView > 11) {
            currentMonthView = 0;
            currentYearView++;
        }
        currentPage = 1;
        renderTable();
    });
    
    // Disable next month button if it's in the future
    const nextMonthBtn = document.querySelector('.next-month');
    const currentDate = new Date();
    if (currentYearView > currentDate.getFullYear() || 
        (currentYearView === currentDate.getFullYear() && currentMonthView > currentDate.getMonth())) {
        nextMonthBtn.disabled = true;
        nextMonthBtn.style.opacity = '0.5';
        nextMonthBtn.style.cursor = 'not-allowed';
    }
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

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm'
    });

    // Set default font
    doc.setFont('helvetica', 'normal');

    // Add header
    doc.setFontSize(18);
    doc.setTextColor(42, 63, 84);
    doc.text('MOTHER BIRD TRACKING SYSTEM', 105, 15, { align: 'center' });
    
    doc.setFontSize(14);
    doc.setTextColor(100, 100, 100);
    doc.text('Sales Report', 105, 22, { align: 'center' });

    // Add report date
    doc.setFontSize(10);
    doc.text(`Generated: ${new Date().toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    })}`, 105, 28, { align: 'center' });

    // Add summary section with better layout
    doc.setFontSize(12);
    doc.setTextColor(40, 40, 40);
    doc.text('SUMMARY', 20, 40);
    doc.setDrawColor(200, 200, 200);
    doc.line(20, 42, 190, 42);

    // Summary boxes
    doc.setFillColor(240, 240, 240);
    doc.roundedRect(20, 45, 55, 20, 2, 2, 'F');
    doc.roundedRect(80, 45, 55, 20, 2, 2, 'F');
    doc.roundedRect(140, 45, 55, 20, 2, 2, 'F');

    // Summary content
    doc.setFontSize(11);
    doc.setTextColor(100, 100, 100);
    doc.text('Current Month', 27, 50);
    doc.text('Last Month', 87, 50);
    doc.text('Growth', 147, 50);

    doc.setFontSize(12);
    doc.setTextColor(40, 40, 40);
    doc.text(document.getElementById('monthly-total').textContent, 27, 58);
    doc.text(document.getElementById('last-month-total').textContent, 87, 58);
    
    const growthValue = parseFloat(document.getElementById('growth-percentage').textContent);
    if (growthValue >= 0) {
        doc.setTextColor(39, 174, 96); // Green
    } else {
        doc.setTextColor(231, 76, 60); // Red
    }
    doc.text(document.getElementById('growth-percentage').textContent, 147, 58);
    doc.setTextColor(40, 40, 40); // Reset color

    // Add transaction section with proper table
    doc.setFontSize(12);
    doc.text('TRANSACTION DETAILS', 20, 75);
    doc.line(20, 77, 190, 77);

    // Prepare data for the table
    const headers = [['Date', 'Day', 'Cash (₱)', 'Coins (₱)', 'Total (₱)']];
    const data = incomeData.map(entry => [
        formatSimpleDate(entry.date),
        entry.day.substring(0, 3),
        entry.paperMoney.toFixed(2),
        entry.coins.toFixed(2),
        entry.total.toFixed(2)
    ]);

    // Add the table
    doc.autoTable({
        startY: 80,
        head: headers,
        body: data,
        margin: { left: 20, right: 20 },
        styles: {
            fontSize: 9,
            cellPadding: 3,
            overflow: 'linebreak'
        },
        headStyles: {
            fillColor: [42, 63, 84],
            textColor: 255,
            fontStyle: 'bold'
        },
        alternateRowStyles: {
            fillColor: [240, 240, 240]
        },
        columnStyles: {
            0: { cellWidth: 25 },
            1: { cellWidth: 20 },
            2: { cellWidth: 25, halign: 'right' },
            3: { cellWidth: 25, halign: 'right' },
            4: { cellWidth: 25, halign: 'right' }
        },
        didDrawPage: function(data) {
            // Footer
            doc.setFontSize(9);
            doc.setTextColor(150, 150, 150);
            doc.text('Created by John Albert Retiza', 105, doc.internal.pageSize.height - 10, { align: 'center' });
            doc.text(`Page ${doc.internal.getNumberOfPages()}`, 105, doc.internal.pageSize.height - 5, { align: 'center' });
        }
    });

    // Add monthly summary chart
    const monthlyData = {};
    incomeData.forEach(entry => {
        const date = new Date(entry.date);
        const monthYear = `${date.toLocaleString('default', { month: 'short' })} ${date.getFullYear()}`;
        
        if (!monthlyData[monthYear]) {
            monthlyData[monthYear] = 0;
        }
        monthlyData[monthYear] += entry.total;
    });

    const chartLabels = Object.keys(monthlyData);
    const chartData = Object.values(monthlyData);

    if (chartLabels.length > 0) {
        doc.addPage();
        doc.setFontSize(12);
        doc.text('MONTHLY SUMMARY', 20, 20);
        doc.line(20, 22, 190, 22);

        // Create a simple bar chart representation
        const startX = 30;
        const startY = 40;
        const chartWidth = 150;
        const chartHeight = 100;
        const maxValue = Math.max(...chartData);
        const barWidth = chartWidth / chartLabels.length;

        // Draw axes
        doc.line(startX, startY, startX, startY + chartHeight);
        doc.line(startX, startY + chartHeight, startX + chartWidth, startY + chartHeight);

        // Draw bars and labels
        chartLabels.forEach((label, i) => {
            const barHeight = (chartData[i] / maxValue) * chartHeight;
            const x = startX + (i * barWidth) + 5;
            const y = startY + chartHeight - barHeight;
            
            // Bar
            doc.setFillColor(26, 187, 156);
            doc.rect(x, y, barWidth - 10, barHeight, 'F');
            
            // Value label
            doc.setFontSize(8);
            doc.setTextColor(40, 40, 40);
            doc.text(`₱${chartData[i].toFixed(2)}`, x + (barWidth/2) - 10, y - 5);
            
            // Month label
            doc.text(label, x + (barWidth/2) - 10, startY + chartHeight + 5);
        });

        // Add scale markers
        for (let i = 0; i <= 5; i++) {
            const y = startY + chartHeight - (i * (chartHeight / 5));
            doc.line(startX - 2, y, startX, y);
            doc.text(`₱${Math.round(maxValue * (i/5))}`, startX - 5, y, { align: 'right' });
        }
    }

    // Save PDF
    doc.save(`MotherBird_Sales_Report_${new Date().toISOString().split('T')[0]}.pdf`);
}

// Simple date format: Jul 25
function formatSimpleDate(dateString) {
    const date = new Date(dateString);
    const month = date.toLocaleString('default', { month: 'short' });
    return `${month} ${date.getDate()}`;
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