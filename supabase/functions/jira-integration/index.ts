import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.84.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface JiraIntegration {
  jira_domain: string;
  jira_email: string;
  jira_api_token: string;
  jira_project_key?: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { action, projectName, projectKey, projectTemplate, ...payload } = await req.json();

    // Get user's Jira integration settings
    const { data: integration, error: integrationError } = await supabase
      .from('jira_integrations')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (integrationError || !integration) {
      // Allow create_project action without full integration (just needs credentials stored)
      if (action !== 'create_project') {
        return new Response(
          JSON.stringify({ error: 'Jira integration not configured' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    const jiraAuth = btoa(`${integration.jira_email}:${integration.jira_api_token}`);
    const jiraBaseUrl = `https://${integration.jira_domain}/rest/api/3`;

    switch (action) {
      case 'list_projects': {
        const response = await fetch(`${jiraBaseUrl}/project/search`, {
          method: 'GET',
          headers: {
            'Authorization': `Basic ${jiraAuth}`,
            'Accept': 'application/json',
          },
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error('Jira API error:', errorText);
          throw new Error(`Failed to fetch projects: ${response.status}`);
        }

        const data = await response.json();
        return new Response(
          JSON.stringify({ projects: data.values }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'test_connection': {
        const response = await fetch(`${jiraBaseUrl}/myself`, {
          method: 'GET',
          headers: {
            'Authorization': `Basic ${jiraAuth}`,
            'Accept': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error('Failed to authenticate with Jira');
        }

        const userData = await response.json();
        return new Response(
          JSON.stringify({ success: true, user: userData }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'create_issues': {
        const { stories, projectKey } = payload;
        const targetProjectKey = projectKey || integration.jira_project_key;

        if (!targetProjectKey) {
          throw new Error('No project key specified');
        }

        const createdIssues = [];
        const errors = [];

        for (const story of stories) {
          try {
            const issueData = {
              fields: {
                project: { key: targetProjectKey },
                summary: story.title || story.summary,
                description: {
                  type: 'doc',
                  version: 1,
                  content: [
                    {
                      type: 'paragraph',
                      content: [
                        {
                          type: 'text',
                          text: story.description || story.acceptanceCriteria || '',
                        },
                      ],
                    },
                  ],
                },
                issuetype: { name: 'Story' },
              },
            };

            const response = await fetch(`${jiraBaseUrl}/issue`, {
              method: 'POST',
              headers: {
                'Authorization': `Basic ${jiraAuth}`,
                'Accept': 'application/json',
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(issueData),
            });

            if (!response.ok) {
              const errorText = await response.text();
              console.error('Failed to create issue:', errorText);
              errors.push({ story: story.title, error: errorText });
              continue;
            }

            const created = await response.json();
            createdIssues.push({
              key: created.key,
              id: created.id,
              summary: story.title || story.summary,
            });
          } catch (error) {
            console.error('Error creating issue:', error);
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            errors.push({ story: story.title, error: errorMessage });
          }
        }

        return new Response(
          JSON.stringify({ 
            success: true, 
            created: createdIssues.length,
            issues: createdIssues,
            errors: errors.length > 0 ? errors : undefined,
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'check_sync': {
        const { stories, projectKey } = payload;
        const targetProjectKey = projectKey || integration.jira_project_key;

        if (!targetProjectKey) {
          throw new Error('No project key specified');
        }

        console.log('Checking sync for project:', targetProjectKey);

        // Fetch all stories from Jira project using the new API endpoint
        const jqlQuery = `project = ${targetProjectKey} AND issuetype = Story ORDER BY created DESC`;
        console.log('JQL Query:', jqlQuery);

        const searchBody = {
          jql: jqlQuery,
          maxResults: 1000,
          fields: ['summary', 'status'],
        };
        
        const response = await fetch(
          `${jiraBaseUrl}/search/jql`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Basic ${jiraAuth}`,
              'Accept': 'application/json',
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(searchBody),
          }
        );

        if (!response.ok) {
          const errorText = await response.text();
          console.error('Jira API error:', {
            status: response.status,
            statusText: response.statusText,
            error: errorText,
            projectKey: targetProjectKey
          });
          throw new Error(`Failed to fetch Jira issues: ${response.status} - ${errorText}`);
        }

        const data = await response.json();
        console.log('Jira API raw response meta:', {
          total: data.total,
          issuesCount: Array.isArray(data.issues) ? data.issues.length : undefined,
        });

        if (!data.issues || !Array.isArray(data.issues)) {
          console.error('Invalid response structure from /search/jql:', data);
          throw new Error('Invalid response from Jira API');
        }

        const jiraIssues = data.issues
          .map((issue: any, idx: number) => {
            const fields = issue.fields || {};
            const summary = fields.summary ?? issue.summary ?? '';
            const statusName =
              fields.status?.name ??
              issue.status?.name ??
              issue.status ??
              'Unknown';

            if (idx < 2) {
              console.log(`Sample issue #${idx}:`, {
                key: issue.key,
                summary,
                status: statusName,
                rawIssue: JSON.stringify(issue).slice(0, 200)
              });
            }

            return {
              key: issue.key || issue.issueKey || issue.id,
              summary: summary.trim(),
              status: statusName,
            };
          })
          .filter((issue: any) => !!issue.summary);

        console.log(`Mapped ${jiraIssues.length} Jira issues with summaries`);
        if (jiraIssues.length > 0) {
          console.log('First 3 summaries:', jiraIssues.slice(0, 3).map((i: any) => i.summary));
        }

        // Compare with local stories
        const syncStatus = stories.map((story: any, idx: number) => {
          const title = (story.title || story.summary || '').trim();
          if (!title) {
            console.warn('Story without title:', story);
            return {
              title: 'Untitled Story',
              synced: false,
              jiraKey: null,
              jiraStatus: null,
            };
          }

          const titleLower = title.toLowerCase();
          const matchingIssue = jiraIssues.find((issue: any) => 
            issue.summary.toLowerCase() === titleLower
          );

          if (idx < 3) {
            console.log(`Comparing story #${idx}: "${title}" -> ${matchingIssue ? 'MATCH: ' + matchingIssue.key : 'NO MATCH'}`);
          }

          return {
            title,
            synced: !!matchingIssue,
            jiraKey: matchingIssue?.key || null,
            jiraStatus: matchingIssue?.status || null,
          };
        });

        console.log('Sync comparison complete:', {
          totalStories: stories.length,
          syncedCount: syncStatus.filter((s: any) => s.synced).length,
          notSyncedCount: syncStatus.filter((s: any) => !s.synced).length,
        });

        return new Response(
          JSON.stringify({ 
            success: true,
            syncStatus,
            totalStories: stories.length,
            syncedCount: syncStatus.filter((s: any) => s.synced).length,
            notSyncedCount: syncStatus.filter((s: any) => !s.synced).length,
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'create_project': {
        // Validate inputs
        if (!projectName || typeof projectName !== 'string' || projectName.trim().length === 0) {
          return new Response(
            JSON.stringify({ error: 'Project name is required', code: 'INVALID_NAME' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        if (!projectKey || typeof projectKey !== 'string') {
          return new Response(
            JSON.stringify({ error: 'Project key is required', code: 'INVALID_KEY' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Validate project key format (2-10 uppercase alphanumeric characters)
        const keyRegex = /^[A-Z][A-Z0-9]{1,9}$/;
        if (!keyRegex.test(projectKey)) {
          return new Response(
            JSON.stringify({ 
              error: 'Project key must be 2-10 uppercase characters, starting with a letter', 
              code: 'INVALID_KEY_FORMAT' 
            }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        console.log('Creating Jira project:', { projectName, projectKey, projectTemplate });

        // Check if project key already exists
        const checkKeyResponse = await fetch(`${jiraBaseUrl}/project/${projectKey}`, {
          method: 'GET',
          headers: {
            'Authorization': `Basic ${jiraAuth}`,
            'Accept': 'application/json',
          },
        });

        if (checkKeyResponse.ok) {
          return new Response(
            JSON.stringify({ error: 'A project with this key already exists', code: 'DUPLICATE_KEY' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Get current user's account ID for lead
        const myselfResponse = await fetch(`${jiraBaseUrl}/myself`, {
          method: 'GET',
          headers: {
            'Authorization': `Basic ${jiraAuth}`,
            'Accept': 'application/json',
          },
        });

        if (!myselfResponse.ok) {
          throw new Error('Failed to get user information');
        }

        const myselfData = await myselfResponse.json();
        const leadAccountId = myselfData.accountId;

        // Create the project
        const createProjectData = {
          key: projectKey,
          name: projectName.trim(),
          projectTypeKey: projectTemplate || 'software',
          leadAccountId: leadAccountId,
        };

        console.log('Project creation payload:', createProjectData);

        const createResponse = await fetch(`${jiraBaseUrl}/project`, {
          method: 'POST',
          headers: {
            'Authorization': `Basic ${jiraAuth}`,
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(createProjectData),
        });

        if (!createResponse.ok) {
          const errorText = await createResponse.text();
          console.error('Failed to create project:', errorText);
          
          // Parse error to check for duplicate name
          try {
            const errorData = JSON.parse(errorText);
            if (errorData.errors?.projectName || errorText.includes('already exists')) {
              return new Response(
                JSON.stringify({ error: 'A project with this name already exists', code: 'DUPLICATE_NAME' }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
              );
            }
          } catch (e) {
            // Ignore parse error
          }
          
          throw new Error(`Failed to create project: ${createResponse.status} - ${errorText}`);
        }

        const createdProject = await createResponse.json();
        console.log('Project created successfully:', createdProject);

        return new Response(
          JSON.stringify({ 
            success: true, 
            project: {
              id: createdProject.id,
              key: createdProject.key,
              name: projectName.trim(),
            }
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
  } catch (error) {
    console.error('Error in jira-integration function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});