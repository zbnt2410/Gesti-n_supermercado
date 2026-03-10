import React, { useEffect, useState, useCallback } from 'react';
import { Send, CreditCard, FileText } from 'lucide-react';
import EnviosComponent from '../components/caja/Envios';
import TransferenciasComponent from '../components/caja/Transferencias';
import FiadosComponent from '../components/caja/Fiados';
import { cajaService } from '../services/cajaService';
import { formatCurrency } from '../utils/formatters';

const CajaPage = ({ activeSubsection }) => {
  const [resumen, setResumen] = useState(null);

  // función reutilizable
  const fetchData = useCallback(async () => {
    try {
      const [enviosRes, transferenciasRes, fiadosRes] = await Promise.all([
        cajaService.getEnvios(),
        cajaService.getTransferencias(),
        cajaService.getFiados(),
      ]);

      const envios = enviosRes.envios || [];
      const transferencias = transferenciasRes.transferencias || [];
      const fiados = fiadosRes.fiados || [];

      setResumen({
        enviosTotal: envios.reduce((sum, e) => sum + parseFloat(e.monto), 0),
        enviosCount: envios.length,
        transferenciasTotal: transferencias.reduce((sum, t) => sum + parseFloat(t.monto), 0),
        transferenciasCount: transferencias.length,
        fiadosTotal: fiados.reduce((sum, f) => sum + parseFloat(f.monto), 0),
        fiadosCount: fiados.length,
      });
    } catch (error) {
      console.error("Error al cargar resumen:", error);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const renderContent = () => {
    switch (activeSubsection) {
      case 'envios':
        return <EnviosComponent onChange={fetchData} />;
      case 'transferencias':
        return <TransferenciasComponent onChange={fetchData} />;
      case 'fiados':
        return <FiadosComponent onChange={fetchData} />;
      default:
        return (
          <div className="bg-white rounded-2xl shadow-xl p-12 text-center">
            <h2 className="text-4xl font-bold text-gray-800 mb-4">Sección Caja</h2>
            <p className="text-xl text-gray-600 mb-6">
              Selecciona una subsección del menú lateral
            </p>

            {resumen ? (
              <div className="grid grid-cols-1 md:grid-cols-1 gap-40 mt-20">
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-xl border-2 border-blue-200">
                  <h3 className="text-xl font-bold text-blue-800 mb-2 flex items-center gap-2">
                    <Send className="text-blue-600" /> Envíos
                  </h3>
                  <p className="text-gray-600">Total: {formatCurrency(resumen.enviosTotal)}</p>
                  <p className="text-gray-500 text-sm">Cantidad: {resumen.enviosCount}</p>
                </div>

                <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-6 rounded-xl border-2 border-green-200">
                  <h3 className="text-xl font-bold text-green-800 mb-2 flex items-center gap-2">
                    <CreditCard className="text-green-600" /> Transferencias
                  </h3>
                  <p className="text-gray-600">Total: {formatCurrency(resumen.transferenciasTotal)}</p>
                  <p className="text-gray-500 text-sm">Cantidad: {resumen.transferenciasCount}</p>
                </div>

                <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-6 rounded-xl border-2 border-purple-200">
                  <h3 className="text-xl font-bold text-purple-800 mb-2 flex items-center gap-2">
                    <FileText className="text-purple-600" /> Fiados
                  </h3>
                  <p className="text-gray-600">Total: {formatCurrency(resumen.fiadosTotal)}</p>
                  <p className="text-gray-500 text-sm">Cantidad: {resumen.fiadosCount}</p>
                </div>
              </div>
            ) : (
              <p className="text-gray-500">Cargando resumen...</p>
            )}
          </div>
        );
    }
  };

  return renderContent();
};

export default CajaPage;