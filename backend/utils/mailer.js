import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

// Create transporter
const transporter = nodemailer.createTransport({
  service: process.env.EMAIL_SERVICE || "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

// Send Welcome Email
export const sendWelcomeEmail = async (name, email) => {
  // Skip email if disabled
  if (process.env.ENABLE_EMAIL === 'false') {
    console.log(`⏭️  Email disabled - skipping welcome email for ${email}`);
    return;
  }

  try {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Welcome to Heer Enterprise 🎨",
      html: `
        <div style="font-family: 'Playfair Display', serif, Arial; max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden;">
          <div style="background: #111; padding: 40px 20px; text-align: center;">
            <h1 style="color: #c5a059; margin: 0; font-size: 28px; letter-spacing: 2px; text-transform: uppercase;">Heer Enterprise</h1>
            <p style="color: #888; margin-top: 10px; font-size: 14px;">Luxury Redefined</p>
          </div>
          <div style="padding: 40px; background-color: #ffffff;">
            <p style="color: #111; font-size: 18px; margin-bottom: 20px;">Hi <strong>${name}</strong>,</p>
            <p style="color: #444; line-height: 1.8; font-size: 15px;">
              Thank you for choosing <strong>Heer Enterprise</strong>. We are thrilled to have you as part of our exclusive community.
            </p>
            <p style="color: #444; line-height: 1.8; font-size: 15px;">
              Discover your unique style and explore our curated collections designed to make you stand out.
            </p>
            <div style="margin: 40px 0; text-align: center;">
              <a href="${process.env.FRONTEND_URL || "http://localhost:5173"}/login" style="background-color: #c5a059; color: white; padding: 15px 40px; text-decoration: none; border-radius: 4px; font-weight: bold; display: inline-block; text-transform: uppercase; letter-spacing: 1px;">
                Access Your Account
              </a>
            </div>
            <p style="color: #999; font-size: 12px; text-align: center; margin-top: 20px;">
              If you didn't create this account, please ignore this email.
            </p>
          </div>
          <div style="background-color: #111; padding: 20px; text-align: center; font-size: 12px; color: #888;">
            <p style="margin: 0;">© 2026 Heer Enterprise. All rights reserved.</p>
          </div>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log(`Welcome email sent to ${email}`);
  } catch (error) {
    console.error("Error sending welcome email:", error);
    throw error;
  }
};

// Send Login Notification Email
export const sendLoginNotificationEmail = async (name, email) => {
  // Skip email if disabled
  if (process.env.ENABLE_EMAIL === 'false') {
    console.log(`⏭️  Email disabled - skipping login notification email for ${email}`);
    return;
  }

  try {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Security Alert - Heer Enterprise",
      html: `
        <div style="font-family: 'Playfair Display', serif, Arial; max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden;">
          <div style="background: #111; padding: 30px 20px; text-align: center;">
            <h1 style="color: #c5a059; margin: 0; font-size: 24px; text-transform: uppercase;">Login Notification</h1>
          </div>
          <div style="padding: 30px; background-color: #ffffff;">
            <p style="color: #111; font-size: 16px;">Hi <strong>${name}</strong>,</p>
            <p style="color: #444; line-height: 1.8;">
              We've detected a new login to your <strong>Heer Enterprise</strong> account. If this was you, you can safely ignore this email.
            </p>
            <p style="color: #999; font-size: 12px; margin-top: 20px;">
              <strong>Login Details:</strong><br>
              Date: ${new Date().toLocaleString()}<br>
              Account: ${email}
            </p>
            <p style="color: #999; font-size: 12px; text-align: center; margin-top: 20px;">
              If you didn't log in, please change your password right away.
            </p>
          </div>
          <div style="background-color: #111; padding: 20px; text-align: center; font-size: 12px; color: #888;">
            <p style="margin: 0;">© 2026 Heer Enterprise. All rights reserved.</p>
          </div>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log(`Login notification email sent to ${email}`);
  } catch (error) {
    console.error("Error sending login notification email:", error);
    throw error;
  }
};

// Send Order Confirmation Email
export const sendOrderConfirmationEmail = async (name, email, orderId, orderItems, totalPrice) => {
  // Skip email if disabled
  if (process.env.ENABLE_EMAIL === 'false') {
    console.log(`⏭️  Email disabled - skipping order confirmation email for ${email}`);
    return;
  }

  try {
    const itemsHTML = orderItems
      .map(
        (item) => `
        <tr style="border-bottom: 1px solid #ddd;">
          <td style="padding: 12px; text-align: left;">${item.name}</td>
          <td style="padding: 12px; text-align: center;">${item.qty}</td>
          <td style="padding: 12px; text-align: right;">₹${item.price.toFixed(2)}</td>
          <td style="padding: 12px; text-align: right;">₹${(item.qty * item.price).toFixed(2)}</td>
        </tr>
      `
      )
      .join("");

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: `Order Confirmed - Heer Enterprise #${orderId}`,
      html: `
        <div style="font-family: 'Playfair Display', serif, Arial; max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden;">
          <div style="background: #111; padding: 40px 20px; text-align: center;">
            <h1 style="color: #c5a059; margin: 0; font-size: 28px; letter-spacing: 2px; text-transform: uppercase;">Order Confirmed</h1>
            <p style="color: #888; margin-top: 10px; font-size: 14px;">Thank you for shopping with Heer Enterprise</p>
          </div>
          <div style="padding: 40px; background-color: #ffffff;">
            <p style="color: #111; font-size: 18px; margin-bottom: 20px;">Hi <strong>${name}</strong>,</p>
            <p style="color: #444; line-height: 1.8; font-size: 15px;">
              Your order has been successfully placed! We're preparing your items with care and will notify you as soon as they're on their way.
            </p>
            
            <div style="background-color: white; padding: 15px; border-radius: 5px; margin: 20px 0; border: 1px solid #ddd;">
              <p style="color: #333; font-weight: bold; margin: 0 0 10px 0;">Order Details</p>
              <p style="color: #666; margin: 5px 0;"><strong>Order ID:</strong> ${orderId}</p>
              <p style="color: #666; margin: 5px 0;"><strong>Order Date:</strong> ${new Date().toLocaleDateString()}</p>
            </div>

            <p style="color: #333; font-weight: bold; margin: 20px 0 10px 0;">Items Ordered:</p>
            <table style="width: 100%; border-collapse: collapse; background-color: white; border-radius: 5px; overflow: hidden;">
              <thead>
                <tr style="background-color: #f0f0f0; border-bottom: 2px solid #ddd;">
                  <th style="padding: 12px; text-align: left;">Product</th>
                  <th style="padding: 12px; text-align: center;">Qty</th>
                  <th style="padding: 12px; text-align: right;">Price</th>
                  <th style="padding: 12px; text-align: right;">Total</th>
                </tr>
              </thead>
              <tbody>
                ${itemsHTML}
              </tbody>
            </table>

            <div style="background-color: white; padding: 15px; border-radius: 5px; margin: 20px 0; border: 1px solid #ddd; text-align: right;">
              <p style="color: #333; font-size: 18px; font-weight: bold; margin: 0;">
                Total: <span style="color: #667eea;">₹${totalPrice.toFixed(2)}</span>
              </p>
            </div>

            <div style="margin: 40px 0; text-align: center;">
              <a href="${process.env.FRONTEND_URL || "http://localhost:5173"}/orders/${orderId}" style="background-color: #c5a059; color: white; padding: 15px 40px; text-decoration: none; border-radius: 4px; font-weight: bold; display: inline-block; text-transform: uppercase; letter-spacing: 1px;">
                View Order Status
              </a>
            </div>

            <p style="color: #888; font-size: 13px; margin-top: 30px; text-align: center; font-style: italic;">
              If you have any questions, please reply to this email or visit our website.
            </p>
          </div>
          <div style="background-color: #111; padding: 20px; text-align: center; font-size: 12px; color: #888;">
            <p style="margin: 0;">© 2026 Heer Enterprise. All rights reserved.</p>
          </div>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log(`Order confirmation email sent to ${email}`);
  } catch (error) {
    console.error("Error sending order confirmation email:", error);
    throw error;
  }
};
