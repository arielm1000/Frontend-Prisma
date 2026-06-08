import client from '../api/client';

export const getTransportesRequest = async () => {
  const { data } = await client.get('/transportes');
  return data;
};

export const createTransporteRequest = async (transporte) => {
  const { data } = await client.post('/transportes', transporte);
  return data;
};

export const updateTransporteRequest = async (id, transporte) => {
  const { data } = await client.put(`/transportes/${id}`, transporte);
  return data;
};

export const deleteTransporteRequest = async (id) => {
  const { data } = await client.delete(`/transportes/${id}`);
  return data;
};

export const getHistoricoTransporteRequest = async (id) => {
  const { data } = await client.get(`/transportes/${id}/historico`);
  return data;
};
