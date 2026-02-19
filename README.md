# 💅 Clawed up Glam - Appointment Booking System

A modern, interactive nail salon appointment booking system with Excel-based data storage and automatic cleanup of past appointments.

## ✨ Features

- **Excel Storage**: All appointments saved to `.xlsx` file with proper formatting
- **Auto-Created Excel**: File automatically created if it doesn't exist
- **Data Persistence**: Stored in `/data` folder for deployment persistence
- **Auto-Sorting**: Entries automatically sorted by Date and Time (ascending)
- **Duplicate Prevention**: Prevents same email booking same date/time slot
- **Scheduled Cleanup**: Automatically removes past appointments (runs hourly)
- **Error Handling**: Handles locked Excel files with retry mechanism
- **Form Validation**: Server-side validation for all required fields
- Beautiful, responsive design with space-themed background
- Mobile-friendly design

## 📋 How It Works

1. **Client fills booking form** → name, email, phone, date, time, service, notes
2. **Data validated** → Server validates all required fields
3. **Duplicate check** → Prevents double-booking same slot
4. **Saved to Excel** → Appointment added to `data/appointments.xlsx`
5. **Auto-sorted** → All entries sorted by date/time ascending
6. **Confirmation shown** → Client receives confirmation number
7. **Auto-cleanup** → Past appointments deleted hourly via cron job

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
├── index.html          # Main HTML page with booking form
├── styles.css          # All CSS styles
├── script.js           # Frontend JavaScript
├── server.js           # Backend API server with Excel integration
├── package.json        # Node.js dependencies
├── data/               # Created automatically - stores Excel file
│   └── appointments.xlsx   # Auto-created Excel file with appointments
└── README.md           # This file
```

## 📊 Excel File Structure

The `appointments.xlsx` file contains these columns:

| Column | Description |
|--------|-------------|
| Name | Client's full name |
| Email | Client's email address |
| Phone | Client's phone number |
| Date | Appointment date (YYYY-MM-DD) |
| Time | Appointment time (HH:MM) |
| Service | Service type selected (optional) |
| Notes | Additional notes (optional) |
| Place | Client's location |
| ConfirmationID | Unique booking confirmation |
| CreatedAt | Timestamp when booked |

## 🔌 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Health check - shows server status |
| POST | `/api/book-appointment` | Book a new appointment |
| GET | `/api/appointments` | Get all appointments (admin) |
| POST | `/api/cleanup` | Manually trigger past appointment cleanup |

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

1. **Data Persistence**: The Excel file is stored in `/data/appointments.xlsx`. Ensure this folder persists across deployments:
   - Use volume mounts on container platforms
   - Backup regularly on VPS deployments

2. **Environment Variables**: Set `PORT` if your host requires a specific port:
   ```bash
   PORT=8080 npm start
   ```

3. **Timezone**: The cron job uses UTC by default. Edit `server.js` to change:
   ```javascript
   cron.schedule('0 * * * *', async () => { ... }, {
       timezone: "America/New_York" // Your timezone
   });
   ```

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

### Change Cleanup Schedule
Edit the cron schedule in `server.js`:
```javascript
// Every hour
cron.schedule('0 * * * *', ...)

// Every day at midnight
cron.schedule('0 0 * * *', ...)

// Every 30 minutes
cron.schedule('*/30 * * * *', ...)
```

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

### Excel file is locked?
- Close Excel if you have the file open
- The server has retry logic (3 attempts)
- If issue persists, restart the server

### Server not starting?
- Run `npm install` first
- Check if port 3000 is available
- Check console for error messages

### Appointments not saving?
- Check if `/data` folder has write permissions
- Check server logs for errors
- Verify form data is valid

### Past appointments not being deleted?
- Cron runs every hour - wait for next cycle
- Manually trigger: `POST /api/cleanup`
- Check server timezone settings

## 📄 License

MIT License - Feel free to use for your nail salon!

---

Made with 💖 for **Clawed up Glam**
