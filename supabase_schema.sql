-- Create tables for KasFlow

CREATE TABLE public.accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  type text NOT NULL,
  color text,
  icon text,
  created_at bigint NOT NULL,
  coa_code text
);

CREATE TABLE public.transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL,
  amount numeric NOT NULL,
  category text NOT NULL,
  date text NOT NULL,
  note text,
  created_at bigint NOT NULL,
  account_id uuid REFERENCES public.accounts(id) ON DELETE CASCADE,
  to_account_id uuid,
  is_recurring boolean DEFAULT false,
  recurrence_type text
);

CREATE TABLE public.budgets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category text NOT NULL,
  limit_amount numeric NOT NULL,
  month text NOT NULL
);

CREATE TABLE public.chart_of_accounts (
  code text PRIMARY KEY,
  name text NOT NULL,
  type text NOT NULL,
  normal_balance text NOT NULL,
  is_system boolean DEFAULT false,
  description text
);

CREATE TABLE public.journal_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date text NOT NULL,
  number text NOT NULL,
  description text NOT NULL,
  lines jsonb NOT NULL,
  created_at bigint NOT NULL,
  transaction_id uuid,
  is_automatic boolean DEFAULT false
);

CREATE TABLE public.company_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  address text NOT NULL,
  email text NOT NULL,
  phone text NOT NULL
);
