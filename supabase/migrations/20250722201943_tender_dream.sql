/*
  # Sistema de Gerenciamento de Tempo de Contrato

  1. Modificações na Tabela
    - Adicionar campos de contrato na tabela tenants
    - contract_start_date: Data de início do contrato
    - contract_duration_days: Duração do contrato em dias
    - contract_end_date: Data de fim do contrato (calculada)
    - contract_status: Status do contrato (active, expired, suspended)
    - contract_notifications_sent: Notificações enviadas

  2. Funções
    - Função para calcular data de expiração
    - Função para verificar status do contrato
    - Função para atualizar contratos expirados

  3. Triggers
    - Trigger para calcular automaticamente a data de fim
    - Trigger para atualizar status quando necessário
*/

-- Adicionar campos de contrato à tabela tenants
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS contract_start_date timestamptz DEFAULT now();
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS contract_duration_days integer DEFAULT 30;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS contract_end_date timestamptz;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS contract_status text DEFAULT 'active' CHECK (contract_status IN ('active', 'expired', 'suspended', 'trial'));
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS contract_notifications_sent jsonb DEFAULT '{}';

-- Função para calcular data de fim do contrato
CREATE OR REPLACE FUNCTION calculate_contract_end_date(start_date timestamptz, duration_days integer)
RETURNS timestamptz
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT start_date + (duration_days || ' days')::interval;
$$;

-- Função para verificar e atualizar status dos contratos
CREATE OR REPLACE FUNCTION update_contract_status()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Atualizar contratos expirados
  UPDATE tenants 
  SET 
    contract_status = 'expired',
    updated_at = now()
  WHERE 
    contract_end_date < now() 
    AND contract_status = 'active';
    
  -- Atualizar contratos que voltaram a ser ativos (se a data foi estendida)
  UPDATE tenants 
  SET 
    contract_status = 'active',
    updated_at = now()
  WHERE 
    contract_end_date > now() 
    AND contract_status = 'expired';
END;
$$;

-- Trigger para calcular automaticamente a data de fim do contrato
CREATE OR REPLACE FUNCTION trigger_calculate_contract_end_date()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  -- Calcular data de fim quando start_date ou duration_days mudarem
  IF (TG_OP = 'INSERT') OR 
     (OLD.contract_start_date IS DISTINCT FROM NEW.contract_start_date) OR
     (OLD.contract_duration_days IS DISTINCT FROM NEW.contract_duration_days) THEN
    
    NEW.contract_end_date := calculate_contract_end_date(
      NEW.contract_start_date, 
      NEW.contract_duration_days
    );
    
    -- Atualizar status baseado na nova data
    IF NEW.contract_end_date > now() THEN
      NEW.contract_status := 'active';
    ELSE
      NEW.contract_status := 'expired';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Criar trigger
DROP TRIGGER IF EXISTS calculate_contract_end_date_trigger ON tenants;
CREATE TRIGGER calculate_contract_end_date_trigger
  BEFORE INSERT OR UPDATE ON tenants
  FOR EACH ROW
  EXECUTE FUNCTION trigger_calculate_contract_end_date();

-- Função para obter informações do contrato
CREATE OR REPLACE FUNCTION get_contract_info(tenant_uuid uuid)
RETURNS TABLE(
  tenant_id uuid,
  tenant_name text,
  contract_start_date timestamptz,
  contract_end_date timestamptz,
  contract_duration_days integer,
  contract_status text,
  days_remaining integer,
  is_expired boolean,
  days_since_expiry integer
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    t.id,
    t.name,
    t.contract_start_date,
    t.contract_end_date,
    t.contract_duration_days,
    t.contract_status,
    CASE 
      WHEN t.contract_end_date > now() THEN 
        EXTRACT(days FROM (t.contract_end_date - now()))::integer
      ELSE 0
    END as days_remaining,
    (t.contract_end_date < now()) as is_expired,
    CASE 
      WHEN t.contract_end_date < now() THEN 
        EXTRACT(days FROM (now() - t.contract_end_date))::integer
      ELSE 0
    END as days_since_expiry
  FROM tenants t
  WHERE t.id = tenant_uuid;
END;
$$;

-- Função para estender contrato
CREATE OR REPLACE FUNCTION extend_contract(
  tenant_uuid uuid,
  additional_days integer,
  admin_user_id uuid DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  tenant_record tenants%ROWTYPE;
  new_end_date timestamptz;
BEGIN
  -- Verificar se o tenant existe
  SELECT * INTO tenant_record FROM tenants WHERE id = tenant_uuid;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Loja não encontrada'
    );
  END IF;
  
  -- Calcular nova data de fim
  IF tenant_record.contract_end_date > now() THEN
    -- Se ainda não expirou, adicionar aos dias restantes
    new_end_date := tenant_record.contract_end_date + (additional_days || ' days')::interval;
  ELSE
    -- Se já expirou, adicionar a partir de hoje
    new_end_date := now() + (additional_days || ' days')::interval;
  END IF;
  
  -- Atualizar contrato
  UPDATE tenants 
  SET 
    contract_end_date = new_end_date,
    contract_duration_days = EXTRACT(days FROM (new_end_date - contract_start_date))::integer,
    contract_status = 'active',
    updated_at = now()
  WHERE id = tenant_uuid;
  
  -- Log da extensão (poderia ser uma tabela de auditoria)
  INSERT INTO tenant_metrics (tenant_id, metric_date, created_at)
  VALUES (tenant_uuid, CURRENT_DATE, now())
  ON CONFLICT (tenant_id, metric_date) DO NOTHING;
  
  RETURN jsonb_build_object(
    'success', true,
    'message', 'Contrato estendido com sucesso',
    'new_end_date', new_end_date,
    'days_added', additional_days
  );
END;
$$;

-- Atualizar tenants existentes com dados de contrato padrão
UPDATE tenants 
SET 
  contract_start_date = COALESCE(contract_start_date, created_at),
  contract_duration_days = COALESCE(contract_duration_days, 30)
WHERE contract_start_date IS NULL OR contract_duration_days IS NULL;

-- Executar atualização inicial de status
SELECT update_contract_status();

-- Conceder permissões
GRANT EXECUTE ON FUNCTION calculate_contract_end_date(timestamptz, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION update_contract_status() TO authenticated;
GRANT EXECUTE ON FUNCTION get_contract_info(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION extend_contract(uuid, integer, uuid) TO authenticated;