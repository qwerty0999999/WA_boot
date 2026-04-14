# Project Issues - WA_boot Audit

## High Priority

### ISSUE-01: Hardcoded Credentials (Security)
- **File:** `index.js`, `lib/api.js`
- **Description:** Supabase URL, Supabase Key, and Gemini API Key are hardcoded in the source code.
- **Root Cause:** Credentials were included directly for quick development/testing.
- **Suggested Solution:** Move all credentials to `.env` and access them via `process.env`.
- **Label:** security

### ISSUE-02: Connection Management Recursion (Logic)
- **File:** `index.js`
- **Description:** `startBot()` is called recursively on connection close, which can lead to stack overflow or infinite loops during persistent failures.
- **Root Cause:** Lack of retry limit or exponential backoff in reconnection logic.
- **Suggested Solution:** Implement a maximum retry count and a delay before reconnecting.
- **Label:** bug

### ISSUE-03: Ephemeral Data Loss (Reliability)
- **File:** `messageHandler.js`
- **Description:** Features like `absensi` and `ingatkan` use in-memory objects and `setTimeout`, which are lost when the bot restarts.
- **Root Cause:** Use of non-persistent storage for stateful features.
- **Suggested Solution:** Integrate with Supabase to store attendance and reminder data.
- **Label:** bug, enhancement

## Medium Priority

### ISSUE-04: Lack of Admin Checks (Logic/UX)
- **File:** `messageHandler.js`
- **Description:** Commands like `everyone` and `hidetag` do not verify if the bot is an admin in the group.
- **Root Cause:** Incomplete permission validation logic.
- **Suggested Solution:** Add a helper function to check if the bot has admin privileges before executing group management commands.
- **Label:** bug

### ISSUE-05: Rate Limiting for Anonymous Commands (Security/UX)
- **File:** `messageHandler.js`
- **Description:** The `confess` command can be used for spamming as it lacks any rate-limiting mechanism.
- **Root Cause:** Missing protection against abuse of anonymous features.
- **Suggested Solution:** Implement a simple per-user rate limiter for sensitive commands.
- **Label:** security, enhancement

## Low Priority

### ISSUE-06: Sequential Loop Performance (Performance)
- **File:** `cronHandler.js`, `messageHandler.js` (broadcast)
- **Description:** Broadcasting and cron tasks loop through groups sequentially with static delays. Large group lists will take significant time.
- **Root Cause:** Naive iteration over group lists.
- **Suggested Solution:** Review the necessity of static delays and consider a more robust queue system if group count grows large.
- **Label:** performance

### ISSUE-07: Inconsistent Logging and Error Handling (Code Quality)
- **File:** Multiple files
- **Description:** Heavy use of `console.log` and inconsistent error handling patterns.
- **Root Cause:** Lack of standardized logging and error management during development.
- **Suggested Solution:** Standardize on `pino` logger and ensure consistent `try-catch` patterns with proper reporting.
- **Label:** refactor
