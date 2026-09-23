const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: "smtp.zoho.in",    // 👈 Free account ke liye yeh exact host chalega
  port: 465,               // 👈 SSL port
  secure: true,            // 👈 true for port 465
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  connectionTimeout: 10000,
  socketTimeout: 10000,
});

const sendOtpEmail = async (toEmail, otp) => {
  const mailOptions = {
    from: `"KafChat Security" <${process.env.EMAIL_USER}>`,
    to: toEmail,
    subject: "Your KafChat Verification Code",
    html: `
      <div style="font-family: Arial, sans-serif; padding: 25px; color: #1e293b; max-width: 500px; border: 1px solid #e2e8f0; border-radius: 12px; background: #ffffff;">
        <h2 style="color: #6366f1; margin-top: 0;">Welcome to KafChat</h2>
        <p style="font-size: 15px; color: #475569;">Use the following 6-digit code to verify your account or login:</p>
        <div style="background: #f8fafc; border: 1px dashed #6366f1; border-radius: 8px; text-align: center; padding: 15px; margin: 20px 0;">
          <h1 style="color: #0f172a; letter-spacing: 6px; font-size: 36px; margin: 0;">${otp}</h1>
        </div>
        <p style="color: #64748b; font-size: 13px; margin-bottom: 0;">This code will expire in 5 minutes. Please do not share it with anyone.</p>
      </div>
    `,
  };

  return await transporter.sendMail(mailOptions);
};

module.exports = { sendOtpEmail };