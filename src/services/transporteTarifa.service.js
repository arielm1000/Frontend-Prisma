import client from '../api/client';

export const getTransporteTarifasRequest = async (params = {}) => {
  const { data } = await client.get('/transportes-tarifas', {
    params
  });
  return data;
};

export const createTransporteTarifaRequest = async (tarifa) => {
  const { data } = await client.post('/transportes-tarifas', tarifa);
  return data;
};

export const updateTransporteTarifaRequest = async (id, tarifa) => {
  const { data } = await client.put(`/transportes-tarifas/${id}`, tarifa);
  return data;
};

export const deleteTransporteTarifaRequest = async (id) => {
  const { data } = await client.delete(`/transportes-tarifas/${id}`);
  return data;
};
