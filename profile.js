const DRIVE_FOLDER_ID = "1yVtUIDGgg-BaaaLR2hXm2J-gvLH6HtsX"; // Root folder

function doGet(e) {
  try {
    if (e.parameter.fileId) {
      return doGetImage(e);  // delegate to image fetch
    }

    const empId = e.parameter.EMP_ID;
    const role = e.parameter.role;
    if (!empId) throw new Error("EMP_ID missing");
    if (!role) throw new Error("role missing");

    // Use the provided Google Sheet ID for employee lookup
    const SHEET_ID = "1WGvnJUF5n1ZoKHk5y8DzztYSuKhuNJBb-mquGwiRZ1w";
    const sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName("Employee");
    const values = sheet.getDataRange().getValues();
    const headers = values.shift();

    const row = values.find(r => String(r[0]) === String(empId));
    if (!row) return ContentService
      .createTextOutput(JSON.stringify({ error: "Profile not found" }))
      .setMimeType(ContentService.MimeType.JSON);

    const profile = {};
    headers.forEach((h, i) => profile[h] = row[i]);

    // Find the profile image fileId if it exists
    try {
      const root = DriveApp.getFolderById(DRIVE_FOLDER_ID);
      const roleFolder = root.getFoldersByName(role);
      if (!roleFolder.hasNext()) throw new Error('Role folder not found');
      const roleFld = roleFolder.next();
      const idFolder = roleFld.getFoldersByName(String(empId));
      if (!idFolder.hasNext()) throw new Error('ID folder not found');
      const idFld = idFolder.next();
      const profileImgFolder = idFld.getFoldersByName('ProfilePhoto');
      if (profileImgFolder.hasNext()) {
        const imgFld = profileImgFolder.next();
        const files = imgFld.getFiles();
        if (files.hasNext()) {
          const file = files.next();
          profile.IMAGE_URL = file.getId();
        }
      }
    } catch (e) {
      // Ignore if not found
    }

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
    const { EMP_ID, imageData, fileName, mimeType, role } = body;
    if (!EMP_ID || !imageData || !role) throw new Error("Invalid payload");

    const blob = Utilities.newBlob(
      Utilities.base64Decode(imageData),
      mimeType,
      fileName
    );

    // Navigate to correct folder: root -> role (Admin/Employees) -> EMP_ID -> ProfileImage
    const root = DriveApp.getFolderById(DRIVE_FOLDER_ID);
    let roleFldIter = root.getFoldersByName(role);
    let roleFld = roleFldIter.hasNext() ? roleFldIter.next() : root.createFolder(role);
    let idFldIter = roleFld.getFoldersByName(String(EMP_ID));
    let idFld = idFldIter.hasNext() ? idFldIter.next() : roleFld.createFolder(String(EMP_ID));
    let profileImgFldIter = idFld.getFoldersByName('ProfileImage');
    let profileImgFld = profileImgFldIter.hasNext() ? profileImgFldIter.next() : idFld.createFolder('ProfileImage');

    // Remove old files in ProfileImage folder
    const files = profileImgFld.getFiles();
    while (files.hasNext()) {
      files.next().setTrashed(true);
    }

    const file = profileImgFld.createFile(blob);
    file.setName(`EMP_${EMP_ID}_${Date.now()}`);
    const fileId = file.getId();

    // Optionally update sheet IMAGE_URL
    const SHEET_ID = "1WGvnJUF5n1ZoKHk5y8DzztYSuKhuNJBb-mquGwiRZ1w";
    const sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName("Employee");
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