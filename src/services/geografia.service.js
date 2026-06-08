import client from '../api/client';

export const getProvinciasRequest = async () => {
    const response = await client.get('/geografia/provincias');
    return response.data;
};

export const getLocalidadesRequest = async (provinciaCodigo) => {
    const response = await client.get(`/geografia/localidades/${provinciaCodigo}`);
    return response.data;
};

