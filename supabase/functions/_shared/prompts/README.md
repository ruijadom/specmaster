# Agent Prompts Configuration

This directory contains all AI agent system prompts used across the application. Each agent has its own file for better maintainability and easier updates.

## Structure

```
prompts/
├── README.md                # This file
├── types.ts                 # TypeScript interfaces
├── agent-prompts.ts        # Main exports and aggregation
└── agents/                 # Individual agent prompt files
    ├── ba.ts               # Business Analyst (Mary)
    ├── pm.ts               # Product Manager (John)
    ├── ux.ts               # UX Designer (Sally)
    ├── architect.ts        # Technical Architect (Eve)
    └── sm.ts               # Scrum Master (Steve)
```

## Benefits of This Approach

1. **Separation of Concerns**: Each agent in its own file
2. **Easy Updates**: Modify individual agents without touching others
3. **Version Control**: Track changes per agent independently
4. **Reusability**: Import specific agents or all at once
5. **Scalability**: Add new agents by creating new files
6. **Type Safety**: Shared TypeScript interfaces ensure consistency

## Adding a New Agent

1. Create a new file in `agents/` directory (e.g., `agents/qa.ts`):

```typescript
import type { AgentPrompt } from '../types.ts';

export const qaPrompt: AgentPrompt = {
  id: 'qa',
  name: 'Agent Name',
  role: 'Quality Assurance Engineer',
  prompt: `System prompt content here...`
};
```

2. Import and add to `agent-prompts.ts`:

```typescript
import { qaPrompt } from './agents/qa.ts';

export const AGENT_PROMPTS: Record<string, AgentPrompt> = {
  // ... existing agents
  qa: qaPrompt,
};
```

## Best Practices

- Keep prompts focused on role and behavior
- Include clear instructions about context handling
- Document expected inputs and outputs
- Use consistent formatting across all prompts
- Test prompt changes thoroughly before deploying
- Follow the existing structure for consistency
- Always use the `AgentPrompt` interface type

## Usage in Functions

```typescript
import { getAgentPrompt } from "../_shared/prompts/agent-prompts.ts";

const prompt = getAgentPrompt('ba'); // Returns Business Analyst prompt
```

## Agent IDs

- `ba` - Business Analyst (Mary)
- `pm` - Product Manager (John)
- `uxdesigner` - UX Designer (Sally)
- `architect` - Technical Architect (Eve)
- `sm` - Scrum Master (Steve)
