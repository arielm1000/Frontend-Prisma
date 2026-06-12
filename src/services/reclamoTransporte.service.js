import client from '../api/client';

export const getReclamosTransporteRequest = async (params = {}) => {
  const { data } = await client.get('/reclamos-transporte', {
    params
  });
  return data;
};

export const createReclamoTransporteRequest = async (reclamo) => {
  const { data } = await client.post('/reclamos-transporte', reclamo);
  return data;
};

export const resolverReclamoTransporteRequest = async (id, resolucion) => {
  const { data } = await client.patch(
    `/reclamos-transporte/${id}/resolver`,
    resolucion
  );
  return data;
};
