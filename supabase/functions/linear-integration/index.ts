import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface LinearIntegration {
  linear_api_token: string;
  linear_team_id?: string;
  linear_team_name?: string;
}

// Valid action types
const VALID_ACTIONS = ['test_connection', 'list_teams', 'create_team', 'create_issues', 'check_sync'];

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Use ANON_KEY with user's auth header instead of SERVICE_ROLE_KEY
    // This ensures RLS policies are enforced for all database operations
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create client with user's auth token to enforce RLS
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: { Authorization: authHeader },
      },
    });

    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      console.error('Authentication failed:', userError?.message);
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('User authenticated:', user.id);

    const { data: integration, error: integrationError } = await supabase
      .from('linear_integrations')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (integrationError || !integration) {
      return new Response(
        JSON.stringify({ error: 'Linear integration not configured' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const requestUrl = new URL(req.url);
    let action = requestUrl.searchParams.get('action');
    let stories: any[] = [];
    let teamId: string | undefined;
    let teamName: string | undefined;
    let teamKey: string | undefined;

    if (!req.bodyUsed && req.method !== 'OPTIONS') {
      try {
        const body = await req.json();
        console.log('Linear integration: parsed body action:', body.action);
        action = (body.action as string) ?? action;
        stories = (body.stories as any[]) ?? stories;
        teamId = (body.teamId as string | undefined) ?? teamId;
        teamName = (body.teamName as string | undefined) ?? teamName;
        teamKey = (body.teamKey as string | undefined) ?? teamKey;
      } catch (parseError) {
        console.error('Linear integration: failed to parse JSON body', parseError);
      }
    } else {
      console.log('Linear integration: skipping req.json(), bodyUsed =', (req as any).bodyUsed);
    }

    // Validate action
    if (!action || !VALID_ACTIONS.includes(action)) {
      return new Response(
        JSON.stringify({ error: `Invalid action. Must be one of: ${VALID_ACTIONS.join(', ')}` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate teamName and teamKey lengths if provided
    if (teamName && (teamName.length < 1 || teamName.length > 100)) {
      return new Response(
        JSON.stringify({ error: 'Team name must be between 1 and 100 characters' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (teamKey && (teamKey.length < 1 || teamKey.length > 10)) {
      return new Response(
        JSON.stringify({ error: 'Team key must be between 1 and 10 characters' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate stories array
    if (stories && !Array.isArray(stories)) {
      return new Response(
        JSON.stringify({ error: 'Stories must be an array' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (stories && stories.length > 100) {
      return new Response(
        JSON.stringify({ error: 'Maximum 100 stories allowed per request' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const apiToken = integration.linear_api_token;

    switch (action) {
      case 'test_connection': {
        console.log('Testing Linear connection...');
        
        const query = `
          query {
            viewer {
              id
              name
              email
            }
          }
        `;

        const response = await fetch('https://api.linear.app/graphql', {
          method: 'POST',
          headers: {
            'Authorization': apiToken,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ query }),
        });

        const result = await response.json();
        
        if (result.errors) {
          throw new Error(result.errors[0].message);
        }

        console.log('Connection successful:', result.data.viewer);

        return new Response(
          JSON.stringify({ user: result.data.viewer }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'list_teams': {
        console.log('Fetching Linear teams...');
        
        const query = `
          query {
            teams {
              nodes {
                id
                name
                key
              }
            }
          }
        `;

        const response = await fetch('https://api.linear.app/graphql', {
          method: 'POST',
          headers: {
            'Authorization': apiToken,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ query }),
        });

        const result = await response.json();
        
        if (result.errors) {
          throw new Error(result.errors[0].message);
        }

        console.log(`Found ${result.data.teams.nodes.length} teams`);

        return new Response(
          JSON.stringify({ teams: result.data.teams.nodes }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'create_team': {
        if (!teamName || !teamKey) {
          return new Response(
            JSON.stringify({ error: 'Team name and key are required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        console.log(`Creating new Linear team: ${teamName} (${teamKey})`);

        // First check if team with same key already exists
        const checkQuery = `
          query {
            teams {
              nodes {
                id
                key
                name
              }
            }
          }
        `;

        const checkResponse = await fetch('https://api.linear.app/graphql', {
          method: 'POST',
          headers: {
            'Authorization': apiToken,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ query: checkQuery }),
        });

        const checkResult = await checkResponse.json();
        
        if (checkResult.errors) {
          throw new Error(checkResult.errors[0].message);
        }

        const existingTeams = checkResult.data.teams.nodes;
        const duplicateKey = existingTeams.find((t: any) => t.key.toLowerCase() === teamKey.toLowerCase());
        const duplicateName = existingTeams.find((t: any) => t.name.toLowerCase() === teamName.toLowerCase());

        if (duplicateKey) {
          return new Response(
            JSON.stringify({ 
              error: 'DUPLICATE_KEY',
              message: `A team with key "${duplicateKey.key}" already exists`
            }),
            { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        if (duplicateName) {
          return new Response(
            JSON.stringify({ 
              error: 'DUPLICATE_NAME',
              message: `A team with name "${duplicateName.name}" already exists`
            }),
            { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Create the team
        const mutation = `
          mutation CreateTeam($input: TeamCreateInput!) {
            teamCreate(input: $input) {
              success
              team {
                id
                key
                name
              }
            }
          }
        `;

        const variables = {
          input: {
            name: teamName,
            key: teamKey.toUpperCase(),
          }
        };

        const response = await fetch('https://api.linear.app/graphql', {
          method: 'POST',
          headers: {
            'Authorization': apiToken,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ query: mutation, variables }),
        });

        const result = await response.json();
        
        if (result.errors) {
          console.error('Failed to create team:', result.errors[0].message);
          return new Response(
            JSON.stringify({ error: result.errors[0].message }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        console.log('Team created successfully:', result.data.teamCreate.team);

        return new Response(
          JSON.stringify({ 
            success: true,
            team: result.data.teamCreate.team 
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'create_issues': {
        const targetTeamId = teamId || integration.linear_team_id;

        if (!targetTeamId) {
          throw new Error('No team specified');
        }

        console.log(`Creating ${stories.length} issues in Linear team: ${targetTeamId}`);

        const results = [];
        
        for (const story of stories) {
          const title = story.title || story.summary || story.name;
          const description = story.description || story.acceptance_criteria || '';

          // Validate title
          if (!title || typeof title !== 'string' || title.length > 500) {
            results.push({ title: title || 'Unknown', success: false, error: 'Invalid or too long title' });
            continue;
          }

          console.log(`Creating issue: "${title}"`);

          const mutation = `
            mutation CreateIssue($input: IssueCreateInput!) {
              issueCreate(input: $input) {
                success
                issue {
                  id
                  identifier
                  title
                }
              }
            }
          `;

          const variables = {
            input: {
              teamId: targetTeamId,
              title: title.substring(0, 500),
              description: typeof description === 'string' ? description.substring(0, 10000) : '',
            }
          };

          const response = await fetch('https://api.linear.app/graphql', {
            method: 'POST',
            headers: {
              'Authorization': apiToken,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ query: mutation, variables }),
          });

          const result = await response.json();
          
          if (result.errors) {
            console.error(`Failed to create issue "${title}":`, result.errors[0].message);
            results.push({ title, success: false, error: result.errors[0].message });
          } else {
            console.log(`Created issue: ${result.data.issueCreate.issue.identifier}`);
            results.push({ 
              title, 
              success: true, 
              issue: result.data.issueCreate.issue 
            });
          }
        }

        const successCount = results.filter(r => r.success).length;
        console.log(`Created ${successCount}/${stories.length} issues`);

        return new Response(
          JSON.stringify({ 
            created: successCount, 
            total: stories.length,
            results 
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'check_sync': {
        const targetTeamId = teamId || integration.linear_team_id;

        if (!targetTeamId) {
          throw new Error('No team specified');
        }

        console.log(`Checking sync for team: ${targetTeamId}`);
        console.log(`Comparing ${stories.length} stories`);

        // Fetch all issues from the team
        const query = `
          query GetTeamIssues($teamId: String!) {
            team(id: $teamId) {
              issues {
                nodes {
                  id
                  identifier
                  title
                  state {
                    name
                  }
                }
              }
            }
          }
        `;

        const response = await fetch('https://api.linear.app/graphql', {
          method: 'POST',
          headers: {
            'Authorization': apiToken,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            query, 
            variables: { teamId: targetTeamId } 
          }),
        });

        const result = await response.json();
        
        if (result.errors) {
          throw new Error(result.errors[0].message);
        }

        const linearIssues = result.data.team.issues.nodes;
        console.log(`Found ${linearIssues.length} Linear issues`);

        // Map Linear issues by title
        interface LinearIssue {
          id: string;
          identifier: string;
          title: string;
          state: {
            name: string;
          };
        }

        const issueMap = new Map(
          linearIssues.map((issue: LinearIssue) => [
            issue.title.toLowerCase().trim(),
            issue
          ])
        );

        // Compare stories with Linear issues
        const syncStatus = stories.map((story: any) => {
          const title = (story.title || story.summary || story.name || '').trim();
          const matchedIssue = issueMap.get(title.toLowerCase()) as LinearIssue | undefined;

          if (matchedIssue) {
            console.log(`Story "${title}" -> MATCH: ${matchedIssue.identifier}`);
            return {
              title,
              synced: true,
              linearKey: matchedIssue.identifier,
              linearStatus: matchedIssue.state.name,
            };
          } else {
            console.log(`Story "${title}" -> NOT SYNCED`);
            return {
              title,
              synced: false,
            };
          }
        });

        const syncedCount = syncStatus.filter((s: any) => s.synced).length;
        const notSyncedCount = syncStatus.filter((s: any) => !s.synced).length;

        console.log(`Sync comparison complete: { totalStories: ${stories.length}, syncedCount: ${syncedCount}, notSyncedCount: ${notSyncedCount} }`);

        return new Response(
          JSON.stringify({ 
            syncStatus,
            syncedCount,
            notSyncedCount,
            totalCount: stories.length
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      default:
        return new Response(
          JSON.stringify({ error: 'Invalid action' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
  } catch (error: any) {
    console.error('Error in linear-integration function:', error);
    return new Response(
      JSON.stringify({ error: error?.message || 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
