import client from '../api/client';

export const getRecepcionesPedidoProveedorRequest = async (params = {}) => {
  const { data } = await client.get('/recepciones-pedidos-proveedor', {
    params
  });
  return data;
};

export const createRecepcionPedidoProveedorRequest = async (recepcion) => {
  const { data } = await client.post('/recepciones-pedidos-proveedor', recepcion);
  return data;
};

export const aprobarControlRecepcionPedidoProveedorRequest = async (
  id,
  control = {}
) => {
  const { data } = await client.patch(
    `/recepciones-pedidos-proveedor/${id}/aprobar-control`,
    control
  );
  return data;
};

export const resolverGestionAdministrativaRecepcionRequest = async (
  id,
  gestion
) => {
  const { data } = await client.patch(
    `/recepciones-pedidos-proveedor/${id}/resolver-gestion-administrativa`,
    gestion
  );
  return data;
};

export const corregirFacturaRecepcionRequest = async (id, factura) => {
  const { data } = await client.patch(
    `/recepciones-pedidos-proveedor/${id}/corregir-factura`,
    factura
  );
  return data;
};

export const getHistoricoRecepcionPedidoProveedorRequest = async (id) => {
  const { data } = await client.get(
    `/recepciones-pedidos-proveedor/${id}/historico`
  );
  return data;
};
