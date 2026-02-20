const nodemailer = require('nodemailer');
const { logger } = require('../config/logger');

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        type: 'OAuth2',
        user: process.env.EMAIL_USER,
        clientId: process.env.CLIENT_ID,
        clientSecret: process.env.CLIENT_SECRET,
        refreshToken: process.env.REFRESH_TOKEN,
    },
});

// Verify the connection configuration
transporter.verify((error, success) => {
    if (error) {
        logger.error('Error connecting to email server', { error: error.message });
    } else {
        logger.info('Email server is ready to send messages');
    }
});


/**
 * Shared HTML email wrapper
 * ─────────────────────────
 * All emails use this consistent layout to maintain brand identity.
 * Inline styles are required because most email clients strip <style> tags.
 */
function emailTemplate(bodyContent) {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>FinLedger</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f4f5f7; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f5f7; padding: 40px 0;">
        <tr>
            <td align="center">
                <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 12px rgba(0,0,0,0.08);">
                    
                    <!-- Header -->
                    <tr>
                        <td style="background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%); padding: 32px 40px; text-align: center;">
                            <h1 style="margin: 0; font-size: 26px; font-weight: 700; color: #ffffff; letter-spacing: 1px;">FinLedger</h1>
                            <p style="margin: 6px 0 0; font-size: 13px; color: #94a3b8; letter-spacing: 0.5px;">Secure Banking Infrastructure</p>
                        </td>
                    </tr>

                    <!-- Body -->
                    <tr>
                        <td style="padding: 36px 40px 40px;">
                            ${bodyContent}
                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td style="background-color: #f8fafc; padding: 24px 40px; border-top: 1px solid #e2e8f0;">
                            <p style="margin: 0; font-size: 12px; color: #94a3b8; text-align: center; line-height: 1.6;">
                                This is an automated message from FinLedger. Please do not reply to this email.
                            </p>
                            <p style="margin: 8px 0 0; font-size: 11px; color: #cbd5e1; text-align: center;">
                                FinLedger &mdash; Financial Ledger System
                            </p>
                        </td>
                    </tr>

                </table>
            </td>
        </tr>
    </table>
</body>
</html>`;
}


/**
 * Format INR currency
 */
function formatINR(amount) {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 2
    }).format(amount);
}


/**
 * Send email utility
 */
const sendEmail = async (to, subject, text, html) => {
    try {
        const info = await transporter.sendMail({
            from: `"FinLedger" <${process.env.EMAIL_USER}>`,
            to,
            subject,
            text,
            html,
        });

        logger.info('Email sent', { messageId: info.messageId });
    } catch (error) {
        logger.error('Error sending email', { error: error.message });
    }
};


// ═══════════════════════════════════════════════════════════════
//  Registration Email
// ═══════════════════════════════════════════════════════════════

async function sendRegistrationEmail(userEmail, name) {
    const subject = 'Welcome to FinLedger';

    const text = [
        `Hello ${name},`,
        '',
        'Thank you for registering with FinLedger. Your account has been created successfully.',
        '',
        'You can now create bank accounts, make transfers, and manage your finances securely.',
        '',
        'Regards,',
        'The FinLedger Team'
    ].join('\n');

    const html = emailTemplate(`
        <h2 style="margin: 0 0 20px; font-size: 20px; font-weight: 600; color: #1e293b;">Welcome, ${name}</h2>
        <p style="margin: 0 0 16px; font-size: 15px; color: #475569; line-height: 1.6;">
            Thank you for registering with FinLedger. Your account has been created successfully.
        </p>
        <p style="margin: 0 0 24px; font-size: 15px; color: #475569; line-height: 1.6;">
            You can now create bank accounts, make transfers, and manage your finances securely through the FinLedger dashboard.
        </p>
        <table role="presentation" cellpadding="0" cellspacing="0" style="margin: 0 0 24px;">
            <tr>
                <td style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 16px 24px;">
                    <p style="margin: 0; font-size: 14px; font-weight: 600; color: #166534;">Account Status: Active</p>
                    <p style="margin: 4px 0 0; font-size: 13px; color: #4ade80;">Your login credentials are ready to use.</p>
                </td>
            </tr>
        </table>
        <p style="margin: 0; font-size: 14px; color: #64748b; line-height: 1.5;">
            Regards,<br />The FinLedger Team
        </p>
    `);

    await sendEmail(userEmail, subject, text, html);
}


// ═══════════════════════════════════════════════════════════════
//  Transaction Success Email
// ═══════════════════════════════════════════════════════════════

async function sendTransactionEmail(userEmail, name, amount, toAccount) {
    const formattedAmount = formatINR(amount);
    const subject = `Transaction Successful - ${formattedAmount}`;
    const timestamp = new Date().toLocaleString('en-IN', {
        timeZone: 'Asia/Kolkata',
        dateStyle: 'medium',
        timeStyle: 'short'
    });

    const text = [
        `Hello ${name},`,
        '',
        `Your transaction of ${formattedAmount} to account ${toAccount} was completed successfully.`,
        '',
        `Date: ${timestamp}`,
        `Amount: ${formattedAmount}`,
        `Recipient Account: ${toAccount}`,
        `Status: Completed`,
        '',
        'Regards,',
        'The FinLedger Team'
    ].join('\n');

    const html = emailTemplate(`
        <h2 style="margin: 0 0 20px; font-size: 20px; font-weight: 600; color: #1e293b;">Transaction Successful</h2>
        <p style="margin: 0 0 20px; font-size: 15px; color: #475569; line-height: 1.6;">
            Hello ${name}, your fund transfer has been processed successfully.
        </p>

        <!-- Transaction details card -->
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin: 0 0 24px; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
            <tr>
                <td style="background-color: #f8fafc; padding: 14px 20px; border-bottom: 1px solid #e2e8f0;">
                    <p style="margin: 0; font-size: 13px; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px;">Transaction Details</p>
                </td>
            </tr>
            <tr>
                <td style="padding: 0;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                        <tr>
                            <td style="padding: 12px 20px; border-bottom: 1px solid #f1f5f9; font-size: 14px; color: #64748b; width: 40%;">Amount</td>
                            <td style="padding: 12px 20px; border-bottom: 1px solid #f1f5f9; font-size: 14px; font-weight: 600; color: #1e293b;">${formattedAmount}</td>
                        </tr>
                        <tr>
                            <td style="padding: 12px 20px; border-bottom: 1px solid #f1f5f9; font-size: 14px; color: #64748b;">Recipient Account</td>
                            <td style="padding: 12px 20px; border-bottom: 1px solid #f1f5f9; font-size: 14px; color: #1e293b; font-family: monospace;">${toAccount}</td>
                        </tr>
                        <tr>
                            <td style="padding: 12px 20px; border-bottom: 1px solid #f1f5f9; font-size: 14px; color: #64748b;">Date</td>
                            <td style="padding: 12px 20px; border-bottom: 1px solid #f1f5f9; font-size: 14px; color: #1e293b;">${timestamp}</td>
                        </tr>
                        <tr>
                            <td style="padding: 12px 20px; font-size: 14px; color: #64748b;">Status</td>
                            <td style="padding: 12px 20px; font-size: 14px; font-weight: 600; color: #16a34a;">Completed</td>
                        </tr>
                    </table>
                </td>
            </tr>
        </table>

        <p style="margin: 0; font-size: 14px; color: #64748b; line-height: 1.5;">
            Regards,<br />The FinLedger Team
        </p>
    `);

    await sendEmail(userEmail, subject, text, html);
}


// ═══════════════════════════════════════════════════════════════
//  Transaction Failure Email
// ═══════════════════════════════════════════════════════════════

async function sendTransactionFailureEmail(userEmail, name, amount, toAccount) {
    const formattedAmount = formatINR(amount);
    const subject = `Transaction Failed - ${formattedAmount}`;
    const timestamp = new Date().toLocaleString('en-IN', {
        timeZone: 'Asia/Kolkata',
        dateStyle: 'medium',
        timeStyle: 'short'
    });

    const text = [
        `Hello ${name},`,
        '',
        `We regret to inform you that your transaction of ${formattedAmount} to account ${toAccount} has failed.`,
        '',
        `Date: ${timestamp}`,
        `Amount: ${formattedAmount}`,
        `Recipient Account: ${toAccount}`,
        `Status: Failed`,
        '',
        'Please try again later. If the issue persists, contact support.',
        '',
        'Regards,',
        'The FinLedger Team'
    ].join('\n');

    const html = emailTemplate(`
        <h2 style="margin: 0 0 20px; font-size: 20px; font-weight: 600; color: #1e293b;">Transaction Failed</h2>
        <p style="margin: 0 0 20px; font-size: 15px; color: #475569; line-height: 1.6;">
            Hello ${name}, unfortunately your fund transfer could not be processed.
        </p>

        <!-- Transaction details card -->
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin: 0 0 24px; border: 1px solid #fecaca; border-radius: 8px; overflow: hidden;">
            <tr>
                <td style="background-color: #fef2f2; padding: 14px 20px; border-bottom: 1px solid #fecaca;">
                    <p style="margin: 0; font-size: 13px; font-weight: 600; color: #991b1b; text-transform: uppercase; letter-spacing: 0.5px;">Transaction Details</p>
                </td>
            </tr>
            <tr>
                <td style="padding: 0;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                        <tr>
                            <td style="padding: 12px 20px; border-bottom: 1px solid #f1f5f9; font-size: 14px; color: #64748b; width: 40%;">Amount</td>
                            <td style="padding: 12px 20px; border-bottom: 1px solid #f1f5f9; font-size: 14px; font-weight: 600; color: #1e293b;">${formattedAmount}</td>
                        </tr>
                        <tr>
                            <td style="padding: 12px 20px; border-bottom: 1px solid #f1f5f9; font-size: 14px; color: #64748b;">Recipient Account</td>
                            <td style="padding: 12px 20px; border-bottom: 1px solid #f1f5f9; font-size: 14px; color: #1e293b; font-family: monospace;">${toAccount}</td>
                        </tr>
                        <tr>
                            <td style="padding: 12px 20px; border-bottom: 1px solid #f1f5f9; font-size: 14px; color: #64748b;">Date</td>
                            <td style="padding: 12px 20px; border-bottom: 1px solid #f1f5f9; font-size: 14px; color: #1e293b;">${timestamp}</td>
                        </tr>
                        <tr>
                            <td style="padding: 12px 20px; font-size: 14px; color: #64748b;">Status</td>
                            <td style="padding: 12px 20px; font-size: 14px; font-weight: 600; color: #dc2626;">Failed</td>
                        </tr>
                    </table>
                </td>
            </tr>
        </table>

        <p style="margin: 0 0 16px; font-size: 14px; color: #475569; line-height: 1.6;">
            Please try again later. If the issue persists, contact support.
        </p>
        <p style="margin: 0; font-size: 14px; color: #64748b; line-height: 1.5;">
            Regards,<br />The FinLedger Team
        </p>
    `);

    await sendEmail(userEmail, subject, text, html);
}


// ═══════════════════════════════════════════════════════════════
//  Account Creation Email
// ═══════════════════════════════════════════════════════════════

async function sendAccountCreationEmail(userEmail, name, accountId) {
    const subject = 'New Bank Account Created - FinLedger';
    const timestamp = new Date().toLocaleString('en-IN', {
        timeZone: 'Asia/Kolkata',
        dateStyle: 'medium',
        timeStyle: 'short'
    });

    const text = [
        `Hello ${name},`,
        '',
        `A new bank account has been created successfully on your FinLedger profile.`,
        '',
        `Account ID: ${accountId}`,
        `Currency: INR`,
        `Status: Active`,
        `Created: ${timestamp}`,
        '',
        'You can now deposit funds and make transfers from this account.',
        '',
        'Regards,',
        'The FinLedger Team'
    ].join('\n');

    const html = emailTemplate(`
        <h2 style="margin: 0 0 20px; font-size: 20px; font-weight: 600; color: #1e293b;">Account Created</h2>
        <p style="margin: 0 0 20px; font-size: 15px; color: #475569; line-height: 1.6;">
            Hello ${name}, a new bank account has been created successfully on your FinLedger profile.
        </p>

        <!-- Account details card -->
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin: 0 0 24px; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
            <tr>
                <td style="background-color: #f8fafc; padding: 14px 20px; border-bottom: 1px solid #e2e8f0;">
                    <p style="margin: 0; font-size: 13px; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px;">Account Details</p>
                </td>
            </tr>
            <tr>
                <td style="padding: 0;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                        <tr>
                            <td style="padding: 12px 20px; border-bottom: 1px solid #f1f5f9; font-size: 14px; color: #64748b; width: 40%;">Account ID</td>
                            <td style="padding: 12px 20px; border-bottom: 1px solid #f1f5f9; font-size: 14px; color: #1e293b; font-family: monospace;">${accountId}</td>
                        </tr>
                        <tr>
                            <td style="padding: 12px 20px; border-bottom: 1px solid #f1f5f9; font-size: 14px; color: #64748b;">Currency</td>
                            <td style="padding: 12px 20px; border-bottom: 1px solid #f1f5f9; font-size: 14px; color: #1e293b;">INR</td>
                        </tr>
                        <tr>
                            <td style="padding: 12px 20px; border-bottom: 1px solid #f1f5f9; font-size: 14px; color: #64748b;">Status</td>
                            <td style="padding: 12px 20px; border-bottom: 1px solid #f1f5f9; font-size: 14px; font-weight: 600; color: #16a34a;">Active</td>
                        </tr>
                        <tr>
                            <td style="padding: 12px 20px; font-size: 14px; color: #64748b;">Created</td>
                            <td style="padding: 12px 20px; font-size: 14px; color: #1e293b;">${timestamp}</td>
                        </tr>
                    </table>
                </td>
            </tr>
        </table>

        <p style="margin: 0 0 16px; font-size: 14px; color: #475569; line-height: 1.6;">
            You can now deposit funds and make transfers from this account through the FinLedger dashboard.
        </p>
        <p style="margin: 0; font-size: 14px; color: #64748b; line-height: 1.5;">
            Regards,<br />The FinLedger Team
        </p>
    `);

    await sendEmail(userEmail, subject, text, html);
}


// ═══════════════════════════════════════════════════════════════
//  Account Closure Email
// ═══════════════════════════════════════════════════════════════

async function sendAccountClosureEmail(userEmail, name, accountId) {
    const subject = 'Account Closed - FinLedger';
    const timestamp = new Date().toLocaleString('en-IN', {
        timeZone: 'Asia/Kolkata',
        dateStyle: 'medium',
        timeStyle: 'short'
    });

    const text = [
        `Hello ${name},`,
        '',
        `Your bank account has been closed as requested.`,
        '',
        `Account ID: ${accountId}`,
        `Status: Closed`,
        `Closed On: ${timestamp}`,
        '',
        'All ledger entries and transaction history associated with this account remain available for audit purposes.',
        '',
        'If you did not request this closure, please contact support immediately.',
        '',
        'Regards,',
        'The FinLedger Team'
    ].join('\n');

    const html = emailTemplate(`
        <h2 style="margin: 0 0 20px; font-size: 20px; font-weight: 600; color: #1e293b;">Account Closed</h2>
        <p style="margin: 0 0 20px; font-size: 15px; color: #475569; line-height: 1.6;">
            Hello ${name}, your bank account has been closed as per your request.
        </p>

        <!-- Account details card -->
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin: 0 0 24px; border: 1px solid #fecaca; border-radius: 8px; overflow: hidden;">
            <tr>
                <td style="background-color: #fef2f2; padding: 14px 20px; border-bottom: 1px solid #fecaca;">
                    <p style="margin: 0; font-size: 13px; font-weight: 600; color: #991b1b; text-transform: uppercase; letter-spacing: 0.5px;">Closure Details</p>
                </td>
            </tr>
            <tr>
                <td style="padding: 0;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                        <tr>
                            <td style="padding: 12px 20px; border-bottom: 1px solid #f1f5f9; font-size: 14px; color: #64748b; width: 40%;">Account ID</td>
                            <td style="padding: 12px 20px; border-bottom: 1px solid #f1f5f9; font-size: 14px; color: #1e293b; font-family: monospace;">${accountId}</td>
                        </tr>
                        <tr>
                            <td style="padding: 12px 20px; border-bottom: 1px solid #f1f5f9; font-size: 14px; color: #64748b;">Status</td>
                            <td style="padding: 12px 20px; border-bottom: 1px solid #f1f5f9; font-size: 14px; font-weight: 600; color: #dc2626;">Closed</td>
                        </tr>
                        <tr>
                            <td style="padding: 12px 20px; font-size: 14px; color: #64748b;">Closed On</td>
                            <td style="padding: 12px 20px; font-size: 14px; color: #1e293b;">${timestamp}</td>
                        </tr>
                    </table>
                </td>
            </tr>
        </table>

        <table role="presentation" cellpadding="0" cellspacing="0" style="margin: 0 0 24px;">
            <tr>
                <td style="background-color: #fffbeb; border: 1px solid #fde68a; border-radius: 8px; padding: 14px 20px;">
                    <p style="margin: 0; font-size: 13px; color: #92400e; line-height: 1.5;">
                        All ledger entries and transaction history for this account remain available for audit purposes. No financial records have been deleted.
                    </p>
                </td>
            </tr>
        </table>

        <p style="margin: 0 0 16px; font-size: 14px; color: #475569; line-height: 1.6;">
            If you did not request this closure, please contact support immediately.
        </p>
        <p style="margin: 0; font-size: 14px; color: #64748b; line-height: 1.5;">
            Regards,<br />The FinLedger Team
        </p>
    `);

    await sendEmail(userEmail, subject, text, html);
}


// ═══════════════════════════════════════════════════════════════
//  OTP Verification Email
// ═══════════════════════════════════════════════════════════════

async function sendOtpEmail(userEmail, name, otp) {
    const subject = `${otp} is your FinLedger verification code`;

    const text = [
        `Hello ${name},`,
        '',
        `Your verification code is: ${otp}`,
        '',
        'This code will expire in 10 minutes.',
        '',
        'If you did not request this code, please ignore this email.',
        '',
        'Regards,',
        'The FinLedger Team'
    ].join('\n');

    // Split OTP into individual digits for styled display
    const digits = otp.split('').map(d =>
        `<td style="width: 48px; height: 56px; background-color: #f1f5f9; border: 2px solid #e2e8f0; border-radius: 10px; text-align: center; font-size: 28px; font-weight: 700; color: #1e293b; font-family: 'Courier New', monospace; letter-spacing: 2px;">${d}</td>`
    ).join('<td style="width: 8px;"></td>');

    const html = emailTemplate(`
        <h2 style="margin: 0 0 8px; font-size: 20px; font-weight: 600; color: #1e293b;">Verify Your Email</h2>
        <p style="margin: 0 0 24px; font-size: 15px; color: #475569; line-height: 1.6;">
            Hello ${name}, please use the following code to complete your registration.
        </p>

        <!-- OTP digits -->
        <table role="presentation" cellpadding="0" cellspacing="0" style="margin: 0 auto 24px;">
            <tr>
                ${digits}
            </tr>
        </table>

        <!-- Expiry notice -->
        <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin: 0 0 24px;">
            <tr>
                <td style="background-color: #fffbeb; border: 1px solid #fde68a; border-radius: 8px; padding: 14px 20px; text-align: center;">
                    <p style="margin: 0; font-size: 13px; color: #92400e; line-height: 1.5;">
                        This code will expire in <strong>10 minutes</strong>. Do not share it with anyone.
                    </p>
                </td>
            </tr>
        </table>

        <p style="margin: 0 0 16px; font-size: 14px; color: #475569; line-height: 1.6;">
            If you did not request this code, please ignore this email. No account will be created.
        </p>
        <p style="margin: 0; font-size: 14px; color: #64748b; line-height: 1.5;">
            Regards,<br />The FinLedger Team
        </p>
    `);

    await sendEmail(userEmail, subject, text, html);
}


module.exports = {
    sendRegistrationEmail,
    sendTransactionEmail,
    sendTransactionFailureEmail,
    sendAccountCreationEmail,
    sendAccountClosureEmail,
    sendOtpEmail
};