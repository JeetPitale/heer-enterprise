# Email Integration Setup Guide

## Overview
Your StyleAI backend now has complete email integration with the following features:
- **Welcome email** on user registration
- **Login notification email** on every login
- **Order confirmation email** after successful payment

## Setup Instructions

### 1. Install Dependencies
Make sure nodemailer is installed by running:
```bash
cd backend
npm install
```

### 2. Configure Email Credentials

Update your `.env` file in the backend folder with your Gmail credentials:

```env
# Email Configuration
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
```

### 3. Generate Gmail App Password

Since Gmail doesn't allow regular passwords for third-party apps, you need to:

1. Enable 2-Factor Authentication on your Gmail account (if not already enabled)
2. Go to [Google Account Security](https://myaccount.google.com/security)
3. Find "App passwords" in the left menu
4. Select "Mail" and "Windows Computer" (or your device)
5. Copy the generated 16-character password
6. Paste this into `EMAIL_PASSWORD` in your `.env` file

**Important**: This is NOT your regular Gmail password!

### 4. Test Email Configuration

Run your server and:
- Register a new user (should receive welcome email)
- Log in (should receive login notification email)
- Complete a purchase (should receive order confirmation email)

## Email Templates

All emails include:
- Professional HTML formatting with StyleAI branding
- Responsive design that works on all devices
- Action buttons for easy user interaction
- Necessary order/account details

### Email Types:

#### Welcome Email (Registration)
- Sent when user creates account
- Includes login link and account confirmation

#### Login Notification Email
- Sent on each login attempt
- Includes timestamp and account details
- Security alert for unusual activity

#### Order Confirmation Email
- Sent after successful payment
- Includes order ID, items, and total price
- Includes order tracking link
- Professional invoice-style formatting

## Troubleshooting

### Email not sending?
1. Verify credentials are correct in `.env`
2. Check that 2FA is enabled and app password is used (not regular password)
3. Check server logs for email error messages
4. If using different email service, update `EMAIL_SERVICE` accordingly

### Using Different Email Service
To use services like SendGrid, Mailgun, or Office365:
1. Update `EMAIL_SERVICE` and `EMAIL_USER`/`EMAIL_PASSWORD` accordingly
2. Refer to [Nodemailer Documentation](https://nodemailer.com/smtp/)

## Environment Variables Reference

```env
# Email service configuration
EMAIL_SERVICE=gmail              # Service provider (gmail, outlook, etc.)
EMAIL_USER=your-email@gmail.com  # Email account to send from
EMAIL_PASSWORD=your-app-password # App password (not regular password for Gmail)

# Frontend URL for email links
FRONTEND_URL=http://localhost:5173  # Change for production
```

## Production Deployment

For production, make sure to:
1. Use a dedicated email service account
2. Update `FRONTEND_URL` to your production domain
3. Consider using SendGrid or similar for better reliability
4. Store credentials securely in your hosting platform's environment variables

---

**Setup is complete!** Your email integration is now fully functional.
