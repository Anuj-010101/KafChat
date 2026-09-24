const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.zoho.in',
  port: 465,
  secure: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

const sendOtpEmail = async (toEmail, otp) => {
  try {
    const mailOptions = {
      from: `"KafChat" <${process.env.EMAIL_USER}>`,
      to: toEmail,
      subject: 'Your KafChat Verification Code',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9; border-radius: 8px; border: 1px solid #e0e0e0;">
          <h2 style="color: #4F46E5; text-align: center;">KafChat Verification</h2>
          <p style="font-size: 16px; color: #333;">Hello,</p>
          <p style="font-size: 16px; color: #333;">Your One-Time Password (OTP) for login/signup is:</p>
          <div style="text-align: center; margin: 25px 0;">
            <span style="font-size: 28px; font-weight: bold; color: #fff; background-color: #4F46E5; padding: 12px 24px; letter-spacing: 4px; border-radius: 6px; display: inline-block;">
              ${otp}
            </span>
          </div>
          <p style="font-size: 14px; color: #666; text-align: center;">This code is valid for a limited time. Do not share it with anyone.</p>
          <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 20px 0;">
          <p style="font-size: 12px; color: #999; text-align: center;">&copy; KafChat Platform. All rights reserved.</p>
        </div>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("Styled OTP email sent successfully:", info.response);
    return true;
  } catch (error) {
    console.error("Email Error:", error);
    throw error;
  }
};

module.exports = { sendOtpEmail };