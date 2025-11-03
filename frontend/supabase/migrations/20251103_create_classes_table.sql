-- Create classes table
create table if not exists public.classes (
    id uuid default gen_random_uuid() primary key,
    name text not null,
    grade text not null,
    section text not null,
    subject text not null,
    teacher_id uuid not null references public.profiles(id) on delete cascade,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.classes enable row level security;

-- Create policies
create policy "Users can view their own classes" on public.classes
    for select using (
        auth.uid() = teacher_id or 
        auth.uid() in (
            select id from public.profiles where role = 'admin'
        )
    );

create policy "Only admins can insert" on public.classes
    for insert with check (
        auth.uid() in (
            select id from public.profiles where role = 'admin'
        )
    );

create policy "Only admins can update" on public.classes
    for update using (
        auth.uid() in (
            select id from public.profiles where role = 'admin'
        )
    );

create policy "Only admins can delete" on public.classes
    for delete using (
        auth.uid() in (
            select id from public.profiles where role = 'admin'
        )
    );