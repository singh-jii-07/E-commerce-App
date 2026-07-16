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
      from: `"E-commerce App" <nileshkumarsingh060@gmail.com>`,
      to: newUser.email,
      subject: "Your OTP for Email Verification - NKPR",
      html: `
<div style="margin:0;padding:0;background:#f5f7fa;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f7fa;padding:40px 0;">
    <tr>
      <td align="center">

        <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:15px;overflow:hidden;box-shadow:0 8px 25px rgba(0,0,0,0.08);">

          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#4F46E5,#2563EB);padding:35px;text-align:center;color:#fff;">
              <h1 style="margin:0;font-size:30px;">🛒 E-Commerce</h1>
              <p style="margin-top:8px;font-size:15px;opacity:.9;">
                Secure Account Verification
              </p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:40px;color:#333;">

              <h2 style="margin-top:0;">
                Hello, ${newUser.username}
              </h2>

              <p style="font-size:16px;line-height:28px;color:#555;">
                We received a request to verify your account.
                Use the OTP below to continue.
              </p>

              <!-- OTP BOX -->
              <div style="text-align:center;margin:35px 0;">

                <div style="
                display:inline-block;
                background:#EEF2FF;
                border:2px dashed #4F46E5;
                padding:18px 40px;
                border-radius:12px;
                font-size:34px;
                letter-spacing:8px;
                font-weight:bold;
                color:#4F46E5;
                ">
                  ${newUser.otp}
                </div>

              </div>

              <p style="font-size:15px;color:#666;">
                ⏰ This OTP is valid for
                <strong>10 Minutes</strong>.
              </p>

              <p style="font-size:15px;color:#666;">
                Never share this OTP with anyone.
                Our team will never ask for it.
              </p>

              <div style="
              background:#FFF7ED;
              border-left:4px solid #F97316;
              padding:15px;
              margin-top:25px;
              border-radius:8px;
              ">

                <strong>Security Tip 🔒</strong>

                <p style="margin:8px 0 0;color:#555;">
                  If you didn't request this verification,
                  you can safely ignore this email.
                </p>

              </div>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="
            background:#111827;
            color:#d1d5db;
            text-align:center;
            padding:25px;
            ">

              <h3 style="margin:0;color:white;">
                Thank You ❤️
              </h3>

              <p style="margin:10px 0 5px;">
                Happy Shopping with E-Commerce
              </p>

              <p style="font-size:13px;color:#9ca3af;">
                © ${new Date().getFullYear()} E-Commerce.
                All Rights Reserved.
              </p>

            </td>
          </tr>

        </table>

      </td>
    </tr>
  </table>
</div>
      `,
    });

    console.log("OTP email sent successfully");
  } catch (err) {
    console.error("Error sending OTP email:", err);
  }
};
