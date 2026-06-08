import client from '../api/client';

export const getRoles = async () => {
  const { data } = await client.get('/roles');
  return data;
};

export const createRole = async (role) => {
  const { data } = await client.post('/roles', role );
  return data;
};

export const updateRole = async (id, role) => {
  const { data } = await client.put(`/roles/${id}`, role);
  return data;
};

export const deleteRole = async (id) => {
  const { data } = await client.delete(`/roles/${id}`);
  return data;
};

