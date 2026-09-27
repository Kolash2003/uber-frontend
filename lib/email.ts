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

export async function sendVerificationEmail({
  to,
  name,
  url,
}: {
  to: string;
  name: string;
  url: string;
}) {
  if (!transporter) {
    console.warn(
      `[email] Gmail SMTP is not configured. Verification URL for ${to}: ${url}`,
    );
    return;
  }

  const greeting = name ? `Hi ${name},` : "Hi there,";

  await transporter.sendMail({
    from: `"Ride" <${mailFrom}>`,
    to,
    subject: "Verify your Ride email",
    text: `${greeting}\n\nVerify your email to finish creating your Ride account:\n${url}\n\nThis link expires in 1 hour. If you didn't create an account, you can ignore this email.`,
    html: `
      <div style="font-family: -apple-system, Segoe UI, Roboto, sans-serif; max-width: 480px; margin: 0 auto;">
        <h2 style="margin-bottom: 8px;">Verify your email</h2>
        <p>${greeting}</p>
        <p>Verify your email to finish creating your Ride account.</p>
        <p style="margin: 28px 0;">
          <a href="${url}"
             style="background:#111;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none;display:inline-block;">
            Verify email
          </a>
        </p>
        <p style="color:#666;font-size:13px;">This link expires in 1 hour. If you didn't create an account, you can ignore this email.</p>
      </div>
    `,
  });
}
