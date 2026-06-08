import client from '../api/client';

export const getRubrosRequest = async () => {
  const { data } = await client.get('/rubros');
  return data;
};

export const createRubroRequest = async (rubro) => {
  const { data } = await client.post('/rubros', rubro);
  return data;
};

export const updateRubroRequest = async (id, rubro) => {
  const { data } = await client.put(`/rubros/${id}`, rubro);
  return data;
};

export const deleteRubroRequest = async (id) => {
  const { data } = await client.delete(`/rubros/${id}`);
  return data;
};

export const getHistoricoRubroRequest = async (id) => {
  const { data } = await client.get(`/rubros/${id}/historico`);
  return data;
};
