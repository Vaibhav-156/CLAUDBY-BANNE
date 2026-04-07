# 💅 Clawed up Glam - Appointment Booking System

A modern, interactive nail salon appointment booking system with Google Sheets storage and an email-based approval workflow.

## ✨ Features

- **Google Sheets Storage**: All appointments stored in a Google Sheet via Apps Script
- **Admin Approval Workflow**: Each booking is reviewed before confirmation
- **Email Notifications**: Admin approval email + client approval/decline email
- **Secure Action Links**: One-click approve/decline links with tokens
- **Server-side Validation**: Required fields validated on the backend
- **Client Status Polling**: UI checks approval status automatically
- Beautiful, responsive design with space-themed background
- Mobile-friendly design

## 📋 How It Works

1. **Client fills booking form** → name, email, phone, date, time, service, notes
2. **Data validated** → Server validates all required fields
3. **Pending appointment created** → Token + confirmation number generated
4. **Admin email sent** → Approve/decline links included
5. **Saved to Google Sheets** → Status recorded as Pending/Approved/Declined
6. **Client notified** → Email sent after approval/decline
7. **Status polling** → UI updates when approval status changes

## 🚀 Quick Start

### 1. Install Dependencies

```bash
npm install
```

This installs:
- `express` - Web server framework
- `cors` - Cross-origin resource sharing
- `exceljs` - Excel file creation and manipulation
- `node-cron` - Scheduled task runner

### 2. Start the Server

```bash
npm start
```

Or for development with auto-reload:
```bash
npm run dev
```

Server will run at `http://localhost:3000`

### 3. Open the Website

Open `http://localhost:3000` in your browser.

## 📁 Project Structure

```
clawed-up-glam/
├── public/
│   ├── index.html        # Landing page
│   ├── booking.html      # Booking form
│   ├── styles.css        # Frontend styles
│   └── script.js         # Frontend behavior
├── server.js             # Backend API + email/Google Sheets integration
├── package.json          # Node.js dependencies
├── data/                 # Legacy data folder (not used in Sheets flow)
└── README.md             # This file
```

## 📊 Google Sheets Columns

The Google Sheet uses these columns (see GOOGLE_SHEETS_SETUP.md / GOOGLE_SHEETS_SCRIPT_NEW.md):

| Column | Description |
|--------|-------------|
| Name | Client's full name |
| Email | Client's email address |
| Phone | Client's phone number |
| Location | Client's location |
| Date | Appointment date (YYYY-MM-DD) |
| Time | Appointment time (HH:MM) |
| Service | Service type selected (optional) |
| Notes | Additional notes (optional) |
| Status | Pending / Approved / Declined |
| _Token | Hidden token for updates |
| _ConfirmationID | Hidden confirmation reference |

## 🔌 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Health check - shows server status |
| POST | `/api/book-appointment` | Submit a new appointment request |
| GET | `/api/status/:token` | Check approval status (polling) |
| GET | `/api/approve/:token` | Admin approve confirmation page |
| POST | `/api/approve/:token` | Admin approve action |
| GET | `/api/decline/:token` | Admin decline confirmation page |
| POST | `/api/decline/:token` | Admin decline action |
| GET | `/api/appointments` | Info message (data is in Google Sheets) |
| POST | `/api/cleanup` | Info message (cleanup handled in Sheets) |

### Example Request

### Example API Request

```javascript
POST /api/book-appointment
Content-Type: application/json

{
  "appointmentData": {
    "fullName": "Jane Doe",
    "email": "jane@example.com",
    "phone": "1234567890",
    "place": "New York",
    "appointmentDate": "2026-03-15",
    "appointmentTime": "14:30",
    "serviceType": "Manicure & Pedicure",
    "additionalNotes": "Please use gel polish"
  }
}
```

## 🚀 Deployment Guide

### Deploy to Render.com (Recommended - Free)

1. Push your code to GitHub
2. Create account on [Render.com](https://render.com)
3. Create new "Web Service" and connect your GitHub repo
4. Configure:
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Environment**: Node
5. Add a **Persistent Disk** (important for Excel file):
   - Mount Path: `/opt/render/project/src/data`
   - This ensures your `appointments.xlsx` persists!

### Deploy to Railway.app

1. Push your code to GitHub
2. Create account on [Railway.app](https://railway.app)
3. New Project → Deploy from GitHub repo
4. Add a **Volume** mounted at `/app/data` for persistence

### Deploy to Heroku

1. Install Heroku CLI
2. Run:
```bash
heroku create your-app-name
heroku git:remote -a your-app-name
git push heroku main
```
**Note**: Heroku's ephemeral filesystem means data will be lost on restart. Consider using Heroku Postgres or external storage.

### Deploy to VPS (DigitalOcean, AWS, etc.)

1. SSH into your server
2. Install Node.js:
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
```
3. Clone your repo and install:
```bash
git clone your-repo-url
cd clawed-up-glam
npm install
```
4. Use PM2 for process management:
```bash
npm install -g pm2
pm2 start server.js --name "clawed-up-glam"
pm2 save
pm2 startup
```
5. Setup Nginx reverse proxy (optional but recommended)

### Important Deployment Notes

1. **Environment Variables**: Set these in your host environment:
   ```bash
   GOOGLE_SHEETS_WEBHOOK_URL=...
   SMTP_USER=...
   SMTP_PASS=...
   ADMIN_EMAIL=...
   BASE_URL=https://your-domain.com
   ```

2. **PORT**: Set `PORT` if your host requires a specific port:
   ```bash
   PORT=8080 npm start
   ```

3. **Email Links**: `BASE_URL` should match your deployed domain so approve/decline links work correctly.

## 🎨 Customization

### Change Salon Details
Edit the `SALON_CONFIG` object in `server.js`:
```javascript
const SALON_CONFIG = {
    name: 'Your Salon Name',
    phone: '(555) 123-4567',
    address: '123 Your Street, City',
    email: 'your@email.com',
    website: 'www.yoursalon.com'
};
```

### Change Colors
Edit `styles.css` and modify the CSS variables:
```css
:root {
    --primary-pink: #f8b4c4;
    --soft-pink: #fce4ec;
    --lavender: #e8d5f2;
    --accent-pink: #e91e63;
}
```

### Change Approval Flow
The approval flow is handled in `server.js` via `/api/approve/:token` and `/api/decline/:token`.

### Modify Service Types
Edit `index.html` to add/remove service options:
```html
<select id="serviceType">
    <option value="">Select a service</option>
    <option value="Manicure">Manicure</option>
    <!-- Add more options -->
</select>
```

## 🛠 Troubleshooting

### Server not starting?
- Run `npm install` first
- Check if port 3000 is available
- Check console for error messages

### Appointments not saving to Google Sheets?
- Verify the `GOOGLE_SHEETS_WEBHOOK_URL` in your `.env`
- Confirm the Apps Script is deployed as a web app (access: Anyone)
- Check server logs for webhook errors

### Emails not sending?
- Verify `SMTP_USER` and `SMTP_PASS`
- Check `ADMIN_EMAIL` and spam folders
- Check server logs for transporter errors

## 📄 License

MIT License - Feel free to use for your nail salon!

---

Made with 💖 for **Clawed up Glam**
