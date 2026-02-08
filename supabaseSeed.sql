-- Schema
create table if not exists app_users (
  id text primary key,
  name text not null,
  avatar text not null,
  quote text,
  level int default 1,
  email text,
  "createdAt" timestamptz default now()
);

alter table app_users add column if not exists email text;

create table if not exists user_stats (
  "userId" text primary key references app_users(id) on delete cascade,
  "targetsCreated" int default 0,
  "roastsPosted" int default 0,
  "likesReceived" int default 0
);

create table if not exists badges (
  id text primary key,
  name text not null,
  icon text not null,
  description text not null,
  condition text not null
);

create table if not exists user_badges (
  "userId" text references app_users(id) on delete cascade,
  "badgeId" text references badges(id) on delete cascade,
  unlocked boolean default false,
  primary key ("userId", "badgeId")
);

create table if not exists roast_targets (
  id text primary key,
  name text not null,
  type text not null,
  description text not null,
  tags text[] not null,
  "avatarStyle" text not null,
  "avatarUrl" text,
  "roastCount" int default 0,
  "totalLikes" int default 0,
  "heatIndex" int default 0,
  "topRoastPreview" text,
  "creatorId" text,
  "createdAt" timestamptz default now()
);

create table if not exists roast_comments (
  id text primary key,
  "targetId" text references roast_targets(id) on delete cascade,
  "userId" text,
  "userName" text not null,
  "userAvatar" text not null,
  content text not null,
  type text not null,
  "mediaUrl" text,
  duration int,
  likes int default 0,
  "isChampion" boolean default false,
  "timestamp" text,
  "createdAt" timestamptz default now()
);

create table if not exists leaderboard_daily (
  id text primary key,
  "userName" text not null,
  "userAvatar" text not null,
  streak int default 1,
  likes int default 0,
  quote text not null,
  "targetAvatar" text
);

create table if not exists leaderboard_top (
  rank int primary key,
  "userName" text not null,
  "userAvatar" text not null,
  quote text not null,
  likes int default 0
);

create table if not exists leaderboard_hof (
  id text primary key,
  "dateLabel" text not null,
  "userName" text not null,
  "userAvatar" text not null
);

-- Enable RLS for all tables
alter table app_users enable row level security;
alter table user_stats enable row level security;
alter table badges enable row level security;
alter table user_badges enable row level security;
alter table roast_targets enable row level security;
alter table roast_comments enable row level security;
alter table leaderboard_daily enable row level security;
alter table leaderboard_top enable row level security;
alter table leaderboard_hof enable row level security;

-- Minimal RLS policies
drop policy if exists "app_users_select_own" on app_users;
drop policy if exists "app_users_insert_own" on app_users;
drop policy if exists "app_users_update_own" on app_users;
create policy "app_users_select_own" on app_users
  for select using (auth.uid()::text = id);
create policy "app_users_insert_own" on app_users
  for insert with check (auth.uid()::text = id);
create policy "app_users_update_own" on app_users
  for update using (auth.uid()::text = id);

drop policy if exists "user_stats_select_own" on user_stats;
drop policy if exists "user_stats_insert_own" on user_stats;
drop policy if exists "user_stats_update_own" on user_stats;
create policy "user_stats_select_own" on user_stats
  for select using (auth.uid()::text = "userId");
create policy "user_stats_insert_own" on user_stats
  for insert with check (auth.uid()::text = "userId");
create policy "user_stats_update_own" on user_stats
  for update using (auth.uid()::text = "userId");

drop policy if exists "badges_select_all" on badges;
create policy "badges_select_all" on badges
  for select using (true);

drop policy if exists "user_badges_select_own" on user_badges;
create policy "user_badges_select_own" on user_badges
  for select using (auth.uid()::text = "userId");

drop policy if exists "roast_targets_select_all" on roast_targets;
drop policy if exists "roast_targets_insert_auth" on roast_targets;
drop policy if exists "roast_targets_update_auth" on roast_targets;
create policy "roast_targets_select_all" on roast_targets
  for select using (true);
create policy "roast_targets_insert_auth" on roast_targets
  for insert with check (auth.uid() is not null);
create policy "roast_targets_update_auth" on roast_targets
  for update using (auth.uid() is not null);

drop policy if exists "roast_comments_select_all" on roast_comments;
drop policy if exists "roast_comments_insert_auth" on roast_comments;
drop policy if exists "roast_comments_update_auth" on roast_comments;
create policy "roast_comments_select_all" on roast_comments
  for select using (true);
create policy "roast_comments_insert_auth" on roast_comments
  for insert with check (auth.uid() is not null);
create policy "roast_comments_update_auth" on roast_comments
  for update using (auth.uid() is not null);

drop policy if exists "leaderboard_daily_select_all" on leaderboard_daily;
drop policy if exists "leaderboard_top_select_all" on leaderboard_top;
drop policy if exists "leaderboard_hof_select_all" on leaderboard_hof;
create policy "leaderboard_daily_select_all" on leaderboard_daily
  for select using (true);
create policy "leaderboard_top_select_all" on leaderboard_top
  for select using (true);
create policy "leaderboard_hof_select_all" on leaderboard_hof
  for select using (true);

-- Increment likes helper
create or replace function increment_roast_like(roast_id text)
returns void
language plpgsql
as $$
begin
  update roast_comments
  set likes = coalesce(likes, 0) + 1
  where id = roast_id;
end;
$$;

-- Seed Data
insert into app_users (id, name, avatar, quote, level)
values
  ('me', '毒舌小王子', 'https://picsum.photos/seed/me/200', '“键盘在手，天下我有。吐槽不息，战斗不止。”', 12)
on conflict (id) do update set
  name = excluded.name,
  avatar = excluded.avatar,
  quote = excluded.quote,
  level = excluded.level;

insert into user_stats ("userId", "targetsCreated", "roastsPosted", "likesReceived")
values
  ('me', 5, 124, 3500)
on conflict ("userId") do update set
  "targetsCreated" = excluded."targetsCreated",
  "roastsPosted" = excluded."roastsPosted",
  "likesReceived" = excluded."likesReceived";

insert into badges (id, name, icon, description, condition)
values
  ('b1', '每日骂王', '👑', '当日评论获赞数第一名', '单日获赞Top 1'),
  ('b2', '连冠达人', '🏆', '连续 3 天获得每日骂王', '连续3天冠军'),
  ('b3', '百赞骂手', '🔥', '单条评论获得 100+ 赞', '100+赞'),
  ('b4', '千赞骂手', '💎', '单条评论获得 1000+ 赞', '1000+赞'),
  ('b5', '投稿达人', '📝', '投稿 10 个以上被骂对象', '投稿10+'),
  ('b6', '话痨骂手', '💬', '累计发布 100 条评论', '100条评论'),
  ('b7', '新手上路', '🌱', '完成首次骂', '完成首次骂'),
  ('b8', '语音达人', '🎤', '发布 10 条语音评论', '10条语音'),
  ('b9', '配图大师', '🖼️', '发布 10 条带图评论', '10条带图')
on conflict (id) do update set
  name = excluded.name,
  icon = excluded.icon,
  description = excluded.description,
  condition = excluded.condition;

insert into user_badges ("userId", "badgeId", unlocked)
values
  ('me', 'b1', true),
  ('me', 'b3', true),
  ('me', 'b6', true),
  ('me', 'b7', true)
on conflict ("userId", "badgeId") do update set
  unlocked = excluded.unlocked;

insert into roast_targets (
  id, name, type, description, tags, "avatarStyle", "avatarUrl",
  "roastCount", "totalLikes", "heatIndex", "topRoastPreview", "creatorId"
)
values
  ('1', '甲方张总', '甲方', '改了 47 版方案还说第一版最好，每次都要在下班前 5 分钟发需求。',
   ARRAY['#甲方', '#改稿王', '#职场'], 'suit-man', null, 1240, 8900, 98,
   '建议把第一版和第四十七版拼在一起，叫“甲方迷惑行为大赏”。', 'u1'),
  ('2', '前任小李', '前任', '同时和三个人说晚安，备注全是“宝宝1号”、“宝宝2号”。',
   ARRAY['#渣男', '#海王', '#时间管理'], 'fresh-boy', null, 856, 4200, 85,
   '他是海王？那是公海管理员。', 'u2'),
  ('3', '室友老刘', '室友', '凌晨 3 点外放短视频，笑声穿透三层墙，厕所从来不刷。',
   ARRAY['#室友', '#噪音制造机', '#邋遢'], 'uncle', null, 540, 3100, 72,
   '建议你给他买个耳塞，顺便把他的嘴缝上。', 'u3'),
  ('4', '领导王姐', '领导', '你这个我周末看看啊（永远不看），周一开会问你为什么没动静。',
   ARRAY['#职场', '#PUA', '#双标'], 'mature-woman', null, 2300, 15600, 99,
   '王姐看的不是方案，是她那虚无缥缈的掌控感。', 'u4'),
  ('5', '楼下大妈', '邻居', '每天早上 6 点准时开跳广场舞，音响声音大到我床都在震。',
   ARRAY['#邻居', '#广场舞', '#扰民'], 'mystery', null, 310, 1200, 60,
   '建议加入，从内部瓦解她们。', 'u5'),
  ('6', '健身房教练', '陌生人', '买了课还天天推销新课，说我不练就废了，结果他自己也没肌肉。',
   ARRAY['#推销', '#骚扰', '#健身房'], 'suit-man', null, 150, 800, 45,
   '他是教你健身还是教你理财？', 'u6'),
  ('7', '甲方周总', '甲方', '需求天天变，反馈永远晚，喜欢让人猜心思。',
   ARRAY['#甲方', '#改稿王', '#职场'], 'suit-man', null, 60, 320, 40,
   '他要的是灵感，不是方案。', 'me')
on conflict (id) do update set
  name = excluded.name,
  type = excluded.type,
  description = excluded.description,
  tags = excluded.tags,
  "avatarStyle" = excluded."avatarStyle",
  "avatarUrl" = excluded."avatarUrl",
  "roastCount" = excluded."roastCount",
  "totalLikes" = excluded."totalLikes",
  "heatIndex" = excluded."heatIndex",
  "topRoastPreview" = excluded."topRoastPreview",
  "creatorId" = excluded."creatorId";

insert into roast_comments (
  id, "targetId", "userId", "userName", "userAvatar",
  content, type, "mediaUrl", likes, "isChampion", "timestamp"
)
values
  ('r1', '1', 'u10', '正义的伙伴', 'https://picsum.photos/seed/user1/100',
   '张总这哪是甲方，这是我的受难日记。', 'text', null, 452, true, '2小时前'),
  ('r2', '1', 'u11', '退堂鼓国家级选手', 'https://picsum.photos/seed/user2/100',
   '改图可以，得加钱，得加命。', 'text', null, 128, false, '4小时前'),
  ('r3', '1', 'u12', '画图狗', 'https://picsum.photos/seed/user3/100',
   '看看这发际线，都是张总亲手拔掉的。', 'image', 'https://picsum.photos/seed/bald/400/300', 890, false, '10分钟前'),
  ('r4', '4', 'me', '毒舌小王子', 'https://picsum.photos/seed/me/200',
   '你说周末看，结果周末看的是我发际线吧？', 'text', null, 128, false, '昨天 18:30'),
  ('r5', '2', 'me', '毒舌小王子', 'https://picsum.photos/seed/me/200',
   '你不是海王，是情绪债务管理公司。', 'text', null, 64, false, '前天 13:20')
on conflict (id) do update set
  "targetId" = excluded."targetId",
  "userId" = excluded."userId",
  "userName" = excluded."userName",
  "userAvatar" = excluded."userAvatar",
  content = excluded.content,
  type = excluded.type,
  "mediaUrl" = excluded."mediaUrl",
  likes = excluded.likes,
  "isChampion" = excluded."isChampion",
  "timestamp" = excluded."timestamp";

insert into leaderboard_daily (id, "userName", "userAvatar", streak, likes, quote, "targetAvatar")
values
  ('daily-1', '毒舌老李', 'https://picsum.photos/seed/winner1/100', 3, 12450,
   '“张总改的不是方案，是他那支离破碎的审美，建议他把公司的Logo印在脑门上，这样全世界都能一眼看出谁是那个审美孤儿。”',
   'https://picsum.photos/seed/target1/100')
on conflict (id) do update set
  "userName" = excluded."userName",
  "userAvatar" = excluded."userAvatar",
  streak = excluded.streak,
  likes = excluded.likes,
  quote = excluded.quote,
  "targetAvatar" = excluded."targetAvatar";

insert into leaderboard_top (rank, "userName", "userAvatar", quote, likes)
values
  (1, '犀利哥_1', 'https://picsum.photos/seed/user1/60', '“他这操作真的刷新了我...”', 1800),
  (2, '犀利哥_2', 'https://picsum.photos/seed/user2/60', '“他这操作真的刷新了我...”', 1600),
  (3, '犀利哥_3', 'https://picsum.photos/seed/user3/60', '“他这操作真的刷新了我...”', 1400),
  (4, '犀利哥_4', 'https://picsum.photos/seed/user4/60', '“他这操作真的刷新了我...”', 1200),
  (5, '犀利哥_5', 'https://picsum.photos/seed/user5/60', '“他这操作真的刷新了我...”', 1000)
on conflict (rank) do update set
  "userName" = excluded."userName",
  "userAvatar" = excluded."userAvatar",
  quote = excluded.quote,
  likes = excluded.likes;

insert into leaderboard_hof (id, "dateLabel", "userName", "userAvatar")
values
  ('hof-1', '09-21', '冠军用户_1', 'https://picsum.photos/seed/hist1/80'),
  ('hof-2', '09-22', '冠军用户_2', 'https://picsum.photos/seed/hist2/80'),
  ('hof-3', '09-23', '冠军用户_3', 'https://picsum.photos/seed/hist3/80')
on conflict (id) do update set
  "dateLabel" = excluded."dateLabel",
  "userName" = excluded."userName",
  "userAvatar" = excluded."userAvatar";
