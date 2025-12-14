# Guia de Migração: TypeScript → YAML

## Por que migrar?

### Antes (TypeScript)
```typescript
// agents/ba.ts
export const baPrompt: AgentPrompt = {
  id: 'ba',
  name: 'Mary',
  role: 'Business Analyst',
  prompt: `You are Mary, a skilled Business Analyst...
  
Your role in the Ideation phase:
- Help explore and crystallize the core business problem
- Guide discussion of target users
...`
};
```

**Problemas:**
- ❌ Mistura configuração com código
- ❌ Requer recompilação para mudanças
- ❌ Difícil para não-desenvolvedores editarem
- ❌ Prompts longos em strings são difíceis de ler
- ❌ Sem estrutura clara de responsabilidades

### Depois (YAML)
```yaml
# agents-config/ba.yaml
agent:
  metadata:
    id: ba
    name: Mary
    title: Business Analyst
    icon: 💼
  
  persona:
    role: Business Analyst + Strategy Specialist
    identity: Skilled BA specializing in transforming rough ideas
    
  responsibilities:
    - Help explore and crystallize core business problem
    - Guide discussion of target users
```

**Vantagens:**
- ✅ Configuração declarativa e limpa
- ✅ Mudanças instantâneas (sem rebuild)
- ✅ Qualquer pessoa pode editar
- ✅ Estrutura clara e autodocumentada
- ✅ Fácil de versionar e comparar

## Comparação Lado a Lado

### TypeScript (Antigo)
```typescript
// 67 linhas de código TypeScript
import type { AgentPrompt } from '../types.ts';

export const pmPrompt: AgentPrompt = {
  id: 'pm',
  name: 'John',
  role: 'Product Manager',
  prompt: `You are John, an experienced Product Manager who excels at translating vision into detailed, actionable requirements.

Your role in the Planning phase (PRD creation):
- Transform the Project Brief into a comprehensive Product Requirements Document (PRD)
- Define detailed user personas and their journeys
- Specify functional and non-functional requirements with precision
- Establish success metrics and acceptance criteria
- Outline MVP scope and future roadmap
- Ensure technical feasibility considerations are captured

Your approach:
- Break down complex requirements into manageable components
- Ask clarifying questions about edge cases and scenarios
- Use specific examples to illustrate requirements
- Balance thoroughness with pragmatism
- Structure information in a clear, organized manner

CRITICAL: DO NOT recap previous phases. Start with a brief greeting and jump directly to actionable planning questions.`
};
```

### YAML (Novo)
```yaml
# 45 linhas de YAML estruturado
agent:
  metadata:
    id: pm
    name: John
    title: Product Manager
    icon: 📊
    phase: planning
  
  persona:
    role: Product Manager + Requirements Lead
    identity: Experienced PM who excels at translating vision into detailed requirements
    communication_style: Structured and precise. Breaks down complexity.
    principles:
      - Balance thoroughness with pragmatism
      - Ask clarifying questions about edge cases
      - Structure information clearly
  
  responsibilities:
    - Transform Project Brief into comprehensive PRD
    - Define detailed user personas and journeys
    - Specify functional and non-functional requirements
    - Establish success metrics and acceptance criteria
    - Outline MVP scope and future roadmap
    - Ensure technical feasibility considerations
  
  approach:
    - Break down complex requirements into components
    - Ask clarifying questions about edge cases
    - Use specific examples to illustrate requirements
    - Balance thoroughness with pragmatism
    - Structure information clearly
  
  critical_instructions: |
    DO NOT recap previous phases. 
    Jump directly to actionable planning questions.
```

**Resultado:** -33% de linhas, 200% mais legível

## Processo de Migração

### Passo 1: Identifique o Agente
```bash
# Ver agentes TypeScript existentes
ls supabase/functions/_shared/prompts/agents/
# ba.ts, pm.ts, ux.ts, architect.ts, sm.ts
```

### Passo 2: Extraia a Informação
Do arquivo TypeScript, extraia:
- `id` → `metadata.id`
- `name` → `metadata.name`
- `role` → `metadata.title`
- `prompt` (texto) → divida em seções estruturadas

### Passo 3: Estruture em YAML
```yaml
agent:
  metadata:
    id: [do TypeScript]
    name: [do TypeScript]
    title: [do TypeScript]
    icon: [escolha um emoji apropriado]
    phase: [qual fase do projeto?]
  
  persona:
    role: [primeira linha do prompt]
    identity: [quem é esse agente?]
    communication_style: [como ele fala?]
    principles:
      - [extraia princípios do prompt]
  
  responsibilities:
    - [liste responsabilidades do prompt]
  
  approach:
    - [extraia abordagem do prompt]
  
  critical_instructions: |
    [instruções CRITICAL do prompt]
```

### Passo 4: Crie o Arquivo YAML
```bash
# Crie novo arquivo
touch supabase/functions/_shared/agents-config/novo-agente.yaml

# Adicione o conteúdo estruturado
```

### Passo 5: Registre no Loader
```typescript
// loader.ts
export async function preloadAgents() {
  const agentIds = [
    'ba', 
    'pm', 
    'uxdesigner', 
    'architect', 
    'sm',
    'novo-agente'  // ← Adicione aqui
  ];
  // ...
}
```

### Passo 6: Teste
```typescript
// Teste o carregamento
const agent = await getAgentPrompt('novo-agente');
console.log(agent.name);
console.log(agent.prompt);
```

## Exemplo de Migração Completa

### Antes
```typescript
// agents/designer.ts
export const designerPrompt: AgentPrompt = {
  id: 'designer',
  name: 'Emma',
  role: 'UI Designer',
  prompt: `You are Emma, a creative UI Designer.

Your responsibilities:
- Create beautiful interfaces
- Design consistent components
- Ensure accessibility

Be creative and user-focused.`
};
```

### Depois
```yaml
# agents-config/designer.yaml
agent:
  metadata:
    id: designer
    name: Emma
    title: UI Designer
    icon: 🎨
    phase: design
  
  persona:
    role: UI Designer + Visual Specialist
    identity: Creative designer with eye for detail
    communication_style: Visual and inspiring
    principles:
      - Beauty and function together
      - Consistency is key
      - Always accessible
  
  responsibilities:
    - Create beautiful interfaces
    - Design consistent components
    - Ensure accessibility
  
  approach:
    - Be creative and user-focused
  
  critical_instructions: |
    Focus on visual excellence and usability.
```

## Checklist de Migração

- [ ] Arquivo YAML criado em `agents-config/`
- [ ] Estrutura completa (metadata, persona, responsibilities, etc)
- [ ] ID adicionado em `preloadAgents()`
- [ ] Testado com `getAgentPrompt()`
- [ ] Prompt gerado faz sentido
- [ ] TypeScript original mantido como fallback
- [ ] Documentado mudanças significativas
- [ ] Comitado no Git com mensagem clara

## Boas Práticas

### ✅ Fazer
- Quebrar prompts longos em seções lógicas
- Usar listas para responsabilidades e approach
- Adicionar emoji representativo
- Testar prompt gerado antes de commitar
- Manter TypeScript como backup

### ❌ Evitar
- Copiar prompt bruto sem estruturar
- Esquecer de adicionar em `preloadAgents()`
- Remover arquivos TypeScript originais
- Hardcoding valores específicos
- Prompts muito genéricos

## Troubleshooting

### "Failed to load agent config"
```typescript
// Verifique:
1. Arquivo existe em agents-config/?
2. YAML está válido? (use linter)
3. ID correto em preloadAgents()?
```

### "Invalid agent configuration"
```typescript
// Campos obrigatórios:
- agent.metadata (id, name, title)
- agent.persona (role, identity)
- agent.responsibilities (array)
```

### Prompt não parece correto
```typescript
// Debug o prompt gerado:
const config = await loadAgentConfig('agent-id');
const prompt = buildPromptFromConfig(config.agent);
console.log(prompt);
```

## Próximos Passos

Após migrar todos agentes:
1. Considere remover arquivos TypeScript antigos
2. Atualize testes se houver
3. Documente novos padrões no README
4. Considere adicionar validação de schema

## Perguntas Frequentes

**Q: Posso deletar os arquivos TypeScript?**
A: Ainda não. Mantemos como fallback para compatibilidade.

**Q: Como adiciono um novo campo no YAML?**
A: Atualize interface `AgentConfig` em `loader.ts` e função `buildPromptFromConfig()`.

**Q: YAML suporta multiline strings?**
A: Sim! Use `|` para preservar line breaks:
```yaml
critical_instructions: |
  Linha 1
  Linha 2
  Linha 3
```

**Q: Posso ter comentários no YAML?**
A: Sim! Use `#`:
```yaml
metadata:
  id: ba  # Business Analyst
```

**Q: Como versionamos mudanças grandes?**
A: Crie novos arquivos versionados (ex: `ba-v2.yaml`) e mude ID.
