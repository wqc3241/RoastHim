# End-to-End Test Cases

Run all tests below after every new feature. All must pass to consider work complete.

## Environment
- Supabase configured with RLS policies enabled
- `GEMINI_API_KEY` set in `.env.local`
- `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` set
- Dev server running (`npm run dev`)

## Auth and Onboarding
- Open app as new user
- Sign in with Google
- Verify onboarding screen appears
- Set nickname and description, save
- Verify app loads to Home
- Logout from Profile
- Log back in and confirm onboarding does not reappear

## Home Feed
- Verify Home renders 2-column layout on mobile width
- Verify each card shows:
  - Name, tags
  - Roast count
  - Total likes (top-right)
  - Top roast preview (highest likes; if no likes, latest)

## Target Details
- Open a target from Home
- Verify header shows roast count and total likes
- Add a text roast
- Verify roast count increments by 1
- Verify new comment appears in list
- Like the comment
- Verify comment likes increments immediately
- Refresh page, verify likes persist
- Verify total likes in header updated and persists after refresh

## Post Flow (AI)
- Go to 投稿
- Step 1: enter experience text (<= 2000 chars)
- Use voice input (if supported)
- Click “用 AI 生成”
- Verify step 2 appears with generated fields
- Edit fields manually
- Submit and verify:
  - New target appears on Home
  - Profile “投稿对象” increments

## Profile
- Verify stats:
  - 投稿对象 count matches created targets
  - 发布骂评 count matches user comments
  - 获赞总数 matches sum of user comment likes
- Tap “我的骂” item → opens the target detail page
- Tap “我的投稿” item → opens the target detail page

## Leaderboard
- Verify daily/top/hof sections render from Supabase tables

## Permissions / RLS
- Confirm reads work for authenticated user
- Confirm insert/update works for:
  - `roast_targets`
  - `roast_comments`
  - `app_users`
  - `user_stats`
