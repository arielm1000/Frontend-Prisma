import client from '../api/client';

export const getPedidosProveedorRequest = async (params = {}) => {
  const { data } = await client.get('/pedidos-proveedor', {
    params
  });
  return data;
};

export const getResumenPedidosProveedorRequest = async (params = {}) => {
  const { data } = await client.get('/pedidos-proveedor/resumen', {
    params
  });
  return data;
};

export const createPedidoProveedorRequest = async (pedido) => {
  const { data } = await client.post('/pedidos-proveedor', pedido);
  return data;
};

export const updatePedidoProveedorRequest = async (id, pedido) => {
  const { data } = await client.put(`/pedidos-proveedor/${id}`, pedido);
  return data;
};

export const enviarPedidoProveedorRequest = async (id) => {
  const { data } = await client.patch(`/pedidos-proveedor/${id}/enviar`);
  return data;
};

export const confirmarPedidoProveedorRequest = async (id) => {
  const { data } = await client.patch(`/pedidos-proveedor/${id}/confirmar`);
  return data;
};

export const cancelarPedidoProveedorRequest = async (id) => {
  const { data } = await client.patch(`/pedidos-proveedor/${id}/cancelar`);
  return data;
};

export const reactivarPedidoProveedorRequest = async (id) => {
  const { data } = await client.patch(`/pedidos-proveedor/${id}/reactivar`);
  return data;
};

export const cancelarPendientePedidoProveedorRequest = async (id, payload) => {
  const { data } = await client.patch(
    `/pedidos-proveedor/${id}/cancelar-pendiente`,
    payload
  );
  return data;
};

export const getHistoricoPedidoProveedorRequest = async (id) => {
  const { data } = await client.get(`/pedidos-proveedor/${id}/historico`);
  return data;
};
