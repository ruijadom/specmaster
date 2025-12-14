# Agent Configuration System

Este diretório contém as definições YAML dos agentes conversacionais do sistema, seguindo uma arquitetura declarativa e escalável.

## Estrutura

```
agents-config/
├── README.md           # Esta documentação
├── loader.ts           # Carregador e parser TypeScript
├── ba.yaml            # Business Analyst
├── pm.yaml            # Product Manager
├── ux.yaml            # UX Designer
├── architect.yaml     # Software Architect
└── sm.yaml            # Scrum Master
```

## Formato YAML

Cada agente é definido em YAML seguindo esta estrutura:

```yaml
agent:
  metadata:
    id: agent-id          # Identificador único
    name: Agent Name      # Nome humano
    title: Job Title      # Título profissional
    icon: 🎯             # Emoji representativo
    phase: phase-name     # Fase do projeto

  persona:
    role: Role Description
    identity: Who they are and their experience
    communication_style: How they communicate
    principles:
      - Principle 1
      - Principle 2

  responsibilities:
    - Responsibility 1
    - Responsibility 2

  key_areas:            # Opcional
    - Key area 1
    - Key area 2

  approach:
    - Approach item 1
    - Approach item 2

  critical_instructions: |
    Critical behavior instructions
```

## Vantagens desta Abordagem

### 1. **Separação de Responsabilidades**
- Configuração (YAML) ≠ Lógica (TypeScript)
- Designers/PMs podem editar agentes sem tocar em código
- Mudanças não requerem recompilação

### 2. **Manutenibilidade**
- Fácil de comparar versões no Git
- Estrutura clara e autodocumentada
- Menos propenso a bugs de sintaxe

### 3. **Escalabilidade**
- Adicionar novos agentes é trivial
- Fácil criar variações para A/B testing
- Suporta internacionalização facilmente

### 4. **Validação e Type Safety**
- TypeScript valida estrutura ao carregar
- Cache automático para performance
- Fallback para versões TypeScript legadas

## Uso

### Carregar um Agente

```typescript
import { getAgentPrompt } from '../agents-config/loader.ts';

// Assíncrono (recomendado)
const agent = await getAgentPrompt('ba');
console.log(agent.name);    // "Mary"
console.log(agent.prompt);  // Prompt completo gerado
```

### Adicionar Novo Agente

1. Crie arquivo `novo-agente.yaml` seguindo o formato
2. Adicione o ID à função `preloadAgents()` em `loader.ts`
3. O agente estará disponível automaticamente

### Modificar Agente Existente

Edite o arquivo YAML correspondente. Mudanças são:
- Refletidas automaticamente após reload
- Versionadas no Git
- Facilmente revertíveis

## Migração de TypeScript para YAML

Os agentes originais em TypeScript (`agents/*.ts`) são mantidos como fallback.
O sistema tenta carregar de YAML primeiro, depois usa TypeScript se falhar.

### Por que mantemos ambos?

1. **Gradual Migration**: Permite transição suave
2. **Backwards Compatibility**: Código existente continua funcionando
3. **Safety Net**: Se YAML parsing falhar, app não quebra

## Performance

- **Cache**: Agentes carregados são cacheados em memória
- **Preload**: Todos agentes são carregados ao inicializar
- **Zero Overhead**: Após preload, acesso é instantâneo

## Boas Práticas

### ✅ Fazer

- Usar YAML para todas novas definições de agentes
- Manter prompts concisos mas completos
- Testar mudanças com diferentes contextos
- Versionar mudanças significativas no Git

### ❌ Evitar

- Lógica complexa no YAML (use TypeScript para isso)
- Prompts muito longos (quebrar em seções)
- Hardcoding de valores específicos do projeto
- Misturar idiomas no mesmo agente

## Exemplo Completo

Ver `ba.yaml` para exemplo completo e comentado de um agente.

## Debugging

### Logs

O loader gera logs úteis:
```
✓ Preloaded agent: ba
✓ Preloaded agent: pm
✗ Failed to preload agent xyz: File not found
```

### Validação

TypeScript valida estrutura ao carregar:
- Campos obrigatórios presentes?
- Tipos corretos?
- YAML válido?

### Testing

```typescript
// Testar carregamento
const config = await loadAgentConfig('ba');
console.log(config.agent.metadata.name); // "Mary"

// Testar prompt gerado
const prompt = buildPromptFromConfig(config.agent);
console.log(prompt.includes('Mary')); // true
```

## Roadmap

- [ ] Suporte a múltiplos idiomas por agente
- [ ] Templates de prompt reutilizáveis
- [ ] Validação de schema com Zod
- [ ] Hot-reload em desenvolvimento
- [ ] Métricas de uso por agente
- [ ] A/B testing framework
