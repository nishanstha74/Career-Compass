import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL,
    pass: process.env.EMAIL_PASSWORD,
  },
});

export const sendVerificationEmail = async (email, otp) => {
  try {
    await transporter.sendMail({
      from: `"Career Compass" <${process.env.EMAIL}>`,
      to: email,
      subject: "Verify Your Career Compass Account",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto;">
          <h2>Email Verification</h2>
          <p>Hello,</p>
          <p>Thank you for registering with <strong>Career Compass</strong>.</p>
          <p>Your verification code is:</p>

          <h1 style="letter-spacing: 5px; color: #2563eb;">
            ${otp}
          </h1>

          <p>This OTP is valid for <strong>10 minutes</strong>.</p>

          <p>If you didn't create this account, you can safely ignore this email.</p>

          <hr />
          <small>Career Compass Team</small>
        </div>
      `,
    });

    console.log(`✅ Verification email sent to ${email}`);
  } catch (error) {
    console.error("❌ Error sending verification email:", error);
    throw error;
  }
};

export const sendPasswordResetEmail = async (email, otp) => {
  try {
    await transporter.sendMail({
      from: `"Career Compass" <${process.env.EMAIL}>`,
      to: email,
      subject: "Reset Your Career Compass Password",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto;">
          <h2>Password Reset Request</h2>
          <p>Hello,</p>
          <p>We received a request to reset your <strong>Career Compass</strong> password.</p>
          <p>Your password reset OTP is:</p>

          <h1 style="letter-spacing: 5px; color: #2563eb;">
            ${otp}
          </h1>

          <p>This OTP is valid for <strong>10 minutes</strong>.</p>
          <p>If you did not request a password reset, please ignore this email. Your password will remain unchanged.</p>

          <hr />
          <small>Career Compass Team</small>
        </div>
      `,
    });

    console.log(`✅ Password reset email sent to ${email}`);
  } catch (error) {
    console.error("❌ Error sending password reset email:", error);
    throw error;
  }
};
