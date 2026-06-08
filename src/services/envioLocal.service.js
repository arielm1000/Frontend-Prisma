import client from '../api/client';

export const getEnviosLocalesRequest = async (params = {}) => {
  const { data } = await client.get('/envios-locales', {
    params
  });
  return data;
};

export const getEnvioLocalRequest = async (id) => {
  const { data } = await client.get(`/envios-locales/${id}`);
  return data;
};

export const createEnvioLocalRequest = async (envio) => {
  const { data } = await client.post('/envios-locales', envio);
  return data;
};

export const recibirEnvioLocalRequest = async (id, recepcion) => {
  const { data } = await client.patch(`/envios-locales/${id}/recibir`, recepcion);
  return data;
};

export const resolverDiferenciaEnvioLocalRequest = async (detalleId, resolucion) => {
  const { data } = await client.post(
    `/envios-locales/detalles/${detalleId}/resolver-diferencia`,
    resolucion
  );
  return data;
};
