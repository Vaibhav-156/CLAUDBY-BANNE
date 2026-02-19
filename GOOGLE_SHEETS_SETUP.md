# Google Sheets Integration Setup

This guide will help you set up Google Sheets to store approved appointment data.

## Step 1: Create a Google Sheet

1. Go to [Google Sheets](https://sheets.google.com)
2. Create a new spreadsheet
3. Name it "Clawed Up Glam - Appointments"
4. In the first row (Row 1), add these headers:
   - A1: `Name`
   - B1: `Phone`
   - C1: `Email`
   - D1: `Appointment Date`
   - E1: `Time`
   - F1: `Service`
   - G1: `Location`
   - H1: `Notes`
   - I1: `Confirmation ID`
   - J1: `Status`
   - K1: `Approved At`

## Step 2: Create Google Apps Script

1. In your Google Sheet, go to **Extensions** → **Apps Script**
2. Delete any existing code and paste this:

```javascript
function doPost(e) {
  try {
    // Parse the incoming JSON data
    var data = JSON.parse(e.postData.contents);
    
    // Get the active spreadsheet and first sheet
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    
    // Append a new row with the appointment data
    sheet.appendRow([
      data.name || '',
      data.phone || '',
      data.email || '',
      data.date || '',
      data.time || '',
      data.service || '',
      data.location || '',
      data.notes || '',
      data.confirmationId || '',
      data.status || 'Approved',
      data.approvedAt || new Date().toISOString()
    ]);
    
    // Return success response
    return ContentService
      .createTextOutput(JSON.stringify({ success: true, message: 'Data saved successfully' }))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    // Return error response
    return ContentService
      .createTextOutput(JSON.stringify({ success: false, error: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// Test function to verify the script works
function doGet(e) {
  return ContentService
    .createTextOutput(JSON.stringify({ 
      success: true, 
      message: 'Google Sheets API is working! Use POST to add appointments.' 
    }))
    .setMimeType(ContentService.MimeType.JSON);
}
```

3. Click **Save** (Ctrl+S)
4. Name your project: "Appointment Handler"

## Step 3: Deploy as Web App

1. Click **Deploy** → **New deployment**
2. Click the gear icon ⚙️ next to "Select type" and choose **Web app**
3. Configure:
   - **Description**: "Appointment Data Handler"
   - **Execute as**: "Me"
   - **Who has access**: "Anyone"
4. Click **Deploy**
5. Click **Authorize access** and follow the prompts:
   - Choose your Google account
   - Click "Advanced" → "Go to Appointment Handler (unsafe)"
   - Click "Allow"
6. **Copy the Web App URL** - it looks like:
   ```
   https://script.google.com/macros/s/AKfycb.../exec
   ```

## Step 4: Configure Your Server

Add this to your `.env` file:

```env
GOOGLE_SHEETS_WEBHOOK_URL=https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec
```

Replace `YOUR_SCRIPT_ID` with your actual deployed URL.

## Step 5: Test the Integration

1. Restart your server: `npm start`
2. Book a test appointment through your website
3. Approve the appointment via the email link
4. Check your Google Sheet - the data should appear!

## Troubleshooting

### Data not appearing in Google Sheet?
1. Verify the `GOOGLE_SHEETS_WEBHOOK_URL` in your `.env` file
2. Check that the Apps Script is deployed as a web app
3. Ensure "Who has access" is set to "Anyone"

### Authorization errors?
1. Go to Apps Script editor
2. Click **Deploy** → **Manage deployments**
3. Delete the existing deployment
4. Create a new deployment and re-authorize

### Updating the Script?
After editing the Apps Script code:
1. Click **Deploy** → **Manage deployments**
2. Click the pencil icon to edit
3. Change Version to "New version"
4. Click **Deploy**

## Benefits of Google Sheets

✅ **Accessible anywhere** - View from phone, tablet, or computer  
✅ **Shareable** - Give access to staff members  
✅ **Searchable** - Find clients easily  
✅ **Exportable** - Download as Excel, CSV, or PDF  
✅ **Free** - No database costs  
✅ **Automatic backups** - Google handles it  

## Viewing Your Data

- **On Phone**: Download Google Sheets app (iOS/Android)
- **On Desktop**: Go to sheets.google.com
- **Share with Staff**: Click "Share" button in Google Sheets

---

Need help? Contact support or check the server logs for error messages.
