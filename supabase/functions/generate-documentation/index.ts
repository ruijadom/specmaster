import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { AI_PROVIDER, getProviderConfig } from "../_shared/ai-config.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Valid phase types
const VALID_PHASE_TYPES = ['project-brief', 'prd', 'ux-spec', 'architecture', 'backlog'];

// UUID validation regex
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, phase_type, project_id, custom_prompt } = await req.json();
    
    // Input validation
    // Validate project_id format
    if (!project_id || typeof project_id !== 'string' || !UUID_REGEX.test(project_id)) {
      return new Response(
        JSON.stringify({ error: 'Invalid project_id. Must be a valid UUID.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate phase_type
    if (!phase_type || !VALID_PHASE_TYPES.includes(phase_type)) {
      return new Response(
        JSON.stringify({ error: `Invalid phase_type. Must be one of: ${VALID_PHASE_TYPES.join(', ')}` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate messages array
    if (!Array.isArray(messages) || messages.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Messages must be a non-empty array.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Limit messages count
    if (messages.length > 200) {
      return new Response(
        JSON.stringify({ error: 'Too many messages. Maximum is 200.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate custom_prompt length if provided
    if (custom_prompt && (typeof custom_prompt !== 'string' || custom_prompt.length > 5000)) {
      return new Response(
        JSON.stringify({ error: 'Custom prompt must be a string with maximum 5000 characters.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate message structure
    for (const msg of messages) {
      if (!msg || typeof msg !== 'object' || !msg.role || !msg.content) {
        return new Response(
          JSON.stringify({ error: 'Each message must have role and content properties.' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (!['user', 'assistant', 'system'].includes(msg.role)) {
        return new Response(
          JSON.stringify({ error: 'Message role must be user, assistant, or system.' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (typeof msg.content !== 'string' || msg.content.length > 50000) {
        return new Response(
          JSON.stringify({ error: 'Message content must be a string with maximum 50000 characters.' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    // Get provider configuration
    const providerConfig = getProviderConfig(AI_PROVIDER);
    const apiKey = Deno.env.get(providerConfig.secretKey);
    
    if (!apiKey) {
      throw new Error(`${providerConfig.secretKey} is not configured for provider: ${AI_PROVIDER}`);
    }

    // Authenticate user if auth header is present
    const authHeader = req.headers.get('Authorization');
    let userId: string | null = null;
    
    if (authHeader) {
      const userClient = createClient(SUPABASE_URL!, SUPABASE_ANON_KEY!);
      const token = authHeader.replace('Bearer ', '');
      const { data: userData, error: userError } = await userClient.auth.getUser(token);
      
      if (!userError && userData.user) {
        userId = userData.user.id;
        console.log('User authenticated:', userId);
      }
    }

    // Use service role client for database operations
    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    // System prompts for each phase type
    const systemPrompts: Record<string, string> = {
      'project-brief': `You are a Business Analyst. Analyze the conversation and extract a structured project brief in JSON format with these fields:
{
  "project_name": "string",
  "executive_summary": "string (2-3 paragraphs)",
  "business_objectives": "array of strings (list of objectives)",
  "target_audience": "string",
  "pain_points": "array of strings (specific user pain points and problems identified)",
  "market_research": "string (market analysis, competitive landscape, and opportunities)",
  "key_features": "array of strings (list of features)",
  "success_criteria": "string",
  "constraints": "string"
}`,
      'prd': `You are a Product Manager. Analyze the conversation and extract a structured PRD in JSON format with these fields:
{
  "product_vision": "string",
  "user_personas": "string",
  "user_stories": "string (list of user stories)",
  "functional_requirements": "string (detailed list)",
  "non_functional_requirements": "string",
  "success_metrics": "string",
  "roadmap": "string"
}`,
      'ux-spec': `You are a UX Designer. Analyze the conversation and extract a structured UX specification in JSON format with these fields:
{
  "design_principles": "string",
  "user_flows": "string (detailed user journey maps)",
  "wireframes_description": "string",
  "interaction_patterns": "string",
  "accessibility_requirements": "string",
  "design_system": "string",
  "usability_testing_plan": "string"
}`,
      'architecture': `You are a Technical Architect. Analyze the conversation and extract a structured architecture document in JSON format with these fields:
{
  "system_overview": "string",
  "technology_stack": "string (list with justification)",
  "architecture_diagram_description": "string",
  "data_model": "string",
  "api_design": "string",
  "security_considerations": "string",
  "scalability_plan": "string"
}`,
      'backlog': `You are a Scrum Master. Analyze the conversation and extract a structured backlog in JSON format with these fields:
{
  "sprint_structure": "string",
  "user_stories": "array of objects with {id, title, description, priority, story_points, acceptance_criteria}",
  "sprint_1": "string (list of story IDs)",
  "sprint_2": "string (list of story IDs)",
  "technical_debt": "string",
  "definition_of_done": "string"
}`
    };

    console.log(`Generating documentation for phase: ${phase_type}, project: ${project_id}${custom_prompt ? ' with custom instructions' : ''}`);

    // Check if the agent already generated a formatted document in the conversation
    const assistantMessages = messages.filter((m: any) => m.role === 'assistant');
    let hasFormattedDoc = false;
    let formattedDocContent = '';
    
    // Look for documents with specific phase markers
    const phaseMarkers: Record<string, string[]> = {
      'project-brief': ['Project Brief:', 'Sumário Executivo', 'Objetivos de Negócio', 'AAVANCA'],
      'prd': ['Product Requirements', 'PRD', 'Functional Requirements', 'User Stories'],
      'ux-spec': ['UX Specification', 'User Flow', 'Wireframe', 'Design System', 'Interaction', 'Accessibility'],
      'architecture': ['Architecture', 'Technology Stack', 'System Design', 'Data Model'],
      'backlog': ['Backlog', 'Sprint', 'User Stories', 'Story Points']
    };
    
    const markers = phaseMarkers[phase_type] || [];
    
    // Search from most recent to oldest messages
    for (let i = assistantMessages.length - 1; i >= 0; i--) {
      const msg = assistantMessages[i];
      
      // Skip introduction messages (they often have "Hello", "I'm", "My role", etc.)
      const isIntroduction = msg.content.includes('Hello') || 
                            msg.content.includes("I'm") || 
                            msg.content.includes('My role') ||
                            msg.content.includes('working with you') ||
                            msg.content.includes("Here's what I'll be focusing on");
      
      if (isIntroduction) {
        console.log(`Skipping introduction message at index ${i}`);
        continue;
      }
      
      // Check if message has sufficient length and contains phase-specific markers
      if (msg.content.length > 2000) { // Increased from 1000 to ensure we get substantial documents
        let markerCount = 0;
        for (const marker of markers) {
          if (msg.content.includes(marker)) {
            markerCount++;
          }
        }
        
        // Count substantial numbered sections (should have multiple)
        const numberedSections = (msg.content.match(/\n\d+\.\s+[A-Z]/g) || []).length;
        
        // If we found at least 2 markers, has multiple numbered sections, and looks like documentation
        if (markerCount >= 2 && 
            numberedSections >= 3 &&
            !msg.content.includes('Por favor') &&
            !msg.content.includes('próxim') &&
            !msg.content.toLowerCase().includes('pergunta') &&
            !msg.content.toLowerCase().includes('let\'s start by discussing')) {
          hasFormattedDoc = true;
          formattedDocContent = msg.content;
          console.log(`Found formatted document at message index ${i} with ${markerCount} markers and ${numberedSections} sections`);
          break;
        }
      }
    }

    // If we found a formatted document and no custom prompt, use it directly
    if (hasFormattedDoc && !custom_prompt) {
      console.log('Using formatted document from conversation');
      
      const structuredContent = {
        type: 'formatted_document',
        content: formattedDocContent
      };

      // Save to project_phases table
      const { data: existingPhase, error: existingError } = await supabase
        .from('project_phases')
        .select('id')
        .eq('project_id', project_id)
        .eq('phase_type', phase_type)
        .maybeSingle();

      if (existingError) {
        console.error('Error fetching existing phase:', existingError);
        throw existingError;
      }

      if (existingPhase) {
        const { error: updateError } = await supabase
          .from('project_phases')
          .update({
            content: structuredContent,
            completed: true,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingPhase.id);

        if (updateError) {
          console.error('Error updating phase:', updateError);
          throw updateError;
        }
      } else {
        const { error: insertError } = await supabase
          .from('project_phases')
          .insert({
            project_id,
            phase_type,
            content: structuredContent,
            completed: true
          });

        if (insertError) {
          console.error('Error inserting phase:', insertError);
          throw insertError;
        }
      }

      // Increment document usage for authenticated user
      if (userId) {
        const { error: usageError } = await supabase.rpc('increment_document_usage', { p_user_id: userId });
        if (usageError) {
          console.error('Error incrementing document usage:', usageError);
        } else {
          console.log('Document usage incremented for user:', userId);
        }
      }

      return new Response(JSON.stringify({ success: true, content: structuredContent }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Otherwise, use AI to generate/extract structured documentation
    const userPrompt = custom_prompt 
      ? `Based on this conversation, generate the documentation with these specific instructions: ${custom_prompt}\n\nConversation:\n\n${messages.map((m: any) => `${m.role}: ${m.content}`).join('\n\n')}`
      : `Based on this conversation, generate the documentation:\n\n${messages.map((m: any) => `${m.role}: ${m.content}`).join('\n\n')}`;

    console.log(`Using AI provider: ${AI_PROVIDER}`);

    let response;
    if (AI_PROVIDER === 'gemini') {
      // Gemini uses a different API format
      response = await fetch(providerConfig.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': apiKey,
        },
        body: JSON.stringify({
          contents: [
            { role: 'user', parts: [{ text: systemPrompts[phase_type] || systemPrompts['project-brief'] }] },
            { role: 'user', parts: [{ text: userPrompt }] }
          ],
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
          },
        }),
      });
    } else {
      // OpenAI and Lovable AI use the same format
      response = await fetch(providerConfig.endpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: providerConfig.model,
          messages: [
            { role: 'system', content: systemPrompts[phase_type] || systemPrompts['project-brief'] },
            { role: 'user', content: userPrompt }
          ],
          temperature: 0.7,
        }),
      });
    }

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      return new Response(JSON.stringify({ error: 'AI gateway error' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const result = await response.json();
    let content;
    
    if (AI_PROVIDER === 'gemini') {
      // Gemini response format
      content = result.candidates?.[0]?.content?.parts?.[0]?.text || '';
    } else {
      // OpenAI/Lovable format
      content = result.choices[0].message.content;
    }
    
    // Try to extract JSON from the response
    let structuredContent;
    try {
      const jsonMatch = content.match(/```json\n([\s\S]*?)\n```/) || content.match(/\{[\s\S]*\}/);
      structuredContent = jsonMatch ? JSON.parse(jsonMatch[1] || jsonMatch[0]) : { raw: content };
    } catch {
      structuredContent = { raw: content };
    }

    // Save to project_phases table
    const { data: existingPhase, error: existingError } = await supabase
      .from('project_phases')
      .select('id')
      .eq('project_id', project_id)
      .eq('phase_type', phase_type)
      .maybeSingle();

    if (existingError) {
      console.error('Error fetching existing phase:', existingError);
      throw existingError;
    }

    if (existingPhase) {
      // Update existing phase
      const { error: updateError } = await supabase
        .from('project_phases')
        .update({
          content: structuredContent,
          completed: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingPhase.id);

      if (updateError) {
        console.error('Error updating phase:', updateError);
        throw updateError;
      }
    } else {
      // Create new phase
      const { error: insertError } = await supabase
        .from('project_phases')
        .insert({
          project_id,
          phase_type,
          content: structuredContent,
          completed: true
        });

      if (insertError) {
        console.error('Error inserting phase:', insertError);
        throw insertError;
      }
    }

    // Increment document usage for authenticated user
    if (userId) {
      const { error: usageError } = await supabase.rpc('increment_document_usage', { p_user_id: userId });
      if (usageError) {
        console.error('Error incrementing document usage:', usageError);
      } else {
        console.log('Document usage incremented for user:', userId);
      }
    }

    return new Response(JSON.stringify({ success: true, content: structuredContent }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in generate-documentation function:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
