const DRIVE_FOLDER_ID = "1YCkSUFaEDuAob9Ljf2rr4lGZwS6NvoeO";

function doGet(e) {
  try {
    if (e.parameter.fileId) {
      return doGetImage(e);  // delegate to image fetch
    }

    const empId = e.parameter.EMP_ID;
    if (!empId) throw new Error("EMP_ID missing");

    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Employee");
    const values = sheet.getDataRange().getValues();
    const headers = values.shift();

    const row = values.find(r => String(r[0]) === String(empId));
    if (!row) return ContentService
      .createTextOutput(JSON.stringify({ error: "Profile not found" }))
      .setMimeType(ContentService.MimeType.JSON);

    const profile = {};
    headers.forEach((h, i) => profile[h] = row[i]);

    return ContentService
      .createTextOutput(JSON.stringify(profile))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ error: err.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents);
    const { EMP_ID, imageData, fileName, mimeType } = body;
    if (!EMP_ID || !imageData) throw new Error("Invalid payload");

    const blob = Utilities.newBlob(
      Utilities.base64Decode(imageData),
      mimeType,
      fileName
    );
    const file = DriveApp.getFolderById(DRIVE_FOLDER_ID).createFile(blob);
    file.setName(`EMP_${EMP_ID}_${Date.now()}`);
    const fileId = file.getId();

    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Employee");
    const headers = sheet.getDataRange().getValues()[0];
    const col = headers.indexOf("IMAGE_URL") + 1;
    const rows = sheet.getDataRange().getValues();
    const idx = rows.findIndex(r => String(r[0]) === String(EMP_ID));
    if (idx === -1) throw new Error("Employee not found");

    sheet.getRange(idx + 1, col).setValue(fileId);

    return ContentService
      .createTextOutput(JSON.stringify({ status: "success", fileId }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ status: "error", message: err.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doGetImage(e) {
  try {
    const fileId = e.parameter.fileId;
    if (!fileId) throw new Error("Missing fileId");

    const blob = DriveApp.getFileById(fileId).getBlob();
    const dataUri = "data:" + blob.getContentType() + ";base64," + Utilities.base64Encode(blob.getBytes());

    return ContentService
      .createTextOutput(dataUri)
      .setMimeType(ContentService.MimeType.TEXT);

  } catch (err) {
    return ContentService
      .createTextOutput(err.message)
      .setMimeType(ContentService.MimeType.TEXT);
  }
}