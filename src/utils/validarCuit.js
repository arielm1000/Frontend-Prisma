export const limpiarCuit = (cuit = '') =>
  cuit.replace(/\D/g, '').slice(0, 11);

export const formatearCuit = (cuit = '') => {
  const cuitLimpio = limpiarCuit(cuit);

  if (cuitLimpio.length <= 2) {
    return cuitLimpio;
  }

  if (cuitLimpio.length <= 10) {
    return `${cuitLimpio.slice(0, 2)}-${cuitLimpio.slice(2)}`;
  }

  return `${cuitLimpio.slice(0, 2)}-${cuitLimpio.slice(2, 10)}-${cuitLimpio.slice(10)}`;
};

export const validarCuit = (cuit) => {

  const cuitLimpio = limpiarCuit(cuit);

  if (!/^\d{11}$/.test(cuitLimpio)) {
    return false;
  }

  const multiplicadores =
    [5,4,3,2,7,6,5,4,3,2];

  let suma = 0;

  for (let i = 0; i < 10; i++) {
    suma +=
      Number(cuitLimpio[i]) *
      multiplicadores[i];
  }

  let resto = suma % 11;

  let verificador =
    11 - resto;

  if (verificador === 11)
    verificador = 0;

  if (verificador === 10)
    verificador = 9;

  return (
    verificador ===
    Number(cuitLimpio[10])
  );
};
