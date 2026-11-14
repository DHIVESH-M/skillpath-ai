-- Run in Supabase SQL editor
create table if not exists profiles(id uuid primary key references auth.users on delete cascade, name text, career_goal text, xp int default 0, streak int default 0, last_active date, created_at timestamptz default now());
create table if not exists skill_scores(user_id uuid references auth.users on delete cascade, skill text, level int default 0, primary key(user_id, skill));
create table if not exists roadmaps(user_id uuid primary key references auth.users on delete cascade, summary text, steps jsonb default '[]', matches jsonb default '[]', updated_at timestamptz default now());
create table if not exists attempts(id bigserial primary key, user_id uuid references auth.users on delete cascade, skill text, score int, feedback text, created_at timestamptz default now());
create table if not exists achievements(user_id uuid references auth.users on delete cascade, key text, earned_at timestamptz default now(), primary key(user_id, key));
create table if not exists messages(id bigserial primary key, user_id uuid references auth.users on delete cascade, role text, content text, created_at timestamptz default now());
alter table profiles enable row level security; alter table skill_scores enable row level security; alter table roadmaps enable row level security;
alter table attempts enable row level security; alter table achievements enable row level security; alter table messages enable row level security;
create policy "own profile" on profiles for select using (auth.uid()=id);
create policy "own skills" on skill_scores for select using (auth.uid()=user_id);
create policy "own roadmap" on roadmaps for select using (auth.uid()=user_id);
create policy "own attempts" on attempts for select using (auth.uid()=user_id);
create policy "own achievements" on achievements for select using (auth.uid()=user_id);
create policy "own messages" on messages for select using (auth.uid()=user_id);
-- Writes happen through the FastAPI backend using the service-role key.
