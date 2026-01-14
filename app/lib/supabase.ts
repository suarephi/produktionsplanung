import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database types matching our CRM schema
export interface DBContact {
  id: string;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  role?: string;
  tags: string[];
  notes: string;
  created_at: string;
  last_interaction?: string;
  user_id: string;
}

export interface DBMeeting {
  id: string;
  title: string;
  date: string;
  duration: number;
  attendee_ids: string[];
  transcript?: string;
  summary?: string;
  action_items: string[];
  topics: string[];
  calendar_event_id?: string;
  status: 'scheduled' | 'completed' | 'cancelled';
  user_id: string;
  audio_url?: string;
}

export interface DBTask {
  id: string;
  title: string;
  description?: string;
  contact_id?: string;
  meeting_id?: string;
  due_date?: string;
  priority: 'low' | 'medium' | 'high';
  status: 'todo' | 'in_progress' | 'done';
  created_at: string;
  user_id: string;
}

export interface DBInteraction {
  id: string;
  contact_id: string;
  type: 'meeting' | 'call' | 'email' | 'note';
  date: string;
  summary: string;
  details?: string;
  user_id: string;
}

export interface DBEmail {
  id: string;
  contact_id?: string;
  gmail_id: string;
  thread_id: string;
  subject: string;
  from_email: string;
  to_email: string;
  snippet: string;
  date: string;
  is_sent: boolean;
  user_id: string;
}

// Supabase SQL schema for reference (run this in Supabase SQL editor):
/*
-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Contacts table
create table contacts (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  email text not null,
  phone text,
  company text,
  role text,
  tags text[] default '{}',
  notes text default '',
  created_at timestamp with time zone default now(),
  last_interaction timestamp with time zone,
  user_id uuid references auth.users(id) on delete cascade
);

-- Meetings table
create table meetings (
  id uuid default uuid_generate_v4() primary key,
  title text not null,
  date timestamp with time zone not null,
  duration integer not null,
  attendee_ids uuid[] default '{}',
  transcript text,
  summary text,
  action_items text[] default '{}',
  topics text[] default '{}',
  calendar_event_id text,
  status text default 'scheduled',
  audio_url text,
  user_id uuid references auth.users(id) on delete cascade
);

-- Tasks table
create table tasks (
  id uuid default uuid_generate_v4() primary key,
  title text not null,
  description text,
  contact_id uuid references contacts(id) on delete set null,
  meeting_id uuid references meetings(id) on delete set null,
  due_date date,
  priority text default 'medium',
  status text default 'todo',
  created_at timestamp with time zone default now(),
  user_id uuid references auth.users(id) on delete cascade
);

-- Interactions table
create table interactions (
  id uuid default uuid_generate_v4() primary key,
  contact_id uuid references contacts(id) on delete cascade,
  type text not null,
  date timestamp with time zone default now(),
  summary text not null,
  details text,
  user_id uuid references auth.users(id) on delete cascade
);

-- Emails table
create table emails (
  id uuid default uuid_generate_v4() primary key,
  contact_id uuid references contacts(id) on delete set null,
  gmail_id text unique not null,
  thread_id text not null,
  subject text,
  from_email text not null,
  to_email text not null,
  snippet text,
  date timestamp with time zone not null,
  is_sent boolean default false,
  user_id uuid references auth.users(id) on delete cascade
);

-- Google tokens table
create table google_tokens (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete cascade unique,
  access_token text not null,
  refresh_token text not null,
  expiry_date bigint not null,
  scope text
);

-- Row Level Security
alter table contacts enable row level security;
alter table meetings enable row level security;
alter table tasks enable row level security;
alter table interactions enable row level security;
alter table emails enable row level security;
alter table google_tokens enable row level security;

-- Policies (users can only access their own data)
create policy "Users can view own contacts" on contacts for select using (auth.uid() = user_id);
create policy "Users can insert own contacts" on contacts for insert with check (auth.uid() = user_id);
create policy "Users can update own contacts" on contacts for update using (auth.uid() = user_id);
create policy "Users can delete own contacts" on contacts for delete using (auth.uid() = user_id);

create policy "Users can view own meetings" on meetings for select using (auth.uid() = user_id);
create policy "Users can insert own meetings" on meetings for insert with check (auth.uid() = user_id);
create policy "Users can update own meetings" on meetings for update using (auth.uid() = user_id);
create policy "Users can delete own meetings" on meetings for delete using (auth.uid() = user_id);

create policy "Users can view own tasks" on tasks for select using (auth.uid() = user_id);
create policy "Users can insert own tasks" on tasks for insert with check (auth.uid() = user_id);
create policy "Users can update own tasks" on tasks for update using (auth.uid() = user_id);
create policy "Users can delete own tasks" on tasks for delete using (auth.uid() = user_id);

create policy "Users can view own interactions" on interactions for select using (auth.uid() = user_id);
create policy "Users can insert own interactions" on interactions for insert with check (auth.uid() = user_id);

create policy "Users can view own emails" on emails for select using (auth.uid() = user_id);
create policy "Users can insert own emails" on emails for insert with check (auth.uid() = user_id);

create policy "Users can manage own google tokens" on google_tokens for all using (auth.uid() = user_id);

-- Indexes
create index idx_contacts_user_id on contacts(user_id);
create index idx_meetings_user_id on meetings(user_id);
create index idx_tasks_user_id on tasks(user_id);
create index idx_interactions_contact_id on interactions(contact_id);
create index idx_emails_contact_id on emails(contact_id);
*/
