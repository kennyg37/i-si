/**
 * Test Email Configuration Script
 *
 * Run this to verify your email setup is working correctly
 *
 * Usage: npx tsx scripts/test-email-setup.ts
 */

import { verifyEmailConfig, sendVerificationEmail } from '../src/lib/email/mailer';

async function testEmailSetup() {
  console.log('Testing Email Configuration...\n');

  // Check environment variables
  console.log('Environment Variables:');
  console.log('- EMAIL_USER:', process.env.EMAIL_USER ? 'Set' : 'Missing');
  console.log('- EMAIL_APP_PASSWORD:', process.env.EMAIL_APP_PASSWORD ? 'Set' : 'Missing');
  console.log('- EMAIL_FROM_NAME:', process.env.EMAIL_FROM_NAME || '(using default)');
  console.log('- NEXT_PUBLIC_APP_URL:', process.env.NEXT_PUBLIC_APP_URL || '(using default)');
  console.log('- CRON_SECRET:', process.env.CRON_SECRET ? 'Set' : 'Missing');
  console.log('');

  if (!process.env.EMAIL_USER || !process.env.EMAIL_APP_PASSWORD) {
    console.error('Missing required environment variables!');
    console.error('Please set EMAIL_USER and EMAIL_APP_PASSWORD in your .env.local file');
    console.error('See NOTIFICATIONS_SETUP.md for instructions');
    process.exit(1);
  }

  // Test SMTP connection
  console.log('📧 Testing SMTP Connection...');
  try {
    const isValid = await verifyEmailConfig();

    if (isValid) {
      console.log('SMTP connection successful!\n');
    } else {
      console.error('SMTP connection failed!');
      process.exit(1);
    }
  } catch (error) {
    console.error('SMTP connection error:', error);
    process.exit(1);
  }

  // Ask if user wants to send a test email
  console.log('📨 Test Email Sending');
  console.log('To test email delivery, provide an email address:');
  console.log('(Press Ctrl+C to skip)\n');

  const readline = require('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  rl.question('Email address to test: ', async (email: string) => {
    if (!email || !email.includes('@')) {
      console.log('Skipping email send test.');
      rl.close();
      process.exit(0);
    }

    console.log(`\nSending test verification email to ${email}...`);

    try {
      const testSent = await sendVerificationEmail(
        email,
        `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/notifications/verify?id=test-123`
      );

      if (testSent) {
        console.log('Test email sent successfully!');
        console.log(`📬 Check ${email} for the verification email`);
      } else {
        console.error('Failed to send test email');
      }
    } catch (error) {
      console.error('Error sending test email:', error);
    }

    rl.close();
    process.exit(0);
  });
}

// Run the test
testEmailSetup().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
