// ========== CONFIGURATION ==========
const SHEET_LEAVE_REQUESTS = 'LeaveRequests';
const SHEET_LEAVE_SUMMARY = 'LeaveSummary';

// Expected Google Sheets structure:
// LeaveRequests: Timestamp | Leave Type | From Date | To Date | Reason | Day Type | Leave Days | Status
// LeaveSummary: Sick | Sick Used | Sick Remaining | Casual | Casual Used | Casual Remaining | Earned | Earned Used | Earned Remaining | Compensation | Compensation Used | Compensation Remaining
//               12   | 0        | 12            | 7      | 0          | 7               | 2      | 0         | 2              | 4            | 0               | 4

// ========== ENTRY POINTS ==========

// Handle GET requests
function doGet(e) {
  const sheetId = e.parameter.sheetId;
  const callback = e.parameter.callback;
  const action = e.parameter.action;
  
  if (!sheetId) {
    const errorData = JSON.stringify({ error: "Missing sheetId" });
    if (callback) {
      return ContentService.createTextOutput(`${callback}(${errorData})`)
        .setMimeType(ContentService.MimeType.JAVASCRIPT);
    }
    return errorResponse("Missing sheetId");
  }

  try {
    const ss = SpreadsheetApp.openById(sheetId);
    
    // Initialize LeaveSummary sheet if needed
    initializeLeaveSummary(ss);
    
    // Handle different actions
    if (action === 'validateLeave') {
      return handleLeaveValidation(e, ss, callback);
    }
    
    if (action === 'syncBalance') {
      return handleBalanceSync(e, ss, callback);
    }
    
    if (action === 'checkLeaveUpdates') {
      return handleLeaveUpdates(e, ss, callback);
    }
    
    // Default: return history and balance (with auto-sync using comprehensive function)
    updateLeaveSummaryFromApprovedRequests(ss);
    const leaveHistory = getLeaveHistory(ss);
    const leaveBalance = getLeaveBalance(ss);

    const responseData = JSON.stringify({
      leaveHistory,
      leaveBalance
    });

    // Return JSONP response if callback is provided
    if (callback) {
      return ContentService.createTextOutput(`${callback}(${responseData})`)
        .setMimeType(ContentService.MimeType.JAVASCRIPT);
    }

    // Regular JSON response
    return ContentService.createTextOutput(responseData)
      .setMimeType(ContentService.MimeType.JSON)
      .setHeaders(corsHeaders());
  } catch (err) {
    const errorData = JSON.stringify({ error: "Invalid sheetId or error opening sheet." });
    if (callback) {
      return ContentService.createTextOutput(`${callback}(${errorData})`)
        .setMimeType(ContentService.MimeType.JAVASCRIPT);
    }
    return errorResponse("Invalid sheetId or error opening sheet.");
  }
}

// Handle POST requests
function doPost(e) {
  const sheetId = e.parameter.sheetId;
  if (!sheetId) return errorResponse("Missing sheetId");

  try {
    // Handle both JSON and form data
    let data;
    if (e.postData && e.postData.contents) {
      try {
        // Try to parse as JSON first
        data = JSON.parse(e.postData.contents);
      } catch (jsonError) {
        // If JSON parsing fails, use form parameters
        data = e.parameter;
      }
    } else {
      // Use form parameters
      data = e.parameter;
    }

    const { leaveType, fromDate, toDate, reason, dayType } = data;

    // Validate required fields
    if (!leaveType || !fromDate || !toDate || !reason || !dayType) {
      return errorResponse("Missing required fields");
    }

    // Validate date format and logic
    const fromDateObj = new Date(fromDate);
    const toDateObj = new Date(toDate);
    
    if (isNaN(fromDateObj.getTime()) || isNaN(toDateObj.getTime())) {
      return errorResponse("Invalid date format");
    }
    
    if (fromDateObj > toDateObj) {
      return errorResponse("From date cannot be after to date");
    }

    const ss = SpreadsheetApp.openById(sheetId);
    const sheet = ss.getSheetByName(SHEET_LEAVE_REQUESTS);
    
    // Create headers if sheet is empty
    if (sheet.getLastRow() === 0) {
      sheet.appendRow([
        'Timestamp', 'Leave Type', 'From Date', 'To Date', 
        'Reason', 'Day Type', 'Leave Days', 'Status'
      ]);
    }

    const leaveDays = calculateLeaveDays(fromDate, toDate, dayType);
    
    // Add the leave request
    sheet.appendRow([
      new Date(), 
      leaveType, 
      fromDate, 
      toDate, 
      reason, 
      dayType, 
      leaveDays, 
      'Pending'
    ]);

    return ContentService.createTextOutput(JSON.stringify({ 
      success: true, 
      message: 'Leave request submitted successfully',
      data: {
        leaveType,
        fromDate,
        toDate,
        leaveDays,
        status: 'Pending'
      }
    }))
      .setMimeType(ContentService.MimeType.JSON)
      .setHeaders(corsHeaders());
  } catch (err) {
    return errorResponse("Failed to process leave request: " + err.message);
  }
}

// Handle CORS preflight requests
function doOptions(e) {
  return ContentService.createTextOutput("")
    .setMimeType(ContentService.MimeType.TEXT)
    .setHeaders(corsHeaders());
}

// ========== HELPERS ==========

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  };
}

function errorResponse(message) {
  return ContentService.createTextOutput(JSON.stringify({ error: message }))
    .setMimeType(ContentService.MimeType.JSON)
    .setHeaders(corsHeaders());
}

function calculateLeaveDays(fromDateStr, toDateStr, dayType) {
  try {
    const fromDate = new Date(fromDateStr);
    const toDate = new Date(toDateStr);
    
    // Validate dates
    if (isNaN(fromDate.getTime()) || isNaN(toDate.getTime())) {
      return 0;
    }
    
    if (fromDate > toDate) {
      return 0;
    }
    
    // Calculate total days (inclusive)
    let totalDays = Math.floor((toDate - fromDate) / (1000 * 60 * 60 * 24)) + 1;
    
    // Handle day type
    if (dayType === 'Half Day') {
      // For half day, return half of the calculated days
      return totalDays / 2;
    }
    
    return totalDays;
  } catch (error) {
    console.error('Error calculating leave days:', error);
    return 0;
  }
}

function getLeaveHistory(ss) {
  const sheet = ss.getSheetByName(SHEET_LEAVE_REQUESTS);
  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return [];

  const headers = data[0];
  return data.slice(1).map(row => {
    const record = {};
    headers.forEach((key, idx) => {
      record[key.toLowerCase()] = row[idx];
    });
    return record;
  });
}

function getLeaveBalance(ss) {
  const summarySheet = ss.getSheetByName(SHEET_LEAVE_SUMMARY);
  const leaveSheet = ss.getSheetByName(SHEET_LEAVE_REQUESTS);
  
  const headers = summarySheet.getRange(1, 1, 1, summarySheet.getLastColumn()).getValues()[0];
  const values = summarySheet.getRange(2, 1, 1, summarySheet.getLastColumn()).getValues()[0];

  console.log('getLeaveBalance - headers:', headers);
  console.log('getLeaveBalance - values:', values);

  const balance = {};
  headers.forEach((type, index) => {
    balance[type] = values[index] || 0;
  });

  // Try multiple possible column naming patterns for used leave
  const possibleColumnMappings = [
    // Pattern 1: Direct T columns (CST, ST, ET, CT) - various cases
    {
      'Casual': ['CST', 'CsT', 'cst', 'Cst'],
      'Sick': ['ST', 'St', 'st', 'sT'],
      'Earned': ['ET', 'Et', 'et', 'eT'], 
      'Compensation': ['CT', 'Ct', 'ct', 'cT']
    },
    // Pattern 2: Standard "Used" columns
    {
      'Casual': ['Casual Used', 'casual used', 'CASUAL USED'],
      'Sick': ['Sick Used', 'sick used', 'SICK USED'],
      'Earned': ['Earned Used', 'earned used', 'EARNED USED'],
      'Compensation': ['Compensation Used', 'compensation used', 'COMPENSATION USED']
    },
    // Pattern 3: Position-based (assume specific column positions)
    {
      'Casual': [4], // Column E (0-indexed)
      'Sick': [5],   // Column F (0-indexed)
      'Earned': [6], // Column G (0-indexed)
      'Compensation': [7] // Column H (0-indexed)
    }
  ];
  
  const leaveTypes = ['Sick', 'Casual', 'Earned', 'Compensation'];
  
  for (const leaveType of leaveTypes) {
    const usedKey = leaveType + ' Used';
    const remainingKey = leaveType + ' Remaining';
    let usedValue = 0;
    let foundUsedColumn = false;
    
    // Try each mapping pattern to find the used column
    for (const mapping of possibleColumnMappings) {
      const columnIdentifiers = mapping[leaveType];
      let columnIndex = -1;
      let foundColumn = null;
      
      if (Array.isArray(columnIdentifiers)) {
        // Try each possible column name/position
        for (const identifier of columnIdentifiers) {
          if (typeof identifier === 'string') {
            // String-based column name
            columnIndex = headers.indexOf(identifier);
            if (columnIndex !== -1) {
              foundColumn = identifier;
              break;
            }
          } else if (typeof identifier === 'number') {
            // Position-based column index
            if (identifier < values.length) {
              columnIndex = identifier;
              foundColumn = `position-${identifier}`;
              break;
            }
          }
        }
      }
      
      if (columnIndex !== -1 && columnIndex < values.length) {
        usedValue = values[columnIndex] || 0;
        foundUsedColumn = true;
        console.log(`Found ${leaveType} used value: ${usedValue} from column ${columnIndex} (${foundColumn})`);
        break;
      }
    }
    
    // If no used column found, calculate from approved requests
    if (!foundUsedColumn) {
      console.log(`No used column found for ${leaveType}, calculating from approved requests`);
      const leaveData = leaveSheet.getDataRange().getValues();
      
      if (leaveData.length > 1) {
        const leaveHeaders = leaveData[0];
        const statusIndex = leaveHeaders.indexOf('Status');
        const typeIndex = leaveHeaders.indexOf('Leave Type');
        const daysIndex = leaveHeaders.indexOf('Leave Days');
        const fromDateIndex = leaveHeaders.indexOf('From Date');
        const timestampIndex = leaveHeaders.indexOf('Timestamp');

        // Track processed entries by unique key for consistency with sync function
        const processedEntries = new Set();

        // Count approved leave days for this type with uniqueness
        for (let i = 1; i < leaveData.length; i++) {
          const row = leaveData[i];
          const status = row[statusIndex];
          const rowLeaveType = row[typeIndex];
          const days = parseFloat(row[daysIndex]) || 0;
          const fromDate = row[fromDateIndex];
          const timestamp = row[timestampIndex];
          
          // Create unique key using fromDate and timestamp
          const uniqueKey = `${fromDate}_${timestamp}_${rowLeaveType}_${days}`;
          
          if (status === 'Approved' && rowLeaveType === leaveType) {
            // Check if we've already processed this exact entry
            if (!processedEntries.has(uniqueKey)) {
              usedValue += days;
              processedEntries.add(uniqueKey);
            }
          }
        }
      }
    }
    
    balance[usedKey] = usedValue;
    
    // Calculate remaining
    const total = balance[leaveType] || 0;
    balance[remainingKey] = total - usedValue;
    
    console.log(`${leaveType}: Total=${total}, Used=${usedValue}, Remaining=${balance[remainingKey]}`);
  }

  return balance;
}

// Initialize LeaveSummary sheet with proper structure
function initializeLeaveSummary(ss) {
  let summarySheet = ss.getSheetByName(SHEET_LEAVE_SUMMARY);
  
  if (!summarySheet) {
    // Create the sheet if it doesn't exist
    summarySheet = ss.insertSheet(SHEET_LEAVE_SUMMARY);
  }
  
  // Check if sheet is empty and initialize
  if (summarySheet.getLastRow() === 0) {
    // Set up headers
    summarySheet.getRange(1, 1, 1, 12).setValues([[
      'Sick', 'Sick Used', 'Sick Remaining',
      'Casual', 'Casual Used', 'Casual Remaining', 
      'Earned', 'Earned Used', 'Earned Remaining',
      'Compensation', 'Compensation Used', 'Compensation Remaining'
    ]]);
    
    // Set up default values (you can modify these)
    summarySheet.getRange(2, 1, 1, 12).setValues([[
      12, 0, 12,  // Sick: 12 total, 0 used, 12 remaining
      7, 0, 7,    // Casual: 7 total, 0 used, 7 remaining
      2, 0, 2,    // Earned: 2 total, 0 used, 2 remaining
      4, 0, 4     // Compensation: 4 total, 0 used, 4 remaining
    ]]);
    
    // Format headers
    const headerRange = summarySheet.getRange(1, 1, 1, 12);
    headerRange.setFontWeight('bold');
    headerRange.setBackground('#e8f0fe');
  }
  
  return summarySheet;
}

// Sync approved leaves to LeaveSummary sheet
function syncApprovedLeavesToSummary(ss) {
  try {
    const summarySheet = ss.getSheetByName(SHEET_LEAVE_SUMMARY);
    const leaveSheet = ss.getSheetByName(SHEET_LEAVE_REQUESTS);
    
    if (!summarySheet || !leaveSheet) {
      console.log('Missing sheets - Summary:', !!summarySheet, 'Leave:', !!leaveSheet);
      return;
    }
    
    // Get all leave data
    const leaveData = leaveSheet.getDataRange().getValues();
    console.log('Leave data rows:', leaveData.length);
    
    if (leaveData.length <= 1) {
      console.log('No leave data to sync');
      return; // No data to sync
    }
    
    const leaveHeaders = leaveData[0];
    console.log('Leave headers:', leaveHeaders);
    
    const statusIndex = leaveHeaders.indexOf('Status');
    const typeIndex = leaveHeaders.indexOf('Leave Type');
    const daysIndex = leaveHeaders.indexOf('Leave Days');
    const fromDateIndex = leaveHeaders.indexOf('From Date');
    const timestampIndex = leaveHeaders.indexOf('Timestamp');
    
    console.log('Column indices - Status:', statusIndex, 'Type:', typeIndex, 'Days:', daysIndex, 'FromDate:', fromDateIndex, 'Timestamp:', timestampIndex);
    
    if (statusIndex === -1 || typeIndex === -1 || daysIndex === -1 || fromDateIndex === -1) {
      console.log('Missing required columns');
      return;
    }
    
    // Calculate total used leave for each type with uniqueness tracking
    const usedLeave = {
      'Sick': 0,
      'Casual': 0,
      'Earned': 0,
      'Compensation': 0
    };
    
    // Track processed entries by unique key (fromDate + timestamp for ultimate uniqueness)
    const processedEntries = new Set();
    
    // Count all approved leave days
    for (let i = 1; i < leaveData.length; i++) {
      const row = leaveData[i];
      const status = row[statusIndex];
      const leaveType = row[typeIndex];
      const days = parseFloat(row[daysIndex]) || 0;
      const fromDate = row[fromDateIndex];
      const timestamp = row[timestampIndex];
      
      // Create unique key using fromDate and timestamp for better uniqueness
      const uniqueKey = `${fromDate}_${timestamp}_${leaveType}_${days}`;
      
      console.log(`Row ${i}: Status="${status}", Type="${leaveType}", Days=${days}, FromDate="${fromDate}", UniqueKey="${uniqueKey}"`);
      
      if (status === 'Approved') {
        // Check if we've already processed this exact entry
        if (processedEntries.has(uniqueKey)) {
          console.log(`Skipping duplicate entry: ${uniqueKey}`);
          continue;
        }
        
        if (usedLeave.hasOwnProperty(leaveType)) {
          usedLeave[leaveType] += days;
          processedEntries.add(uniqueKey);
          console.log(`Added ${days} days to ${leaveType}, total now: ${usedLeave[leaveType]} (UniqueKey: ${uniqueKey})`);
        } else {
          console.log(`Unknown leave type: ${leaveType}`);
        }
      }
    }
    
    console.log('Final calculated used leave:', usedLeave);
    console.log('Total processed unique entries:', processedEntries.size);
    
    // Get actual summary sheet structure
    const summaryHeaders = summarySheet.getRange(1, 1, 1, summarySheet.getLastColumn()).getValues()[0];
    const summaryValues = summarySheet.getRange(2, 1, 1, summarySheet.getLastColumn()).getValues()[0];
    console.log('Summary headers:', summaryHeaders);
    console.log('Summary values before update:', summaryValues);
    
    // Try multiple possible column naming patterns
    const possibleColumnMappings = [
      // Pattern 1: Direct T columns (CST, ST, ET, CT) - various cases
      {
        'Casual': ['CST', 'CsT', 'cst', 'Cst'],
        'Sick': ['ST', 'St', 'st', 'sT'],
        'Earned': ['ET', 'Et', 'et', 'eT'], 
        'Compensation': ['CT', 'Ct', 'ct', 'cT']
      },
      // Pattern 2: Standard "Used" columns
      {
        'Casual': ['Casual Used', 'casual used', 'CASUAL USED'],
        'Sick': ['Sick Used', 'sick used', 'SICK USED'],
        'Earned': ['Earned Used', 'earned used', 'EARNED USED'],
        'Compensation': ['Compensation Used', 'compensation used', 'COMPENSATION USED']
      },
      // Pattern 3: Position-based (assume specific column positions)
      {
        'Casual': [4], // Column E (0-indexed)
        'Sick': [5],   // Column F (0-indexed)
        'Earned': [6], // Column G (0-indexed)
        'Compensation': [7] // Column H (0-indexed)
      }
    ];
    
    let updateSuccess = false;
    
    // Try each mapping pattern
    for (let patternIndex = 0; patternIndex < possibleColumnMappings.length; patternIndex++) {
      const mapping = possibleColumnMappings[patternIndex];
      console.log(`Trying mapping pattern ${patternIndex + 1}:`, mapping);
      
      for (const leaveType of Object.keys(usedLeave)) {
        const columnIdentifiers = mapping[leaveType];
        let columnIndex = -1;
        let foundColumn = null;
        
        if (Array.isArray(columnIdentifiers)) {
          // Try each possible column name/position
          for (const identifier of columnIdentifiers) {
            if (typeof identifier === 'string') {
              // String-based column name
              columnIndex = summaryHeaders.indexOf(identifier);
              if (columnIndex !== -1) {
                foundColumn = identifier;
                break;
              }
            } else if (typeof identifier === 'number') {
              // Position-based column index
              if (identifier < summaryHeaders.length) {
                columnIndex = identifier;
                foundColumn = `position-${identifier}`;
                break;
              }
            }
          }
        }
        
        console.log(`${leaveType} - Looking for columns ${JSON.stringify(columnIdentifiers)}, found "${foundColumn}" at index:`, columnIndex);
        
        if (columnIndex !== -1 && columnIndex < summaryHeaders.length) {
          try {
            summarySheet.getRange(2, columnIndex + 1).setValue(usedLeave[leaveType]);
            console.log(`✅ Successfully set ${leaveType} to ${usedLeave[leaveType]} at column ${columnIndex + 1} (${summaryHeaders[columnIndex]})`);
            updateSuccess = true;
          } catch (updateError) {
            console.log(`❌ Failed to update ${leaveType} at column ${columnIndex + 1}:`, updateError.message);
          }
        } else {
          console.log(`❌ ${leaveType} - No matching column found`);
        }
      }
      
      if (updateSuccess) {
        console.log(`✅ Pattern ${patternIndex + 1} worked, stopping here`);
        break;
      }
    }
    
    // Verify the update
    const summaryValuesAfter = summarySheet.getRange(2, 1, 1, summarySheet.getLastColumn()).getValues()[0];
    console.log('Summary values after update:', summaryValuesAfter);
    
    if (!updateSuccess) {
      console.log('❌ All mapping patterns failed. Sheet may have different structure than expected.');
      // As a last resort, try to update any columns that contain numbers and match our totals
      console.log('Attempting fallback update strategy...');
      for (let col = 0; col < summaryHeaders.length; col++) {
        const headerName = summaryHeaders[col];
        console.log(`Column ${col + 1}: "${headerName}" = ${summaryValues[col]}`);
      }
    }
    
    console.log('Approved leaves synced to summary sheet T columns:', usedLeave);
    return {
      usedLeave,
      processedCount: processedEntries.size,
      uniqueEntries: Array.from(processedEntries),
      updateSuccess,
      summaryHeaders,
      summaryValuesBefore: summaryValues,
      summaryValuesAfter: summaryValuesAfter
    };
    
  } catch (err) {
    console.error('Error syncing approved leaves:', err.message, err.stack);
    return null;
  }
}

// Handle balance sync requests
function handleLeaveUpdates(e, ss, callback) {
  try {
    console.log('=== CHECKING AUTOMATIC LEAVE UPDATES ===');
    
    const summarySheet = ss.getSheetByName(SHEET_LEAVE_SUMMARY);
    if (!summarySheet) {
      const errorData = JSON.stringify({ error: "LeaveSummary sheet not found" });
      if (callback) {
        return ContentService.createTextOutput(`${callback}(${errorData})`)
          .setMimeType(ContentService.MimeType.JAVASCRIPT);
      }
      return errorResponse("LeaveSummary sheet not found");
    }

    const today = new Date();
    const currentDate = today.getDate();
    const currentMonth = today.getMonth(); // 0-based (0 = January)
    const currentYear = today.getFullYear();
    
    console.log(`Current date: ${currentDate}, month: ${currentMonth}, year: ${currentYear}`);
    
    // Get or create last update tracking
    const updateTrackingSheet = getOrCreateUpdateTrackingSheet(ss);
    const lastUpdates = getLastUpdateDates(updateTrackingSheet);
    
    let updates = [];
    let balanceUpdated = false;
    
    // Check for monthly earned leave update (1st of each month)
    if (currentDate === 1) {
      const lastEarnedUpdate = lastUpdates.lastEarnedUpdate;
      const currentMonthYear = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`;
      
      if (!lastEarnedUpdate || !lastEarnedUpdate.includes(currentMonthYear)) {
        console.log('Applying monthly earned leave increase (+0.5)');
        const earnedUpdated = updateEarnedLeave(summarySheet, 0.5);
        if (earnedUpdated) {
          updates.push('Added 0.5 to Earned Leave (monthly increase)');
          updateLastEarnedUpdate(updateTrackingSheet, currentMonthYear);
          balanceUpdated = true;
        }
      } else {
        console.log('Earned leave already updated for this month');
      }
    }
    
    // Check for yearly reset (January 1st)
    if (currentMonth === 0 && currentDate === 1) { // January 1st
      const lastYearlyReset = lastUpdates.lastYearlyReset;
      
      if (!lastYearlyReset || !lastYearlyReset.includes(String(currentYear))) {
        console.log('Applying yearly reset for sick and casual leave');
        const resetUpdated = resetSickAndCasualUsage(summarySheet);
        if (resetUpdated) {
          updates.push('Reset Sick and Casual leave usage (yearly reset)');
          updateLastYearlyReset(updateTrackingSheet, String(currentYear));
          balanceUpdated = true;
        }
      } else {
        console.log('Yearly reset already applied for this year');
      }
    }
    
    const responseData = JSON.stringify({
      updated: balanceUpdated,
      updates: updates,
      message: balanceUpdated ? 'Leave balances updated automatically' : 'No updates needed'
    });
    
    if (callback) {
      return ContentService.createTextOutput(`${callback}(${responseData})`)
        .setMimeType(ContentService.MimeType.JAVASCRIPT);
    }
    
    return ContentService.createTextOutput(responseData)
      .setMimeType(ContentService.MimeType.JSON)
      .setHeaders(corsHeaders());
      
  } catch (err) {
    console.error('Error in handleLeaveUpdates:', err);
    const errorData = JSON.stringify({ error: "Update check failed: " + err.message });
    if (callback) {
      return ContentService.createTextOutput(`${callback}(${errorData})`)
        .setMimeType(ContentService.MimeType.JAVASCRIPT);
    }
    return errorResponse("Update check failed");
  }
}

// Helper functions for leave updates
function getOrCreateUpdateTrackingSheet(ss) {
  let trackingSheet = ss.getSheetByName('LeaveUpdateTracking');
  if (!trackingSheet) {
    trackingSheet = ss.insertSheet('LeaveUpdateTracking');
    trackingSheet.getRange(1, 1, 1, 2).setValues([['UpdateType', 'LastUpdate']]);
    trackingSheet.getRange(2, 1, 2, 2).setValues([
      ['EarnedLeave', ''],
      ['YearlyReset', '']
    ]);
  }
  return trackingSheet;
}

function getLastUpdateDates(trackingSheet) {
  const data = trackingSheet.getDataRange().getValues();
  const updates = {
    lastEarnedUpdate: '',
    lastYearlyReset: ''
  };
  
  for (let i = 1; i < data.length; i++) {
    const [updateType, lastUpdate] = data[i];
    if (updateType === 'EarnedLeave') {
      updates.lastEarnedUpdate = lastUpdate;
    } else if (updateType === 'YearlyReset') {
      updates.lastYearlyReset = lastUpdate;
    }
  }
  
  return updates;
}

function updateEarnedLeave(summarySheet, increaseAmount) {
  try {
    const headers = summarySheet.getRange(1, 1, 1, summarySheet.getLastColumn()).getValues()[0];
    const values = summarySheet.getRange(2, 1, 1, summarySheet.getLastColumn()).getValues()[0];
    
    const earnedIndex = headers.indexOf('Earned');
    if (earnedIndex !== -1) {
      const currentEarned = values[earnedIndex] || 0;
      const newEarned = currentEarned + increaseAmount;
      summarySheet.getRange(2, earnedIndex + 1).setValue(newEarned);
      console.log(`Earned leave updated: ${currentEarned} -> ${newEarned}`);
      return true;
    }
    
    console.log('Earned leave column not found');
    return false;
  } catch (error) {
    console.error('Error updating earned leave:', error);
    return false;
  }
}

function resetSickAndCasualUsage(summarySheet) {
  try {
    const headers = summarySheet.getRange(1, 1, 1, summarySheet.getLastColumn()).getValues()[0];
    let resetCount = 0;
    
    // Reset Sick Used
    const sickUsedPatterns = ['Sick Used', 'ST', 'St', 'st'];
    for (const pattern of sickUsedPatterns) {
      const index = headers.indexOf(pattern);
      if (index !== -1) {
        summarySheet.getRange(2, index + 1).setValue(0);
        console.log(`Reset ${pattern} to 0`);
        resetCount++;
        break;
      }
    }
    
    // Reset Casual Used
    const casualUsedPatterns = ['Casual Used', 'CST', 'CsT', 'cst'];
    for (const pattern of casualUsedPatterns) {
      const index = headers.indexOf(pattern);
      if (index !== -1) {
        summarySheet.getRange(2, index + 1).setValue(0);
        console.log(`Reset ${pattern} to 0`);
        resetCount++;
        break;
      }
    }
    
    return resetCount > 0;
  } catch (error) {
    console.error('Error resetting sick and casual usage:', error);
    return false;
  }
}

function updateLastEarnedUpdate(trackingSheet, monthYear) {
  const data = trackingSheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === 'EarnedLeave') {
      trackingSheet.getRange(i + 1, 2).setValue(monthYear);
      break;
    }
  }
}

function updateLastYearlyReset(trackingSheet, year) {
  const data = trackingSheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === 'YearlyReset') {
      trackingSheet.getRange(i + 1, 2).setValue(year);
      break;
    }
  }
}

function handleBalanceSync(e, ss, callback) {
  try {
    console.log('=== BALANCE SYNC REQUEST RECEIVED ===');
    
    // Use the comprehensive sync function
    const syncResult = updateLeaveSummaryFromApprovedRequests(ss);
    console.log('Sync operation result:', syncResult);
    
    // Get updated balance after sync (even if sync had issues)
    const leaveBalance = getLeaveBalance(ss);
    console.log('Updated leave balance:', leaveBalance);
    
    // Determine overall success - sync success OR we have valid balance data
    const overallSuccess = syncResult.success || (leaveBalance && Object.keys(leaveBalance).length > 0);
    
    const responseData = JSON.stringify({
      success: overallSuccess,
      syncResult,
      leaveBalance,
      message: syncResult.success ? 
        'Balance synchronized successfully from approved requests' : 
        `Sync had issues: ${syncResult.error || 'Unknown error'}, but returning current balance`
    });
    
    if (callback) {
      return ContentService.createTextOutput(`${callback}(${responseData})`)
        .setMimeType(ContentService.MimeType.JAVASCRIPT);
    }
    
    return ContentService.createTextOutput(responseData)
      .setMimeType(ContentService.MimeType.JSON)
      .setHeaders(corsHeaders());
      
  } catch (err) {
    console.error('Balance sync error:', err.message, err.stack);
    
    // Try to get balance even if sync failed
    let fallbackBalance = null;
    try {
      fallbackBalance = getLeaveBalance(ss);
      console.log('Fallback balance retrieved:', fallbackBalance);
    } catch (balanceError) {
      console.error('Failed to get fallback balance:', balanceError.message);
    }
    
    const errorData = JSON.stringify({ 
      success: false,
      error: "Sync failed: " + err.message,
      leaveBalance: fallbackBalance,
      details: err.stack
    });
    
    if (callback) {
      return ContentService.createTextOutput(`${callback}(${errorData})`)
        .setMimeType(ContentService.MimeType.JAVASCRIPT);
    }
    return errorResponse("Sync failed");
  }
}

// Handle leave validation requests
function handleLeaveValidation(e, ss, callback) {
  const { leaveType, fromDate, toDate, dayType } = e.parameter;
  
  if (!leaveType || !fromDate || !toDate || !dayType) {
    const errorData = JSON.stringify({ error: "Missing validation parameters" });
    if (callback) {
      return ContentService.createTextOutput(`${callback}(${errorData})`)
        .setMimeType(ContentService.MimeType.JAVASCRIPT);
    }
    return errorResponse("Missing validation parameters");
  }
  
  try {
    const leaveBalance = getLeaveBalance(ss);
    const requestedDays = calculateLeaveDays(fromDate, toDate, dayType);
    
    // Map leave type to balance keys
    const balanceKey = leaveType + ' Remaining';
    const availableDays = leaveBalance[balanceKey] || 0;
    
    const validation = {
      isValid: requestedDays <= availableDays,
      requestedDays,
      availableDays,
      message: requestedDays <= availableDays ? 
        'Leave request is valid' : 
        `Insufficient balance. Requested: ${requestedDays}, Available: ${availableDays}`
    };
    
    const responseData = JSON.stringify({ validation });
    
    if (callback) {
      return ContentService.createTextOutput(`${callback}(${responseData})`)
        .setMimeType(ContentService.MimeType.JAVASCRIPT);
    }
    
    return ContentService.createTextOutput(responseData)
      .setMimeType(ContentService.MimeType.JSON)
      .setHeaders(corsHeaders());
      
  } catch (err) {
    const errorData = JSON.stringify({ error: "Validation failed: " + err.message });
    if (callback) {
      return ContentService.createTextOutput(`${callback}(${errorData})`)
        .setMimeType(ContentService.MimeType.JAVASCRIPT);
    }
    return errorResponse("Validation failed");
  }
}

// ========== ADMIN FUNCTION: APPROVE LEAVE ==========
function approveLeave(sheetId, rowNumber) {
  try {
    const ss = SpreadsheetApp.openById(sheetId);
    const leaveSheet = ss.getSheetByName(SHEET_LEAVE_REQUESTS);
    const summarySheet = ss.getSheetByName(SHEET_LEAVE_SUMMARY);

    const row = leaveSheet.getRange(rowNumber, 1, 1, leaveSheet.getLastColumn()).getValues()[0];
    const status = row[7]; // Status column index
    if (status !== 'Pending') return 'Already processed';

    const leaveType = row[1]; // Leave Type column
    const leaveDays = parseFloat(row[6]) || 0; // Leave Days column

    // Update status to Approved
    leaveSheet.getRange(rowNumber, 8).setValue('Approved');

    // Update the LeaveSummary sheet with taken leave
    const summaryHeaders = summarySheet.getRange(1, 1, 1, summarySheet.getLastColumn()).getValues()[0];
    
    // Find the "Used" column for this leave type
    const usedColumnName = leaveType + ' Used';
    let usedColumnIndex = summaryHeaders.indexOf(usedColumnName);
    
    // If "Used" column doesn't exist, create it
    if (usedColumnIndex === -1) {
      // Add the new "Used" column header
      const newColumnIndex = summarySheet.getLastColumn() + 1;
      summarySheet.getRange(1, newColumnIndex).setValue(usedColumnName);
      summarySheet.getRange(2, newColumnIndex).setValue(leaveDays);
      usedColumnIndex = newColumnIndex - 1; // Convert to 0-based index for next operations
    } else {
      // Update existing "Used" column (usedColumnIndex is 0-based, but we need 1-based for getRange)
      const currentUsed = summarySheet.getRange(2, usedColumnIndex + 1).getValue() || 0;
      summarySheet.getRange(2, usedColumnIndex + 1).setValue(currentUsed + leaveDays);
    }

    // Also update or create "Remaining" column
    const remainingColumnName = leaveType + ' Remaining';
    const currentHeaders = summarySheet.getRange(1, 1, 1, summarySheet.getLastColumn()).getValues()[0]; // Refresh headers
    let remainingColumnIndex = currentHeaders.indexOf(remainingColumnName);
    const totalColumnIndex = currentHeaders.indexOf(leaveType);
    
    if (totalColumnIndex !== -1) {
      const totalLeave = summarySheet.getRange(2, totalColumnIndex + 1).getValue() || 0;
      const currentUsed = summarySheet.getRange(2, usedColumnIndex + 1).getValue() || 0;
      const remaining = totalLeave - currentUsed;
      
      if (remainingColumnIndex === -1) {
        // Create new "Remaining" column
        const newColumnIndex = summarySheet.getLastColumn() + 1;
        summarySheet.getRange(1, newColumnIndex).setValue(remainingColumnName);
        summarySheet.getRange(2, newColumnIndex).setValue(remaining);
      } else {
        // Update existing "Remaining" column
        summarySheet.getRange(2, remainingColumnIndex + 1).setValue(remaining);
      }
    }

    return 'Leave approved successfully. Summary sheet updated.';
  } catch (err) {
    return 'Error during approval: ' + err.message;
  }
}

// ========== TEST FUNCTION (for debugging) ==========
function testLeaveSystem(sheetId) {
  try {
    const ss = SpreadsheetApp.openById(sheetId);
    
    // Initialize sheets
    initializeLeaveSummary(ss);
    
    // Get initial balance
    const initialBalance = getLeaveBalance(ss);
    console.log('Initial Balance:', JSON.stringify(initialBalance, null, 2));
    
    // Add a test leave request
    const sheet = ss.getSheetByName(SHEET_LEAVE_REQUESTS);
    if (sheet.getLastRow() === 0) {
      sheet.appendRow([
        'Timestamp', 'Leave Type', 'From Date', 'To Date', 
        'Reason', 'Day Type', 'Leave Days', 'Status'
      ]);
    }
    
    sheet.appendRow([
      new Date(), 'Sick', '2025-07-25', '2025-07-26', 
      'Test sick leave', 'Full Day', 2, 'Pending'
    ]);
    
    const lastRow = sheet.getLastRow();
    
    // Approve the leave
    const approvalResult = approveLeave(sheetId, lastRow);
    console.log('Approval Result:', approvalResult);
    
    // Get updated balance
    const updatedBalance = getLeaveBalance(ss);
    console.log('Updated Balance:', JSON.stringify(updatedBalance, null, 2));
    
    return {
      success: true,
      initialBalance,
      approvalResult,
      updatedBalance
    };
    
  } catch (err) {
    return {
      success: false,
      error: err.message
    };
  }
}

// ========== COMPREHENSIVE SYNC FUNCTION ==========
// Fetch all approved leaves and update LeaveSummary sheet accordingly
function updateLeaveSummaryFromApprovedRequests(ss) {
  try {
    console.log('=== STARTING COMPREHENSIVE LEAVE SUMMARY UPDATE ===');
    
    const summarySheet = ss.getSheetByName(SHEET_LEAVE_SUMMARY);
    const leaveSheet = ss.getSheetByName(SHEET_LEAVE_REQUESTS);
    
    if (!summarySheet || !leaveSheet) {
      console.log('Missing required sheets - Summary:', !!summarySheet, 'Leave:', !!leaveSheet);
      return { success: false, error: 'Missing required sheets' };
    }
    
    // Step 1: Get all leave request data
    const leaveData = leaveSheet.getDataRange().getValues();
    console.log('Total leave request rows:', leaveData.length);
    
    if (leaveData.length <= 1) {
      console.log('No leave request data found');
      return { success: true, message: 'No leave data to process' };
    }
    
    // Step 2: Identify column indices
    const leaveHeaders = leaveData[0];
    console.log('Leave request headers:', leaveHeaders);
    
    let statusIndex = leaveHeaders.indexOf('Status');
    let typeIndex = leaveHeaders.indexOf('Leave Type');
    let daysIndex = leaveHeaders.indexOf('Leave Days');
    let fromDateIndex = leaveHeaders.indexOf('From Date');
    let timestampIndex = leaveHeaders.indexOf('Timestamp');
    
    console.log('Column indices - Status:', statusIndex, 'Type:', typeIndex, 'Days:', daysIndex, 'FromDate:', fromDateIndex, 'Timestamp:', timestampIndex);
    
    // Be more flexible about required columns - only Status, Type, and Days are absolutely essential
    if (statusIndex === -1 || typeIndex === -1 || daysIndex === -1) {
      console.log('Missing essential columns in LeaveRequests sheet');
      console.log('Available headers:', leaveHeaders);
      
      // Try to find columns with similar names (case-insensitive)
      const findColumnIndex = (possibleNames) => {
        for (const name of possibleNames) {
          const index = leaveHeaders.findIndex(header => 
            header && header.toString().toLowerCase().includes(name.toLowerCase())
          );
          if (index !== -1) return index;
        }
        return -1;
      };
      
      const altStatusIndex = statusIndex === -1 ? findColumnIndex(['status', 'state', 'approval']) : statusIndex;
      const altTypeIndex = typeIndex === -1 ? findColumnIndex(['type', 'leave type', 'category']) : typeIndex;
      const altDaysIndex = daysIndex === -1 ? findColumnIndex(['days', 'leave days', 'duration']) : daysIndex;
      
      console.log('Alternative indices - Status:', altStatusIndex, 'Type:', altTypeIndex, 'Days:', altDaysIndex);
      
      if (altStatusIndex === -1 || altTypeIndex === -1 || altDaysIndex === -1) {
        return { 
          success: false, 
          error: 'Missing essential columns: Status, Leave Type, and Leave Days are required',
          availableHeaders: leaveHeaders,
          foundIndices: {
            status: altStatusIndex,
            type: altTypeIndex,
            days: altDaysIndex
          }
        };
      }
      
      // Use alternative indices
      console.log('Using alternative column indices');
      statusIndex = altStatusIndex;
      typeIndex = altTypeIndex;
      daysIndex = altDaysIndex;
    }
    
    // Step 3: Calculate total used leave for each type from approved requests
    const approvedLeaveUsage = {
      'Sick': 0,
      'Casual': 0,
      'Earned': 0,
      'Compensation': 0
    };
    
    const processedEntries = new Set(); // Track unique entries to avoid duplicates
    const approvedRequests = []; // Store details of approved requests
    
    // Process each leave request
    for (let i = 1; i < leaveData.length; i++) {
      const row = leaveData[i];
      const status = row[statusIndex];
      const leaveType = row[typeIndex];
      const days = parseFloat(row[daysIndex]) || 0;
      const fromDate = fromDateIndex !== -1 ? row[fromDateIndex] : null;
      const timestamp = timestampIndex !== -1 ? row[timestampIndex] : null;
      
      // Create unique identifier for this request (handle missing fromDate/timestamp)
      const uniqueKey = `${fromDate || 'nodate'}_${timestamp || i}_${leaveType}_${days}`;
      
      console.log(`Processing row ${i}: Status="${status}", Type="${leaveType}", Days=${days}, FromDate="${fromDate}", UniqueKey="${uniqueKey}"`);
      
      if (status === 'Approved' && approvedLeaveUsage.hasOwnProperty(leaveType)) {
        // Check for duplicates
        if (processedEntries.has(uniqueKey)) {
          console.log(`Skipping duplicate entry: ${uniqueKey}`);
          continue;
        }
        
        // Add to totals
        approvedLeaveUsage[leaveType] += days;
        processedEntries.add(uniqueKey);
        
        // Store request details
        approvedRequests.push({
          row: i + 1,
          leaveType,
          days,
          fromDate: fromDate || 'N/A',
          status,
          uniqueKey
        });
        
        console.log(`✅ Added ${days} days to ${leaveType}, total now: ${approvedLeaveUsage[leaveType]}`);
      } else if (status === 'Approved') {
        console.log(`⚠️ Unknown leave type: ${leaveType}`);
      } else {
        console.log(`⏳ Non-approved status: ${status}`);
      }
    }
    
    console.log('Final approved leave usage:', approvedLeaveUsage);
    console.log('Total unique approved requests processed:', processedEntries.size);
    console.log('Approved requests details:', approvedRequests);
    
    // Step 4: Get current summary sheet structure
    const summaryHeaders = summarySheet.getRange(1, 1, 1, summarySheet.getLastColumn()).getValues()[0];
    const summaryValues = summarySheet.getRange(2, 1, 1, summarySheet.getLastColumn()).getValues()[0];
    
    console.log('Current summary headers:', summaryHeaders);
    console.log('Current summary values:', summaryValues);
    
    // Step 5: Update the summary sheet with calculated usage
    const updateResults = {};
    let overallUpdateSuccess = false;
    
    // Define possible column mapping patterns (flexible approach)
    const columnMappings = [
      // Pattern 1: T columns (various cases)
      { 'Casual': ['CST', 'CsT', 'cst'], 'Sick': ['ST', 'St', 'st'], 'Earned': ['ET', 'Et', 'et'], 'Compensation': ['CT', 'Ct', 'ct'] },
      // Pattern 2: Standard "Used" columns
      { 'Casual': ['Casual Used'], 'Sick': ['Sick Used'], 'Earned': ['Earned Used'], 'Compensation': ['Compensation Used'] },
      // Pattern 3: Position-based fallback
      { 'Casual': [4], 'Sick': [5], 'Earned': [6], 'Compensation': [7] }
    ];
    
    // Try each mapping pattern
    for (let patternIndex = 0; patternIndex < columnMappings.length; patternIndex++) {
      const mapping = columnMappings[patternIndex];
      console.log(`\n--- Trying mapping pattern ${patternIndex + 1} ---`);
      
      let patternWorked = false;
      
      for (const leaveType of Object.keys(approvedLeaveUsage)) {
        const possibleColumns = mapping[leaveType];
        let foundColumn = false;
        
        for (const columnIdentifier of possibleColumns) {
          let columnIndex = -1;
          
          if (typeof columnIdentifier === 'string') {
            // String-based column search
            columnIndex = summaryHeaders.indexOf(columnIdentifier);
            if (columnIndex !== -1) {
              console.log(`Found ${leaveType} column "${columnIdentifier}" at index ${columnIndex}`);
              foundColumn = true;
            }
          } else if (typeof columnIdentifier === 'number') {
            // Position-based column
            if (columnIdentifier < summaryHeaders.length) {
              columnIndex = columnIdentifier;
              console.log(`Using position-based ${leaveType} column at index ${columnIndex} (${summaryHeaders[columnIndex]})`);
              foundColumn = true;
            }
          }
          
          if (foundColumn) {
            try {
              const newValue = approvedLeaveUsage[leaveType];
              summarySheet.getRange(2, columnIndex + 1).setValue(newValue);
              console.log(`✅ Successfully updated ${leaveType} to ${newValue} in column ${columnIndex + 1} (${summaryHeaders[columnIndex]})`);
              
              updateResults[leaveType] = {
                success: true,
                column: summaryHeaders[columnIndex],
                columnIndex: columnIndex + 1,
                oldValue: summaryValues[columnIndex],
                newValue: newValue
              };
              
              overallUpdateSuccess = true;
              patternWorked = true;
              break; // Found and updated, move to next leave type
              
            } catch (updateError) {
              console.log(`❌ Failed to update ${leaveType}: ${updateError.message}`);
              updateResults[leaveType] = {
                success: false,
                error: updateError.message
              };
            }
          }
        }
        
        if (!foundColumn) {
          console.log(`❌ No suitable column found for ${leaveType} in pattern ${patternIndex + 1}`);
        }
      }
      
      if (patternWorked) {
        console.log(`✅ Pattern ${patternIndex + 1} worked, continuing with this pattern`);
        break; // Stop trying other patterns if this one worked
      }
    }
    
    // Step 6: Verify updates by reading the sheet again
    const updatedSummaryValues = summarySheet.getRange(2, 1, 1, summarySheet.getLastColumn()).getValues()[0];
    console.log('Summary values after update:', updatedSummaryValues);
    
    // Step 7: Calculate and update "Remaining" columns if they exist
    console.log('\n--- Updating Remaining Columns ---');
    for (const leaveType of Object.keys(approvedLeaveUsage)) {
      const totalColumnIndex = summaryHeaders.indexOf(leaveType);
      const remainingColumnName = leaveType + ' Remaining';
      const remainingColumnIndex = summaryHeaders.indexOf(remainingColumnName);
      
      if (totalColumnIndex !== -1 && remainingColumnIndex !== -1) {
        const totalLeave = updatedSummaryValues[totalColumnIndex] || 0;
        const usedLeave = approvedLeaveUsage[leaveType];
        const remaining = totalLeave - usedLeave;
        
        try {
          summarySheet.getRange(2, remainingColumnIndex + 1).setValue(remaining);
          console.log(`✅ Updated ${leaveType} Remaining: ${totalLeave} - ${usedLeave} = ${remaining}`);
        } catch (error) {
          console.log(`❌ Failed to update ${leaveType} Remaining: ${error.message}`);
        }
      } else {
        console.log(`⚠️ Missing total or remaining column for ${leaveType}`);
      }
    }
    
    // Step 8: Final verification
    const finalSummaryValues = summarySheet.getRange(2, 1, 1, summarySheet.getLastColumn()).getValues()[0];
    console.log('Final summary values:', finalSummaryValues);
    
    console.log('=== COMPREHENSIVE LEAVE SUMMARY UPDATE COMPLETE ===');
    
    return {
      success: overallUpdateSuccess,
      approvedLeaveUsage,
      processedRequests: approvedRequests.length,
      uniqueEntries: processedEntries.size,
      updateResults,
      summaryBefore: summaryValues,
      summaryAfter: finalSummaryValues,
      message: overallUpdateSuccess ? 'Leave summary updated successfully' : 'No updates could be applied'
    };
    
  } catch (error) {
    console.error('Error in updateLeaveSummaryFromApprovedRequests:', error.message, error.stack);
    return {
      success: false,
      error: error.message
    };
  }
}

// ========== DEBUG SHEET STRUCTURE FUNCTION ==========
function debugSheetStructure(sheetId) {
  try {
    console.log('=== DEBUGGING SHEET STRUCTURE ===');
    
    const ss = SpreadsheetApp.openById(sheetId);
    
    // Check LeaveRequests sheet
    const leaveSheet = ss.getSheetByName(SHEET_LEAVE_REQUESTS);
    if (leaveSheet) {
      const leaveData = leaveSheet.getDataRange().getValues();
      console.log('LeaveRequests sheet structure:');
      console.log('Headers:', leaveData.length > 0 ? leaveData[0] : 'No headers found');
      console.log('Total rows:', leaveData.length);
      
      if (leaveData.length > 1) {
        console.log('Sample data row:', leaveData[1]);
        
        // Show all data for debugging
        console.log('All leave data:');
        for (let i = 0; i < Math.min(leaveData.length, 10); i++) {
          console.log(`Row ${i}:`, leaveData[i]);
        }
      }
    } else {
      console.log('LeaveRequests sheet not found');
    }
    
    // Check LeaveSummary sheet
    const summarySheet = ss.getSheetByName(SHEET_LEAVE_SUMMARY);
    if (summarySheet) {
      const summaryData = summarySheet.getDataRange().getValues();
      console.log('LeaveSummary sheet structure:');
      console.log('Headers:', summaryData.length > 0 ? summaryData[0] : 'No headers found');
      console.log('Values:', summaryData.length > 1 ? summaryData[1] : 'No values found');
      console.log('Total rows:', summaryData.length);
    } else {
      console.log('LeaveSummary sheet not found');
    }
    
    console.log('=== DEBUG COMPLETE ===');
    
    return {
      success: true,
      leaveRequests: leaveSheet ? leaveSheet.getDataRange().getValues() : null,
      leaveSummary: summarySheet ? summarySheet.getDataRange().getValues() : null
    };
    
  } catch (err) {
    console.error('Debug error:', err.message, err.stack);
    return {
      success: false,
      error: err.message
    };
  }
}

// ========== TEST COMPREHENSIVE SYNC FUNCTION ==========
function testComprehensiveSync(sheetId) {
  try {
    console.log('=== TESTING COMPREHENSIVE SYNC ===');
    
    const ss = SpreadsheetApp.openById(sheetId);
    
    // Run the comprehensive sync
    const syncResult = updateLeaveSummaryFromApprovedRequests(ss);
    console.log('Comprehensive sync result:', JSON.stringify(syncResult, null, 2));
    
    // Get the updated balance
    const finalBalance = getLeaveBalance(ss);
    console.log('Final balance after sync:', JSON.stringify(finalBalance, null, 2));
    
    return {
      success: true,
      syncResult,
      finalBalance,
      timestamp: new Date().toISOString()
    };
    
  } catch (err) {
    console.error('Test comprehensive sync error:', err.message, err.stack);
    return {
      success: false,
      error: err.message,
      stack: err.stack
    };
  }
}

// ========== MANUAL SYNC FUNCTION (for debugging) ==========
function manualSyncTest(sheetId) {
  try {
    const ss = SpreadsheetApp.openById(sheetId);
    
    console.log('=== MANUAL SYNC TEST START ===');
    
    // First, let's check what's in the sheets
    const leaveSheet = ss.getSheetByName(SHEET_LEAVE_REQUESTS);
    const summarySheet = ss.getSheetByName(SHEET_LEAVE_SUMMARY);
    
    console.log('Leave sheet exists:', !!leaveSheet);
    console.log('Summary sheet exists:', !!summarySheet);
    
    if (leaveSheet) {
      const leaveData = leaveSheet.getDataRange().getValues();
      console.log('Leave data:', leaveData);
    }
    
    if (summarySheet) {
      const summaryData = summarySheet.getDataRange().getValues();
      console.log('Summary data before sync:', summaryData);
    }
    
    // Run the sync
    const syncResult = syncApprovedLeavesToSummary(ss);
    console.log('Sync result:', syncResult);
    
    // Check summary data after sync
    if (summarySheet) {
      const summaryDataAfter = summarySheet.getDataRange().getValues();
      console.log('Summary data after sync:', summaryDataAfter);
    }
    
    // Get balance using our function
    const balance = getLeaveBalance(ss);
    console.log('Final balance:', balance);
    
    console.log('=== MANUAL SYNC TEST END ===');
    
    return {
      success: true,
      syncResult,
      balance
    };
    
  } catch (err) {
    console.error('Manual sync test error:', err.message, err.stack);
    return {
      success: false,
      error: err.message
    };
  }
}
