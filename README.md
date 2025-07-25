# MotherBirdApp - Sari-Sari Store Tracking System

A simple web application to track daily sales and income for small retail stores.

## Features

- **Daily Transaction Tracking**: Record cash and coin transactions
- **Monthly Statistics**: View current and previous month totals with growth percentage
- **Data Visualization**: Bar chart showing monthly income trends
- **Data Management**:
  - Automatic local storage (browser cache)
  - Import/Export data as JSON files
  - Export PDF reports
  - Clear all data

## How to Use

1. **Add Transactions**:
   - Enter the date, time, cash amount, and coins
   - Click "Add Transaction"

2. **View Data**:
   - Transaction history is displayed in a table
   - Navigate between months using the Previous/Next buttons

3. **Data Management**:
   - **Import Data**: Click "Import Data" to load previously saved data
   - **Export Data**: Click "Export Data" to save all data as a JSON file
   - **Export PDF**: Click "Export PDF" to generate a printable report
   - **Clear All**: Click "Clear All" to remove all data (cannot be undone)

## Technical Details

- Built with HTML, CSS, and JavaScript
- Uses localStorage for persistent data storage
- Charts powered by Chart.js
- PDF generation with jsPDF and AutoTable
- Responsive design works on mobile and desktop

Created by John Albert Retiza