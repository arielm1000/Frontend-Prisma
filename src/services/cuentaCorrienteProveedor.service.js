import client from '../api/client';

export const getCuentaCorrienteProveedorRequest = async (params = {}) => {
  const { data } = await client.get('/cuenta-corriente-proveedores', {
    params
  });
  return data;
};

export const getResumenCuentaCorrienteProveedorRequest = async (params = {}) => {
  const { data } = await client.get('/cuenta-corriente-proveedores/resumen', {
    params
  });
  return data;
};

export const createCuentaCorrienteProveedorMovimientoRequest = async (
  movimiento
) => {
  const { data } = await client.post(
    '/cuenta-corriente-proveedores',
    movimiento
  );
  return data;
};

export const anularCuentaCorrienteProveedorMovimientoRequest = async (id) => {
  const { data } = await client.patch(
    `/cuenta-corriente-proveedores/${id}/anular`
  );
  return data;
};
