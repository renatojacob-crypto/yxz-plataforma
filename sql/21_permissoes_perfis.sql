-- =========================================================
-- PORTAL YXZ 2.0
-- 21_permissoes_perfis.sql
--
-- Registra a correcao das permissoes aplicada ao Supabase.
--
-- Escalas:
--   Administrador Master, Administrador,
--   Educador Social e Coordenador.
--
-- Relatorios e faturamento:
--   Somente Administrador Master e Administrador.
--
-- Gestao de usuarios:
--   Continua controlada por can_manage_users(),
--   alterada anteriormente, e nao e modificada aqui.
--
-- Este arquivo modifica apenas cinco funcoes de autorizacao.
-- Nao altera registros, usuarios ou politicas RLS.
-- =========================================================

BEGIN;

-- 1. Visualizar escalas

CREATE OR REPLACE FUNCTION public.can_view_schedules()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO ''
AS $function$
    SELECT EXISTS (
        SELECT 1
        FROM public.profiles p
        WHERE p.id = (SELECT auth.uid())
          AND p.ativo IS TRUE
          AND p.perfil::text IN (
              'administrador_master',
              'administrador',
              'educador_social',
              'coordenador'
          )
    );
$function$;


-- 2. Gerenciar escalas

CREATE OR REPLACE FUNCTION public.can_manage_schedules()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO ''
AS $function$
    SELECT EXISTS (
        SELECT 1
        FROM public.profiles p
        WHERE p.id = (SELECT auth.uid())
          AND p.ativo IS TRUE
          AND p.perfil::text IN (
              'administrador_master',
              'administrador',
              'educador_social',
              'coordenador'
          )
    );
$function$;


-- 3. Visualizar relatorios
-- Permissao independente da visualizacao de escalas.

CREATE OR REPLACE FUNCTION public.can_view_reports()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO ''
AS $function$
    SELECT EXISTS (
        SELECT 1
        FROM public.profiles p
        WHERE p.id = (SELECT auth.uid())
          AND p.ativo IS TRUE
          AND p.perfil::text IN (
              'administrador_master',
              'administrador'
          )
    );
$function$;


-- 4. Visualizar faturamento
-- Permissao independente de escalas e relatorios.

CREATE OR REPLACE FUNCTION public.can_view_billing()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO ''
AS $function$
    SELECT EXISTS (
        SELECT 1
        FROM public.profiles p
        WHERE p.id = (SELECT auth.uid())
          AND p.ativo IS TRUE
          AND p.perfil::text IN (
              'administrador_master',
              'administrador'
          )
    );
$function$;


-- 5. Gerenciar faturamento
-- Permissao independente do gerenciamento de escalas.

CREATE OR REPLACE FUNCTION public.can_manage_billing()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO ''
AS $function$
    SELECT EXISTS (
        SELECT 1
        FROM public.profiles p
        WHERE p.id = (SELECT auth.uid())
          AND p.ativo IS TRUE
          AND p.perfil::text IN (
              'administrador_master',
              'administrador'
          )
    );
$function$;

COMMIT;