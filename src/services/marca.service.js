import client from '../api/client';

export const getMarcasRequest = async () => {
  const { data } = await client.get('/marcas');
  return data;
};

export const createMarcaRequest = async (marca) => {
  const { data } = await client.post('/marcas', marca);
  return data;
};

export const updateMarcaRequest = async (id, marca) => {
  const { data } = await client.put(`/marcas/${id}`, marca);
  return data;
};

export const deleteMarcaRequest = async (id) => {
  const { data } = await client.delete(`/marcas/${id}`);
  return data;
};

export const getHistoricoMarcaRequest = async (id) => {
  const { data } = await client.get(`/marcas/${id}/historico`);
  return data;
};
