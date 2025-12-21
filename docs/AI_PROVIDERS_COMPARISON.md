# Comparação de Provedores de IA

## Resumo Rápido

**🏆 Recomendado: OpenAI GPT-4o-mini** - Melhor custo-benefício para produção

---

## Tabela Comparativa

| Critério              | OpenAI GPT-4o-mini | Gemini 2.0 Flash Exp | Lovable AI Gateway |
| --------------------- | ------------------ | -------------------- | ------------------ |
| **Preço (Input)**     | $0.15 / 1M tokens  | **GRÁTIS**           | ~$5-10 / 1M tokens |
| **Preço (Output)**    | $0.60 / 1M tokens  | **GRÁTIS**           | ~$5-10 / 1M tokens |
| **Rate Limit (Free)** | 3-5 req/min        | 5-15 req/min         | N/A                |
| **Rate Limit (Paid)** | 500+ req/min       | 50-100 req/min       | 100+ req/min       |
| **Latência**          | ~1-2s              | ~1-2s                | ~1-2s              |
| **Qualidade**         | ⭐⭐⭐⭐⭐         | ⭐⭐⭐⭐             | ⭐⭐⭐⭐⭐         |
| **Confiabilidade**    | ⭐⭐⭐⭐⭐         | ⭐⭐⭐               | ⭐⭐⭐⭐           |
| **Setup**             | API Key            | API Key              | Lovable Account    |

---

## Análise Detalhada

### 🥇 OpenAI GPT-4o-mini (RECOMENDADO)

**Prós:**

- ✅ **Extremamente barato**: $0.0006 por mensagem típica
- ✅ **Rate limits generosos**: 500+ req/min com tier pago
- ✅ **Alta confiabilidade**: 99.9% uptime
- ✅ **Ótima qualidade**: Modelo otimizado para chat
- ✅ **Documentação excelente**

**Contras:**

- ⚠️ Requer cartão de crédito para tier pago
- ⚠️ Free tier tem rate limits baixos (3-5 req/min)

**Custo Estimado:**

- **Desenvolvimento**: $0.50-2.00/mês
- **Produção (1000 usuários ativos)**: $50-200/mês
- **Enterprise (10k+ usuários)**: $500-2000/mês

**Melhor para:**

- ✅ Produção
- ✅ Múltiplos usuários simultâneos
- ✅ Desenvolvimento com budget baixo

### 🥈 Gemini 2.0 Flash Experimental

**Prós:**

- ✅ **100% GRATUITO** (por enquanto)
- ✅ **Rápido**: Latência similar ao GPT-4o-mini
- ✅ **Boa qualidade**: Modelo competente

**Contras:**

- ❌ **Rate limits muito baixos**: 5-15 req/min (free tier)
- ❌ **Instável**: API experimental, pode mudar
- ❌ **Erros 429 frequentes**: Especialmente em picos
- ❌ **Sem SLA**: Pode sair do ar sem aviso

**Melhor para:**

- ✅ Desenvolvimento/testes pessoais
- ✅ Prototipagem
- ❌ **NÃO recomendado para produção**

### 🥉 Lovable AI Gateway

**Prós:**

- ✅ **Fácil setup**: Integração simplificada
- ✅ **Rate limits altos**: 100+ req/min
- ✅ **Suporte incluso**: Time da Lovable

**Contras:**

- ❌ **Mais caro**: ~10x mais caro que OpenAI
- ⚠️ **Dependência da Lovable**: Vendor lock-in
- ⚠️ **Menos controle**: Configurações limitadas

**Melhor para:**

- ✅ Projetos Lovable nativos
- ✅ Quem valoriza conveniência sobre custo
- ⚠️ Não ideal para projetos independentes

---

## Calculadora de Custos

### Cenário: Chat de Agentes (BA, PM, UX, Architect, SM)

**Assumptions:**

- Média de 2000 tokens de input por mensagem
- Média de 500 tokens de output por mensagem
- Usuário típico: 50 mensagens/mês

### Custos por Usuário/Mês:

| Usuários | OpenAI GPT-4o-mini | Gemini | Lovable AI |
| -------- | ------------------ | ------ | ---------- |
| 1 (você) | $0.03              | $0     | $0.15      |
| 10       | $0.30              | $0     | $1.50      |
| 100      | $3.00              | $0\*   | $15.00     |
| 1,000    | $30.00             | $0\*   | $150.00    |
| 10,000   | $300.00            | N/A    | $1,500.00  |

\* **Atenção**: Gemini grátis tem rate limits que impedem uso com muitos usuários

---

## Recomendações por Fase

### 🧪 Fase 1: Desenvolvimento/MVP

```typescript
export const AI_PROVIDER: AIProvider = "gemini"; // Grátis para testar
```

- Use Gemini para economizar
- Expectativa: 429 errors ocasionais
- OK para testes pessoais

### 🚀 Fase 2: Beta/Produção Inicial

```typescript
export const AI_PROVIDER: AIProvider = "openai"; // Barato e confiável
```

- Mude para OpenAI ($1-5/mês inicial)
- Rate limits adequados (20 req/min no app)
- Experiência de usuário profissional

### 📈 Fase 3: Escala

```typescript
export const AI_PROVIDER: AIProvider = "openai"; // Tier 3-4
```

- Upgrade OpenAI tier para 500+ req/min
- Considere cache de respostas comuns
- Monitore custos com analytics

---

## Como Trocar de Provider

### 1. Editar Configuração

```typescript
// supabase/functions/_shared/ai-config.ts
export const AI_PROVIDER: AIProvider = "openai"; // ou 'gemini' ou 'lovable-ai'
```

### 2. Verificar Secret

```bash
supabase secrets list
# Deve mostrar: OPENAI_API_KEY ou GEMINI_API_KEY ou LOVABLE_API_KEY
```

### 3. Adicionar Secret (se necessário)

```bash
supabase secrets set OPENAI_API_KEY=sk-proj-...
# ou
supabase secrets set GEMINI_API_KEY=AIza...
```

### 4. Deploy

```bash
supabase functions deploy chat-agent
```

### 5. Testar

Envie uma mensagem e verifique os logs:

```
Console log: "Chat with agent: ba | Provider: openai"
```

---

## Troubleshooting

### Still Getting 429 After Switching?

1. **Confirme o provider ativo:**

   ```bash
   # Veja os logs da edge function
   # Deve mostrar: "Provider: openai" (não "gemini")
   ```

2. **Limpe rate limit local:**

   ```sql
   SELECT reset_user_rate_limit('your-user-id');
   ```

3. **Aguarde 60 segundos** após trocar provider

### OpenAI API Key não funciona?

1. Verifique que começe com `sk-proj-` ou `sk-`
2. Confirme que tem billing ativo no OpenAI
3. Tier 1+ recomendado ($5+ depositados)

### Custos muito altos?

1. Adicione cache de mensagens comuns
2. Limite histórico de contexto
3. Implemente rate limiting por usuário mais restritivo

---

## Conclusão

### Para seu caso (SpecMaster):

**✅ Use OpenAI GPT-4o-mini**

**Razões:**

1. Custo baixíssimo: ~$0.0006/mensagem
2. Rate limits adequados: 20 req/min (vs 5 no Gemini)
3. Confiável: Sem 429 errors aleatórios
4. Escalável: Quando crescer, só aumenta o tier

**Investimento inicial:** $5-10 na OpenAI (dura meses)
**ROI:** Experiência profissional + sem dor de cabeça com rate limits

🎯 **Configuração atual: OpenAI** (já deployado!)
