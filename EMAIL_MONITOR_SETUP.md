# Email Approval Monitor - Setup Guide

## 📧 Automated Email-Based Appointment Approval System

This system monitors incoming emails and automatically updates your Excel file **only when you approve a client**. Declined appointments are logged but **do NOT modify the Excel file**.

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [How It Works](#how-it-works)
3. [Required Permissions](#required-permissions)
4. [Step-by-Step Setup](#step-by-step-setup)
5. [Configuration](#configuration)
6. [Running the Monitor](#running-the-monitor)
7. [Sample Email Formats](#sample-email-formats)
8. [Security Features](#security-features)
9. [Troubleshooting](#troubleshooting)

---

## 🎯 Overview

This automation workflow:
- ✅ Monitors your inbox for approval/rejection emails
- ✅ Only processes emails from YOUR authorized email address
- ✅ Updates Excel file ONLY for approved appointments
- ✅ Ignores declined appointments (no Excel modification)
- ✅ Prevents duplicate entries
- ✅ Comprehensive logging for audit trail
- ✅ Secure token-based validation

---

## 🔄 How It Works

```
┌─────────────────────────────────────────────────────────────┐
│                    APPROVAL WORKFLOW                         │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  1. Client books appointment → Goes to PENDING status        │
│                      ↓                                       │
│  2. You receive approval request email                       │
│                      ↓                                       │
│  3. You reply/send email with "Approved" or "Declined"       │
│                      ↓                                       │
│  4. Monitor detects your email                               │
│                      ↓                                       │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  If "Approved":  │  If "Declined":                    │   │
│  │  → Update Excel  │  → Log only (NO Excel update)      │   │
│  │  → Send confirm  │  → Send decline notice             │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔐 Required Permissions

### For Gmail Users:

1. **Enable IMAP Access**
   - Go to Gmail Settings → See all settings
   - Click "Forwarding and POP/IMAP" tab
   - Enable IMAP access
   - Save changes

2. **Create App Password** (Required for Gmail)
   - Go to https://myaccount.google.com/apppasswords
   - You need 2-Factor Authentication enabled
   - Select "Mail" and your device
   - Click "Generate"
   - **Save the 16-character password** (you won't see it again!)

3. **Less Secure App Access** (Alternative, not recommended)
   - Only if App Password doesn't work
   - Go to https://myaccount.google.com/lesssecureapps
   - Enable access (security risk)

### For Microsoft 365/Outlook:

1. **IMAP Settings**:
   - Server: `outlook.office365.com`
   - Port: `993`
   - Use OAuth 2.0 or App Password

---

## 📝 Step-by-Step Setup

### Step 1: Install Python Dependencies

```powershell
# Navigate to project directory
cd "c:\Users\zingz\OneDrive\Desktop\web dev\claudeby banne"

# Install required packages
pip install -r requirements_email_monitor.txt
```

### Step 2: Configure Environment

1. Copy the example configuration:
```powershell
copy ".env.email_monitor.example" ".env"
```

2. Edit `.env` file with your settings:

```env
# Your email inbox to monitor
MONITOR_EMAIL=your-salon-email@gmail.com
MONITOR_EMAIL_PASSWORD=your-16-char-app-password

# YOUR email address for sending approvals
# ONLY emails from this address will be processed!
AUTHORIZED_SENDER_EMAIL=your-personal-email@gmail.com

# IMAP server (Gmail default)
IMAP_SERVER=imap.gmail.com
IMAP_PORT=993

# Check interval (seconds)
POLL_INTERVAL=30
```

### Step 3: Test the Setup

```powershell
# Test Excel file creation
python email_approval_monitor.py --test-excel

# Run once to test email connection
python email_approval_monitor.py --once
```

### Step 4: Run Continuous Monitoring

```powershell
# Start the monitor (runs continuously)
python email_approval_monitor.py
```

### Step 5: Run as Background Service (Optional)

**Windows Task Scheduler:**
1. Open Task Scheduler
2. Create Basic Task
3. Trigger: At startup
4. Action: Start a program
5. Program: `python`
6. Arguments: `"c:\Users\zingz\OneDrive\Desktop\web dev\claudeby banne\email_approval_monitor.py"`
7. Start in: `"c:\Users\zingz\OneDrive\Desktop\web dev\claudeby banne"`

---

## ⚙️ Configuration

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `MONITOR_EMAIL` | Email inbox to monitor | ✅ |
| `MONITOR_EMAIL_PASSWORD` | App password for email | ✅ |
| `AUTHORIZED_SENDER_EMAIL` | Your email for approvals | ✅ |
| `IMAP_SERVER` | IMAP server address | Default: imap.gmail.com |
| `IMAP_PORT` | IMAP port | Default: 993 |
| `POLL_INTERVAL` | Check interval in seconds | Default: 30 |

### Approval Keywords (Recognized)

**Approval indicators:**
- approved, approve, accept, accepted
- confirmed, confirm, yes, granted
- ok, okay, agreed

**Rejection indicators:**
- declined, decline, reject, rejected
- denied, deny, no, refused
- cancel, cancelled, not approved

---

## 📨 Sample Email Formats

### ✅ APPROVAL EMAIL (Updates Excel)

**Option 1 - Subject Line Approval:**
```
To: your-salon-email@gmail.com
From: your-personal-email@gmail.com
Subject: Approved - CUG-MLRYYCDV-SZDY

The appointment is approved.
```

**Option 2 - Body Approval:**
```
To: your-salon-email@gmail.com
From: your-personal-email@gmail.com
Subject: Re: New Appointment Request

I approve this appointment.

Confirmation ID: CUG-MLRYYCDV-SZDY
```

**Option 3 - Forward with Approval:**
```
To: your-salon-email@gmail.com
From: your-personal-email@gmail.com
Subject: Fwd: Appointment Request

APPROVED

Name: Vaibhav Singh
Email: client@example.com
Phone: 6394140862
Date: 2026-02-27
Time: 11:18 PM
Confirmation #: CUG-MLRYYCDV-SZDY
```

---

### ❌ DECLINE EMAIL (Does NOT Update Excel)

**Option 1 - Subject Line Decline:**
```
To: your-salon-email@gmail.com
From: your-personal-email@gmail.com
Subject: Declined - CUG-MLRYYCDV-SZDY

Cannot accommodate this appointment.
```

**Option 2 - Body Decline:**
```
To: your-salon-email@gmail.com
From: your-personal-email@gmail.com
Subject: Re: New Appointment Request

Sorry, I have to decline this appointment.

Confirmation ID: CUG-MLRYYCDV-SZDY
```

---

## 🔒 Security Features

### 1. Authorized Sender Only
```
⚠️ ONLY emails from AUTHORIZED_SENDER_EMAIL are processed!
All other senders are logged and ignored.
```

### 2. Confirmation ID Validation
- Each appointment has a unique confirmation ID
- Must include confirmation ID in email for processing

### 3. Duplicate Prevention
- System checks for existing entries before adding
- Same appointment cannot be added twice

### 4. Audit Logging
- All actions logged to `data/email_monitor.log`
- Tracks who approved/declined what and when

### 5. Processed Email Tracking
- Prevents reprocessing same email multiple times
- Stored in `data/processed_emails.json`

---

## 🛠️ Troubleshooting

### "Authentication failed"
- Ensure you're using an App Password, not your regular password
- Verify IMAP is enabled in email settings
- Check IMAP_SERVER and IMAP_PORT values

### "No confirmation ID found"
- Include the confirmation ID (CUG-XXXXX-XXXX) in your email
- Check email body or subject line

### "Unauthorized sender"
- Email must be FROM your AUTHORIZED_SENDER_EMAIL exactly
- Check for typos in the .env file

### "Excel file is locked"
- Close the Excel file before running the monitor
- The system will retry 3 times automatically

### "Module not found"
```powershell
pip install openpyxl python-dotenv
```

### Check Logs
```powershell
# View recent logs
Get-Content "data\email_monitor.log" -Tail 50
```

---

## 📁 File Structure

```
claudeby banne/
├── email_approval_monitor.py      # Main monitor script
├── requirements_email_monitor.txt # Python dependencies
├── .env.email_monitor.example     # Configuration template
├── .env                           # Your configuration (create this)
└── data/
    ├── appointments.xlsx          # Approved appointments
    ├── pending_appointments.json  # Waiting for approval
    ├── email_monitor.log          # Activity log
    └── processed_emails.json      # Processed email IDs
```

---

## 🚀 Quick Start Summary

```powershell
# 1. Install dependencies
pip install -r requirements_email_monitor.txt

# 2. Create configuration
copy ".env.email_monitor.example" ".env"
# Edit .env with your email credentials

# 3. Test the setup
python email_approval_monitor.py --test-excel
python email_approval_monitor.py --once

# 4. Run continuously
python email_approval_monitor.py
```

---

## 📞 Support

If you encounter issues:
1. Check the log file: `data/email_monitor.log`
2. Verify your `.env` configuration
3. Ensure email IMAP access is enabled
4. Test with `--once` flag first

---

**Note:** This system works alongside your existing URL-based approval system. Both methods can be used simultaneously for flexibility.
