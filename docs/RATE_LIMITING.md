# Rate Limiting Documentation

## Overview

The chat-agent edge function implements rate limiting to prevent exceeding AI provider limits (especially Google Gemini's strict rate limits).

## Current Limits

- **User Rate Limit**: 5 requests per minute per user
- **Window Duration**: 60 seconds (rolling window)
- **Provider**: Google Gemini (has ~15 requests/minute on free tier)

## How It Works

1. Each user request is tracked in the `user_rate_limits` table
2. Before calling the AI provider, the function checks if the user has exceeded their limit
3. If exceeded, returns 429 with a helpful error message and retry time
4. Rate limits automatically reset after the 60-second window

## Error Messages

### Application Rate Limit (5 req/min)

```
Rate limit exceeded. Please wait X seconds before trying again.
```

- **Status**: 429
- **Retry-After**: Calculated based on window age

### AI Provider Rate Limit (Gemini)

```
AI provider rate limit exceeded. Please wait 60 seconds and try again.
```

- **Status**: 429
- **Retry-After**: 60 seconds

## Database Functions

### Check Rate Limit Status

```sql
SELECT * FROM get_rate_limit_status('user-uuid-here');
```

Returns:

- `request_count`: Number of requests in current window
- `window_start`: When the current window started
- `seconds_until_reset`: Seconds until the window resets

### Reset Rate Limit (Service Role Only)

```sql
SELECT reset_user_rate_limit('user-uuid-here');
```

This immediately clears a user's rate limit. Useful for:

- Testing
- Supporting users who hit limits unfairly
- Manually clearing after system issues

## Adjusting Rate Limits

To change the rate limits, edit `/supabase/functions/chat-agent/index.ts`:

```typescript
const windowDuration = 60 * 1000; // Change window duration (milliseconds)
const maxRequests = 5; // Change max requests per window
```

After changing, redeploy:

```bash
supabase functions deploy chat-agent
```

## Frontend Integration

The `useAgentChat` hook now tracks rate limit state:

```typescript
const {
  rateLimitedUntil, // Date when rate limit expires
  isRateLimited, // Boolean: currently rate limited
  // ... other properties
} = useAgentChat({ projectId });
```

## Monitoring

Check recent rate limit activity:

```sql
SELECT
  user_id,
  request_count,
  window_start,
  NOW() - window_start as window_age
FROM user_rate_limits
ORDER BY window_start DESC
LIMIT 10;
```

## Best Practices

1. **Don't disable rate limiting** - Gemini's free tier is strict
2. **Monitor usage** - If users frequently hit limits, consider:
   - Upgrading Gemini API tier
   - Implementing request queuing
   - Adding premium tier with higher limits
3. **User Communication** - The UI now shows retry times clearly
4. **Graceful Degradation** - Consider caching common responses

## Troubleshooting

### User Reports Rate Limit Too Strict

1. Check their actual usage: `SELECT * FROM get_rate_limit_status('uuid');`
2. If legitimate, reset: `SELECT reset_user_rate_limit('uuid');`
3. Consider increasing limits if pattern is widespread

### Still Getting Provider 429s

- The provider limit (Gemini) is separate from our app limit
- Our 5 req/min is conservative to stay under Gemini's ~15 req/min
- Consider upgrading Gemini API tier or switching providers

### Rate Limit Not Resetting

- Check system time is correct
- Verify migration was applied: `\d user_rate_limits`
- Check for errors in edge function logs
