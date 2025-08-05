function doGet(e) {
  if (!e || !e.parameter || !e.parameter.action) {
    return ContentService.createTextOutput(JSON.stringify({ error: 'Missing or invalid request' }))
      .setMimeType(ContentService.MimeType.JSON);
  }

  const action = e.parameter.action;

  switch (action) {
    case 'getAdminLeaveRequests':
      return getAllPendingLeaveRequests();
    case 'getAdminLeaveHistory':
      return getAdminLeaveHistory();
    case 'getHolidays':
      return getAllHolidays(e);
    default:
      return ContentService.createTextOutput(JSON.stringify({ error: 'Invalid or missing action' }))
        .setMimeType(ContentService.MimeType.JSON);
  }
}

function getAdminLeaveHistory() {
  const ss = SpreadsheetApp.openById('1Wxf8Xxc2HWbf_39B21zkp_09EYoIAb2DMrYHETSQVSw');
  const sheet = ss.getSheetByName('AdminLeaveHistory');
  if (!sheet) {
    return ContentService.createTextOutput(JSON.stringify([])).setMimeType(ContentService.MimeType.JSON);
  }
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const rows = data.slice(1).map(row => {
    let obj = {};
    headers.forEach((h, i) => obj[h] = row[i]);
    return obj;
  });
  return ContentService.createTextOutput(JSON.stringify(rows)).setMimeType(ContentService.MimeType.JSON);
}


function getAllPendingLeaveRequests() {
  const ss = SpreadsheetApp.openById('1Wxf8Xxc2HWbf_39B21zkp_09EYoIAb2DMrYHETSQVSw');
  const employeeSheet = ss.getSheetByName('Employee');
  const empData = employeeSheet.getDataRange().getValues();
  const empHeaders = empData[0];
  const sheetIdIdx = empHeaders.indexOf('SHEETID');
  const empIdIdx = empHeaders.indexOf('EMP_ID');
  const empNameIdx = empHeaders.indexOf('EMP_NAME');
  const empLastNameIdx = empHeaders.indexOf('EMP_LAST_NAME');
  const emailIdx = empHeaders.indexOf('EMAIL');

  let pendingRequests = [];

  for (let i = 1; i < empData.length; i++) {
    const sheetId = empData[i][sheetIdIdx];
    if (!sheetId) continue;
    try {
      const empSheet = SpreadsheetApp.openById(sheetId).getSheetByName('LeaveRequests');
      if (!empSheet) continue;
      const leaveData = empSheet.getDataRange().getValues();
      const leaveHeaders = leaveData[0];
      const statusIdx = leaveHeaders.indexOf('Status');
      const timestampIdx = leaveHeaders.indexOf('Timestamp');

      for (let j = 1; j < leaveData.length; j++) {
        const row = leaveData[j];
        if (row[statusIdx] === 'Pending') {
          let entry = {};
          leaveHeaders.forEach((key, idx) => {
            entry[key] = row[idx];
          });
          // Attach employee info for admin display
          entry.EmpId = empData[i][empIdIdx];
          entry.EMP_NAME = empData[i][empNameIdx];
          entry.EMP_LAST_NAME = empData[i][empLastNameIdx];
          entry.EMAIL = empData[i][emailIdx];
          entry.SHEETID = sheetId;
          pendingRequests.push(entry);
        }
      }
    } catch (err) {
      // skip if sheet not found or error
      continue;
    }
  }
  return ContentService.createTextOutput(JSON.stringify(pendingRequests))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  let data;
  try {
    data = JSON.parse(e.postData.contents);
  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ message: 'Invalid JSON' }))
      .setMimeType(ContentService.MimeType.JSON);
  }

  // --- In doPost, remove category from addHoliday ---
if (data.action === 'addHoliday' && data.title && data.date) {
  try {
    const ss = SpreadsheetApp.openById('1Wxf8Xxc2HWbf_39B21zkp_09EYoIAb2DMrYHETSQVSw');
    let sheet = ss.getSheetByName('Holidays');
    if (!sheet) {
      sheet = ss.insertSheet('Holidays');
      sheet.appendRow(['Title', 'Date']); // Removed 'Category'
    }
    sheet.appendRow([data.title, data.date]); // Removed category
    return ContentService
      .createTextOutput(JSON.stringify({ message: 'Success' }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ message: 'Error adding holiday', error: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
  // ...existing code...
if (data.action === 'deleteHoliday' && data.date) {
  try {
    const ss = SpreadsheetApp.openById('1Wxf8Xxc2HWbf_39B21zkp_09EYoIAb2DMrYHETSQVSw');
    const sheet = ss.getSheetByName('Holidays');
    if (!sheet) {
      return ContentService
        .createTextOutput(JSON.stringify({ message: 'No Holidays sheet' }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    const dataRows = sheet.getDataRange().getValues();
    const dateIdx = dataRows[0].indexOf('Date');
    let deleted = false;
    for (let i = dataRows.length - 1; i > 0; i--) {
  let sheetDate = dataRows[i][dateIdx];
  let sheetDateStr = '';

  if (sheetDate instanceof Date) {
    // If it's a Date object, convert to YYYY-MM-DD
    sheetDateStr = sheetDate.toISOString().split('T')[0];
  } else if (typeof sheetDate === 'string' && sheetDate.includes('/')) {
    // Convert DD/M/YY or D/M/YY to YYYY-MM-DD
    const parts = sheetDate.split('/');
    if (parts.length === 3) {
      let dd = parts[0].padStart(2, '0');
      let mm = parts[1].padStart(2, '0');
      let yy = parts[2];
      let yyyy = yy.length === 2 ? ('20' + yy) : yy;
      sheetDateStr = `${yyyy}-${mm}-${dd}`;
    }
  } else {
    sheetDateStr = String(sheetDate).trim();
  }

  // Now compare with frontend date (YYYY-MM-DD)
  if (sheetDateStr === String(data.date).trim()) {
    sheet.deleteRow(i + 1);
    deleted = true;
    break;
  }
}
    if (deleted) {
      return ContentService
        .createTextOutput(JSON.stringify({ message: 'Success' }))
        .setMimeType(ContentService.MimeType.JSON);
    } else {
      return ContentService
        .createTextOutput(JSON.stringify({ message: 'Holiday not found' }))
        .setMimeType(ContentService.MimeType.JSON);
    }
  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ message: 'Error deleting holiday', error: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
// ...existing code...
  if (data.action === 'updateLeaveStatus' && data.timestamp && data.SHEETID && data.status) {
    try {
      // 1. Open the employee's sheet using SHEETID
      const empSheet = SpreadsheetApp.openById(data.SHEETID).getSheetByName('LeaveRequests');
      const leaveData = empSheet.getDataRange().getValues();
      const headers = leaveData[0];
      const tsIdx = headers.indexOf('Timestamp');
      const statusIdx = headers.indexOf('Status');
      let updated = false;

      for (let i = 1; i < leaveData.length; i++) {
        const sheetTs = leaveData[i][tsIdx];
        const incomingTs = data.timestamp;

        // Try direct string match
        if (String(sheetTs).trim() === String(incomingTs).trim()) {
          empSheet.getRange(i + 1, statusIdx + 1).setValue(data.status);
          updated = true;
          break;
        }

        // Try date match (handles Google Sheets date objects and ISO strings)
        const sheetDate = new Date(sheetTs);
        const incomingDate = new Date(incomingTs);

        if (
          !isNaN(sheetDate.getTime()) &&
          !isNaN(incomingDate.getTime()) &&
          sheetDate.getFullYear() === incomingDate.getFullYear() &&
          sheetDate.getMonth() === incomingDate.getMonth() &&
          sheetDate.getDate() === incomingDate.getDate() &&
          sheetDate.getHours() === incomingDate.getHours() &&
          sheetDate.getMinutes() === incomingDate.getMinutes() &&
          sheetDate.getSeconds() === incomingDate.getSeconds()
        ) {
          empSheet.getRange(i + 1, statusIdx + 1).setValue(data.status);
          updated = true;
          break;
        }
      }

      // ...existing code...

// ...existing code...

      // --- LEAVE HISTORY LOGGING ---
      if (updated) {
        try {
          const masterSheet = SpreadsheetApp.openById('1Wxf8Xxc2HWbf_39B21zkp_09EYoIAb2DMrYHETSQVSw'); // Master Employee sheet
          let historySheet = masterSheet.getSheetByName('AdminLeaveHistory');
          if (!historySheet) {
            historySheet = masterSheet.insertSheet('AdminLeaveHistory');
            historySheet.appendRow([
              'Timestamp', 'AdminAction', 'Status', 'EmpId', 'EMP_NAME', 'EMP_LAST_NAME', 'EMAIL', 'LeaveType', 'FromDate', 'ToDate', 'Reason'
            ]);
          }
          historySheet.appendRow([
            new Date().toISOString(),
            'Admin',
            data.status,
            data.EMP_ID || data.EmpId || '',
            data.EMP_NAME || '',
            data.EMP_LAST_NAME || '',
            data.EMAIL || '',
            data.LeaveType || '',
            data.FromDate || '',
            data.ToDate || '',
            data.Reason || ''
          ]);
        } catch (err) {
          Logger.log('Error logging admin action: ' + err);
        }

        return ContentService
          .createTextOutput(JSON.stringify({ message: 'Success' }))
          .setMimeType(ContentService.MimeType.JSON);
      } else {
        return ContentService
          .createTextOutput(JSON.stringify({ message: 'No matching timestamp' }))
          .setMimeType(ContentService.MimeType.JSON);
      }
    } catch (err) {
      return ContentService
        .createTextOutput(JSON.stringify({ message: 'Error updating status', error: err.toString() }))
        .setMimeType(ContentService.MimeType.JSON);
    }
  }

  if (data.action === 'addCompLeave' && data.empId && data.leaves) {
    try {
      // 1. Find the employee's SHEETID from the Employee sheet
      const masterSheet = SpreadsheetApp.openById('1Wxf8Xxc2HWbf_39B21zkp_09EYoIAb2DMrYHETSQVSw'); // Employee master sheet
      const employeeSheet = masterSheet.getSheetByName('Employee');
      const empData = employeeSheet.getDataRange().getValues();
      const empHeaders = empData[0];
      const empIdIdx = empHeaders.indexOf('EMP_ID');
      const sheetIdIdx = empHeaders.indexOf('SHEETID');
      let sheetId = null;
      for (let i = 1; i < empData.length; i++) {
        if (String(empData[i][empIdIdx]).trim() === String(data.empId).trim()) {
          sheetId = empData[i][sheetIdIdx];
          break;
        }
      }
      if (!sheetId) {
        return ContentService
          .createTextOutput(JSON.stringify({ message: 'Employee not found' }))
          .setMimeType(ContentService.MimeType.JSON);
      }

      // 2. Open the employee's LeaveSummary sheet
      const empSS = SpreadsheetApp.openById(sheetId);
      const leaveSummarySheet = empSS.getSheetByName('LeaveSummary');
      if (!leaveSummarySheet) {
        return ContentService
          .createTextOutput(JSON.stringify({ message: 'LeaveSummary sheet not found' }))
          .setMimeType(ContentService.MimeType.JSON);
      }

      // 3. Find the "Compensation" and "CT" columns
      const summaryHeaders = leaveSummarySheet.getRange(1, 1, 1, leaveSummarySheet.getLastColumn()).getValues()[0];
      const compIdx = summaryHeaders.indexOf('Compensation');
      const ctIdx = summaryHeaders.indexOf('CT');
      if (compIdx === -1 || ctIdx === -1) {
        return ContentService
          .createTextOutput(JSON.stringify({ message: 'Compensation or CT column not found' }))
          .setMimeType(ContentService.MimeType.JSON);
      }

      // 4. Add the leaves to both columns (assuming row 2 is the data row)
      const currentComp = Number(leaveSummarySheet.getRange(2, compIdx + 1).getValue()) || 0;
      const currentCT = Number(leaveSummarySheet.getRange(2, ctIdx + 1).getValue()) || 0;
      leaveSummarySheet.getRange(2, compIdx + 1).setValue(currentComp + Number(data.leaves));
      leaveSummarySheet.getRange(2, ctIdx + 1).setValue(currentCT + Number(data.leaves));

      return ContentService
        .createTextOutput(JSON.stringify({ message: 'Success' }))
        .setMimeType(ContentService.MimeType.JSON);
    } catch (err) {
      return ContentService
        .createTextOutput(JSON.stringify({ message: 'Error adding compensation leave', error: err.toString() }))
        .setMimeType(ContentService.MimeType.JSON);
    }
  }

  return ContentService
    .createTextOutput(JSON.stringify({ message: 'Invalid action or missing fields' }))
    .setMimeType(ContentService.MimeType.JSON);
}


function getAllHolidays(e) {
  const ss = SpreadsheetApp.openById('1Wxf8Xxc2HWbf_39B21zkp_09EYoIAb2DMrYHETSQVSw');
  const sheet = ss.getSheetByName('Holidays');
  if (!sheet) {
    return ContentService.createTextOutput(JSON.stringify([])).setMimeType(ContentService.MimeType.JSON);
  }
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const rows = data.slice(1).map(row => {
    let obj = {};
    headers.forEach((h, i) => obj[h] = row[i]);
    return obj;
  });

  // Optional: filter by month/year if e.parameter.date is provided
  if (e.parameter.date) {
    const [year, month] = e.parameter.date.split('-');
    const filtered = rows.filter(h => {
      const d = new Date(h.Date);
      return d.getFullYear() == year && (d.getMonth() + 1) == month;
    });
    return ContentService.createTextOutput(JSON.stringify(filtered)).setMimeType(ContentService.MimeType.JSON);
  }

  return ContentService.createTextOutput(JSON.stringify(rows)).setMimeType(ContentService.MimeType.JSON);
}



function doOptions(e) {
  return ContentService.createTextOutput('')
    .setMimeType(ContentService.MimeType.TEXT)
    .setHeader("Access-Control-Allow-Origin", "*")
    .setHeader("Access-Control-Allow-Methods", "POST")
    .setHeader("Access-Control-Allow-Headers", "Content-Type");
}