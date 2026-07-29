-- Helper
create or replace function public.get_my_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select role from public.profiles where id = auth.uid() and active = true limit 1;
$$;

-- Profiles
drop policy if exists "profile self read" on public.profiles;
create policy "profile self read" on public.profiles
for select to authenticated
using (id = auth.uid() or public.get_my_role() = 'doctor');

-- Case papers: doctor full control; receptionist no access
drop policy if exists "doctor case paper select" on public.case_papers;
create policy "doctor case paper select" on public.case_papers
for select to authenticated using (public.get_my_role() = 'doctor');

drop policy if exists "doctor case paper insert" on public.case_papers;
create policy "doctor case paper insert" on public.case_papers
for insert to authenticated with check (public.get_my_role() = 'doctor');

drop policy if exists "doctor case paper update" on public.case_papers;
create policy "doctor case paper update" on public.case_papers
for update to authenticated using (public.get_my_role() = 'doctor') with check (public.get_my_role() = 'doctor');

drop policy if exists "doctor case paper delete" on public.case_papers;
create policy "doctor case paper delete" on public.case_papers
for delete to authenticated using (public.get_my_role() = 'doctor');

-- Medicines: doctor full control; receptionist may read for inventory UI only if needed
drop policy if exists "doctor medicines all" on public.medicines;
create policy "doctor medicines all" on public.medicines
for all to authenticated using (public.get_my_role() = 'doctor') with check (public.get_my_role() = 'doctor');

-- Prescription items: doctor only
drop policy if exists "doctor prescription items all" on public.prescription_items;
create policy "doctor prescription items all" on public.prescription_items
for all to authenticated using (public.get_my_role() = 'doctor') with check (public.get_my_role() = 'doctor');

-- Notifications: user can read/update own; doctor can insert
drop policy if exists "own notifications read" on public.notifications;
create policy "own notifications read" on public.notifications
for select to authenticated using (user_id = auth.uid());

drop policy if exists "own notifications update" on public.notifications;
create policy "own notifications update" on public.notifications
for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "doctor notifications insert" on public.notifications;
create policy "doctor notifications insert" on public.notifications
for insert to authenticated with check (public.get_my_role() = 'doctor');

-- Call events: doctor sends; receptionist receives
drop policy if exists "doctor call insert" on public.patient_call_events;
create policy "doctor call insert" on public.patient_call_events
for insert to authenticated with check (public.get_my_role() = 'doctor');

drop policy if exists "doctor call read" on public.patient_call_events;
create policy "doctor call read" on public.patient_call_events
for select to authenticated using (public.get_my_role() = 'doctor');

drop policy if exists "reception call read" on public.patient_call_events;
create policy "reception call read" on public.patient_call_events
for select to authenticated using (public.get_my_role() = 'receptionist');

drop policy if exists "reception call update" on public.patient_call_events;
create policy "reception call update" on public.patient_call_events
for update to authenticated using (public.get_my_role() = 'receptionist') with check (public.get_my_role() = 'receptionist');

-- Audit: doctor can read; application can insert through server-side trusted logic later
drop policy if exists "doctor audit read" on public.audit_logs;
create policy "doctor audit read" on public.audit_logs
for select to authenticated using (public.get_my_role() = 'doctor');

-- Enable Realtime Broadcast authorization for the private clinic topic.
drop policy if exists "authenticated realtime receive" on realtime.messages;
create policy "authenticated realtime receive" on realtime.messages
for select to authenticated using (true);
