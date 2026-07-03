import { Resend } from 'resend';
import nodemailer from 'nodemailer';
import logger from '../utils/logger.js';

/**
 * Send a password reset email via Resend.
 * Falls back to console.log when RESEND_API_KEY is not set (dev mode).
 */
export async function sendPasswordResetEmail({ to, resetUrl, appName = 'AI SEO Article Generator' }) {
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;

  if (smtpUser && smtpPass) {
    try {
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: process.env.SMTP_PORT || 587,
        secure: process.env.SMTP_PORT == 465,
        auth: { user: smtpUser, pass: smtpPass },
      });
      const info = await transporter.sendMail({
        from: `"${appName}" <${smtpUser}>`,
        to,
        subject: `Reset your ${appName} password`,
        html: buildResetEmail({ resetUrl, appName }),
      });
      return { success: true, id: info.messageId };
    } catch (error) {
      throw new Error(`Échec de l'envoi via SMTP : ${error.message}`);
    }
  }

  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    logger.warn(`[Email] RESEND_API_KEY not set — logging reset URL. To: ${to} | URL: ${resetUrl}`);
    return { success: true, fallback: true };
  }

  // EMAIL_FROM must be an address on a Resend-verified domain.
  // During development you can use: onboarding@resend.dev (delivers only to the Resend account owner).
  const fromEmail = process.env.EMAIL_FROM || 'onboarding@resend.dev';

  if (!process.env.EMAIL_FROM) {
    logger.warn(
      '[Email] EMAIL_FROM is not set — using Resend test sender (onboarding@resend.dev). ' +
      'Set EMAIL_FROM=noreply@yourdomain.com with a verified Resend domain for production.'
    );
  }

  const resend = new Resend(apiKey);

  const { data, error } = await resend.emails.send({
    from: `${appName} <${fromEmail}>`,
    to,
    subject: `Reset your ${appName} password`,
    html: buildResetEmail({ resetUrl, appName }),
  });

  if (error) {
    if (error.name === 'validation_error') {
      throw new Error(`Le compte Resend gratuit ne permet d'envoyer des emails qu'à votre adresse principale (celle du compte Resend). Pour envoyer à d'autres adresses, vous devez vérifier un nom de domaine sur resend.com.`);
    }
    throw new Error(`Échec de l'envoi de l'email : ${error.message}`);
  }

  return { success: true, id: data?.id };
}

export async function sendEmailVerificationEmail({ to, verifyUrl, appName = 'AI SEO Article Generator' }) {
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;

  if (smtpUser && smtpPass) {
    try {
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: process.env.SMTP_PORT || 587,
        secure: process.env.SMTP_PORT == 465,
        auth: { user: smtpUser, pass: smtpPass },
      });
      const info = await transporter.sendMail({
        from: `"${appName}" <${smtpUser}>`,
        to,
        subject: `Verify your ${appName} email address`,
        html: buildVerificationEmail({ verifyUrl, appName }),
      });
      return { success: true, id: info.messageId };
    } catch (error) {
      throw new Error(`Échec de l'envoi via SMTP : ${error.message}`);
    }
  }

  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    logger.warn(`[Email] RESEND_API_KEY not set — logging verification URL. To: ${to} | URL: ${verifyUrl}`);
    return { success: true, fallback: true };
  }

  const fromEmail = process.env.EMAIL_FROM || 'onboarding@resend.dev';
  const resend = new Resend(apiKey);

  const { data, error } = await resend.emails.send({
    from: `${appName} <${fromEmail}>`,
    to,
    subject: `Verify your ${appName} email address`,
    html: buildVerificationEmail({ verifyUrl, appName }),
  });

  if (error) {
    if (error.name === 'validation_error') {
      throw new Error(`Le compte Resend gratuit ne permet d'envoyer des emails qu'à votre adresse principale (celle du compte Resend). Pour envoyer à d'autres adresses, vous devez vérifier un nom de domaine sur resend.com.`);
    }
    throw new Error(`Échec de l'envoi de l'email : ${error.message}`);
  }
  return { success: true, id: data?.id };
}

function buildVerificationEmail({ verifyUrl, appName }) {
  const year = new Date().getFullYear();
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Verify your email</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f4f7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI','Inter',Arial,sans-serif;-webkit-font-smoothing:antialiased;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f7;padding:48px 16px;">
    <tr><td align="center">
      <table role="presentation" width="100%" style="max-width:520px;" cellpadding="0" cellspacing="0">
        <tr>
          <td align="center" style="padding-bottom:24px;">
            <table role="presentation" cellpadding="0" cellspacing="0"><tr>
              <td style="background:linear-gradient(135deg,#7c3aed,#6d28d9);border-radius:12px;padding:10px 12px;vertical-align:middle;">
                <img src="https://raw.githubusercontent.com/lucide-icons/lucide/main/icons/sparkles.svg" width="20" height="20" alt="" style="display:block;filter:brightness(0) invert(1);" />
              </td>
              <td style="padding-left:10px;vertical-align:middle;">
                <span style="font-size:18px;font-weight:800;color:#111827;letter-spacing:-0.3px;">${appName}</span>
              </td>
            </tr></table>
          </td>
        </tr>
        <tr>
          <td style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.06),0 4px 16px rgba(0,0,0,0.04);">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
              <tr><td style="height:4px;background:linear-gradient(90deg,#10b981,#34d399);"></td></tr>
            </table>
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
              <tr><td style="padding:40px 40px 32px;">
                <table role="presentation" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
                  <tr><td style="background:#ecfdf5;border-radius:50%;width:52px;height:52px;text-align:center;vertical-align:middle;">
                    <span style="font-size:24px;line-height:52px;">✉️</span>
                  </td></tr>
                </table>
                <h1 style="margin:0 0 8px;font-size:22px;font-weight:800;color:#111827;letter-spacing:-0.4px;line-height:1.2;">Verify your email address</h1>
                <p style="margin:0 0 28px;font-size:15px;color:#6b7280;line-height:1.65;">
                  Welcome to <strong style="color:#374151;">${appName}</strong>! Click the button below to confirm your email address and activate your account.
                </p>
                <table role="presentation" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
                  <tr><td style="border-radius:10px;background:linear-gradient(135deg,#059669,#10b981);box-shadow:0 4px 12px rgba(16,185,129,0.30);">
                    <a href="${verifyUrl}" style="display:inline-block;padding:14px 36px;font-size:15px;font-weight:700;color:#ffffff;text-decoration:none;letter-spacing:0.1px;border-radius:10px;">Verify Email Address</a>
                  </td></tr>
                </table>
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
                  <tr><td style="background:#fffbeb;border:1px solid #fde68a;border-radius:8px;padding:12px 16px;">
                    <p style="margin:0;font-size:13px;color:#92400e;">⏱ This link expires in <strong>24 hours</strong>.</p>
                  </td></tr>
                </table>
                <p style="margin:0;font-size:13px;color:#9ca3af;line-height:1.6;">
                  If you didn't create an account, you can safely ignore this email.
                </p>
              </td></tr>
              <tr><td style="padding:0 40px 32px;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
                  <td style="border-top:1px solid #f3f4f6;padding-top:20px;">
                    <p style="margin:0 0 4px;font-size:11px;font-weight:600;color:#d1d5db;text-transform:uppercase;letter-spacing:0.8px;">Or copy this link</p>
                    <a href="${verifyUrl}" style="font-size:12px;color:#059669;word-break:break-all;text-decoration:none;">${verifyUrl}</a>
                  </td>
                </tr></table>
              </td></tr>
            </table>
          </td>
        </tr>
        <tr><td align="center" style="padding-top:24px;">
          <p style="margin:0;font-size:12px;color:#9ca3af;">&copy; ${year} ${appName} &middot; All rights reserved</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function buildResetEmail({ resetUrl, appName }) {
  const year = new Date().getFullYear();

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Reset your password</title>
  <!--[if mso]>
  <noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript>
  <![endif]-->
</head>
<body style="margin:0;padding:0;background-color:#f4f4f7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI','Inter',Arial,sans-serif;-webkit-font-smoothing:antialiased;">

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f7;padding:48px 16px;">
    <tr>
      <td align="center">

        <!-- Card -->
        <table role="presentation" width="100%" style="max-width:520px;" cellpadding="0" cellspacing="0">

          <!-- Logo bar -->
          <tr>
            <td align="center" style="padding-bottom:24px;">
              <table role="presentation" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="background:linear-gradient(135deg,#7c3aed,#6d28d9);border-radius:12px;padding:10px 12px;vertical-align:middle;">
                    <!-- sparkles icon inline SVG -->
                    <img src="https://raw.githubusercontent.com/lucide-icons/lucide/main/icons/sparkles.svg" width="20" height="20" alt="" style="display:block;filter:brightness(0) invert(1);" />
                  </td>
                  <td style="padding-left:10px;vertical-align:middle;">
                    <span style="font-size:18px;font-weight:800;color:#111827;letter-spacing:-0.3px;">${appName}</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Main card -->
          <tr>
            <td style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.06),0 4px 16px rgba(0,0,0,0.04);">

              <!-- Purple top strip -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="height:4px;background:linear-gradient(90deg,#7c3aed,#a78bfa);"></td>
                </tr>
              </table>

              <!-- Body -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding:40px 40px 32px;">

                    <!-- Icon -->
                    <table role="presentation" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
                      <tr>
                        <td style="background:#f5f3ff;border-radius:50%;width:52px;height:52px;text-align:center;vertical-align:middle;">
                          <span style="font-size:24px;line-height:52px;">🔑</span>
                        </td>
                      </tr>
                    </table>

                    <h1 style="margin:0 0 8px;font-size:22px;font-weight:800;color:#111827;letter-spacing:-0.4px;line-height:1.2;">Reset your password</h1>
                    <p style="margin:0 0 28px;font-size:15px;color:#6b7280;line-height:1.65;">
                      We received a request to reset the password for your <strong style="color:#374151;">${appName}</strong> account.
                      Click the button below to choose a new password.
                    </p>

                    <!-- CTA button -->
                    <table role="presentation" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
                      <tr>
                        <td style="border-radius:10px;background:linear-gradient(135deg,#7c3aed,#6d28d9);box-shadow:0 4px 12px rgba(124,58,237,0.35);">
                          <a href="${resetUrl}"
                             style="display:inline-block;padding:14px 36px;font-size:15px;font-weight:700;color:#ffffff;text-decoration:none;letter-spacing:0.1px;border-radius:10px;">
                            Reset Password
                          </a>
                        </td>
                      </tr>
                    </table>

                    <!-- Expiry notice -->
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
                      <tr>
                        <td style="background:#fffbeb;border:1px solid #fde68a;border-radius:8px;padding:12px 16px;">
                          <p style="margin:0;font-size:13px;color:#92400e;">
                            ⏱ This link expires in <strong>1 hour</strong>. After that, you'll need to request a new one.
                          </p>
                        </td>
                      </tr>
                    </table>

                    <p style="margin:0;font-size:13px;color:#9ca3af;line-height:1.6;">
                      If you didn't request a password reset, you can safely ignore this email — your password won't change.
                    </p>

                  </td>
                </tr>

                <!-- Divider + raw link -->
                <tr>
                  <td style="padding:0 40px 32px;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="border-top:1px solid #f3f4f6;padding-top:20px;">
                          <p style="margin:0 0 4px;font-size:11px;font-weight:600;color:#d1d5db;text-transform:uppercase;letter-spacing:0.8px;">Or copy this link</p>
                          <a href="${resetUrl}" style="font-size:12px;color:#7c3aed;word-break:break-all;text-decoration:none;">${resetUrl}</a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="padding-top:24px;">
              <p style="margin:0;font-size:12px;color:#9ca3af;">
                &copy; ${year} ${appName} &middot; All rights reserved
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
