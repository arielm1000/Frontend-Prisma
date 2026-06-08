import client from '../api/client';

export const getSegmentosRequest = async () => {
  const { data } = await client.get('/segmentos');
  return data;
};

export const createSegmentoRequest = async (segmento) => {
  const { data } = await client.post('/segmentos', segmento);
  return data;
};

export const updateSegmentoRequest = async (id, segmento) => {
  const { data } = await client.put(`/segmentos/${id}`, segmento);
  return data;
};

export const deleteSegmentoRequest = async (id) => {
  const { data } = await client.delete(`/segmentos/${id}`);
  return data;
};

export const getHistoricoSegmentoRequest = async (id) => {
  const { data } = await client.get(`/segmentos/${id}/historico`);
  return data;
};
