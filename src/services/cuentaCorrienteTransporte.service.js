import client from '../api/client';

export const getCuentaCorrienteTransporteRequest = async (params = {}) => {
  const { data } = await client.get('/cuenta-corriente-transportes', {
    params
  });
  return data;
};

export const getResumenCuentaCorrienteTransporteRequest = async (
  params = {}
) => {
  const { data } = await client.get('/cuenta-corriente-transportes/resumen', {
    params
  });
  return data;
};

export const createCuentaCorrienteTransporteMovimientoRequest = async (
  movimiento
) => {
  const { data } = await client.post(
    '/cuenta-corriente-transportes',
    movimiento
  );
  return data;
};

export const anularCuentaCorrienteTransporteMovimientoRequest = async (id) => {
  const { data } = await client.patch(
    `/cuenta-corriente-transportes/${id}/anular`
  );
  return data;
};
