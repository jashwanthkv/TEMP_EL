// Corrected Google Apps Script Code

function doGet(e) {
  try {
    var email = e.parameter.email;
    var password = e.parameter.password;
    
    // Validate required parameters
    if (!email || !password) {
      return ContentService.createTextOutput(JSON.stringify({
        error: "Missing email or password parameter",
        current: [],
        leave_summary: { error: "Missing parameters" }
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    var result = getEmployeeByEmail(email, password);
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

function getAllEmployees() {
  try {
    const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName('Employee');
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

function getEmployeeByEmail(email, password) {
  try {
    if (!email) {
      Logger.log("No email provided");
      return { current: [], leave_summary: { error: "No email provided" } };
    }

    const employees = getAllEmployees();
    
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
      Logger.log('Password auth - invalid credentials for email: ' + email);
      return { current: [], leave_summary: { error: "Invalid credentials" } };
    }
    
  } catch (error) {
    Logger.log('Error in getEmployeeByEmail: ' + error.toString());
    return { 
      current: [], 
      leave_summary: { error: "Error processing request: " + error.toString() } 
    };
  }
}

function getLeaveSummary(empId) {
  try {
    if (!empId) {
      return { error: "No employee ID provided" };
    }

    const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName("LeaveSummary");
    if (!sheet) {
      Logger.log("LeaveSummary sheet not found");
      return { error: "Leave summary data not available" };
    }

    const data = sheet.getDataRange().getValues();
    
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] == empId) {
        return {
          empId: data[i][0],
          casual: data[i][1] || 0,
          sick: data[i][2] || 0,
          earned: data[i][3] || 0,
          cst: data[i][4] || 0,
          st: data[i][5] || 0,
          et: data[i][6] || 0
        };
      }
    }

    Logger.log(`Employee ID ${empId} not found in leave summary`);
    return { error: `Employee ID ${empId} not found in leave summary` };
    
  } catch (error) {
    Logger.log('Error in getLeaveSummary: ' + error.toString());
    return { error: "Error retrieving leave summary: " + error.toString() };
  }
}

// Test function to verify the script works
function testScript() {
  // Test with known credentials
  var result1 = getEmployeeByEmail("cp@gmail.com", "123456");
  Logger.log("Test result 1: " + JSON.stringify(result1));
  
  var result2 = getEmployeeByEmail("tony@gmail.com", "123456");
  Logger.log("Test result 2: " + JSON.stringify(result2));
  
  // Test Google auth
  var result3 = getEmployeeByEmail("cp@gmail.com", "google_auth");
  Logger.log("Test Google auth: " + JSON.stringify(result3));
}
