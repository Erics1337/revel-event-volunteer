alter table public.notifications
add column if not exists delivery_scope text;
