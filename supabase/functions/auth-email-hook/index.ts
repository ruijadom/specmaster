import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const resend = new Resend(RESEND_API_KEY as string);

// Base styles matching the app design
const baseStyles = `
  body { 
    margin: 0; 
    padding: 0; 
    font-family: -apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', 'Roboto', sans-serif; 
    background-color: #0f0f14;
  }
  .container { 
    max-width: 600px; 
    margin: 0 auto; 
    background-color: #18181d;
    border-radius: 12px;
    overflow: hidden;
  }
  .header { 
    background: linear-gradient(135deg, #8B5CF6 0%, #A78BFA 100%); 
    padding: 48px 40px; 
    text-align: center;
  }
  .logo { 
    color: #ffffff; 
    margin: 0 0 8px; 
    font-size: 24px; 
    font-weight: 700;
  }
  .header h1 { 
    color: #ffffff; 
    margin: 0; 
    font-size: 28px; 
    font-weight: 600;
  }
  .content { 
    padding: 40px; 
    color: #e4e4e7;
  }
  .button { 
    display: inline-block; 
    background: linear-gradient(135deg, #8B5CF6 0%, #A78BFA 100%); 
    color: #ffffff !important; 
    text-decoration: none; 
    padding: 14px 32px; 
    border-radius: 8px; 
    font-weight: 600; 
    font-size: 15px; 
    margin: 24px 0;
  }
  .code { 
    background-color: rgba(139, 92, 246, 0.1); 
    padding: 16px 24px; 
    border-radius: 8px; 
    font-family: monospace; 
    font-size: 24px; 
    letter-spacing: 4px; 
    text-align: center; 
    color: #fafafa; 
    margin: 20px 0;
  }
  .footer { 
    background-color: #0f0f14; 
    padding: 32px 40px; 
    text-align: center;
  }
  .footer p { 
    color: #71717a; 
    font-size: 13px; 
    margin: 0;
  }
`;

const getEmailTemplate = (type: string, data: unknown) => {
  const confirmationLink = `${data.supabase_url}/auth/v1/verify?token=${data.token_hash}&type=${type}&redirect_to=${data.redirect_to}`;

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Confirm Your Email - SpecMaster</title>
  <style>${baseStyles}</style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">specmaster</div>
      <h1>Welcome to SpecMaster! 🚀</h1>
    </div>
    <div class="content">
      <p>Hello!</p>
      <p>Thank you for signing up. Please confirm your email by clicking the button below:</p>
      
      <div style="text-align: center;">
        <a href="${confirmationLink}" class="button">Confirm Email</a>
      </div>
      
      <p>Or use this confirmation code:</p>
      <div class="code">${data.token}</div>
      
      <p style="font-size: 13px; color: #71717a; margin-top: 32px;">
        If you didn't create an account, you can safely ignore this email.
      </p>
    </div>
    <div class="footer">
      <p>© ${new Date().getFullYear()} SpecMaster. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
  `;
};

serve(async (req) => {
  console.log("=== Auth Email Hook ===");
  
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    const payload = await req.text();
    const data = JSON.parse(payload);
    
    console.log("User email:", data?.user?.email);
    console.log("Email action type:", data?.email_data?.email_action_type);
    
    const { user, email_data } = data;
    const { token, token_hash, redirect_to, email_action_type } = email_data;
    
    if (!RESEND_API_KEY) {
      console.error("RESEND_API_KEY not configured");
      return new Response(
        JSON.stringify({ error: { http_code: 500, message: "Email service not configured" } }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }
    
    console.log("Generating email template...");
    const html = getEmailTemplate(email_action_type, {
      token,
      token_hash,
      redirect_to,
      supabase_url: Deno.env.get("SUPABASE_URL") ?? "",
      email: user.email,
    });
    
    console.log("Sending email via Resend...");
    const { error } = await resend.emails.send({
      from: "SpecMaster <onboarding@resend.dev>",
      to: [user.email],
      subject: "Confirm Your Email - SpecMaster",
      html: html,
    });

    if (error) {
      console.error("Resend error:", JSON.stringify(error));
      return new Response(
        JSON.stringify({ error: { http_code: 500, message: `Email send failed: ${error.message}` } }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    console.log("✅ Email sent successfully to", user.email);
    return new Response(JSON.stringify({}), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    console.error("❌ Error:", error.message);
    console.error("Stack:", error.stack);
    return new Response(
      JSON.stringify({ error: { http_code: 500, message: error.message } }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});
