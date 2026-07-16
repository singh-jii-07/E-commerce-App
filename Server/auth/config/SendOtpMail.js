import nodemailer from "nodemailer";


const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "nileshkumarsingh060@gmail.com",
    pass: "xeop srqb lgju wacc", 
  },
});


export const sendOtpMail = async (newUser, otp) => {
  try {
    await transporter.sendMail({
      from: `"NKPR Verification" <nileshkumarsingh060@gmail.com>`,
      to: newUser.email,
      subject: "Your OTP for Email Verification - NKPR",
      html: `
        <div style="font-family: Arial, sans-serif; background: #f4f7fb; padding: 20px;">
          <div style="max-width: 600px; margin: auto; background: #ffffff; border-radius: 10px; overflow: hidden; box-shadow: 0px 4px 10px rgba(0,0,0,0.1);">
            
            <!-- Header -->
            <div style="background: linear-gradient(90deg, #5364FF, #00F1FF); color: white; padding: 20px; text-align: center;">
              <h1 style="margin: 0;">NKPR Verification</h1>
            </div>

            <!-- Body -->
            <div style="padding: 30px; text-align: left; color: #333;">
              <h2>Hello, ${newUser.username} 👋</h2>
              <p>We received a request to verify your email address. Use the OTP below to complete your verification:</p>
              
              <!-- OTP -->
              <div style="text-align: center; margin: 30px 0;">
                <span style="font-size: 28px; font-weight: bold; letter-spacing: 5px; background: #f4f7fb; padding: 12px 25px; border-radius: 8px; border: 2px dashed #5364FF; display: inline-block;">
                  ${newUser.otp}
                </span>
              </div>

              <p>This OTP is valid for <b>10 minutes</b>. Do not share it with anyone for security reasons.</p>
              <p>If you did not request this, please ignore this email.</p>
            </div>

            <!-- Footer -->
            <div style="background: #0B1F33; color: #bbb; text-align: center; padding: 15px; font-size: 12px;">
              © ${new Date().getFullYear()} NKPR & Promotions. All rights reserved.
            </div>
          </div>
        </div>
      `,
    });

    console.log("OTP email sent successfully ✅");
  } catch (err) {
    console.error("Error sending OTP email:", err);
  }
};
