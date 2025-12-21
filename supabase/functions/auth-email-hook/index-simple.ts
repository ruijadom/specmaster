import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

// Versão simplificada para debug - apenas retorna sucesso sem enviar email
serve(async (req) => {
  console.log("=== Simple Auth Hook Test ===");
  console.log("Method:", req.method);
  
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    const payload = await req.text();
    console.log("Payload received, length:", payload.length);
    
    // Parse the payload to see what we're getting
    const data = JSON.parse(payload);
    console.log("User email:", data?.user?.email);
    console.log("Email action type:", data?.email_data?.email_action_type);
    
    // Just return success without sending email
    console.log("✅ Returning success");
    return new Response(JSON.stringify({}), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("❌ Error:", error.message);
    return new Response(
      JSON.stringify({
        error: {
          http_code: 500,
          message: error.message,
        },
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
});
