import nodemailer from "nodemailer";

const gmailUser = process.env.GMAIL_USER;
const gmailPass = process.env.GMAIL_APP_PASSWORD;
const mailFrom = process.env.MAIL_FROM ?? gmailUser;

const transporter =
  gmailUser && gmailPass
    ? nodemailer.createTransport({
        service: "gmail",
        auth: { user: gmailUser, pass: gmailPass },
      })
    : null;

async function sendMail(opts: {
  to: string;
  subject: string;
  text: string;
  html: string;
}) {
  if (!transporter) return false;
  await transporter.sendMail({
    from: `"Ride" <${mailFrom}>`,
    to: opts.to,
    subject: opts.subject,
    text: opts.text,
    html: opts.html,
  });
  return true;
}

function button(url: string, label: string) {
  return `<p style="margin: 28px 0;"><a href="${url}" style="background:#111;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none;display:inline-block;">${label}</a></p>`;
}

function layout(heading: string, body: string) {
  return `<div style="font-family: -apple-system, Segoe UI, Roboto, sans-serif; max-width: 480px; margin: 0 auto;"><h2 style="margin-bottom: 8px;">${heading}</h2>${body}</div>`;
}

export async function sendVerificationEmail({
  to,
  name,
  url,
}: {
  to: string;
  name: string;
  url: string;
}) {
  const greeting = name ? `Hi ${name},` : "Hi there,";

  const sent = await sendMail({
    to,
    subject: "Verify your Ride email",
    text: `${greeting}\n\nVerify your email to finish creating your Ride account:\n${url}\n\nThis link expires in 1 hour. If you didn't create an account, you can ignore this email.`,
    html: layout(
      "Verify your email",
      `<p>${greeting}</p><p>Verify your email to finish creating your Ride account.</p>${button(url, "Verify email")}<p style="color:#666;font-size:13px;">This link expires in 1 hour. If you didn't create an account, you can ignore this email.</p>`,
    ),
  });

  if (!sent) {
    console.warn(
      `[email] Gmail SMTP is not configured. Verification URL for ${to}: ${url}`,
    );
  }
}

export async function sendPasswordResetEmail({
  to,
  name,
  url,
}: {
  to: string;
  name: string;
  url: string;
}) {
  const greeting = name ? `Hi ${name},` : "Hi there,";

  const sent = await sendMail({
    to,
    subject: "Reset your Ride password",
    text: `${greeting}\n\nReset your Ride password with this link:\n${url}\n\nThis link expires in 1 hour. If you didn't request a reset, you can ignore this email.`,
    html: layout(
      "Reset your password",
      `<p>${greeting}</p><p>Reset your Ride password using the button below.</p>${button(url, "Reset password")}<p style="color:#666;font-size:13px;">This link expires in 1 hour. If you didn't request a reset, you can ignore this email.</p>`,
    ),
  });

  if (!sent) {
    console.warn(
      `[email] Gmail SMTP is not configured. Password reset URL for ${to}: ${url}`,
    );
  }
}
