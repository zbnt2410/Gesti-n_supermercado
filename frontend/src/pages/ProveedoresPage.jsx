import React from "react";
import DiasPedido from "../components/proveedores/DiasPedido";
import PagosProveedores from "../components/proveedores/PagosProveedores";
import Pedidos from "../components/proveedores/Pedidos";
import CrearProveedor from "../components/proveedores/CrearProveedor";
import Facturas from "../components/proveedores/Facturas";

const ProveedoresPage = ({ activeSubsection, selectedProveedorId }) => {
  const renderContent = () => {
    switch (activeSubsection) {
      case "dias-pedido":
        return <DiasPedido proveedorId={selectedProveedorId} />;
      case "calendario":
        return <CalendarioProveedores />;
      case "pagos":
        return <PagosProveedores />;
      case "pedidos":
        return <Pedidos />;
      case "facturas":
        return <Facturas />;
      case "crear":
        return <CrearProveedor />;
      default:
        return (
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              Sección Proveedores
            </h2>
            <p className="text-gray-600">
              Selecciona una subsección del menú lateral
            </p>
          </div>
        );
    }
  };

  const mostrarHeader = !activeSubsection;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-indigo-50">
      {mostrarHeader && (
        <div className="mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
            Gestión de Proveedores
          </h1>
          <p className="text-gray-600">
            Administra calendario, pagos, pedidos, facturas y creación de proveedores
          </p>
        </div>
      )}

      {renderContent()}
    </div>
  );
};

export default ProveedoresPage;