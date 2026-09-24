const nodemailer = require('nodemailer');

// Gmail transporter setup
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER, // .env file se email uthayega
    pass: process.env.EMAIL_PASS  // .env file se 16-digit app password uthayega
  }
});

const sendOtpEmail = async (toEmail, otp) => {
  try {
    const mailOptions = {
      from: `"KafChat" <${process.env.EMAIL_USER}>`,
      to: toEmail,
      subject: 'Your KafChat OTP Code',
      text: `Your OTP for KafChat is: ${otp}. Do not share it with anyone.`
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("OTP email sent successfully:", info.response);
    return true;
  } catch (error) {
    console.error("Error sending email via Nodemailer:", error);
    throw error;
  }
};

module.exports = { sendOtpEmail };