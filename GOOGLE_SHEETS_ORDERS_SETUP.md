# Google Sheets Setup for Pre-made Set Orders

This setup stores each checkout order (customer info + cart items + total) into Google Sheets.

## 1. Create an Orders Sheet

Create a new Google Sheet and set row 1 headers:

1. `Record Type`
2. `Order ID`
3. `Customer Name`
4. `Phone`
5. `Address`
6. `Items`
7. `Item Count`
8. `Total Price`
9. `Created At`

## 2. Add Apps Script

Open **Extensions -> Apps Script** and paste:

```javascript
function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents || '{}');
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();

    // Accept only order records in this sheet.
    if ((data.recordType || '').toLowerCase() !== 'order') {
      return ContentService
        .createTextOutput(JSON.stringify({ success: false, error: 'Only order payloads are supported here.' }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    sheet.appendRow([
      data.recordType || 'order',
      data.orderId || '',
      data.customerName || data.name || '',
      data.customerPhone || data.phone || '',
      data.customerAddress || data.location || '',
      data.itemSummary || data.items || '',
      data.itemCount || '',
      data.totalPrice || '',
      data.createdAt || new Date().toISOString()
    ]);

    return ContentService
      .createTextOutput(JSON.stringify({ success: true, message: 'Order saved successfully' }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({ success: false, error: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet() {
  return ContentService
    .createTextOutput(JSON.stringify({ success: true, message: 'Orders endpoint is active' }))
    .setMimeType(ContentService.MimeType.JSON);
}
```

## 3. Deploy as Web App

1. Click **Deploy -> New deployment**
2. Select **Web app**
3. Execute as: **Me**
4. Who has access: **Anyone**
5. Deploy and copy URL

## 4. Add Environment Variable

In your server environment (or `.env`), add:

```env
GOOGLE_SHEETS_ORDERS_WEBHOOK_URL=https://script.google.com/macros/s/your-orders-script-id/exec
```

If this variable is not set, the backend falls back to `GOOGLE_SHEETS_WEBHOOK_URL`.

## 5. Test

1. Open `shop.html`
2. Add items to cart and complete checkout form
3. Submit order
4. Confirm a new row appears in your orders sheet
