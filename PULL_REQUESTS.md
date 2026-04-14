# Pull Requests - WA_boot Improvements

## PR-01: Security & Credentials Refactor
- **Issue:** ISSUE-01
- **Changes:** Moved Supabase and Gemini credentials to `.env`. Created `lib/supabaseClient.js` for shared access.
- **Status:** Merged

## PR-02: Connection Reliability
- **Issue:** ISSUE-02
- **Changes:** Added exponential-ish backoff/delay in reconnection logic to prevent stack overflow from rapid recursion.
- **Status:** Merged

## PR-03: Attendance Persistence
- **Issue:** ISSUE-03
- **Changes:** Integrated Supabase for persistent attendance (`#absen`). Added fallback to in-memory if Supabase is unavailable.
- **Status:** Merged

## PR-04: Admin Permission Checks
- **Issue:** ISSUE-04
- **Changes:** Added logic to verify if the sender is a group admin before executing `#everyone`, `#hidetag`, and `#resetabsen`.
- **Status:** Merged

## PR-05: Anti-Spam (Rate Limiting)
- **Issue:** ISSUE-05
- **Changes:** Implemented a 1-minute rate limit for the anonymous `#confess` command.
- **Status:** Merged

## PR-06: Standardized Logging
- **Issue:** ISSUE-07
- **Changes:** Integrated `pino` and `pino-pretty` for consistent, readable logging across the application. Replaced `console.log` with `logger` calls.
- **Status:** Merged
