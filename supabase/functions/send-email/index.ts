import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import {
  welcomeEmail,
  confirmationEmail,
  alertEmail,
  passwordResetEmail,
  projectUpdateEmail,
  waitlistEmail,
  type WelcomeEmailOptions,
  type ConfirmationEmailOptions,
  type AlertEmailOptions,
  type PasswordResetEmailOptions,
  type ProjectUpdateEmailOptions,
  type WaitlistEmailOptions,
} from "../_shared/email-templates.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type TemplateType = 'welcome' | 'confirmation' | 'alert' | 'password-reset' | 'project-update' | 'waitlist' | 'custom';

interface EmailRequest {
  to: string | string[];
  subject: string;
  template?: TemplateType;
  templateData?: WelcomeEmailOptions | ConfirmationEmailOptions | AlertEmailOptions | PasswordResetEmailOptions | ProjectUpdateEmailOptions | WaitlistEmailOptions;
  html?: string;
  from?: string;
}

const getEmailHtml = (template: TemplateType | undefined, templateData: any, customHtml?: string): string => {
  if (!template || template === 'custom') {
    if (!customHtml) throw new Error("HTML content is required for custom emails");
    return customHtml;
  }

  switch (template) {
    case 'welcome':
      return welcomeEmail(templateData as WelcomeEmailOptions);
    case 'confirmation':
      return confirmationEmail(templateData as ConfirmationEmailOptions);
    case 'alert':
      return alertEmail(templateData as AlertEmailOptions);
    case 'password-reset':
      return passwordResetEmail(templateData as PasswordResetEmailOptions);
    case 'project-update':
      return projectUpdateEmail(templateData as ProjectUpdateEmailOptions);
    case 'waitlist':
      return waitlistEmail(templateData as WaitlistEmailOptions);
    default:
      throw new Error(`Unknown template type: ${template}`);
  }
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { to, subject, template, templateData, html, from }: EmailRequest = await req.json();

    if (!to || !subject) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: to, subject" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const emailHtml = getEmailHtml(template, templateData, html);

    console.log(`Sending ${template || 'custom'} email to: ${to}, subject: ${subject}`);

    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY is not configured");
    }

    // Try with custom domain first, fallback to resend.dev
    const emailFrom = from || "SpecMaster <noreply@notifications.specmaster.app>";
    const fallbackFrom = "SpecMaster <onboarding@resend.dev>";

    let response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: emailFrom,
        to: Array.isArray(to) ? to : [to],
        subject,
        html: emailHtml,
      }),
    });

    let emailResponse = await response.json();

    // If 403 (likely domain not verified), retry with fallback domain
    if (response.status === 403) {
      console.warn(`Failed with custom domain (${emailFrom}), trying fallback domain...`);
      
      response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: fallbackFrom,
          to: Array.isArray(to) ? to : [to],
          subject,
          html: emailHtml,
        }),
      });
      
      emailResponse = await response.json();
    }

    if (!response.ok) {
      console.error("Resend API error:", emailResponse);
      return new Response(
        JSON.stringify({ error: emailResponse.message || "Failed to send email" }),
        { status: response.status, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log("Email sent successfully:", emailResponse);

    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error in send-email function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
