import client from '../api/client';

export const getGuiasTransporteRequest = async (params = {}) => {
  const { data } = await client.get('/guias-transporte', {
    params
  });
  return data;
};

export const createGuiaTransporteRequest = async (guia) => {
  const { data } = await client.post('/guias-transporte', guia);
  return data;
};

export const updateGuiaTransporteRequest = async (id, guia) => {
  const { data } = await client.put(`/guias-transporte/${id}`, guia);
  return data;
};

export const confirmarGuiaTransporteRequest = async (id) => {
  const { data } = await client.patch(`/guias-transporte/${id}/confirmar`);
  return data;
};

export const anularGuiaTransporteRequest = async (id) => {
  const { data } = await client.patch(`/guias-transporte/${id}/anular`);
  return data;
};
