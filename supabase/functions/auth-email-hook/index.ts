import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Webhook } from "https://esm.sh/standardwebhooks@1.0.0";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY") as string);
const hookSecret = Deno.env.get("SEND_EMAIL_HOOK_SECRET") as string;

// Base styles matching the app design
const baseStyles = `
  body { 
    margin: 0; 
    padding: 0; 
    font-family: -apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', 'Roboto', sans-serif; 
    background-color: #0f0f14;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }
  .wrapper { 
    background-color: #0f0f14; 
    padding: 40px 20px; 
  }
  .container { 
    max-width: 600px; 
    margin: 0 auto; 
    background-color: #18181d;
    border-radius: 12px;
    overflow: hidden;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.5);
  }
  .header { 
    background: linear-gradient(135deg, #8B5CF6 0%, #A78BFA 100%); 
    padding: 48px 40px; 
    text-align: center;
    position: relative;
  }
  .header::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 1px;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
  }
  .logo { 
    color: #ffffff; 
    margin: 0 0 8px; 
    font-size: 24px; 
    font-weight: 700;
    letter-spacing: -0.5px;
  }
  .header h1 { 
    color: #ffffff; 
    margin: 0; 
    font-size: 28px; 
    font-weight: 600;
    letter-spacing: -0.5px;
  }
  .header p { 
    color: rgba(255,255,255,0.85); 
    margin: 12px 0 0; 
    font-size: 15px;
    font-weight: 400;
  }
  .content { 
    padding: 40px; 
    color: #e4e4e7;
  }
  .content h2 { 
    color: #fafafa; 
    margin: 0 0 24px; 
    font-size: 22px;
    font-weight: 600;
    letter-spacing: -0.5px;
  }
  .content p { 
    color: #a1a1aa; 
    line-height: 1.7; 
    margin: 0 0 16px; 
    font-size: 15px; 
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
    box-shadow: 0 4px 12px rgba(139, 92, 246, 0.3);
  }
  .code { 
    background-color: rgba(139, 92, 246, 0.1); 
    padding: 16px 24px; 
    border-radius: 8px; 
    font-family: 'JetBrains Mono', monospace; 
    font-size: 24px; 
    letter-spacing: 4px; 
    text-align: center; 
    color: #fafafa; 
    margin: 20px 0;
    border: 1px solid rgba(139, 92, 246, 0.2);
  }
  .footer { 
    background-color: #0f0f14; 
    padding: 32px 40px; 
    text-align: center;
    border-top: 1px solid #27272a;
  }
  .footer p { 
    color: #71717a; 
    font-size: 13px; 
    margin: 0 0 8px;
    line-height: 1.6;
  }
  .footer a { 
    color: #A78BFA; 
    text-decoration: none;
  }
  .divider { 
    height: 1px; 
    background: linear-gradient(90deg, transparent, #27272a, transparent);
    margin: 32px 0; 
  }
  .warning-box { 
    background-color: rgba(245, 158, 11, 0.1); 
    border-left: 3px solid #f59e0b; 
    padding: 20px 24px; 
    margin: 24px 0; 
    border-radius: 0 8px 8px 0;
  }
  .warning-box p { color: #fcd34d; margin: 0; }
  .info-box { 
    background-color: rgba(139, 92, 246, 0.1); 
    border-left: 3px solid #8B5CF6; 
    padding: 20px 24px; 
    margin: 24px 0; 
    border-radius: 0 8px 8px 0;
  }
  .info-box p { color: #d4d4d8; margin: 0; }
  strong { color: #fafafa; font-weight: 600; }
`;

const baseLayout = (content: string, headerTitle: string, headerSubtitle?: string) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${headerTitle}</title>
  <style>${baseStyles}</style>
</head>
<body>
  <div class="wrapper">
    <div class="container">
      <div class="header">
        <div class="logo">specmaster</div>
        <h1>${headerTitle}</h1>
        ${headerSubtitle ? `<p>${headerSubtitle}</p>` : ''}
      </div>
      ${content}
      <div class="footer">
        <p>© ${new Date().getFullYear()} SpecMaster. All rights reserved.</p>
        <p><a href="https://specmaster.app">specmaster.app</a></p>
      </div>
    </div>
  </div>
</body>
</html>
`;

// Email templates
const getEmailTemplate = (
  type: string,
  data: {
    token: string;
    token_hash: string;
    redirect_to: string;
    supabase_url: string;
    email: string;
  }
) => {
  const confirmationLink = `${data.supabase_url}/auth/v1/verify?token=${data.token_hash}&type=${type}&redirect_to=${data.redirect_to}`;

  const templates: Record<string, { subject: string; html: string }> = {
    signup: {
      subject: "Confirm Your Email - SpecMaster",
      html: baseLayout(`
        <div class="content">
          <h2>Welcome to SpecMaster! 🚀</h2>
          <p>Hello!</p>
          <p>Thank you for signing up for SpecMaster. To complete your registration and start using our platform, please confirm your email by clicking the button below:</p>
          
          <div style="text-align: center;">
            <a href="${confirmationLink}" class="button">Confirm Email</a>
          </div>
          
          <p>Or use this confirmation code:</p>
          <div class="code">${data.token}</div>
          
          <div class="divider"></div>
          
          <p style="font-size: 13px; color: #71717a;">
            If you didn't create an account on SpecMaster, you can safely ignore this email.
          </p>
        </div>
      `, 'Confirm Your Email', 'Complete your registration'),
    },
    recovery: {
      subject: "Reset Your Password - SpecMaster",
      html: baseLayout(`
        <div class="content">
          <h2>Password Reset 🔐</h2>
          <p>Hello!</p>
          <p>We received a request to reset the password for your SpecMaster account. Click the button below to create a new password:</p>
          
          <div style="text-align: center;">
            <a href="${confirmationLink}" class="button">Reset Password</a>
          </div>
          
          <p>Or use this code:</p>
          <div class="code">${data.token}</div>
          
          <div class="warning-box">
            <p><strong>Important:</strong> This link expires in 1 hour. If you didn't request a password reset, ignore this email.</p>
          </div>
          
          <div class="divider"></div>
          
          <p style="font-size: 13px; color: #71717a;">
            For security, never share this link with anyone.
          </p>
        </div>
      `, 'Password Reset', 'Create a new password'),
    },
    magiclink: {
      subject: "Your Login Link - SpecMaster",
      html: baseLayout(`
        <div class="content">
          <h2>Magic Link ✨</h2>
          <p>Hello!</p>
          <p>Click the button below to access your SpecMaster account without a password:</p>
          
          <div style="text-align: center;">
            <a href="${confirmationLink}" class="button">Access SpecMaster</a>
          </div>
          
          <p>Or use this access code:</p>
          <div class="code">${data.token}</div>
          
          <div class="info-box">
            <p>This link expires in 1 hour.</p>
          </div>
          
          <div class="divider"></div>
          
          <p style="font-size: 13px; color: #71717a;">
            If you didn't request this login, you can safely ignore this email.
          </p>
        </div>
      `, 'Magic Link', 'Passwordless login'),
    },
    email_change: {
      subject: "Confirm Your New Email - SpecMaster",
      html: baseLayout(`
        <div class="content">
          <h2>Email Change 📧</h2>
          <p>Hello!</p>
          <p>You requested to change the email address for your SpecMaster account. Please confirm your new email by clicking the button below:</p>
          
          <div style="text-align: center;">
            <a href="${confirmationLink}" class="button">Confirm New Email</a>
          </div>
          
          <p>Or use this code:</p>
          <div class="code">${data.token}</div>
          
          <div class="warning-box">
            <p><strong>Important:</strong> If you didn't request this change, please contact us immediately.</p>
          </div>
          
          <div class="divider"></div>
          
          <p style="font-size: 13px; color: #71717a;">
            This is a security notification from SpecMaster.
          </p>
        </div>
      `, 'Confirm New Email', 'Verify your email change'),
    },
  };

  return templates[type] || templates.signup;
};

serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const payload = await req.text();
  const headers = Object.fromEntries(req.headers);
  
  console.log("Auth Email Hook called");
  
  const wh = new Webhook(hookSecret);
  
  try {
    const {
      user,
      email_data: { token, token_hash, redirect_to, email_action_type },
    } = wh.verify(payload, headers) as {
      user: {
        email: string;
      };
      email_data: {
        token: string;
        token_hash: string;
        redirect_to: string;
        email_action_type: string;
        site_url: string;
        token_new: string;
        token_hash_new: string;
      };
    };

    console.log(`Sending ${email_action_type} email to ${user.email}`);

    const template = getEmailTemplate(email_action_type, {
      token,
      token_hash,
      redirect_to,
      supabase_url: Deno.env.get("SUPABASE_URL") ?? "",
      email: user.email,
    });

    const { error } = await resend.emails.send({
      from: "SpecMaster <onboarding@resend.dev>",
      to: [user.email],
      subject: template.subject,
      html: template.html,
    });

    if (error) {
      console.error("Resend error:", error);
      throw error;
    }

    console.log(`Email sent successfully to ${user.email}`);

    return new Response(JSON.stringify({}), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Auth Email Hook error:", error);
    return new Response(
      JSON.stringify({
        error: {
          http_code: error.code || 500,
          message: error.message,
        },
      }),
      {
        status: 401,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
});
