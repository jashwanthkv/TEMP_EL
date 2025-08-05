const FOLDER_NAME = 'CompanyAchievementsImages';
const SHEET_NAME = 'Achievements';

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const sheet = getOrCreateSheet(SHEET_NAME);
    
    const { title, text, imageBase64, imageType, imageName, action, row, imageId } = data;
    let imageUrl = '';
    let uploadedFileId = '';

    if (imageBase64 && imageType && imageName) {
      const folder = getOrCreateFolder(FOLDER_NAME);
      const blob = Utilities.newBlob(Utilities.base64Decode(imageBase64), imageType, imageName);
      const file = folder.createFile(blob);
      
      // Make file publicly accessible
      file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
      
      // Use the most reliable URL format for public access
      const fileId = file.getId();
      imageUrl = `https://drive.google.com/uc?export=view&id=${fileId}`;
      uploadedFileId = fileId;
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
  const data = values.slice(1).map(row => ({
  title: row[0],
  text: row[1],
  imageUrl: row[2],
  imageId: row[3], // <-- changed from fileId to imageId
}));

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
  if (folders.hasNext()) return folders.next();
  return DriveApp.createFolder(folderName);
}