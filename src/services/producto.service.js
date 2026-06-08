import client from '../api/client';

export const getProductosRequest = async (params = {}) => {
  const { data } = await client.get('/productos', {
    params
  });
  return data;
};

export const createProductoRequest = async (producto) => {
  const { data } = await client.post('/productos', producto);
  return data;
};

export const updateProductoRequest = async (id, producto) => {
  const { data } = await client.put(`/productos/${id}`, producto);
  return data;
};

export const deleteProductoRequest = async (id) => {
  const { data } = await client.delete(`/productos/${id}`);
  return data;
};

export const getHistoricoProductoRequest = async (id) => {
  const { data } = await client.get(`/productos/${id}/historico`);
  return data;
};

export const updateStockProductoRequest = async (id, stock) => {
  const { data } = await client.put(`/productos/${id}/stock`, stock);
  return data;
};
