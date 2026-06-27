-- Security Advisor: Function Search Path Mutable 対策
ALTER FUNCTION public.update_updated_at() SET search_path = public, pg_temp;
