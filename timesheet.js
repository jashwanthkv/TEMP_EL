// Final Updated Google Apps Script Code with Employee ID Priority

function doGet(e) {
  try {
    var email = e.parameter.email;
    var password = e.parameter.password;
    var spreadsheetId = e.parameter.spreadsheetId;
    
    // Validate required parameters
    if (!email || !password) {
      return ContentService.createTextOutput(JSON.stringify({
        error: "Missing email or password parameter",
        current: [],
        leave_summary: { error: "Missing parameters" }
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    var result = getEmployeeByEmail(email, password, spreadsheetId);
    return ContentService.createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    Logger.log('Error in doGet: ' + error.toString());
    return ContentService.createTextOutput(JSON.stringify({
      error: "Server error: " + error.toString(),
      current: [],
      leave_summary: { error: "Server error" }
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

const SPREADSHEET_ID = "1WGvnJUF5n1ZoKHk5y8DzztYSuKhuNJBb-mquGwiRZ1w";

function getAllEmployees(spreadsheetId) {
  try {
    // Use provided spreadsheetId or fall back to default
    const sheetId = spreadsheetId || SPREADSHEET_ID;
    
    const sheet = SpreadsheetApp.openById(sheetId).getSheetByName('Employee');
    if (!sheet) {
      Logger.log("Sheet 'Employee' not found");
      return [];
    }

    const data = sheet.getDataRange().getValues();
    if (data.length < 2) {
      Logger.log("No employee data found");
      return [];
    }

    const headers = data[0].map(h => (h || '').toString().trim());
    Logger.log('Headers: ' + JSON.stringify(headers));

    const employees = data.slice(1)
      .filter(row => row.some(cell => cell !== ""))  // filter out completely empty rows
      .map(row => {
        let obj = {};
        headers.forEach((h, i) => obj[h] = row[i]);
        return obj;
      });
    
    Logger.log('Total employees found: ' + employees.length);
    return employees;
  } catch (error) {
    Logger.log('Error in getAllEmployees: ' + error.toString());
    return [];
  }
}

function getEmployeeByEmail(email, password, spreadsheetId) {
  try {
    if (!email) {
      Logger.log("No email provided");
      return { current: [], leave_summary: { error: "No email provided" } };
    }

    const employees = getAllEmployees(spreadsheetId);
    
    // Handle Google Auth case
    if (password === 'google_auth') {
      const current = employees.filter(emp => 
        (emp.EMAIL || '').toLowerCase().trim() === email.toLowerCase().trim()
      );
      
      if (current.length > 0) {
        const leave_summary = getLeaveSummary(current[0].EMP_ID);
        Logger.log('Google auth found employee: ' + JSON.stringify(current));
        return { current, leave_summary };
      } else {
        Logger.log('Google auth - no employee found for email: ' + email);
        return { current: [], leave_summary: { error: "Employee not found" } };
      }
    }
    
    // Handle regular email/password authentication
    const current = employees.filter(emp => 
      (emp.EMAIL || '').toLowerCase().trim() === email.toLowerCase().trim() &&
      (emp.PASSWORD || '').toString() === password.toString()
    );

    if (current.length > 0) {
      const leave_summary = getLeaveSummary(current[0].EMP_ID);
      Logger.log('Password auth found employee: ' + JSON.stringify(current));
      return { current, leave_summary };
    } else {
      Logger.log('Password auth - no employee found or wrong password for email: ' + email);
      return { current: [], leave_summary: { error: "Invalid credentials" } };
    }
  } catch (error) {
    Logger.log('Error in getEmployeeByEmail: ' + error.toString());
    return { current: [], leave_summary: { error: "Server error: " + error.toString() } };
  }
}

function getLeaveSummary(empId) {
  try {
    if (!empId) {
      return { error: "No employee ID provided" };
    }
    
    return {
      balance: 20,
      used: 5,
      pending: 2,
      available: 13
    };
  } catch (error) {
    Logger.log('Error in getLeaveSummary: ' + error.toString());
    return { error: "Failed to load leave summary" };
  }
}

function doPost(e) {
  try {
    Logger.log('=== DOPOST START ===');
    Logger.log('Raw e object: ' + JSON.stringify(e));
    Logger.log('e.parameter: ' + JSON.stringify(e.parameter));
    Logger.log('e.postData: ' + JSON.stringify(e.postData));
    
    // Handle both JSON and form POST data
    let data = {};
    
    if (e.postData && e.postData.contents) {
      try {
        // Try to parse as JSON
        data = JSON.parse(e.postData.contents);
        Logger.log('Parsed POST data as JSON: ' + JSON.stringify(data));
      } catch (jsonError) {
        Logger.log('JSON parsing failed, using form parameters');
        // If JSON parsing fails, treat as form data
        const params = e.parameter || {};
        data = params;
        Logger.log('Using form parameters: ' + JSON.stringify(data));
      }
    } else {
      // Use parameters directly
      data = e.parameter || {};
      Logger.log('Using direct parameters: ' + JSON.stringify(data));
    }

    Logger.log('Final processed data: ' + JSON.stringify(data));
    
    const action = data.action;
    const spreadsheetId = data.spreadsheetId; // Get spreadsheetId from request data
    
    if (!action) {
      Logger.log('No action specified in request');
      return ContentService.createTextOutput(JSON.stringify({ error: 'No action specified' }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    Logger.log('Processing action: ' + action);

    if (action === 'checkin') {
      Logger.log('Calling handleCheckIn with:', { email: data.email, empId: data.empId, project: data.project, task: data.task, start: data.start, spreadsheetId: spreadsheetId });
      const result = handleCheckIn(data.email, data.empId, data.project, data.task, data.start, spreadsheetId);
      Logger.log('CheckIn result: ' + JSON.stringify(result));
      return ContentService.createTextOutput(JSON.stringify(result))
        .setMimeType(ContentService.MimeType.JSON);
    }

    if (action === 'checkout') {
      Logger.log('Calling handleCheckOut with:', { email: data.email, empId: data.empId, end: data.end, spreadsheetId: spreadsheetId });
      const result = handleCheckOut(data.email, data.empId, data.end, spreadsheetId);
      Logger.log('CheckOut result: ' + JSON.stringify(result));
      return ContentService.createTextOutput(JSON.stringify(result))
        .setMimeType(ContentService.MimeType.JSON);
    }

    if (action === 'addEntry') {
      Logger.log('Calling handleAddEntry with:', { email: data.email, empId: data.empId, project: data.project, task: data.task, start: data.start, end: data.end, spreadsheetId: spreadsheetId });
      const result = handleAddEntry(data.email, data.empId, data.project, data.task, data.start, data.end, spreadsheetId);
      Logger.log('AddEntry result: ' + JSON.stringify(result));
      return ContentService.createTextOutput(JSON.stringify(result))
        .setMimeType(ContentService.MimeType.JSON);
    }

    if (action === 'getLogs') {
      Logger.log('Calling getEmployeeTimesheetLogs with:', { email: data.email, empId: data.empId, spreadsheetId: spreadsheetId });
      const result = getEmployeeTimesheetLogs(data.email, data.empId, spreadsheetId);
      Logger.log('GetLogs result: ' + JSON.stringify(result));
      return ContentService.createTextOutput(JSON.stringify(result))
        .setMimeType(ContentService.MimeType.JSON);
    }

    if (action === 'cleanup') {
      Logger.log('Calling cleanupDuplicateDateColumns with:', { spreadsheetId: spreadsheetId });
      const result = cleanupDuplicateDateColumns(spreadsheetId);
      Logger.log('Cleanup result: ' + JSON.stringify(result));
      return ContentService.createTextOutput(JSON.stringify(result))
        .setMimeType(ContentService.MimeType.JSON);
    }

    if (action === 'test') {
      Logger.log('Calling testGetLogs with:', { spreadsheetId: spreadsheetId });
      const result = testGetLogs(spreadsheetId);
      Logger.log('Test result: ' + JSON.stringify(result));
      return ContentService.createTextOutput(JSON.stringify(result))
        .setMimeType(ContentService.MimeType.JSON);
    }

    Logger.log('Unknown action: ' + action);
    return ContentService.createTextOutput(JSON.stringify({ error: 'Unknown action' }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    Logger.log('doPost error: ' + error.toString());
    Logger.log('Error stack: ' + error.stack);
    return ContentService.createTextOutput(JSON.stringify({ error: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  } finally {
    Logger.log('=== DOPOST END ===');
  }
}

function ensureTodayColumn(sheetId) {
  const spreadsheet = SpreadsheetApp.openById(sheetId);
  const sheet = spreadsheet.getSheetByName("Timesheet") || spreadsheet.getSheets()[0];
  const today = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd');
  
  Logger.log(`=== COLUMN CHECK START ===`);
  Logger.log(`Looking for today's date: ${today}`);
  
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000); // Wait up to 10 seconds for lock
    
    const maxCols = sheet.getMaxColumns();
    const headerRange = sheet.getRange(1, 1, 1, maxCols);
    const headers = headerRange.getValues()[0];
    
    Logger.log(`Current headers (${headers.length} columns): ${JSON.stringify(headers)}`);
    
    // Check if today's date already exists in any column
    for (let i = 0; i < headers.length; i++) {
      const headerValue = headers[i];
      let normalizedHeaderValue = '';
      
      if (headerValue) {
        if (headerValue instanceof Date) {
          normalizedHeaderValue = Utilities.formatDate(headerValue, Session.getScriptTimeZone(), 'yyyy-MM-dd');
        } else {
          normalizedHeaderValue = headerValue.toString().trim();
        }
        
        if (normalizedHeaderValue === today) {
          Logger.log(`Found today's date "${today}" in column ${i + 1}`);
          Logger.log(`=== COLUMN CHECK END - USING EXISTING ===`);
          return i + 1;
        }
      }
    }
    
    // Add today's date to the next available column
    let newColIndex = headers.length; // Start from the next column after existing ones
    for (let i = 0; i < headers.length; i++) {
      if (!headers[i] || headers[i].toString().trim() === '') {
        newColIndex = i;
        break;
      }
    }
    
    const targetCol = newColIndex + 1;
    sheet.getRange(1, targetCol).setValue(today);
    Logger.log(`Created new column for "${today}" at column ${targetCol}`);
    Logger.log(`=== COLUMN CHECK END - CREATED NEW ===`);
    
    return targetCol;
    
  } catch (e) {
    Logger.log('Error acquiring lock or processing: ' + e.toString());
    throw e;
  } finally {
    lock.releaseLock();
  }
}


// Utility: Find next empty row in a specific column (for a date)
function getNextEmptyRowInColumn(sheet, col) {
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return 2; // Only header exists
  const data = sheet.getRange(2, col, lastRow - 1, 1).getValues(); // skip header
  for (let i = 0; i < data.length; i++) {
    if (!data[i][0] || data[i][0].toString().trim() === '') {
      return i + 2; // +2: skip header and 0-based index
    }
  }
  return lastRow + 1;
}


function handleCheckIn(email, empId, project, task, start, spreadsheetId) {
  const lock = LockService.getScriptLock();
  lock.waitLock(5000);
  try {
    Logger.log("=== CHECK-IN START ===");
    Logger.log(`Email: ${email}, EmpId: ${empId}, Project: ${project}, Task: ${task}, Start: ${start}, SpreadsheetId: ${spreadsheetId}`);
    const sheetId = spreadsheetId || SPREADSHEET_ID;
    const spreadsheet = SpreadsheetApp.openById(sheetId);
    let sheet = spreadsheet.getSheetByName('Timesheet');
    if (!sheet) {
      sheet = spreadsheet.insertSheet('Timesheet');
    }
    const todayCol = ensureTodayColumn(sheetId);
    if (!todayCol) {
      return { error: "Today's date not found" };
    }
    // Find the next empty row in today's column (skip header)
    const nextRow = getNextEmptyRowInColumn(sheet, todayCol);
    const cell = sheet.getRange(nextRow, todayCol);
    const checkinData = `${project}|${task}|${start}|`;
    cell.setValue(checkinData);
    Logger.log(`Saved check-in data to cell (${nextRow}, ${todayCol}): ${checkinData}`);
    return {
      success: true,
      row: nextRow,
      column: todayCol,
      data: checkinData,
      message: `Check-in successful for ${project} - ${task} at ${start}`
    };
  } catch (err) {
    return { error: err.message };
  } finally {
    lock.releaseLock();
  }
}







function handleCheckOut(email, empId, end, spreadsheetId) {
  try {
    Logger.log(`=== CHECK-OUT START ===`);
    Logger.log(`Email: ${email}, EmpId: ${empId}, End: ${end}, SpreadsheetId: ${spreadsheetId}`);
    
    // Use provided spreadsheetId or fall back to default
    const sheetId = spreadsheetId || SPREADSHEET_ID;
    
    const sheet = SpreadsheetApp.openById(sheetId).getSheetByName('Timesheet');
    if (!sheet) {
      Logger.log('Timesheet sheet not found');
      return { error: 'Timesheet sheet not found' };
    }
    
    // Get today's column
    const todayCol = ensureTodayColumn(sheetId);
    Logger.log(`Using column ${todayCol} for today's date`);
    
    // Search through all rows in today's column to find an active entry (incomplete entry)
    const data = sheet.getDataRange().getValues();
    Logger.log(`Searching through ${data.length} rows for active entry in column ${todayCol}`);
    
    let foundEntry = false;
    let updatedEntryInfo = null;
    
    // Search through today's column for an incomplete entry
    for (let row = 2; row <= data.length; row++) { // Start from row 2 (skip headers)
      const cellValue = data[row - 1][todayCol - 1]; // Convert to 0-based indexing
      
      if (cellValue && typeof cellValue === 'string' && cellValue.trim() !== '') {
        const parts = cellValue.split('|');
        
        // Check if this is an incomplete entry (4 parts with empty end time)
        if (parts.length === 4 && parts[3] === '') {
          Logger.log(`Found active entry at row ${row}: ${cellValue}`);
          
          // Update the entry with end time
          const updatedData = `${parts[0]}|${parts[1]}|${parts[2]}|${end}`;
          const cell = sheet.getRange(row, todayCol);
          cell.setValue(updatedData);
          
          foundEntry = true;
          updatedEntryInfo = {
            row: row,
            column: todayCol,
            oldData: cellValue,
            newData: updatedData
          };
          
          Logger.log(`Updated entry:`);
          Logger.log(`  Before: ${cellValue}`);
          Logger.log(`  After: ${updatedData}`);
          break;
        }
      }
    }

    if (!foundEntry) {
      Logger.log(`No active check-in found in today's column to check out`);
      return { error: 'No active check-in found to check out. Please check in first.' };
    }
    
    Logger.log(`Check-out successful at ${end}`);
    Logger.log(`=== CHECK-OUT END ===`);
    
    return { 
      status: 'checkout_saved', 
      updatedEntryInfo,
      message: `Check-out successful at ${end}`
    };
  } catch (error) {
    Logger.log('Error in handleCheckOut: ' + error.toString());
    return { error: 'Failed to save check-out: ' + error.toString() };
  }
}


function handleAddEntry(email, empId, project, task, start, end, spreadsheetId) {
  try {
    Logger.log(`=== ADD ENTRY START ===`);
    Logger.log(`Email: ${email}, EmpId: ${empId}, Project: ${project}, Task: ${task}, Start: ${start}, End: ${end}, SpreadsheetId: ${spreadsheetId}`);
    const sheetId = spreadsheetId || SPREADSHEET_ID;
    let sheet = SpreadsheetApp.openById(sheetId).getSheetByName('Timesheet');
    if (!sheet) {
      sheet = SpreadsheetApp.openById(sheetId).insertSheet('Timesheet');
    }
    const todayCol = ensureTodayColumn(sheetId);
    const nextRow = getNextEmptyRowInColumn(sheet, todayCol);
    const cell = sheet.getRange(nextRow, todayCol);
    const entryData = `${project}|${task}|${start}|${end}`;
    cell.setValue(entryData);
    Logger.log(`Saved entry data to cell (${nextRow}, ${todayCol}): ${entryData}`);
    return {
      status: 'entry_added',
      row: nextRow,
      column: todayCol,
      data: entryData,
      message: `Entry added successfully for ${project} - ${task} from ${start} to ${end}`
    };
  } catch (error) {
    return { error: 'Failed to add entry: ' + error.toString() };
  }
}

function getEmployeeTimesheetLogs(email, empId, spreadsheetId) {
  try {
    Logger.log(`=== GET LOGS START ===`);
    Logger.log(`Fetching logs for email: ${email}, empId: ${empId}`);
    
    const sheetId = spreadsheetId || SPREADSHEET_ID;
    const sheet = SpreadsheetApp.openById(sheetId).getSheetByName('Timesheet');
    if (!sheet) {
      Logger.log('Timesheet sheet not found');
      return { error: 'Timesheet sheet not found' };
    }
    
    const data = sheet.getDataRange().getValues();
    if (data.length < 1) {
      Logger.log('No data in timesheet');
      return { logs: {} };
    }
    
    const headers = data[0];
    const logs = {};
    
    Logger.log(`Sheet has ${data.length} rows and ${headers.length} columns`);
    Logger.log(`Headers: ${JSON.stringify(headers)}`);
    
    // Get all date columns from headers
    const allAvailableDates = [];
    const dateColumns = [];
    
    for (let c = 0; c < headers.length; c++) {
      const headerValue = headers[c];
      if (headerValue) {
        let normalizedDate = '';
        
        if (headerValue instanceof Date) {
          normalizedDate = Utilities.formatDate(headerValue, Session.getScriptTimeZone(), 'yyyy-MM-dd');
        } else {
          const headerStr = headerValue.toString().trim();
          
          if (headerStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
            normalizedDate = headerStr;
          } else if (headerStr.match(/^\d{2}-\d{2}-\d{4}$/)) {
            const parts = headerStr.split('-');
            normalizedDate = `${parts[2]}-${parts[1]}-${parts[0]}`;
          } else if (headerStr.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
            const parts = headerStr.split('/');
            normalizedDate = `${parts[2]}-${parts[1]}-${parts[0]}`;
          }
        }
        
        if (normalizedDate && normalizedDate.trim() !== '' && normalizedDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
          allAvailableDates.push(normalizedDate);
          dateColumns.push({ date: normalizedDate, column: c });
        }
      }
    }
    
    Logger.log(`Found ${dateColumns.length} date columns: ${JSON.stringify(dateColumns)}`);
    
    // Search through all rows for entries in each date column
    for (const dateCol of dateColumns) {
      const columnEntries = [];
      
      // Go through all data rows (skip header row)
      for (let row = 1; row < data.length; row++) {
        const cellValue = data[row][dateCol.column];
        
        if (cellValue && typeof cellValue === 'string' && cellValue.trim() !== '') {
          // Parse the pipe-separated data: project|task|start|end
          const parts = cellValue.split('|');
          
          if (parts.length >= 3) { // At least project, task, and start time
            const entry = {
              project: parts[0] || '',
              task: parts[1] || '',
              start: parts[2] || '',
              end: parts[3] || null // End time might be empty for active entries
            };
            
            columnEntries.push(entry);
            Logger.log(`Found entry on ${dateCol.date} at row ${row + 1}: ${JSON.stringify(entry)}`);
          }
        }
      }
      
      if (columnEntries.length > 0) {
        logs[dateCol.date] = columnEntries;
        Logger.log(`Total entries for ${dateCol.date}: ${columnEntries.length}`);
      }
    }
    
    // Sort all dates chronologically 
    const allSortedDates = allAvailableDates.sort((a, b) => a.localeCompare(b));
    
    // Get last 7 days for default display
    const defaultDisplayDates = allSortedDates.slice(-7);
    
    Logger.log(`Total logs found: ${Object.keys(logs).length} days`);
    Logger.log(`Available dates in sheet: ${JSON.stringify(allAvailableDates)}`);
    Logger.log(`Default display dates (last 7): ${JSON.stringify(defaultDisplayDates)}`);
    Logger.log(`All logs: ${JSON.stringify(logs)}`);
    Logger.log(`=== GET LOGS END ===`);
    
    return { 
      logs: logs, 
      availableDates: defaultDisplayDates, // Last 7 days for default display
      allDates: allSortedDates // All dates available in chronological order
    };
  } catch (error) {
    Logger.log('Error in getEmployeeTimesheetLogs: ' + error.toString());
    return { error: 'Failed to retrieve timesheet logs: ' + error.toString() };
  }
}

// Cleanup function to remove duplicate date columns
// Cleanup function to remove duplicate date columns

// Function to clean up duplicate date columns (run this once to fix existing duplicates)
function cleanupDuplicateDateColumns(spreadsheetId) {
  try {
    const sheetId = spreadsheetId || SPREADSHEET_ID;
    const sheet = SpreadsheetApp.openById(sheetId).getSheetByName('Timesheet');
    if (!sheet) {
      Logger.log('Timesheet sheet not found');
      return { error: 'Timesheet sheet not found' };
    }
    
    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    
    Logger.log('=== CLEANUP START ===');
    Logger.log('Current headers: ' + JSON.stringify(headers));
    
    // Find all unique dates and their columns
    const dateColumns = new Map();
    const duplicateColumns = [];
    
    for (let i = 1; i < headers.length; i++) { // Start from column 1 (skip EMP_ID)
      const headerValue = headers[i];
      let normalizedDate = '';
      
      if (headerValue) {
        if (headerValue instanceof Date) {
          normalizedDate = Utilities.formatDate(headerValue, Session.getScriptTimeZone(), 'yyyy-MM-dd');
        } else {
          normalizedDate = headerValue.toString().trim();
        }
        
        // Check if this date already exists
        if (dateColumns.has(normalizedDate)) {
          // This is a duplicate
          duplicateColumns.push({ column: i + 1, date: normalizedDate });
          Logger.log(`Found duplicate date "${normalizedDate}" in column ${i + 1}`);
        } else {
          // First occurrence of this date
          dateColumns.set(normalizedDate, i + 1);
          Logger.log(`First occurrence of date "${normalizedDate}" in column ${i + 1}`);
        }
      }
    }
    
    if (duplicateColumns.length === 0) {
      Logger.log('No duplicate columns found');
      return { message: 'No duplicate columns found' };
    }
    
    // Merge data from duplicate columns into the first occurrence
    for (const duplicate of duplicateColumns) {
      const originalCol = dateColumns.get(duplicate.date);
      Logger.log(`Merging data from column ${duplicate.column} into column ${originalCol} for date "${duplicate.date}"`);
      
      // Go through each row and merge data
      for (let row = 2; row <= data.length; row++) {
        const originalCell = sheet.getRange(row, originalCol);
        const duplicateCell = sheet.getRange(row, duplicate.column);
        
        const originalValue = originalCell.getValue();
        const duplicateValue = duplicateCell.getValue();
        
        if (duplicateValue && duplicateValue !== '') {
          if (originalValue && originalValue !== '') {
            // Both have data, need to merge JSON arrays
            try {
              const originalLogs = JSON.parse(originalValue);
              const duplicateLogs = JSON.parse(duplicateValue);
              
              if (Array.isArray(originalLogs) && Array.isArray(duplicateLogs)) {
                const mergedLogs = [...originalLogs, ...duplicateLogs];
                originalCell.setValue(JSON.stringify(mergedLogs));
                Logger.log(`Merged logs for row ${row}: ${originalLogs.length} + ${duplicateLogs.length} = ${mergedLogs.length} entries`);
              }
            } catch (e) {
              Logger.log(`Error merging logs for row ${row}: ${e.toString()}`);
            }
          } else {
            // Only duplicate has data, copy it
            originalCell.setValue(duplicateValue);
            Logger.log(`Copied data from duplicate column to original for row ${row}`);
          }
          
          // Clear the duplicate cell
          duplicateCell.clear();
        }
      }
    }
    
    // Delete the duplicate columns (from right to left to maintain column indices)
    const columnsToDelete = duplicateColumns.map(d => d.column).sort((a, b) => b - a);
    for (const colIndex of columnsToDelete) {
      sheet.deleteColumn(colIndex);
      Logger.log(`Deleted duplicate column ${colIndex}`);
    }
    
    Logger.log('=== CLEANUP END ===');
    return { 
      message: `Cleaned up ${duplicateColumns.length} duplicate columns`,
      mergedColumns: duplicateColumns.length
    };
    
  } catch (error) {
    Logger.log('Error in cleanupDuplicateDateColumns: ' + error.toString());
    return { error: 'Failed to cleanup duplicate columns: ' + error.toString() };
  }
}

// Debug function to test data retrieval
function testGetLogs(spreadsheetId) {
  // Replace with actual test email and empId
  const testEmail = "test@example.com";
  const testEmpId = "EMP001";
  
  Logger.log('=== TESTING GET LOGS ===');
  const sheetId = spreadsheetId || SPREADSHEET_ID;
  const result = getEmployeeTimesheetLogs(testEmail, testEmpId, sheetId);
  Logger.log('Test result: ' + JSON.stringify(result));
  
  // Also test the sheet structure
  const sheet = SpreadsheetApp.openById(sheetId).getSheetByName('Timesheet');
  if (sheet) {
    const data = sheet.getDataRange().getValues();
    Logger.log('Sheet structure:');
    Logger.log('Headers: ' + JSON.stringify(data[0]));
    for (let i = 1; i < Math.min(5, data.length); i++) {
      Logger.log(`Row ${i + 1}: ${JSON.stringify(data[i])}`);
    }
  }
  
  return result;
}