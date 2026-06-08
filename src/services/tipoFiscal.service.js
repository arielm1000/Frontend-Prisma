import client from '../api/client';

export const getTiposFiscalesRequest =
  async () => {
    const response =
      await client.get(
        '/tipos-fiscales'
      );
    return response.data;
};