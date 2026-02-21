/**
 * ============================================
 * CLAWED UP GLAM - BACKEND SERVER
 * ============================================
 * 
 * Server that handles:
 * - Serving static files
 * - Appointment booking with email approval workflow
 * - Google Sheets integration for approved appointments
 * - Token-based secure approval/decline links
 * 
 * SETUP:
 * 1. Run: npm install
 * 2. Create .env file with email credentials
 * 3. Set up Google Sheets (see GOOGLE_SHEETS_SETUP.md)
 * 4. Run: node server.js
 * 5. Open: http://localhost:3000
 */

const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
// Note: ExcelJS removed - using Google Sheets instead
const crypto = require('crypto');
const nodemailer = require('nodemailer');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
const BASE_URL = process.env.BASE_URL || `http://localhost:${PORT}`;

// ============================================
// MIDDLEWARE
// ============================================
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public'))); // Serve static files from public folder

// ============================================
// SALON CONFIGURATION
// ============================================
const SALON_CONFIG = {
    name: 'Clawed up Glam',
    phone: process.env.SALON_PHONE || '6394140862',
    address: process.env.SALON_ADDRESS || '123 Beauty Lane, Glamour City',
    email: process.env.SALON_EMAIL || 'clawedupglambybanne@gmail.com',
    website: 'www.clawedupglam.com'
};

// Admin email for receiving approval requests
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'clawedupglambybanne@gmail.com';

// ============================================
// FILE CONFIGURATION
// ============================================
const DATA_DIR = path.join(__dirname, 'data');
const PENDING_FILE = path.join(DATA_DIR, 'pending_appointments.json');

// Google Sheets Webhook URL (set in .env file)
const GOOGLE_SHEETS_WEBHOOK_URL = process.env.GOOGLE_SHEETS_WEBHOOK_URL || '';

// Ensure data directory exists
function ensureDataDirectory() {
    if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
        console.log('📁 Created data directory:', DATA_DIR);
    }
}

// ============================================
// EMAIL TRANSPORTER CONFIGURATION
// ============================================
let emailTransporter = null;

function getEmailTransporter() {
    // Lazy initialization - create transporter on first use
    if (!emailTransporter) {
        emailTransporter = initializeEmailTransporter();
    }
    return emailTransporter;
}

function initializeEmailTransporter() {
    // Check if email credentials are configured
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
        console.warn('⚠️  Email credentials not configured. Set SMTP_USER and SMTP_PASS in environment variables.');
        console.warn('⚠️  Emails will not be sent until credentials are configured.');
        console.warn(`   SMTP_USER is ${process.env.SMTP_USER ? 'set' : 'NOT SET'}`);
        console.warn(`   SMTP_PASS is ${process.env.SMTP_PASS ? 'set' : 'NOT SET'}`);
        return null;
    }

    console.log('📧 Initializing email transporter...');
    console.log(`   SMTP Host: ${process.env.SMTP_HOST || 'smtp.gmail.com'}`);
    console.log(`   SMTP Port: ${process.env.SMTP_PORT || '587'}`);
    console.log(`   SMTP User: ${process.env.SMTP_USER}`);

    const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.SMTP_PORT) || 587,
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS.replace(/\s/g, '') // Remove any spaces from app password
        },
        tls: {
            rejectUnauthorized: false // Allow self-signed certificates
        }
    });

    // Verify connection
    transporter.verify((error, success) => {
        if (error) {
            console.error('❌ Email transporter verification failed:', error.message);
            console.error('   Full error:', error);
        } else {
            console.log('✅ Email transporter is ready');
        }
    });

    return transporter;
}

// ============================================
// PENDING APPOINTMENTS STORAGE (IN-MEMORY + GOOGLE SHEETS)
// ============================================
// In-memory cache for serverless compatibility (Vercel has read-only filesystem)
const pendingAppointmentsCache = {};

function loadPendingAppointments() {
    // On Vercel, we can't use file system, so return the in-memory cache
    // The actual source of truth is Google Sheets
    return pendingAppointmentsCache;
}

function savePendingAppointments(appointments) {
    // On Vercel, file system is read-only, so we just update the cache
    // Appointments are saved to Google Sheets instead
    Object.assign(pendingAppointmentsCache, appointments);
    return true;  // Always return success for in-memory operations
}

function getPendingAppointment(token) {
    const appointments = loadPendingAppointments();
    return appointments[token] || null;
}

function updatePendingAppointmentStatus(token, status) {
    const appointments = loadPendingAppointments();
    if (appointments[token]) {
        appointments[token].status = status;
        appointments[token].updatedAt = new Date().toISOString();
        savePendingAppointments(appointments);
        return appointments[token];
    }
    return null;
}

function deletePendingAppointment(token) {
    const appointments = loadPendingAppointments();
    if (appointments[token]) {
        delete appointments[token];
        savePendingAppointments(appointments);
        return true;
    }
    return false;
}

// ============================================
// GOOGLE SHEETS INTEGRATION
// ============================================

/**
 * Send approved appointment data to Google Sheets via Apps Script Web App
 * No local file storage - data goes directly to Google Sheets
 */
async function saveAppointmentToGoogleSheets(appointment, status = 'Approved') {
    if (!GOOGLE_SHEETS_WEBHOOK_URL) {
        console.warn('⚠️  Google Sheets webhook URL not configured. Set GOOGLE_SHEETS_WEBHOOK_URL in .env file.');
        console.warn('⚠️  Appointment data was NOT saved. Please configure Google Sheets integration.');
        return { success: false, error: 'Google Sheets not configured' };
    }

    try {
        const payload = {
            name: appointment.name || '',
            phone: appointment.phone || '',
            email: appointment.email || '',
            date: appointment.date || '',
            time: appointment.time || '',
            service: appointment.service || '',
            location: appointment.place || '',
            notes: appointment.notes || '',
            confirmationId: appointment.confirmationId || '',
            status: status,
            token: appointment.token || '',
            createdAt: appointment.createdAt || new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        const response = await fetch(GOOGLE_SHEETS_WEBHOOK_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
            redirect: 'follow'
        });

        // Google Apps Script returns a redirect, so we need to follow it
        const result = await response.text();
        
        try {
            const jsonResult = JSON.parse(result);
            if (jsonResult.success) {
                console.log(`📊 Saved appointment to Google Sheets: ${appointment.confirmationId} (Status: ${status})`);
                return { success: true };
            } else {
                console.error('Google Sheets error:', jsonResult.error);
                return { success: false, error: jsonResult.error };
            }
        } catch {
            // If response isn't JSON, check if it was successful based on status
            if (response.ok) {
                console.log(`📊 Saved appointment to Google Sheets: ${appointment.confirmationId} (Status: ${status})`);
                return { success: true };
            }
            throw new Error('Invalid response from Google Sheets');
        }

    } catch (error) {
        console.error('Error saving to Google Sheets:', error.message);
        return { success: false, error: error.message };
    }
}

// ============================================
// TOKEN GENERATION
// ============================================

function generateSecureToken() {
    return crypto.randomBytes(32).toString('hex');
}

function generateConfirmationNumber() {
    return 'CUG-' + Date.now().toString(36).toUpperCase() + '-' + Math.random().toString(36).substring(2, 6).toUpperCase();
}

// ============================================
// EMAIL TEMPLATES
// ============================================

function getAdminApprovalEmailHTML(appointment, approveUrl, declineUrl) {
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5;">
    <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #e91e63 0%, #f8b4c4 100%); padding: 30px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 28px;">💅 New Appointment Request</h1>
            <p style="color: #ffffff; margin: 10px 0 0 0; opacity: 0.9;">${SALON_CONFIG.name}</p>
        </div>
        
        <!-- Content -->
        <div style="padding: 30px;">
            <p style="color: #333; font-size: 16px; margin-bottom: 20px;">
                A new appointment request has been submitted and requires your approval:
            </p>
            
            <!-- Appointment Details Card -->
            <div style="background: #fce4ec; border-radius: 15px; padding: 25px; margin-bottom: 25px;">
                <h2 style="color: #e91e63; margin: 0 0 20px 0; font-size: 18px;">📋 Appointment Details</h2>
                
                <table style="width: 100%; border-collapse: collapse;">
                    <tr>
                        <td style="padding: 10px 0; color: #666; width: 40%;">👤 <strong>Name:</strong></td>
                        <td style="padding: 10px 0; color: #333;">${appointment.name}</td>
                    </tr>
                    <tr>
                        <td style="padding: 10px 0; color: #666;">📧 <strong>Email:</strong></td>
                        <td style="padding: 10px 0; color: #333;">${appointment.email}</td>
                    </tr>
                    <tr>
                        <td style="padding: 10px 0; color: #666;">📱 <strong>Phone:</strong></td>
                        <td style="padding: 10px 0; color: #333;">${appointment.phone}</td>
                    </tr>
                    <tr>
                        <td style="padding: 10px 0; color: #666;">📅 <strong>Date:</strong></td>
                        <td style="padding: 10px 0; color: #333;">${formatDate(appointment.date)}</td>
                    </tr>
                    <tr>
                        <td style="padding: 10px 0; color: #666;">🕐 <strong>Time:</strong></td>
                        <td style="padding: 10px 0; color: #333;">${formatTime(appointment.time)}</td>
                    </tr>
                    <tr>
                        <td style="padding: 10px 0; color: #666;">💅 <strong>Service:</strong></td>
                        <td style="padding: 10px 0; color: #333;">${appointment.service || 'Not specified'}</td>
                    </tr>
                    <tr>
                        <td style="padding: 10px 0; color: #666;">📍 <strong>Location:</strong></td>
                        <td style="padding: 10px 0; color: #333;">${appointment.place || 'Not specified'}</td>
                    </tr>
                    ${appointment.notes ? `
                    <tr>
                        <td style="padding: 10px 0; color: #666; vertical-align: top;">📝 <strong>Notes:</strong></td>
                        <td style="padding: 10px 0; color: #333;">${appointment.notes}</td>
                    </tr>
                    ` : ''}
                </table>
            </div>
            
            <!-- Confirmation Number -->
            <div style="background: #e8f5e9; border-radius: 10px; padding: 15px; text-align: center; margin-bottom: 25px;">
                <p style="margin: 0; color: #4caf50; font-size: 14px;">
                    <strong>Confirmation #:</strong> ${appointment.confirmationId}
                </p>
            </div>
            
            <!-- Action Buttons -->
            <div style="text-align: center; margin: 30px 0;">
                <p style="color: #666; margin-bottom: 20px;">Please respond to this request:</p>
                
                <a href="${approveUrl}" style="display: inline-block; background: linear-gradient(135deg, #4caf50 0%, #66bb6a 100%); color: #ffffff; text-decoration: none; padding: 15px 40px; border-radius: 30px; font-weight: bold; font-size: 16px; margin: 10px; box-shadow: 0 4px 15px rgba(76, 175, 80, 0.3);">
                    ✅ Accept Appointment
                </a>
                
                <br><br>
                
                <a href="${declineUrl}" style="display: inline-block; background: linear-gradient(135deg, #f44336 0%, #ef5350 100%); color: #ffffff; text-decoration: none; padding: 15px 40px; border-radius: 30px; font-weight: bold; font-size: 16px; margin: 10px; box-shadow: 0 4px 15px rgba(244, 67, 54, 0.3);">
                    ❌ Decline Appointment
                </a>
            </div>
            
            <p style="color: #999; font-size: 12px; text-align: center; margin-top: 30px;">
                These links are secure and can only be used once.
            </p>
        </div>
        
        <!-- Footer -->
        <div style="background: #f5f5f5; padding: 20px; text-align: center; border-top: 1px solid #eee;">
            <p style="margin: 0; color: #999; font-size: 12px;">
                ${SALON_CONFIG.name} | ${SALON_CONFIG.address}<br>
                ${SALON_CONFIG.phone} | ${SALON_CONFIG.email}
            </p>
        </div>
    </div>
</body>
</html>
    `;
}

function getClientApprovalEmailHTML(appointment) {
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5;">
    <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #4caf50 0%, #66bb6a 100%); padding: 30px; text-align: center;">
            <div style="font-size: 60px; margin-bottom: 10px;">✅</div>
            <h1 style="color: #ffffff; margin: 0; font-size: 28px;">Appointment Confirmed!</h1>
            <p style="color: #ffffff; margin: 10px 0 0 0; opacity: 0.9;">${SALON_CONFIG.name}</p>
        </div>
        
        <!-- Content -->
        <div style="padding: 30px;">
            <p style="color: #333; font-size: 16px; margin-bottom: 20px;">
                Hi <strong>${appointment.name}</strong>! 💅
            </p>
            
            <p style="color: #4caf50; font-size: 18px; font-weight: bold; margin-bottom: 20px;">
                Great news! Your appointment has been approved! 🎉
            </p>
            
            <!-- Appointment Details Card -->
            <div style="background: #e8f5e9; border-radius: 15px; padding: 25px; margin-bottom: 25px; border: 2px solid #4caf50;">
                <h2 style="color: #4caf50; margin: 0 0 20px 0; font-size: 18px;">📋 Your Appointment Details</h2>
                
                <table style="width: 100%; border-collapse: collapse;">
                    <tr>
                        <td style="padding: 10px 0; color: #666; width: 40%;">📅 <strong>Date:</strong></td>
                        <td style="padding: 10px 0; color: #333; font-weight: bold;">${formatDate(appointment.date)}</td>
                    </tr>
                    <tr>
                        <td style="padding: 10px 0; color: #666;">🕐 <strong>Time:</strong></td>
                        <td style="padding: 10px 0; color: #333; font-weight: bold;">${formatTime(appointment.time)}</td>
                    </tr>
                    <tr>
                        <td style="padding: 10px 0; color: #666;">💅 <strong>Service:</strong></td>
                        <td style="padding: 10px 0; color: #333;">${appointment.service || 'General Service'}</td>
                    </tr>
                    <tr>
                        <td style="padding: 10px 0; color: #666;">📍 <strong>Location:</strong></td>
                        <td style="padding: 10px 0; color: #333;">${SALON_CONFIG.address}</td>
                    </tr>
                </table>
            </div>
            
            <!-- Confirmation Number -->
            <div style="background: #fff3e0; border-radius: 10px; padding: 15px; text-align: center; margin-bottom: 25px; border-left: 4px solid #ff9800;">
                <p style="margin: 0; color: #e65100; font-size: 14px;">
                    <strong>Confirmation #:</strong> ${appointment.confirmationId}
                </p>
                <p style="margin: 5px 0 0 0; color: #666; font-size: 12px;">
                    Please save this number for your records
                </p>
            </div>
            
            <!-- Important Notes -->
            <div style="background: #fce4ec; border-radius: 10px; padding: 20px; margin-bottom: 25px;">
                <h3 style="color: #e91e63; margin: 0 0 15px 0; font-size: 16px;">💡 Important Reminders</h3>
                <ul style="color: #666; margin: 0; padding-left: 20px; line-height: 1.8;">
                    <li>Please arrive 10-15 minutes before your appointment time</li>
                    <li>If you need to reschedule or cancel, please call us at ${SALON_CONFIG.phone}</li>
                    <li>Bring this confirmation email or your confirmation number</li>
                </ul>
            </div>
            
            <p style="color: #333; text-align: center; font-size: 16px;">
                We can't wait to see you! 💖
            </p>
        </div>
        
        <!-- Footer -->
        <div style="background: #f5f5f5; padding: 20px; text-align: center; border-top: 1px solid #eee;">
            <p style="margin: 0; color: #999; font-size: 12px;">
                ${SALON_CONFIG.name} | ${SALON_CONFIG.address}<br>
                ${SALON_CONFIG.phone} | ${SALON_CONFIG.email}
            </p>
        </div>
    </div>
</body>
</html>
    `;
}

function getClientDeclineEmailHTML(appointment) {
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5;">
    <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #ff9800 0%, #ffb74d 100%); padding: 30px; text-align: center;">
            <div style="font-size: 60px; margin-bottom: 10px;">📅</div>
            <h1 style="color: #ffffff; margin: 0; font-size: 28px;">Appointment Update</h1>
            <p style="color: #ffffff; margin: 10px 0 0 0; opacity: 0.9;">${SALON_CONFIG.name}</p>
        </div>
        
        <!-- Content -->
        <div style="padding: 30px;">
            <p style="color: #333; font-size: 16px; margin-bottom: 20px;">
                Hi <strong>${appointment.name}</strong>,
            </p>
            
            <p style="color: #666; font-size: 16px; margin-bottom: 20px;">
                Unfortunately, we are unable to accommodate your appointment request for the following time:
            </p>
            
            <!-- Appointment Details Card -->
            <div style="background: #fff3e0; border-radius: 15px; padding: 25px; margin-bottom: 25px; border: 2px solid #ff9800;">
                <table style="width: 100%; border-collapse: collapse;">
                    <tr>
                        <td style="padding: 10px 0; color: #666; width: 40%;">📅 <strong>Requested Date:</strong></td>
                        <td style="padding: 10px 0; color: #333;">${formatDate(appointment.date)}</td>
                    </tr>
                    <tr>
                        <td style="padding: 10px 0; color: #666;">🕐 <strong>Requested Time:</strong></td>
                        <td style="padding: 10px 0; color: #333;">${formatTime(appointment.time)}</td>
                    </tr>
                    <tr>
                        <td style="padding: 10px 0; color: #666;">💅 <strong>Service:</strong></td>
                        <td style="padding: 10px 0; color: #333;">${appointment.service || 'General Service'}</td>
                    </tr>
                </table>
            </div>
            
            <!-- Reschedule Notice -->
            <div style="background: #e3f2fd; border-radius: 10px; padding: 20px; margin-bottom: 25px; border-left: 4px solid #2196f3;">
                <h3 style="color: #1976d2; margin: 0 0 15px 0; font-size: 16px;">💙 We'd Love to See You!</h3>
                <p style="color: #666; margin: 0; line-height: 1.6;">
                    Please feel free to book another appointment at a different time. 
                    You can also call us directly at <strong>${SALON_CONFIG.phone}</strong> 
                    and we'll be happy to help you find a time that works!
                </p>
            </div>
            
            <p style="color: #333; text-align: center; font-size: 16px;">
                We apologize for any inconvenience and hope to serve you soon! 💖
            </p>
        </div>
        
        <!-- Footer -->
        <div style="background: #f5f5f5; padding: 20px; text-align: center; border-top: 1px solid #eee;">
            <p style="margin: 0; color: #999; font-size: 12px;">
                ${SALON_CONFIG.name} | ${SALON_CONFIG.address}<br>
                ${SALON_CONFIG.phone} | ${SALON_CONFIG.email}
            </p>
        </div>
    </div>
</body>
</html>
    `;
}

// ============================================
// EMAIL SENDING FUNCTIONS
// ============================================

async function sendAdminApprovalEmail(appointment, token) {
    const transporter = getEmailTransporter();
    
    if (!transporter) {
        console.warn('⚠️  Email not sent - transporter not configured');
        console.warn('   Check that SMTP_USER and SMTP_PASS are set in Vercel environment variables');
        return { success: false, message: 'Email transporter not configured. Check Vercel environment variables.' };
    }

    // Include appointment data in URL for serverless compatibility
    const appointmentParams = encodeURIComponent(JSON.stringify({
        name: appointment.name,
        email: appointment.email,
        phone: appointment.phone,
        date: appointment.date,
        time: appointment.time,
        service: appointment.service,
        place: appointment.place,
        notes: appointment.notes,
        confirmationId: appointment.confirmationId,
        createdAt: appointment.createdAt
    }));
    
    const approveUrl = `${BASE_URL}/api/approve/${token}?data=${appointmentParams}`;
    const declineUrl = `${BASE_URL}/api/decline/${token}?data=${appointmentParams}`;

    console.log(`📤 Attempting to send admin email to: ${ADMIN_EMAIL}`);

    try {
        const mailOptions = {
            from: `"${SALON_CONFIG.name}" <${process.env.SMTP_USER}>`,
            to: ADMIN_EMAIL,
            subject: `🆕 New Appointment Request - ${appointment.name} - ${formatDate(appointment.date)}`,
            html: getAdminApprovalEmailHTML(appointment, approveUrl, declineUrl),
            text: `New appointment request from ${appointment.name}\n\nDate: ${appointment.date}\nTime: ${appointment.time}\nEmail: ${appointment.email}\nPhone: ${appointment.phone}\n\nApprove: ${approveUrl}\nDecline: ${declineUrl}`
        };

        console.log(`   From: ${mailOptions.from}`);
        console.log(`   To: ${mailOptions.to}`);
        console.log(`   Subject: ${mailOptions.subject}`);

        const info = await transporter.sendMail(mailOptions);

        console.log(`✅ Admin approval email sent for appointment ${appointment.confirmationId}`);
        console.log(`   Message ID: ${info.messageId}`);
        return { success: true };
    } catch (error) {
        console.error('❌ Failed to send admin email:', error.message);
        console.error('   Error details:', error);
        return { success: false, message: error.message };
    }
}

async function sendClientApprovalEmail(appointment) {
    const transporter = getEmailTransporter();
    
    if (!transporter) {
        console.warn('⚠️  Email not sent - transporter not configured');
        return { success: false, message: 'Email not configured' };
    }

    try {
        await transporter.sendMail({
            from: `"${SALON_CONFIG.name}" <${process.env.SMTP_USER}>`,
            to: appointment.email,
            subject: `✅ Appointment Confirmed - ${SALON_CONFIG.name}`,
            html: getClientApprovalEmailHTML(appointment),
            text: `Your appointment has been confirmed!\n\nDate: ${appointment.date}\nTime: ${appointment.time}\nConfirmation #: ${appointment.confirmationId}\n\nPlease arrive 10-15 minutes early.\n\n${SALON_CONFIG.name}\n${SALON_CONFIG.phone}`
        });

        console.log(`📧 Client approval email sent to ${appointment.email}`);
        return { success: true };
    } catch (error) {
        console.error('❌ Failed to send client approval email:', error.message);
        return { success: false, message: error.message };
    }
}

async function sendClientDeclineEmail(appointment) {
    const transporter = getEmailTransporter();
    
    if (!transporter) {
        console.warn('⚠️  Email not sent - transporter not configured');
        return { success: false, message: 'Email not configured' };
    }

    try {
        await transporter.sendMail({
            from: `"${SALON_CONFIG.name}" <${process.env.SMTP_USER}>`,
            to: appointment.email,
            subject: `📅 Appointment Update - ${SALON_CONFIG.name}`,
            html: getClientDeclineEmailHTML(appointment),
            text: `Unfortunately, we are unable to accommodate your appointment request.\n\nRequested Date: ${appointment.date}\nRequested Time: ${appointment.time}\n\nPlease try booking another time or call us at ${SALON_CONFIG.phone}.\n\n${SALON_CONFIG.name}`
        });

        console.log(`📧 Client decline email sent to ${appointment.email}`);
        return { success: true };
    } catch (error) {
        console.error('❌ Failed to send client decline email:', error.message);
        return { success: false, message: error.message };
    }
}

// ============================================
// HELPER FUNCTIONS
// ============================================

function formatDate(dateString) {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-US', options);
}

function formatTime(timeString) {
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
}

function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

function isValidPhone(phone) {
    const phoneRegex = /^[0-9]{10,15}$/;
    return phoneRegex.test(phone.replace(/\s/g, ''));
}

function isValidDate(dateString) {
    const selectedDate = new Date(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return selectedDate >= today;
}

// ============================================
// API ENDPOINTS
// ============================================

// Health check
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        message: 'Clawed up Glam API is running',
        timestamp: new Date().toISOString(),
        emailConfigured: !!emailTransporter
    });
});

// Book appointment (creates pending appointment)
app.post('/api/book-appointment', async (req, res) => {
    try {
        const { appointmentData } = req.body;
        
        if (!appointmentData) {
            return res.status(400).json({
                success: false,
                message: 'Missing appointment data'
            });
        }
        
        const { 
            fullName, 
            email, 
            phone, 
            place, 
            appointmentDate, 
            appointmentTime,
            serviceType,
            additionalNotes 
        } = appointmentData;
        
        // Validation
        const errors = [];
        
        if (!fullName || fullName.trim().length < 2) {
            errors.push('Full name must be at least 2 characters');
        }
        
        if (!email || !isValidEmail(email)) {
            errors.push('Please provide a valid email address');
        }
        
        if (!phone || !isValidPhone(phone)) {
            errors.push('Please provide a valid phone number (10-15 digits)');
        }
        
        if (!appointmentDate) {
            errors.push('Please select an appointment date');
        } else if (!isValidDate(appointmentDate)) {
            errors.push('Appointment date cannot be in the past');
        }
        
        if (!appointmentTime) {
            errors.push('Please select an appointment time');
        }
        
        if (errors.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: errors
            });
        }
        
        // Generate tokens and IDs
        const token = generateSecureToken();
        const confirmationNumber = generateConfirmationNumber();
        
        // Create pending appointment
        const appointment = {
            name: fullName.trim(),
            email: email.trim().toLowerCase(),
            phone: phone.trim(),
            date: appointmentDate,
            time: appointmentTime,
            service: serviceType || '',
            notes: additionalNotes || '',
            place: place || '',
            confirmationId: confirmationNumber,
            status: 'pending',
            createdAt: new Date().toISOString(),
            token: token
        };
        
        // Save to pending appointments (in-memory cache)
        const pendingAppointments = loadPendingAppointments();
        pendingAppointments[token] = appointment;
        savePendingAppointments(pendingAppointments);
        
        // Also save to Google Sheets with "Pending" status for persistence across serverless functions
        const sheetsResult = await saveAppointmentToGoogleSheets(appointment, 'Pending');
        if (!sheetsResult.success) {
            console.warn('⚠️  Failed to save pending appointment to Google Sheets:', sheetsResult.error);
        }
        
        // Send approval email to admin
        const emailResult = await sendAdminApprovalEmail(appointment, token);
        
        console.log(`⏳ New pending appointment: ${confirmationNumber}`);
        console.log(`   Name: ${fullName}`);
        console.log(`   Date: ${formatDate(appointmentDate)} at ${formatTime(appointmentTime)}`);
        
        if (!emailResult.success) {
            console.error('❌ Email sending failed:', emailResult.message);
        }
        
        res.json({
            success: true,
            message: 'Appointment request submitted! Waiting for approval.',
            confirmationNumber: confirmationNumber,
            token: token,
            status: 'pending',
            emailSent: emailResult.success,
            emailError: emailResult.success ? null : emailResult.message,
            appointmentData: {
                ...appointment,
                formattedDate: formatDate(appointmentDate),
                formattedTime: formatTime(appointmentTime)
            },
            salon: SALON_CONFIG
        });
        
    } catch (error) {
        console.error('Booking Error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to process booking'
        });
    }
});

// Check appointment status (for polling)
app.get('/api/status/:token', (req, res) => {
    const { token } = req.params;
    
    const appointment = getPendingAppointment(token);
    
    if (!appointment) {
        return res.status(404).json({
            success: false,
            message: 'Appointment not found'
        });
    }
    
    res.json({
        success: true,
        status: appointment.status,
        confirmationId: appointment.confirmationId,
        appointmentData: {
            name: appointment.name,
            email: appointment.email,
            date: appointment.date,
            time: appointment.time,
            service: appointment.service,
            formattedDate: formatDate(appointment.date),
            formattedTime: formatTime(appointment.time)
        }
    });
});

// Approve appointment - Show confirmation page
app.get('/api/approve/:token', async (req, res) => {
    const { token } = req.params;
    const { data } = req.query;
    
    let appointment = getPendingAppointment(token);
    
    // If not in cache (serverless), try to get from URL parameters
    if (!appointment && data) {
        try {
            appointment = JSON.parse(decodeURIComponent(data));
            appointment.token = token;
            appointment.status = 'pending';
            // Cache it for this execution
            const pendingAppointments = loadPendingAppointments();
            pendingAppointments[token] = appointment;
            savePendingAppointments(pendingAppointments);
        } catch (error) {
            console.error('Error parsing appointment data from URL:', error);
        }
    }
    
    if (!appointment) {
        return res.send(getResponseHTML('error', 'Appointment Not Found', 'This appointment link is invalid or has already been processed.'));
    }
    
    if (appointment.status !== 'pending') {
        return res.send(getResponseHTML('info', 'Already Processed', `This appointment has already been ${appointment.status}.`));
    }
    
    // Show confirmation page with button
    res.send(getConfirmationPageHTML('approve', token, appointment));
});

// Actually approve appointment (POST request from confirmation page)
app.post('/api/approve/:token', async (req, res) => {
    const { token } = req.params;
    
    let appointment = getPendingAppointment(token);
    
    if (!appointment) {
        return res.send(getResponseHTML('error', 'Appointment Not Found', 'This appointment link is invalid or has already been processed.'));
    }
    
    if (appointment.status !== 'pending') {
        return res.send(getResponseHTML('info', 'Already Processed', `This appointment has already been ${appointment.status}.`));
    }
    
    try {
        // Update status to approved
        updatePendingAppointmentStatus(token, 'approved');
        
        // Save to Google Sheets (cloud storage)
        const sheetsResult = await saveAppointmentToGoogleSheets(appointment);
        if (!sheetsResult.success) {
            console.warn('⚠️  Failed to save to Google Sheets:', sheetsResult.error);
        }
        
        // Send confirmation email to client
        await sendClientApprovalEmail(appointment);
        
        console.log(`✅ Appointment approved: ${appointment.confirmationId}`);
        
        res.send(getResponseHTML('success', 'Appointment Approved! ✅', `
            <p>The appointment for <strong>${appointment.name}</strong> has been approved.</p>
            <p><strong>Date:</strong> ${formatDate(appointment.date)}</p>
            <p><strong>Time:</strong> ${formatTime(appointment.time)}</p>
            <p><strong>Service:</strong> ${appointment.service || 'General Service'}</p>
            <p style="margin-top: 20px; color: #4caf50;">A confirmation email has been sent to the client.</p>
        `));
        
    } catch (error) {
        console.error('Approval Error:', error);
        res.send(getResponseHTML('error', 'Approval Failed', 'An error occurred while processing the approval. Please try again.'));
    }
});

// Decline appointment - Show confirmation page
app.get('/api/decline/:token', async (req, res) => {
    const { token } = req.params;
    const { data } = req.query;
    
    let appointment = getPendingAppointment(token);
    
    // If not in cache (serverless), try to get from URL parameters
    if (!appointment && data) {
        try {
            appointment = JSON.parse(decodeURIComponent(data));
            appointment.token = token;
            appointment.status = 'pending';
            // Cache it for this execution
            const pendingAppointments = loadPendingAppointments();
            pendingAppointments[token] = appointment;
            savePendingAppointments(pendingAppointments);
        } catch (error) {
            console.error('Error parsing appointment data from URL:', error);
        }
    }
    
    if (!appointment) {
        return res.send(getResponseHTML('error', 'Appointment Not Found', 'This appointment link is invalid or has already been processed.'));
    }
    
    if (appointment.status !== 'pending') {
        return res.send(getResponseHTML('info', 'Already Processed', `This appointment has already been ${appointment.status}.`));
    }
    
    // Show confirmation page with button
    res.send(getConfirmationPageHTML('decline', token, appointment));
});

// Actually decline appointment (POST request from confirmation page)
app.post('/api/decline/:token', async (req, res) => {
    const { token } = req.params;
    
    let appointment = getPendingAppointment(token);
    
    if (!appointment) {
        return res.send(getResponseHTML('error', 'Appointment Not Found', 'This appointment link is invalid or has already been processed.'));
    }
    
    if (appointment.status !== 'pending') {
        return res.send(getResponseHTML('info', 'Already Processed', `This appointment has already been ${appointment.status}.`));
    }
    
    try {
        // Update status to declined
        updatePendingAppointmentStatus(token, 'declined');
        
        // Save to Google Sheets with declined status for record keeping
        const sheetsResult = await saveAppointmentToGoogleSheets(appointment, 'Declined');
        if (!sheetsResult.success) {
            console.warn('⚠️  Failed to save declined appointment to Google Sheets:', sheetsResult.error);
        }
        
        // Send decline email to client
        await sendClientDeclineEmail(appointment);
        
        console.log(`❌ Appointment declined: ${appointment.confirmationId}`);
        
        res.send(getResponseHTML('declined', 'Appointment Declined', `
            <p>The appointment for <strong>${appointment.name}</strong> has been declined.</p>
            <p><strong>Date:</strong> ${formatDate(appointment.date)}</p>
            <p><strong>Time:</strong> ${formatTime(appointment.time)}</p>
            <p style="margin-top: 20px; color: #ff9800;">A notification email has been sent to the client.</p>
        `));
        
    } catch (error) {
        console.error('Decline Error:', error);
        res.send(getResponseHTML('error', 'Decline Failed', 'An error occurred while processing the decline. Please try again.'));
    }
});

// Get all approved appointments
// Note: Appointments are now stored in Google Sheets - access them directly there
app.get('/api/appointments', async (req, res) => {
    res.json({
        success: true,
        message: 'Appointments are now stored in Google Sheets. Please access your Google Sheet directly to view all appointments.',
        googleSheetsConfigured: !!GOOGLE_SHEETS_WEBHOOK_URL
    });
});

// Cleanup endpoint - Not needed with Google Sheets
app.post('/api/cleanup', async (req, res) => {
    res.json({
        success: true,
        message: 'Cleanup is managed directly in Google Sheets. Open your spreadsheet to delete old records.'
    });
});

// HTML response page for approve/decline actions
function getResponseHTML(type, title, content) {
    const colors = {
        success: { bg: '#e8f5e9', border: '#4caf50', text: '#2e7d32' },
        error: { bg: '#ffebee', border: '#f44336', text: '#c62828' },
        info: { bg: '#e3f2fd', border: '#2196f3', text: '#1565c0' },
        declined: { bg: '#fff3e0', border: '#ff9800', text: '#e65100' }
    };
    
    const color = colors[type] || colors.info;
    
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title} - ${SALON_CONFIG.name}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #f8b4c4 0%, #e91e63 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
        }
        .container {
            background: white;
            border-radius: 20px;
            padding: 40px;
            max-width: 500px;
            width: 100%;
            box-shadow: 0 20px 60px rgba(0,0,0,0.2);
            text-align: center;
        }
        .logo { font-size: 48px; margin-bottom: 20px; }
        h1 {
            color: ${color.text};
            margin-bottom: 20px;
            font-size: 24px;
        }
        .content {
            background: ${color.bg};
            border-left: 4px solid ${color.border};
            padding: 20px;
            border-radius: 10px;
            text-align: left;
            color: #333;
            line-height: 1.6;
        }
        .content p { margin: 10px 0; }
        .footer {
            margin-top: 30px;
            color: #999;
            font-size: 12px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="logo">💅</div>
        <h1>${title}</h1>
        <div class="content">
            ${content}
        </div>
        <div class="footer">
            <p>${SALON_CONFIG.name}</p>
            <p>${SALON_CONFIG.phone}</p>
        </div>
    </div>
</body>
</html>
    `;
}

// Confirmation page HTML - requires button click to confirm action
function getConfirmationPageHTML(action, token, appointment) {
    const isApprove = action === 'approve';
    const title = isApprove ? 'Confirm Appointment Approval' : 'Confirm Appointment Decline';
    const buttonText = isApprove ? '✅ Confirm Approval' : '❌ Confirm Decline';
    const buttonColor = isApprove ? '#4caf50' : '#f44336';
    // Use relative URL instead of absolute to work on any domain
    const actionUrl = `/api/${action}/${token}`;
    
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title} - ${SALON_CONFIG.name}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #f8b4c4 0%, #e91e63 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
        }
        .container {
            background: white;
            border-radius: 20px;
            padding: 40px;
            max-width: 500px;
            width: 100%;
            box-shadow: 0 20px 60px rgba(0,0,0,0.2);
            text-align: center;
        }
        .logo { font-size: 48px; margin-bottom: 20px; }
        h1 {
            color: #333;
            margin-bottom: 20px;
            font-size: 24px;
        }
        .details {
            background: #fce4ec;
            padding: 20px;
            border-radius: 15px;
            text-align: left;
            margin-bottom: 25px;
        }
        .details p { margin: 8px 0; color: #333; }
        .details strong { color: #e91e63; }
        .confirm-btn {
            display: inline-block;
            background: ${buttonColor};
            color: white;
            border: none;
            padding: 15px 40px;
            border-radius: 30px;
            font-size: 18px;
            font-weight: bold;
            cursor: pointer;
            transition: transform 0.2s, box-shadow 0.2s;
        }
        .confirm-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 5px 20px rgba(0,0,0,0.2);
        }
        .cancel-link {
            display: block;
            margin-top: 15px;
            color: #999;
            text-decoration: none;
            font-size: 14px;
        }
        .footer {
            margin-top: 30px;
            color: #999;
            font-size: 12px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="logo">💅</div>
        <h1>${title}</h1>
        
        <div class="details">
            <p><strong>👤 Name:</strong> ${appointment.name}</p>
            <p><strong>📧 Email:</strong> ${appointment.email}</p>
            <p><strong>📱 Phone:</strong> ${appointment.phone}</p>
            <p><strong>📅 Date:</strong> ${formatDate(appointment.date)}</p>
            <p><strong>🕐 Time:</strong> ${formatTime(appointment.time)}</p>
            <p><strong>💅 Service:</strong> ${appointment.service || 'Not specified'}</p>
        </div>
        
        <form action="${actionUrl}" method="POST">
            <button type="submit" class="confirm-btn">${buttonText}</button>
        </form>
        
        <a href="javascript:window.close()" class="cancel-link">Cancel and close</a>
        
        <div class="footer">
            <p>${SALON_CONFIG.name}</p>
            <p>${SALON_CONFIG.phone}</p>
        </div>
    </div>
</body>
</html>
    `;
}

// ============================================
// START SERVER
// ============================================
app.listen(PORT, async () => {
    // Initialize email transporter for local development
    const transporter = getEmailTransporter();
    
    const googleSheetsStatus = GOOGLE_SHEETS_WEBHOOK_URL ? 'Configured ✅' : 'Not configured ⚠️';
    
    console.log(`
╔═══════════════════════════════════════════════════════════════════╗
║                                                                   ║
║       💅  CLAWED UP GLAM - Backend Server  💅                    ║
║                                                                   ║
║   Server running at: http://localhost:${PORT}                      ║
║   Admin Email: ${ADMIN_EMAIL}
║                                                                   ║
║   📊 Storage: Google Sheets (Cloud)                               ║
║   📊 Google Sheets: ${googleSheetsStatus}
║                                                                   ║
║   API Endpoints:                                                  ║
║   • GET  /api/health           - Health check                     ║
║   • POST /api/book-appointment - Submit appointment request       ║
║   • GET  /api/status/:token    - Check appointment status         ║
║   • GET  /api/approve/:token   - Approve appointment              ║
║   • GET  /api/decline/:token   - Decline appointment              ║
║   • GET  /api/appointments     - Info about appointments          ║
║                                                                   ║
║   📧 Email: ${transporter ? 'Configured ✅' : 'Not configured ⚠️'}
║                                                                   ║
╚═══════════════════════════════════════════════════════════════════╝
    `);
});

// Serve index.html for all unmatched routes (for Vercel/static hosting)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});
