import client from '../api/client';

// =========================
// LISTAR USUARIOS
// =========================
export const getUsersRequest = async () => {
  const response = await client.get('/users');
  return response.data;
};

// =========================
// CREAR USUARIO
// =========================
export const createUserRequest = async (data) => {
  const response = await client.post(
    '/users',
    data
  );
  return response.data;
};

// =========================
// ACTUALIZAR USUARIO
// =========================
export const updateUserRequest = async (
  id,
  data
) => {
  const response = await client.put(
    `/users/${id}`,
    data
  );
  return response.data;
};

// =========================
// ELIMINAR USUARIO
// =========================
export const deleteUserRequest = async (
  id
) => {
  const response = await client.delete(
    `/users/${id}`
  );
  return response.data;
};