import client from '../api/client';

// =========================
// OBTENER EMPRESAS
// =========================
export const getEmpresasRequest =
  async () => {
    const response =
      await client.get(
        '/empresas'
      );
    return response.data;
};

// =========================
// CREAR EMPRESA
// =========================
export const createEmpresaRequest =
  async (empresa) => {
    const response =
      await client.post(
        '/empresas',
        empresa
      );
    return response.data;
};

// =========================
// ACTUALIZAR EMPRESA
// =========================
export const updateEmpresaRequest =
  async (
    id,
    empresa
  ) => {
    const response =
      await client.put(
        `/empresas/${id}`,
        empresa
      );
    return response.data;
};

// =========================
// ELIMINAR EMPRESA
// =========================
export const deleteEmpresaRequest =
  async (id) => {
    const response =
      await client.delete(
        `/empresas/${id}`
      );
    return response.data;
};

// =========================
// HISTORIAL
// =========================
export const getHistoricoEmpresaRequest =
  async (id) => {
    const response =
      await client.get(
        `/empresas/${id}/historico`
      );
    return response.data;
};