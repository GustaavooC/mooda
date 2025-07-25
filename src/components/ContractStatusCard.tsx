import React from 'react';
import { Calendar, Clock, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { useContract } from '../hooks/useContract';

interface ContractStatusCardProps {
  tenantId: string;
  showDetails?: boolean;
}

const ContractStatusCard: React.FC<ContractStatusCardProps> = ({ 
  tenantId, 
  showDetails = true 
}) => {
  const { 
    contractInfo, 
    loading, 
    error, 
    getContractStatusColor, 
    getContractStatusText, 
    formatDaysRemaining 
  } = useContract(tenantId);

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
          <div className="h-6 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  if (error || !contractInfo) {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center gap-2 text-gray-500">
          <XCircle className="w-5 h-5" />
          <span>Erro ao carregar informações do contrato</span>
        </div>
      </div>
    );
  }

  const isExpired = contractInfo.is_expired;
  const isExpiringSoon = contractInfo.days_remaining <= 7 && !isExpired;

  const getIcon = () => {
    if (isExpired) return <XCircle className="w-5 h-5" />;
    if (isExpiringSoon) return <AlertTriangle className="w-5 h-5" />;
    return <CheckCircle className="w-5 h-5" />;
  };

  const getCardColor = () => {
    if (isExpired) return 'border-red-200 bg-red-50';
    if (isExpiringSoon) return 'border-yellow-200 bg-yellow-50';
    return 'border-green-200 bg-green-50';
  };

  return (
    <div className={`rounded-lg shadow-sm border p-6 ${getCardColor()}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          {getIcon()}
          <h3 className="text-lg font-semibold text-gray-900">Status do Contrato</h3>
        </div>
        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getContractStatusColor(contractInfo.contract_status)}`}>
          {getContractStatusText(contractInfo.contract_status)}
        </span>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-gray-600">Tempo restante:</span>
          <span className={`font-semibold ${isExpired ? 'text-red-600' : isExpiringSoon ? 'text-yellow-600' : 'text-green-600'}`}>
            {formatDaysRemaining(
              isExpired ? contractInfo.days_since_expiry : contractInfo.days_remaining,
              isExpired
            )}
          </span>
        </div>

        {showDetails && (
          <>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Data de início:</span>
              <span className="font-medium">
                {new Date(contractInfo.contract_start_date).toLocaleDateString('pt-BR')}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-gray-600">Data de expiração:</span>
              <span className="font-medium">
                {new Date(contractInfo.contract_end_date).toLocaleDateString('pt-BR')}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-gray-600">Duração do contrato:</span>
              <span className="font-medium">
                {contractInfo.contract_duration_days} dias
              </span>
            </div>
          </>
        )}

        {isExpired && (
          <div className="mt-4 p-4 bg-red-100 border border-red-200 rounded-lg">
            <div className="flex items-center gap-2 text-red-800">
              <AlertTriangle className="w-5 h-5" />
              <span className="font-medium">Fatura vencida</span>
            </div>
            <p className="text-red-700 text-sm mt-1">
              Entre em contato com o suporte para renovar seu plano.
            </p>
          </div>
        )}

        {isExpiringSoon && (
          <div className="mt-4 p-4 bg-yellow-100 border border-yellow-200 rounded-lg">
            <div className="flex items-center gap-2 text-yellow-800">
              <Clock className="w-5 h-5" />
              <span className="font-medium">Contrato expirando em breve</span>
            </div>
            <p className="text-yellow-700 text-sm mt-1">
              Renove seu plano para continuar usando todos os recursos.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ContractStatusCard;