import client from '../api/client';

export const getProveedoresRequest = async () => {
  const { data } = await client.get('/proveedores');
  return data;
};

export const createProveedorRequest = async (proveedor) => {
  const { data } = await client.post('/proveedores', proveedor);
  return data;
};

export const updateProveedorRequest = async (id, proveedor) => {
  const { data } = await client.put(`/proveedores/${id}`, proveedor);
  return data;
};

export const deleteProveedorRequest = async (id) => {
  const { data } = await client.delete(`/proveedores/${id}`);
  return data;
};

export const getHistoricoProveedorRequest = async (id) => {
  const { data } = await client.get(`/proveedores/${id}/historico`);
  return data;
};

export const getRazonesSocialesRequest = async (proveedorId) => {
  const { data } = await client.get(
    `/proveedores/${proveedorId}/razones-sociales`
  );
  return data;
};

export const createRazonSocialRequest = async (
  proveedorId,
  razonSocial
) => {
  const { data } = await client.post(
    `/proveedores/${proveedorId}/razones-sociales`,
    razonSocial
  );
  return data;
};

export const updateRazonSocialRequest = async (
  id,
  razonSocial
) => {
  const { data } = await client.put(
    `/proveedores/razones-sociales/${id}`,
    razonSocial
  );
  return data;
};

export const deleteRazonSocialRequest = async (id) => {
  const { data } = await client.delete(
    `/proveedores/razones-sociales/${id}`
  );
  return data;
};

export const getHistoricoRazonSocialRequest = async (id) => {
  const { data } = await client.get(
    `/proveedores/razones-sociales/${id}/historico`
  );
  return data;
};
