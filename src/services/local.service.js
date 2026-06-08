import client from '../api/client';

// LISTAR
export const getLocalesRequest = async () => {
  const response = await client.get('/locales');
  return response.data;
};

// CREAR
export const createLocalRequest = async (local) => {
  const response = await client.post('/locales', local);
  return response.data;
};

// ACTUALIZAR
export const updateLocalRequest = async (id, local) => {
  const response = await client.put(`/locales/${id}`, local);
  return response.data;
};

// ELIMINAR
export const deleteLocalRequest = async (id) => {
  const response = await client.delete(`/locales/${id}`);
  return response.data;
};

// HISTÓRICO
export const getHistoricoLocalRequest = async (id) => {
  const response = await client.get(`/locales/${id}/historico`);
  return response.data;
};