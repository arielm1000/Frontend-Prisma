import client from '../api/client';

export const loginRequest = async (data) => {

  const response = await client.post(
    '/auth/login',
    data
  );

  return response.data;

};