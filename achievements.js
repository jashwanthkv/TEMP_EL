const FOLDER_NAME = 'CompanyAchievementsImages';
const SHEET_NAME = 'Achievements';

// Function to test if a file is properly shared
function testFileAccess(fileId) {
  try {
    const file = DriveApp.getFileById(fileId);
    const sharing = file.getSharingAccess();
    const permission = file.getSharingPermission();
    
    Logger.log(`File ${fileId} sharing: ${sharing}, permission: ${permission}`);
    
    // Ensure it's properly shared
    if (sharing !== DriveApp.Access.ANYONE_WITH_LINK) {
      file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
      Logger.log(`Updated sharing for file ${fileId}`);
      
      // Wait for permissions to propagate
      Utilities.sleep(500);
    }
    
    // Also check if file is in trash
    if (file.isTrashed()) {
      Logger.log(`Warning: File ${fileId} is in trash`);
      return false;
    }
    
    return true;
  } catch (error) {
    Logger.log(`Error testing file access for ${fileId}: ${error.message}`);
    return false;
  }
}

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const sheet = getOrCreateSheet(SHEET_NAME);
    
    const { title, text, imageBase64, imageType, imageName, action, row, imageId } = data;
    let imageUrl = '';
    let uploadedFileId = '';

    if (imageBase64 && imageType && imageName) {
      try {
        const folder = getOrCreateFolder(FOLDER_NAME);
        const blob = Utilities.newBlob(Utilities.base64Decode(imageBase64), imageType, imageName);
        const file = folder.createFile(blob);
        
        // Make file publicly accessible
        file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
        
        // Wait a moment for permissions to propagate
        Utilities.sleep(1000);
        
        // Use Google's image service URL which handles CORS better
        const fileId = file.getId();
        imageUrl = `https://lh3.googleusercontent.com/d/${fileId}=w1000`;
        uploadedFileId = fileId;
        
        Logger.log(`File uploaded successfully: ${imageName}, ID: ${fileId}, URL: ${imageUrl}`);
      } catch (error) {
        Logger.log(`Error uploading file: ${error.message}`);
        throw new Error(`Failed to upload image: ${error.message}`);
      }
    }

    if (action === 'update' && row && imageId) {
      // Delete previous file if new one uploaded
      if (uploadedFileId) {
        try {
          DriveApp.getFileById(imageId).setTrashed(true);
        } catch (err) {
          Logger.log("Old file deletion failed: " + err);
        }
      }

      const updatedRow = sheet.getRange(row, 1, 1, 4).getValues()[0];
      updatedRow[0] = title;
      updatedRow[1] = text;
      if (imageUrl) {
        updatedRow[2] = imageUrl;
        updatedRow[3] = uploadedFileId;
      }

      sheet.getRange(row, 1, 1, 4).setValues([updatedRow]);

      return ContentService.createTextOutput(
        JSON.stringify({ status: 'updated', fileUrl: imageUrl || updatedRow[2], fileId: uploadedFileId || updatedRow[3] })
      ).setMimeType(ContentService.MimeType.JSON);
    }

    // Default: Add new entry
    sheet.appendRow([title, text, imageUrl, uploadedFileId]);

    return ContentService.createTextOutput(
      JSON.stringify({ status: 'success', fileUrl: imageUrl, fileId: uploadedFileId })
    ).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(
      JSON.stringify({ status: 'error', message: err.message })
    ).setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  const { action, row, fileId } = e.parameter;
  
  if (action === 'getImage' && fileId) {
    return doGetImage(e);
  }
  
  if (action === 'fixSharing' && fileId) {
    try {
      const file = DriveApp.getFileById(fileId);
      
      // Ensure proper sharing permissions
      file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
      
      // Wait for permissions to propagate
      Utilities.sleep(1000);
      
      // Return the optimized URL
      const newUrl = `https://lh3.googleusercontent.com/d/${fileId}=w800`;
      
      Logger.log(`Fixed sharing for file ${fileId}, new URL: ${newUrl}`);
      
      return ContentService.createTextOutput(JSON.stringify({ 
        status: 'success', 
        newUrl: newUrl 
      })).setMimeType(ContentService.MimeType.JSON);
      
    } catch (err) {
      Logger.log(`Error fixing sharing for file ${fileId}: ${err.message}`);
      return ContentService.createTextOutput(JSON.stringify({ 
        status: 'error', 
        message: err.message 
      })).setMimeType(ContentService.MimeType.JSON);
    }
  }
  
  if (action === 'delete' && row && fileId) {
    try {
      const sheet = getOrCreateSheet(SHEET_NAME);
      sheet.deleteRow(Number(row));
      DriveApp.getFileById(fileId).setTrashed(true);
      return ContentService.createTextOutput(JSON.stringify({ status: 'deleted' }))
        .setMimeType(ContentService.MimeType.JSON);
    } catch (err) {
      return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: err.message }))
        .setMimeType(ContentService.MimeType.JSON);
    }
  }

  if (action === 'fetch') {
  const sheet = getOrCreateSheet(SHEET_NAME);
  const values = sheet.getDataRange().getValues();
  const headers = values[0];
  const data = values.slice(1).map(row => {
    const achievement = {
      title: row[0],
      text: row[1],
      imageUrl: row[2],
      imageId: row[3]
    };
    
    // Test file access and fix sharing if needed
    if (achievement.imageId) {
      testFileAccess(achievement.imageId);
      
      // Convert old URL format to new format if needed
      if (achievement.imageUrl && achievement.imageUrl.includes('drive.google.com/uc?id=')) {
        const newUrl = `https://lh3.googleusercontent.com/d/${achievement.imageId}=w1000`;
        achievement.imageUrl = newUrl;
        
        // Update the spreadsheet with the new URL format
        try {
          const rowIndex = values.slice(1).indexOf(row) + 2; // +2 because slice(1) removes header and spreadsheet is 1-indexed
          sheet.getRange(rowIndex, 3).setValue(newUrl);
          Logger.log(`Updated URL for row ${rowIndex}: ${newUrl}`);
        } catch (updateError) {
          Logger.log(`Failed to update URL in spreadsheet: ${updateError.message}`);
        }
      }
    }
    
    return achievement;
  });

  return ContentService.createTextOutput(
    JSON.stringify({ status: 'success', achievements: data })
  ).setMimeType(ContentService.MimeType.JSON);
}


  return ContentService.createTextOutput("Invalid Request").setMimeType(ContentService.MimeType.TEXT);
}


function doGetImage(e) {
  try {
    const fileId = e.parameter.fileId;
    if (!fileId) throw new Error("Missing fileId");

    const file = DriveApp.getFileById(fileId);
    const blob = file.getBlob();

    return ContentService
      .createOutput(blob)
      .setMimeType(blob.getContentType());
  } catch (err) {
    return ContentService.createTextOutput("Error: " + err.message);
  }
}

function uploadImage(blob) {
  const folder = DriveApp.getFolderById("YOUR_FOLDER_ID");
  const file = folder.createFile(blob);
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW); // 👈 Add this
  return file.getId(); // return imageId
}


function getOrCreateSheet(sheetName) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
    sheet.appendRow(['Title', 'Description', 'ImageURL', 'FileID']);
  }
  return sheet;
}

function getOrCreateFolder(folderName) {
  const folders = DriveApp.getFoldersByName(folderName);
  let folder;
  
  if (folders.hasNext()) {
    folder = folders.next();
  } else {
    folder = DriveApp.createFolder(folderName);
  }
  
  // Ensure the folder is properly shared
  try {
    folder.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  } catch (e) {
    Logger.log("Warning: Could not set folder sharing permissions: " + e.message);
  }
  
  return folder;
}