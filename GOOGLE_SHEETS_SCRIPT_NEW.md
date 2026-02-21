# Updated Google Sheets Setup - Simplified Display

## Step 1: Update Your Google Sheet Headers

Open your Google Sheet and replace Row 1 with these headers:

1. **A1**: `Name`
2. **B1**: `Email`
3. **C1**: `Phone`
4. **D1**: `Location`
5. **E1**: `Date`
6. **F1**: `Time`
7. **G1**: `Service`
8. **H1**: `Notes`
9. **I1**: `Status`
10. **J1**: `_Token` (Hidden - used for updates)
11. **K1**: `_ConfirmationID` (Hidden - used for reference)

> **Tip**: After setup, you can hide columns J and K by right-clicking the column headers and selecting "Hide column". They're only used internally for updates.

---

## Step 2: Replace Your Google Apps Script

1. In your Google Sheet, go to **Extensions** → **Apps Script**
2. Delete ALL existing code
3. Paste this new code:

```javascript
/**
 * Google Apps Script for Clawed Up Glam Appointments
 * 
 * Displays only essential appointment information
 * Uses hidden columns for internal tracking (Token, ConfirmationID)
 */

function doPost(e) {
  try {
    // Parse the incoming JSON data
    var data = JSON.parse(e.postData.contents);
    
    // Get the active spreadsheet and first sheet
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    
    // Check if this appointment already exists (by token)
    var token = data.token || '';
    var existingRow = findRowByToken(sheet, token);
    
    if (existingRow > 0) {
      // UPDATE EXISTING ROW - Only update status
      sheet.getRange(existingRow, 9).setValue(data.status || 'Approved'); // Status in column I
      
      Logger.log('Updated existing appointment: ' + data.confirmationId + ' to status: ' + data.status);
      
      return ContentService
        .createTextOutput(JSON.stringify({ 
          success: true, 
          message: 'Status updated successfully',
          action: 'update',
          confirmationId: data.confirmationId
        }))
        .setMimeType(ContentService.MimeType.JSON);
        
    } else {
      // NEW APPOINTMENT - Add new row with visible columns + hidden tracking columns
      sheet.appendRow([
        data.name || '',                    // A: Name
        data.email || '',                   // B: Email
        data.phone || '',                   // C: Phone
        data.location || '',                // D: Location
        data.date || '',                    // E: Date
        data.time || '',                    // F: Time
        data.service || '',                 // G: Service
        data.notes || '',                   // H: Notes
        data.status || 'Pending',           // I: Status
        data.token || '',                   // J: _Token (hidden)
        data.confirmationId || ''           // K: _ConfirmationID (hidden)
      ]);
      
      Logger.log('Added new appointment: ' + data.confirmationId + ' with status: ' + data.status);
      
      return ContentService
        .createTextOutput(JSON.stringify({ 
          success: true, 
          message: 'Data saved successfully',
          action: 'create',
          confirmationId: data.confirmationId
        }))
        .setMimeType(ContentService.MimeType.JSON);
    }
      
  } catch (error) {
    // Return error response
    Logger.error('Error: ' + error.toString());
    return ContentService
      .createTextOutput(JSON.stringify({ 
        success: false, 
        error: error.toString() 
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Find existing appointment row by token
 * Token is stored in column J (index 9)
 */
function findRowByToken(sheet, token) {
  if (!token) return -1;
  
  var data = sheet.getDataRange().getValues();
  
  // Start from row 1 (index 1) to skip header row
  for (var i = 1; i < data.length; i++) {
    if (data[i][9] === token) { // Column J (index 9) contains Token
      return i + 1; // Return 1-based row number
    }
  }
  
  return -1; // Not found
}

/**
 * Test endpoint - Verify the script is working
 */
function doGet(e) {
  return ContentService
    .createTextOutput(JSON.stringify({ 
      success: true, 
      message: 'Google Sheets API is active and ready!',
      timestamp: new Date().toISOString()
    }))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * OPTIONAL: Function to hide internal columns
 * Run this once to automatically hide Token and ConfirmationID columns
 */
function hideInternalColumns() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  
  // Hide column J (_Token)
  sheet.hideColumns(10, 1);
  
  // Hide column K (_ConfirmationID)
  sheet.hideColumns(11, 1);
  
  Logger.log('Hidden internal tracking columns');
}

/**
 * OPTIONAL: Function to unhide internal columns (for debugging)
 */
function showInternalColumns() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  
  // Show column J (_Token)
  sheet.showColumns(10, 1);
  
  // Show column K (_ConfirmationID)  
  sheet.showColumns(11, 1);
  
  Logger.log('Showing internal tracking columns');
}
```

---

## Step 3: Save and Deploy

1. Click **Save** (Ctrl+S or Cmd+S)
2. Name your project: "Appointment Manager - Simplified"
3. Click **Deploy** → **Manage deployments**
4. If you have an existing deployment:
   - Click the pencil icon ✏️ to edit
   - Change "Version" to **New version**
   - Click **Deploy**
5. If this is a new deployment:
   - Click **New deployment**
   - Select type: **Web app**
   - Execute as: **Me**
   - Who has access: **Anyone**
   - Click **Deploy**

6. **Copy the Web App URL** - it should be the same as before

---

## Step 4: Hide Internal Columns (Optional)

### Option A: Manual Hide
1. In your Google Sheet, right-click on column **J** header
2. Select **Hide column**
3. Right-click on column **K** header  
4. Select **Hide column**

### Option B: Auto Hide (Run Script)
1. In Apps Script editor, find the `hideInternalColumns` function
2. Click the **Run** button (▶️)
3. Authorize if prompted
4. Columns J and K will be automatically hidden

To show them again for debugging, run the `showInternalColumns` function.

---

## What's New?

✅ **Simplified Display**: Only 9 visible columns with essential info  
✅ **Same Functionality**: Updates still work using hidden token  
✅ **Cleaner View**: No clutter from technical fields  
✅ **Easy Management**: Hide/unhide internal columns anytime  
✅ **Better Logging**: Clear messages about creates vs updates  

---

## Column Layout

| Column | Header | Visible | Purpose |
|--------|--------|---------|---------|
| A | Name | ✅ Yes | Client name |
| B | Email | ✅ Yes | Contact email |
| C | Phone | ✅ Yes | Contact phone |
| D | Location | ✅ Yes | Service location |
| E | Date | ✅ Yes | Appointment date |
| F | Time | ✅ Yes | Appointment time |
| G | Service | ✅ Yes | Service type |
| H | Notes | ✅ Yes | Additional notes |
| I | Status | ✅ Yes | Pending/Approved/Declined |
| J | _Token | 🔒 Hidden | Internal tracking |
| K | _ConfirmationID | 🔒 Hidden | Reference number |

---

## Testing

1. **Clear existing data** (optional): Delete all rows except the header
2. **Book a test appointment** from your website
3. **Check your sheet**: New row appears with Pending status
4. **Approve the appointment**: Click approve link in email
5. **Verify**: Status changes from Pending to Approved (no duplicate row)

---

## Troubleshooting

### Columns not hiding?
- Manually right-click column header → Hide column
- Or run the `hideInternalColumns()` function

### Updates creating duplicates?
- Check that column J has the token values
- Verify your deployment is using the new script version
- Make sure BASE_URL in .env matches your deployed URL

### Need to see hidden columns?
- Right-click between column I and L
- Select "Show columns J-K"
- Or run `showInternalColumns()` function

---

**Your Google Sheet is now cleaner and easier to read!** 📊✨
