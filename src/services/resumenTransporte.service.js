import client from '../api/client';

export const getResumenesTransporteRequest = async (params = {}) => {
  const { data } = await client.get('/resumenes-transporte', {
    params
  });
  return data;
};

export const createResumenTransporteRequest = async (resumen) => {
  const { data } = await client.post('/resumenes-transporte', resumen);
  return data;
};

export const updateResumenTransporteRequest = async (id, resumen) => {
  const { data } = await client.put(`/resumenes-transporte/${id}`, resumen);
  return data;
};

export const confirmarResumenTransporteRequest = async (id) => {
  const { data } = await client.patch(`/resumenes-transporte/${id}/confirmar`);
  return data;
};

export const anularResumenTransporteRequest = async (id) => {
  const { data } = await client.patch(`/resumenes-transporte/${id}/anular`);
  return data;
};

export const reactivarResumenTransporteRequest = async (id) => {
  const { data } = await client.patch(`/resumenes-transporte/${id}/reactivar`);
  return data;
};

export const createPagoResumenTransporteRequest = async (id, pago) => {
  const { data } = await client.post(`/resumenes-transporte/${id}/pagos`, pago);
  return data;
};

export const anularPagoResumenTransporteRequest = async (pagoId) => {
  const { data } = await client.patch(`/resumenes-transporte/pagos/${pagoId}/anular`);
  return data;
};
