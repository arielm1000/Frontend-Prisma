import { Fragment, useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  FormControlLabel,
  GlobalStyles,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Snackbar,
  Switch,
  TextField,
  Tooltip,
  Typography
} from '@mui/material';
import {
  DataGrid,
  GridToolbar
} from '@mui/x-data-grid';
import AddIcon from '@mui/icons-material/Add';
import CancelIcon from '@mui/icons-material/Cancel';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import HistoryIcon from '@mui/icons-material/History';
import MoveToInboxIcon from '@mui/icons-material/MoveToInbox';
import PrintIcon from '@mui/icons-material/Print';
import SendIcon from '@mui/icons-material/Send';
import VisibilityIcon from '@mui/icons-material/Visibility';
import {
  cancelarPedidoProveedorRequest,
  confirmarPedidoProveedorRequest,
  createPedidoProveedorRequest,
  enviarPedidoProveedorRequest,
  getHistoricoPedidoProveedorRequest,
  getPedidosProveedorRequest,
  getResumenPedidosProveedorRequest,
  updatePedidoProveedorRequest
} from '../../services/pedidoProveedor.service';
import {
  aprobarControlRecepcionPedidoProveedorRequest,
  corregirFacturaRecepcionRequest,
  createRecepcionPedidoProveedorRequest,
  resolverGestionAdministrativaRecepcionRequest
} from '../../services/recepcionPedidoProveedor.service';
import {
  getProveedoresRequest,
  getRazonesSocialesRequest
} from '../../services/proveedor.service';
import { getEmpresasRequest } from '../../services/empresa.service';
import { getTransportesRequest } from '../../services/transporte.service';
import { getLocalesRequest } from '../../services/local.service';
import { getProductosRequest } from '../../services/producto.service';

const fechaInputDesdeHoy = (dias = 0) => {
  const fecha = new Date();
  fecha.setDate(fecha.getDate() + dias);
  const year = fecha.getFullYear();
  const month = String(fecha.getMonth() + 1).padStart(2, '0');
  const day = String(fecha.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
};

const formatoFechaNegocio = (valor) => {
  if (!valor) return '';

  const [year, month, day] = String(valor).slice(0, 10).split('-');

  if (!year || !month || !day) return '';

  return `${day}/${month}/${year}`;
};

const tieneGestionAdministrativaPendiente = (pedido) =>
  (pedido.recepciones || []).some(
    (recepcion) =>
      recepcion.requiereGestionAdministrativa &&
      recepcion.gestionAdministrativaEstado !== 'RESUELTA'
  );

const pedidoInicial = {
  proveedorId: '',
  proveedorRazonSocialId: '',
  empresaFacturacionId: '',
  localDestinoId: '',
  transporteId: '',
  fechaPedido: fechaInputDesdeHoy(),
  fechaEstimadaEntrega: fechaInputDesdeHoy(14),
  estado: 'BORRADOR',
  descuentosGeneralesTexto: '',
  transporteCostoFinal: '',
  transporteObservaciones: '',
  observaciones: ''
};

const detalleInicial = {
  productoId: '',
  productoTexto: '',
  cantidadPedida: 1,
  tipoPrecio: 'LISTA',
  precioListaSinIva: 0,
  descuentosTexto: '',
  ivaCondicion: 'GRAVADO',
  ivaPorcentaje: 21,
  observaciones: ''
};

const recepcionInicial = {
  fechaRecepcion: fechaInputDesdeHoy(),
  empresaFacturacionId: '',
  numeroRemito: '',
  numeroFactura: '',
  facturaPuntoVenta: '',
  facturaNumero: '',
  totalFacturaProveedor: 0,
  redondeoBase: 100,
  margenesPrecioPublicoGeneralTexto: '',
  observaciones: ''
};

const importeFacturaInicial = {
  tipo: 'PERCEPCION',
  descripcion: '',
  porcentaje: 0,
  importe: 0
};

const gestionAdministrativaInicial = {
  responsable: 'PROVEEDOR',
  comprobanteTipo: 'NOTA_CREDITO',
  comprobanteNumero: '',
  fechaResolucion: fechaInputDesdeHoy(),
  importe: '',
  observacion: ''
};

const facturaCorreccionInicial = {
  numeroRemito: '',
  numeroFactura: '',
  facturaPuntoVenta: '',
  facturaNumero: '',
  totalFacturaProveedor: '',
  observaciones: ''
};

const resumenPedidosInicial = {
  cantidadPedidos: 0,
  cantidadAbiertos: 0,
  totalPedidos: 0,
  totalPedidosAbiertos: 0,
  totalRecibidoFacturas: 0,
  totalPendienteEstimado: 0,
  diferenciaFacturas: 0,
  porEstado: [],
  porProveedor: []
};

const estadosPedido = [
  'BORRADOR',
  'ENVIADO',
  'CONFIRMADO',
  'RECIBIDO_PARCIAL',
  'RECIBIDO_COMPLETO',
  'CANCELADO',
  'CANCELADO_PARCIAL'
];

const formatoMoneda = (valor) =>
  Number(valor || 0).toLocaleString('es-AR', {
    style: 'currency',
    currency: 'ARS'
  });

const truncarTexto = (texto = '', largo = 30) => {
  const limpio = String(texto || '').trim();
  return limpio.length > largo
    ? `${limpio.slice(0, largo - 1)}.`
    : limpio;
};

const nombreCortoLocal = (local = {}) =>
  local.nombreCorto || local.nombre || '';

const parseDescuentos = (texto = '') =>
  String(texto)
    .split('+')
    .map((valor) => Number(valor.trim().replace(',', '.')))
    .filter((valor) => Number.isFinite(valor) && valor > 0);

const descuentosToTexto = (descuentos) =>
  Array.isArray(descuentos) ? descuentos.join(' + ') : '';

const descuentoValorToTexto = (valor) => {
  const numero = Number(valor || 0);

  return numero > 0 ? String(numero) : '';
};

const combinarDescuentosTexto = (...descuentos) =>
  descuentos
    .flatMap((descuento) => parseDescuentos(descuento))
    .join(' + ');

const redondear = (valor) =>
  Math.round((Number(valor) + Number.EPSILON) * 100) / 100;

const calcularDescuentoEfectivo = (descuentos) => {
  const factor = descuentos.reduce(
    (acumulado, descuento) => acumulado * (1 - descuento / 100),
    1
  );

  return redondear((1 - factor) * 100);
};

const aplicarDescuentos = (importe, descuentos) =>
  redondear(
    descuentos.reduce(
      (valor, descuento) => valor * (1 - descuento / 100),
      Number(importe || 0)
    )
  );

const aplicarMargenes = (importe, margenes) =>
  redondear(
    margenes.reduce(
      (valor, margen) => valor * (1 + margen / 100),
      Number(importe || 0)
    )
  );

const redondearPrecioPublico = (valor, base = 1) => {
  const baseNumerica = Number(base || 1);

  if (baseNumerica <= 1) {
    return redondear(valor);
  }

  return Math.round(Number(valor || 0) / baseNumerica) * baseNumerica;
};

const calcularDetalle = (detalle) => {
  const descuentos = parseDescuentos(detalle.descuentosTexto);
  const precioListaSinIva = Number(detalle.precioListaSinIva || 0);
  const precioUnitarioSinIva = aplicarDescuentos(
    precioListaSinIva,
    descuentos
  );
  const ivaPorcentaje =
    detalle.ivaCondicion === 'EXENTO'
      ? 0
      : Number(detalle.ivaPorcentaje || 0);
  const precioUnitarioConIva = redondear(
    precioUnitarioSinIva * (1 + ivaPorcentaje / 100)
  );
  const cantidad = Number(detalle.cantidadPedida || 0);

  return {
    descuentos,
    descuentoEfectivo: calcularDescuentoEfectivo(descuentos),
    precioUnitarioSinIva,
    precioUnitarioConIva,
    subtotalSinIva: redondear(cantidad * precioUnitarioSinIva),
    totalConIva: redondear(cantidad * precioUnitarioConIva)
  };
};

const calcularTotales = (detalles, descuentosGeneralesTexto) => {
  const subtotalSinIva = redondear(
    detalles.reduce(
      (total, detalle) => total + calcularDetalle(detalle).subtotalSinIva,
      0
    )
  );
  const totalConIvaAntes = redondear(
    detalles.reduce(
      (total, detalle) => total + calcularDetalle(detalle).totalConIva,
      0
    )
  );
  const descuentos = parseDescuentos(descuentosGeneralesTexto);
  const descuentoEfectivo = calcularDescuentoEfectivo(descuentos);
  const descuentoImporte = redondear(
    subtotalSinIva * (descuentoEfectivo / 100)
  );
  const baseConDescuento = redondear(subtotalSinIva - descuentoImporte);
  const totalConIva = redondear(
    totalConIvaAntes * (1 - descuentoEfectivo / 100)
  );
  const ivaImporte = redondear(totalConIva - baseConDescuento);

  return {
    descuentos,
    descuentoEfectivo,
    subtotalSinIva,
    totalConIvaAntes,
    descuentoImporte,
    baseConDescuento,
    ivaImporte,
    totalConIva
  };
};

const calcularRecibido = (detalle) =>
  (detalle.recepcionesDetalle || []).reduce(
    (total, recepcion) => total + Number(recepcion.cantidadRecibida || 0),
    0
  );

const calcularPendiente = (detalle) =>
  Number(detalle.cantidadPedida || 0) -
  Number(detalle.cantidadCancelada || 0) -
  calcularRecibido(detalle);

const calcularPrecioRecepcion = (detalle, redondeoBase) => {
  const descuentos = parseDescuentos(detalle.descuentosProveedorTexto);
  const margenes = parseDescuentos(detalle.margenesPrecioPublicoTexto);
  const precioLista = Number(detalle.precioListaProveedor || 0);
  const precioConDescuento = aplicarDescuentos(precioLista, descuentos);
  const precioConIva = redondear(
    precioConDescuento * (1 + Number(detalle.ivaPorcentaje || 0) / 100)
  );
  const precioPublicoCalculado = aplicarMargenes(precioConIva, margenes);
  const precioPublicoRedondeado = redondearPrecioPublico(
    precioPublicoCalculado,
    redondeoBase
  );

  return {
    descuentos,
    margenes,
    precioConDescuento,
    precioConIva,
    precioPublicoCalculado,
    precioPublicoRedondeado
  };
};

const porcentajesDesdeValor = (valor) => {
  if (Array.isArray(valor)) {
    return valor
      .map((item) => Number(item))
      .filter((item) => Number.isFinite(item) && item > 0);
  }

  return parseDescuentos(valor);
};

const calcularUnitarioConIvaRecepcion = (detalle) => {
  const descuentos = porcentajesDesdeValor(detalle.descuentosProveedor);
  const precioLista = Number(detalle.precioListaProveedor || 0);
  const precioConDescuento = aplicarDescuentos(precioLista, descuentos);

  return redondear(
    precioConDescuento *
      (1 + Number(detalle.ivaPorcentaje || 0) / 100)
  );
};

const calcularImporteGestionAdministrativa = (recepcion) =>
  redondear(
    (recepcion.detalles || []).reduce((total, detalle) => {
      const diferenciaControl = Number(
        detalle.cantidadDiferenciaControl || 0
      );
      const cantidadFallada = Number(detalle.cantidadFalladaControl || 0);
      const cantidadReclamo =
        Math.abs(diferenciaControl) + cantidadFallada;

      return total +
        cantidadReclamo * calcularUnitarioConIvaRecepcion(detalle);
    }, 0)
  );

const totalDetalleConDescuentosGenerales = (detalle, pedido) => {
  const descuentosGenerales =
    porcentajesDesdeValor(pedido?.descuentosGenerales).length > 0
      ? porcentajesDesdeValor(pedido.descuentosGenerales)
      : porcentajesDesdeValor(pedido?.descuentoGeneralPorcentaje);

  return aplicarDescuentos(
    Number(detalle.totalConIva || 0),
    descuentosGenerales
  );
};

const calcularTotalRecibidoDetalle = (detalle) =>
  (detalle.recepcionesDetalle || []).reduce(
    (total, recepcion) =>
      total +
      Number(
        recepcion.cantidadAplicadaPedido ||
        recepcion.cantidadRecibida ||
        0
      ),
    0
  );

const calcularResumenPedidosDesdeLista = (pedidosLista = []) => {
  const abiertos = [
    'ENVIADO',
    'CONFIRMADO',
    'RECIBIDO_PARCIAL'
  ];

  return pedidosLista.reduce(
    (acumulado, pedido) => {
      const totalPedido = Number(pedido.totalConIva || 0);
      const totalRecepciones = (pedido.recepciones || []).reduce(
        (total, recepcion) =>
          total + Number(recepcion.totalFacturaSistema || 0),
        0
      );
      const diferenciaFacturas = (pedido.recepciones || []).reduce(
        (total, recepcion) =>
          total + Number(recepcion.diferenciaFactura || 0),
        0
      );
      const pendienteEstimado = (pedido.detalles || []).reduce(
        (total, detalle) => {
          const recibido = calcularTotalRecibidoDetalle(detalle);
          const pendiente = Math.max(
            Number(detalle.cantidadPedida || 0) -
              Number(detalle.cantidadCancelada || 0) -
              recibido,
            0
          );

          return total + pendiente * Number(detalle.precioUnitarioConIva || 0);
        },
        0
      );

      acumulado.cantidadPedidos += 1;
      acumulado.totalPedidos += totalPedido;
      acumulado.totalRecibidoFacturas += totalRecepciones;
      acumulado.totalPendienteEstimado += pendienteEstimado;
      acumulado.diferenciaFacturas += diferenciaFacturas;

      if (abiertos.includes(pedido.estado)) {
        acumulado.cantidadAbiertos += 1;
        acumulado.totalPedidosAbiertos += totalPedido;
      }

      return acumulado;
    },
    {
      ...resumenPedidosInicial
    }
  );
};

function PedidosProveedorPage() {
  const [pedidos, setPedidos] = useState([]);
  const [resumenPedidos, setResumenPedidos] = useState(resumenPedidosInicial);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [paginationModel, setPaginationModel] = useState({
    page: 0,
    pageSize: 20
  });
  const [filtros, setFiltros] = useState({
    search: '',
    proveedorId: '',
    empresaFacturacionId: '',
    estado: '',
    transporteId: ''
  });
  const [proveedores, setProveedores] = useState([]);
  const [razonesSociales, setRazonesSociales] = useState([]);
  const [empresas, setEmpresas] = useState([]);
  const [transportes, setTransportes] = useState([]);
  const [locales, setLocales] = useState([]);
  const [productos, setProductos] = useState([]);
  const [productoSearch, setProductoSearch] = useState('');
  const [open, setOpen] = useState(false);
  const [editando, setEditando] = useState(false);
  const [pedidoId, setPedidoId] = useState(null);
  const [form, setForm] = useState(pedidoInicial);
  const [detalles, setDetalles] = useState([]);
  const [openRecepcion, setOpenRecepcion] = useState(false);
  const [pedidoRecepcion, setPedidoRecepcion] = useState(null);
  const [formRecepcion, setFormRecepcion] = useState(recepcionInicial);
  const [detallesRecepcion, setDetallesRecepcion] = useState([]);
  const [otrosImportesRecepcion, setOtrosImportesRecepcion] = useState([]);
  const [openDetalle, setOpenDetalle] = useState(false);
  const [pedidoDetalle, setPedidoDetalle] = useState(null);
  const [openReporteRecepcion, setOpenReporteRecepcion] = useState(false);
  const [recepcionReporte, setRecepcionReporte] = useState(null);
  const [openControlRecepcion, setOpenControlRecepcion] = useState(false);
  const [recepcionControl, setRecepcionControl] = useState(null);
  const [detallesControlRecepcion, setDetallesControlRecepcion] = useState([]);
  const [observacionesControlRecepcion, setObservacionesControlRecepcion] =
    useState('');
  const [openGestionAdministrativa, setOpenGestionAdministrativa] =
    useState(false);
  const [recepcionGestionAdministrativa, setRecepcionGestionAdministrativa] =
    useState(null);
  const [formGestionAdministrativa, setFormGestionAdministrativa] = useState(
    gestionAdministrativaInicial
  );
  const [openCorregirFactura, setOpenCorregirFactura] = useState(false);
  const [recepcionCorregirFactura, setRecepcionCorregirFactura] =
    useState(null);
  const [formCorregirFactura, setFormCorregirFactura] = useState(
    facturaCorreccionInicial
  );
  const [openHistorico, setOpenHistorico] = useState(false);
  const [historico, setHistorico] = useState([]);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  const totales = useMemo(
    () => calcularTotales(detalles, form.descuentosGeneralesTexto),
    [detalles, form.descuentosGeneralesTexto]
  );

  const totalesRecepcion = useMemo(() => {
    const subtotalProductos = redondear(
      detallesRecepcion.reduce((total, detalle) => {
        const calculado = calcularPrecioRecepcion(
          detalle,
          formRecepcion.redondeoBase
        );

        return total +
          Number(detalle.cantidadFacturada || detalle.cantidadRecibida || 0) *
            calculado.precioConDescuento;
      }, 0)
    );
    const totalProductosConIva = redondear(
      detallesRecepcion.reduce((total, detalle) => {
        const calculado = calcularPrecioRecepcion(
          detalle,
          formRecepcion.redondeoBase
        );

        return total +
          Number(detalle.cantidadFacturada || detalle.cantidadRecibida || 0) *
            calculado.precioConIva;
      }, 0)
    );
    const ivaProductos = redondear(totalProductosConIva - subtotalProductos);
    const otrosImportesTotal = redondear(
      otrosImportesRecepcion.reduce(
        (total, importe) => total + Number(importe.importe || 0),
        0
      )
    );
    const totalFacturaSistema = redondear(
      totalProductosConIva + otrosImportesTotal
    );
    const diferenciaFactura = redondear(
      Number(formRecepcion.totalFacturaProveedor || 0) -
        totalFacturaSistema
    );

    return {
      subtotalProductos,
      ivaProductos,
      otrosImportesTotal,
      totalFacturaSistema,
      diferenciaFactura
    };
  }, [detallesRecepcion, otrosImportesRecepcion, formRecepcion]);

  const resumenVisible = useMemo(() => {
    if (Number(resumenPedidos.cantidadPedidos || 0) > 0 || pedidos.length === 0) {
      return resumenPedidos;
    }

    return calcularResumenPedidosDesdeLista(pedidos);
  }, [resumenPedidos, pedidos]);

  const productosOpciones = useMemo(() => {
    const opciones = new Map(
      productos.map((producto) => [Number(producto.id), producto])
    );

    detalles.forEach((detalle) => {
      if (!detalle.productoId || opciones.has(Number(detalle.productoId))) {
        return;
      }

      opciones.set(Number(detalle.productoId), {
        id: Number(detalle.productoId),
        codigo: '',
        nombre: detalle.productoTexto || 'Producto seleccionado'
      });
    });

    return Array.from(opciones.values());
  }, [productos, detalles]);

  const armarParamsFiltros = useCallback((filtrosActuales = filtros) => ({
    search: filtrosActuales.search,
    proveedorId: filtrosActuales.proveedorId,
    empresaFacturacionId: filtrosActuales.empresaFacturacionId,
    estado: filtrosActuales.estado,
    transporteId:
      filtrosActuales.transporteId === 'SIN_TRANSPORTE'
        ? ''
        : filtrosActuales.transporteId,
    sinTransporte:
      filtrosActuales.transporteId === 'SIN_TRANSPORTE' ? 'true' : ''
  }), [filtros]);

  const cargarPedidos = async () => {
    try {
      const respuesta = await getPedidosProveedorRequest({
        page: paginationModel.page,
        pageSize: paginationModel.pageSize,
        ...armarParamsFiltros()
      });

      setPedidos(respuesta.data || []);
      setTotal(respuesta.total || 0);
    } catch (error) {
      console.log(error);
      setSnackbar({
        open: true,
        message: 'Error cargando pedidos',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const cargarResumenPedidos = useCallback(async (filtrosActuales = filtros) => {
    try {
      const data = await getResumenPedidosProveedorRequest(
        armarParamsFiltros(filtrosActuales)
      );
      setResumenPedidos({
        ...resumenPedidosInicial,
        ...data
      });
    } catch (error) {
      console.log(error);
    }
  }, [armarParamsFiltros, filtros]);

  const cargarRazones = async (proveedorId) => {
    if (!proveedorId) {
      setRazonesSociales([]);
      return;
    }

    try {
      const data = await getRazonesSocialesRequest(proveedorId);
      setRazonesSociales(data);
    } catch (error) {
      console.log(error);
    }
  };

  const cargarProductos = async (search = '') => {
    try {
      const respuesta = await getProductosRequest({
        page: 0,
        pageSize: 20,
        search,
        habilitado: true
      });

      setProductos(respuesta.data || []);
    } catch (error) {
      console.log(error);
    }
  };

  const cargarTransportes = async () => {
    try {
      const data = await getTransportesRequest();
      setTransportes(data);
      return data;
    } catch (error) {
      console.log(error);
      return transportes;
    }
  };

  const cerrar = () => {
    setOpen(false);
    setEditando(false);
    setPedidoId(null);
    setRazonesSociales([]);
    setForm(pedidoInicial);
    setDetalles([]);
  };

  const nuevo = async () => {
    await cargarTransportes();
    setEditando(false);
    setPedidoId(null);
    setForm({
      ...pedidoInicial,
      fechaPedido: fechaInputDesdeHoy(),
      fechaEstimadaEntrega: fechaInputDesdeHoy(14)
    });
    setDetalles([]);
    setRazonesSociales([]);
    setOpen(true);
  };

  const handleFiltro = (e) => {
    const { name, value } = e.target;

    setLoading(true);
    setPaginationModel({
      ...paginationModel,
      page: 0
    });
    setFiltros({
      ...filtros,
      [name]: value
    });
  };

  const handleFormChange = async (e) => {
    const { name, value } = e.target;

    if (name === 'proveedorId') {
      setForm({
        ...form,
        proveedorId: value,
        proveedorRazonSocialId: ''
      });
      await cargarRazones(value);
      return;
    }

    if (name === 'transporteId') {
      const transporte = transportes.find(
        (item) => item.id === Number(value)
      );

      setForm({
        ...form,
        transporteId: value,
        transporteCostoFinal:
          transporte?.tarifaBase ?? form.transporteCostoFinal
      });
      return;
    }

    setForm({
      ...form,
      [name]: value
    });
  };

  const agregarDetalle = () => {
    setDetalles([
      ...detalles,
      {
        ...detalleInicial,
        tempId: Date.now()
      }
    ]);
  };

  const eliminarDetalle = (tempId) => {
    setDetalles(detalles.filter((detalle) => detalle.tempId !== tempId));
  };

  const cambiarDetalle = (tempId, name, value) => {
    setDetalles(
      detalles.map((detalle) => {
        if (detalle.tempId !== tempId) return detalle;

        if (name === 'productoId') {
          const producto = productosOpciones.find(
            (item) => item.id === Number(value)
          );

          return {
            ...detalle,
            productoId: value,
            productoTexto: producto
              ? `${producto.codigo} - ${producto.nombre}`
              : ''
          };
        }

        if (name === 'ivaCondicion' && value === 'EXENTO') {
          return {
            ...detalle,
            ivaCondicion: value,
            ivaPorcentaje: 0
          };
        }

        return {
          ...detalle,
          [name]: value
        };
      })
    );
  };

  const armarPayload = () => ({
    proveedorId: Number(form.proveedorId),
    proveedorRazonSocialId: form.proveedorRazonSocialId
      ? Number(form.proveedorRazonSocialId)
      : null,
    empresaFacturacionId: form.empresaFacturacionId
      ? Number(form.empresaFacturacionId)
      : null,
    localDestinoId: form.localDestinoId
      ? Number(form.localDestinoId)
      : null,
    transporteId: form.transporteId
      ? Number(form.transporteId)
      : null,
    fechaPedido: form.fechaPedido,
    fechaEstimadaEntrega: form.fechaEstimadaEntrega || null,
    estado: form.estado,
    descuentosGenerales: totales.descuentos,
    transporteCostoFinal: form.transporteCostoFinal || null,
    transporteObservaciones: form.transporteObservaciones,
    observaciones: form.observaciones,
    detalles: detalles.map((detalle) => {
      const calculado = calcularDetalle(detalle);

      return {
        productoId: Number(detalle.productoId),
        cantidadPedida: Number(detalle.cantidadPedida || 0),
        tipoPrecio: detalle.tipoPrecio,
        precioListaSinIva: Number(detalle.precioListaSinIva || 0),
        descuentosPorcentaje: calculado.descuentos,
        ivaCondicion: detalle.ivaCondicion,
        ivaPorcentaje: Number(detalle.ivaPorcentaje || 0),
        observaciones: detalle.observaciones
      };
    })
  });

  const guardar = async () => {
    if (!form.proveedorId) {
      setSnackbar({
        open: true,
        message: 'Debe seleccionar un proveedor',
        severity: 'warning'
      });
      return;
    }

    if (detalles.length === 0) {
      setSnackbar({
        open: true,
        message: 'Debe cargar al menos un producto',
        severity: 'warning'
      });
      return;
    }

    if (detalles.some((detalle) => !detalle.productoId)) {
      setSnackbar({
        open: true,
        message: 'Todos los detalles deben tener producto',
        severity: 'warning'
      });
      return;
    }

    try {
      const payload = armarPayload();

      if (editando) {
        await updatePedidoProveedorRequest(pedidoId, payload);
        setSnackbar({
          open: true,
          message: 'Pedido actualizado correctamente',
          severity: 'success'
        });
      } else {
        await createPedidoProveedorRequest(payload);
        setSnackbar({
          open: true,
          message: 'Pedido creado correctamente',
          severity: 'success'
        });
      }

      cerrar();
      setLoading(true);
      await cargarPedidos();
      await cargarResumenPedidos();
    } catch (error) {
      console.log(error);
      setSnackbar({
        open: true,
        message:
          error.response?.data?.mensaje ||
          'Error guardando pedido',
        severity: 'error'
      });
    }
  };

  const editar = async (pedido) => {
    setEditando(true);
    setPedidoId(pedido.id);
    await Promise.all([
      cargarRazones(pedido.proveedorId),
      cargarTransportes()
    ]);
    setForm({
      proveedorId: pedido.proveedorId || '',
      proveedorRazonSocialId: pedido.proveedorRazonSocialId || '',
      empresaFacturacionId: pedido.empresaFacturacionId
        ? String(pedido.empresaFacturacionId)
        : '',
      localDestinoId: pedido.localDestinoId || '',
      transporteId: pedido.transporteId || '',
      fechaPedido: pedido.fechaPedido?.slice(0, 10) || '',
      fechaEstimadaEntrega:
        pedido.fechaEstimadaEntrega?.slice(0, 10) || '',
      estado: pedido.estado || 'BORRADOR',
      descuentosGeneralesTexto:
        descuentosToTexto(pedido.descuentosGenerales) ||
        String(pedido.descuentoGeneralPorcentaje || ''),
      transporteCostoFinal: pedido.transporteCostoFinal || '',
      transporteObservaciones: pedido.transporteObservaciones || '',
      observaciones: pedido.observaciones || ''
    });
    setDetalles(
      (pedido.detalles || []).map((detalle) => ({
        tempId: detalle.id,
        productoId: detalle.productoId,
        productoTexto: `${detalle.producto?.codigo || ''} - ${detalle.producto?.nombre || ''}`,
        cantidadPedida: detalle.cantidadPedida,
        tipoPrecio: detalle.tipoPrecio,
        precioListaSinIva: Number(detalle.precioListaSinIva || 0),
        descuentosTexto:
          descuentosToTexto(detalle.descuentosPorcentaje) ||
          String(detalle.descuentoPorcentaje || ''),
        ivaCondicion: detalle.ivaCondicion || 'GRAVADO',
        ivaPorcentaje: Number(detalle.ivaPorcentaje || 0),
        observaciones: detalle.observaciones || ''
      }))
    );
    setOpen(true);
  };

  const cancelar = async (id) => {
    const confirmar = window.confirm(
      'Cancelar pedido?'
    );

    if (!confirmar) return;

    try {
      await cancelarPedidoProveedorRequest(id);
      setLoading(true);
      await cargarPedidos();
      await cargarResumenPedidos();
      setSnackbar({
        open: true,
        message: 'Pedido cancelado',
        severity: 'success'
      });
    } catch (error) {
      console.log(error);
      setSnackbar({
        open: true,
        message: 'Error cancelando pedido',
        severity: 'error'
      });
    }
  };

  const enviar = async (id) => {
    try {
      await enviarPedidoProveedorRequest(id);
      setLoading(true);
      await cargarPedidos();
      await cargarResumenPedidos();
      setSnackbar({
        open: true,
        message: 'Pedido marcado como enviado',
        severity: 'success'
      });
    } catch (error) {
      console.log(error);
      setSnackbar({
        open: true,
        message:
          error.response?.data?.mensaje ||
          'Error enviando pedido',
        severity: 'error'
      });
    }
  };

  const confirmar = async (id) => {
    try {
      await confirmarPedidoProveedorRequest(id);
      setLoading(true);
      await cargarPedidos();
      await cargarResumenPedidos();
      setSnackbar({
        open: true,
        message: 'Pedido confirmado',
        severity: 'success'
      });
    } catch (error) {
      console.log(error);
      setSnackbar({
        open: true,
        message:
          error.response?.data?.mensaje ||
          'Error confirmando pedido',
        severity: 'error'
      });
    }
  };

  const verDetalle = (pedido) => {
    setPedidoDetalle(pedido);
    setOpenDetalle(true);
  };

  const cerrarDetalle = () => {
    setOpenDetalle(false);
    setPedidoDetalle(null);
  };

  const abrirReporteRecepcion = (recepcion) => {
    setRecepcionReporte(recepcion);
    setOpenReporteRecepcion(true);
  };

  const cerrarReporteRecepcion = () => {
    setOpenReporteRecepcion(false);
    setRecepcionReporte(null);
  };

  const imprimirReporteRecepcion = () => {
    const tituloActual = document.title;
    document.title = 'Reporte de Control de Recepcion';
    window.print();

    setTimeout(() => {
      document.title = tituloActual;
    }, 500);
  };

  const abrirControlRecepcion = (recepcion) => {
    setRecepcionControl(recepcion);
    setObservacionesControlRecepcion(recepcion.observacionesControl || '');
    setDetallesControlRecepcion(
      (recepcion.detalles || []).map((detalle) => ({
        detalleId: detalle.id,
        producto:
          detalle.pedidoProveedorDetalle?.producto?.codigo
            ? `${detalle.pedidoProveedorDetalle.producto.codigo} - ${detalle.pedidoProveedorDetalle.producto.nombre}`
            : detalle.pedidoProveedorDetalle?.producto?.nombre || '',
        cantidadFacturada: Number(detalle.cantidadFacturada || 0),
        cantidadRecibida: Number(detalle.cantidadRecibida || 0),
        cantidadControlada:
          detalle.cantidadControlada ?? Number(detalle.cantidadRecibida || 0),
        cantidadFalladaControl: Number(detalle.cantidadFalladaControl || 0),
        observacionesControl: detalle.observacionesControl || ''
      }))
    );
    setOpenControlRecepcion(true);
  };

  const cerrarControlRecepcion = () => {
    setOpenControlRecepcion(false);
    setRecepcionControl(null);
    setDetallesControlRecepcion([]);
    setObservacionesControlRecepcion('');
  };

  const cambiarDetalleControl = (detalleId, campo, valor) => {
    setDetallesControlRecepcion((actuales) =>
      actuales.map((detalle) =>
        detalle.detalleId === detalleId
          ? {
              ...detalle,
              [campo]: valor
            }
          : detalle
      )
    );
  };

  const aprobarControlRecepcion = async () => {
    if (!recepcionControl) return;

    try {
      await aprobarControlRecepcionPedidoProveedorRequest(
        recepcionControl.id,
        {
          observacionesControl: observacionesControlRecepcion,
          detalles: detallesControlRecepcion.map((detalle) => ({
            detalleId: detalle.detalleId,
            cantidadControlada: Number(detalle.cantidadControlada || 0),
            cantidadFalladaControl: Number(
              detalle.cantidadFalladaControl || 0
            ),
            observacionesControl: detalle.observacionesControl
          }))
        }
      );
      cerrarControlRecepcion();
      setOpenDetalle(false);
      setPedidoDetalle(null);
      setLoading(true);
      await cargarPedidos();
      await cargarResumenPedidos();
      setSnackbar({
        open: true,
        message: 'Control cerrado correctamente',
        severity: 'success'
      });
    } catch (error) {
      console.log(error);
      setSnackbar({
        open: true,
        message:
          error.response?.data?.mensaje ||
          'Error cerrando control',
        severity: 'error'
      });
    }
  };

  const abrirRecepcion = async (pedido) => {
    if (!pedido.localDestinoId) {
      setSnackbar({
        open: true,
        message: 'El pedido debe tener local destino para recibir mercaderia',
        severity: 'warning'
      });
      return;
    }

    await cargarRazones(pedido.proveedorId);
    setPedidoRecepcion(pedido);
    const descuentoGeneralPedidoTexto =
      descuentosToTexto(pedido.descuentosGenerales) ||
      descuentoValorToTexto(pedido.descuentoGeneralPorcentaje);

    setFormRecepcion({
      ...recepcionInicial,
      proveedorRazonSocialId: pedido.proveedorRazonSocialId
        ? String(pedido.proveedorRazonSocialId)
        : '',
      empresaFacturacionId: pedido.empresaFacturacionId
        ? String(pedido.empresaFacturacionId)
        : ''
    });
    setOtrosImportesRecepcion([]);
    setDetallesRecepcion(
      (pedido.detalles || [])
        .map((detalle) => ({
          pedidoProveedorDetalleId: detalle.id,
          producto: `${detalle.producto?.codigo || ''} - ${detalle.producto?.nombre || ''}`,
          cantidadPedida: detalle.cantidadPedida,
          pendiente: calcularPendiente(detalle),
          cantidadFacturada: calcularPendiente(detalle),
          cantidadRecibida: calcularPendiente(detalle),
          cantidadExcedente: 0,
          cantidadRechazada: 0,
          accionExcedente: 'SIN_EXCEDENTE',
          precioListaProveedor: Number(detalle.precioListaSinIva || 0),
          descuentosProveedorTexto: combinarDescuentosTexto(
            descuentoGeneralPedidoTexto,
            descuentosToTexto(detalle.descuentosPorcentaje) ||
              descuentoValorToTexto(detalle.descuentoPorcentaje)
          ),
          ivaPorcentaje: Number(detalle.ivaPorcentaje || 21),
          margenesPrecioPublicoTexto: '',
          precioPublicoAnterior: Number(detalle.producto?.precioPublico || 0),
          precioPublicoNuevo: '',
          actualizarPrecioPublico: true,
          observaciones: ''
        }))
        .filter((detalle) => detalle.pendiente > 0)
    );
    setOpenRecepcion(true);
  };

  const cerrarRecepcion = () => {
    setOpenRecepcion(false);
    setPedidoRecepcion(null);
    setFormRecepcion(recepcionInicial);
    setDetallesRecepcion([]);
    setOtrosImportesRecepcion([]);
  };

  const cambiarRecepcion = (e) => {
    const { name, value } = e.target;

    setFormRecepcion({
      ...formRecepcion,
      [name]: value
    });

    if (name === 'margenesPrecioPublicoGeneralTexto') {
      setDetallesRecepcion((actuales) =>
        actuales.map((detalle) => ({
          ...detalle,
          margenesPrecioPublicoTexto: value
        }))
      );
    }
  };

  const cambiarDetalleRecepcion = (id, name, value) => {
    setDetallesRecepcion(
      detallesRecepcion.map((detalle) => {
        if (detalle.pedidoProveedorDetalleId !== id) {
          return detalle;
        }

        const actualizado = {
          ...detalle,
          [name]: value
        };

        if (name === 'cantidadRecibida') {
          const excedente = Math.max(
            Number(value || 0) - Number(detalle.pendiente || 0),
            0
          );

          actualizado.cantidadExcedente = excedente;
          actualizado.accionExcedente =
            excedente > 0 ? 'PENDIENTE' : 'SIN_EXCEDENTE';
        }

        return actualizado;
      })
    );
  };

  const agregarImporteRecepcion = () => {
    setOtrosImportesRecepcion([
      ...otrosImportesRecepcion,
      {
        ...importeFacturaInicial,
        tempId: Date.now()
      }
    ]);
  };

  const cambiarImporteRecepcion = (tempId, name, value) => {
    setOtrosImportesRecepcion(
      otrosImportesRecepcion.map((importe) =>
        importe.tempId === tempId
          ? {
              ...importe,
              [name]: value
            }
          : importe
      )
    );
  };

  const eliminarImporteRecepcion = (tempId) => {
    setOtrosImportesRecepcion(
      otrosImportesRecepcion.filter((importe) => importe.tempId !== tempId)
    );
  };

  const guardarRecepcion = async () => {
    const rechazoSuperaPendiente = detallesRecepcion.some(
      (detalle) => Number(detalle.cantidadRechazada || 0) > Number(detalle.pendiente || 0)
    );

    if (rechazoSuperaPendiente) {
      setSnackbar({
        open: true,
        message: 'Hay rechazos que superan el pendiente',
        severity: 'warning'
      });
      return;
    }

    try {
      await createRecepcionPedidoProveedorRequest({
        pedidoProveedorId: pedidoRecepcion.id,
        ...formRecepcion,
        proveedorRazonSocialId:
          formRecepcion.proveedorRazonSocialId || null,
        otrosImportes: otrosImportesRecepcion.map((importe) => ({
          tipo: importe.tipo,
          descripcion: importe.descripcion,
          porcentaje: Number(importe.porcentaje || 0),
          importe: Number(importe.importe || 0)
        })),
        detalles: detallesRecepcion.map((detalle) => {
          const precio = calcularPrecioRecepcion(
            detalle,
            formRecepcion.redondeoBase
          );

          return {
            pedidoProveedorDetalleId: detalle.pedidoProveedorDetalleId,
            cantidadFacturada: Number(detalle.cantidadFacturada || 0),
            cantidadRecibida: Number(detalle.cantidadRecibida || 0),
            cantidadRechazada: Number(detalle.cantidadRechazada || 0),
            accionExcedente: detalle.accionExcedente,
            precioListaProveedor: Number(detalle.precioListaProveedor || 0),
            descuentosProveedor: parseDescuentos(
              detalle.descuentosProveedorTexto
            ),
            ivaPorcentaje: Number(detalle.ivaPorcentaje || 0),
            margenesPrecioPublico: parseDescuentos(
              detalle.margenesPrecioPublicoTexto
            ),
            precioPublicoNuevo:
              detalle.precioPublicoNuevo === ''
                ? precio.precioPublicoRedondeado
                : Number(detalle.precioPublicoNuevo || 0),
            actualizarPrecioPublico: detalle.actualizarPrecioPublico,
            observaciones: detalle.observaciones
          };
        })
      });

      cerrarRecepcion();
      setLoading(true);
      await cargarPedidos();
      await cargarResumenPedidos();
      setSnackbar({
        open: true,
        message: 'Recepcion guardada pendiente de control',
        severity: 'success'
      });
    } catch (error) {
      console.log(error);
      setSnackbar({
        open: true,
        message:
          error.response?.data?.mensaje ||
          'Error guardando recepcion',
        severity: 'error'
      });
    }
  };

  const abrirGestionAdministrativa = (recepcion) => {
    const importeGestion = calcularImporteGestionAdministrativa(recepcion);

    setRecepcionGestionAdministrativa(recepcion);
    setFormGestionAdministrativa({
      ...gestionAdministrativaInicial,
      fechaResolucion: fechaInputDesdeHoy(),
      importe: importeGestion || '',
      observacion:
        recepcion.gestionAdministrativaTipo
          ? `Resolucion de ${recepcion.gestionAdministrativaTipo}`
          : ''
    });
    setOpenGestionAdministrativa(true);
  };

  const cerrarGestionAdministrativa = () => {
    setOpenGestionAdministrativa(false);
    setRecepcionGestionAdministrativa(null);
    setFormGestionAdministrativa(gestionAdministrativaInicial);
  };

  const handleGestionAdministrativaChange = (event) => {
    const { name, value } = event.target;

    setFormGestionAdministrativa((actual) => ({
      ...actual,
      [name]: value
    }));
  };

  const guardarGestionAdministrativa = async () => {
    if (!recepcionGestionAdministrativa) return;

    try {
      await resolverGestionAdministrativaRecepcionRequest(
        recepcionGestionAdministrativa.id,
        formGestionAdministrativa
      );
      cerrarGestionAdministrativa();
      setOpenDetalle(false);
      setPedidoDetalle(null);
      setLoading(true);
      await cargarPedidos();
      await cargarResumenPedidos();
      setSnackbar({
        open: true,
        message: 'Gestion administrativa resuelta',
        severity: 'success'
      });
    } catch (error) {
      console.log(error);
      setSnackbar({
        open: true,
        message:
          error.response?.data?.mensaje ||
          'Error resolviendo gestion administrativa',
        severity: 'error'
      });
    }
  };

  const abrirCorregirFactura = (recepcion) => {
    setRecepcionCorregirFactura(recepcion);
    setFormCorregirFactura({
      numeroRemito: recepcion.numeroRemito || '',
      numeroFactura: recepcion.numeroFactura || '',
      facturaPuntoVenta: recepcion.facturaPuntoVenta || '',
      facturaNumero: recepcion.facturaNumero || '',
      totalFacturaProveedor: Number(recepcion.totalFacturaProveedor || 0),
      observaciones: recepcion.observaciones || ''
    });
    setOpenCorregirFactura(true);
  };

  const cerrarCorregirFactura = () => {
    setOpenCorregirFactura(false);
    setRecepcionCorregirFactura(null);
    setFormCorregirFactura(facturaCorreccionInicial);
  };

  const handleCorregirFacturaChange = (event) => {
    const { name, value } = event.target;

    setFormCorregirFactura((actual) => ({
      ...actual,
      [name]: value
    }));
  };

  const guardarCorreccionFactura = async () => {
    if (!recepcionCorregirFactura) return;

    try {
      await corregirFacturaRecepcionRequest(
        recepcionCorregirFactura.id,
        formCorregirFactura
      );
      cerrarCorregirFactura();
      setOpenDetalle(false);
      setPedidoDetalle(null);
      setLoading(true);
      await cargarPedidos();
      await cargarResumenPedidos();
      setSnackbar({
        open: true,
        message: 'Factura corregida correctamente',
        severity: 'success'
      });
    } catch (error) {
      console.log(error);
      setSnackbar({
        open: true,
        message:
          error.response?.data?.mensaje ||
          'Error corrigiendo factura',
        severity: 'error'
      });
    }
  };

  const verHistorico = async (id) => {
    try {
      const data = await getHistoricoPedidoProveedorRequest(id);
      setHistorico(data);
      setOpenHistorico(true);
    } catch (error) {
      console.log(error);
      setSnackbar({
        open: true,
        message: 'Error cargando historial',
        severity: 'error'
      });
    }
  };

  useEffect(() => {
    let activo = true;

    const cargarCatalogos = async () => {
      try {
        const [
          proveedoresData,
          empresasData,
          transportesData,
          localesData,
          productosData
        ] = await Promise.all([
          getProveedoresRequest(),
          getEmpresasRequest(),
          getTransportesRequest(),
          getLocalesRequest(),
          getProductosRequest({
            page: 0,
            pageSize: 20,
            habilitado: true
          })
        ]);

        if (!activo) return;

        setProveedores(proveedoresData);
        setEmpresas(empresasData);
        setTransportes(transportesData);
        setLocales(localesData);
        setProductos(productosData.data || []);
      } catch (error) {
        console.log(error);
      }
    };

    cargarCatalogos();

    return () => {
      activo = false;
    };
  }, []);

  useEffect(() => {
    let activo = true;

    const timer = setTimeout(async () => {
      if (!activo) return;
      try {
        const paramsFiltros = armarParamsFiltros();
        const respuesta = await getPedidosProveedorRequest({
          page: paginationModel.page,
          pageSize: paginationModel.pageSize,
          ...paramsFiltros
        });
        const resumenData = await getResumenPedidosProveedorRequest(
          paramsFiltros
        );

        if (!activo) return;

        setPedidos(respuesta.data || []);
        setTotal(respuesta.total || 0);
        setResumenPedidos({
          ...resumenPedidosInicial,
          ...resumenData
        });
      } catch (error) {
        console.log(error);

        if (!activo) return;

        setSnackbar({
          open: true,
          message: 'Error cargando pedidos',
          severity: 'error'
        });
      } finally {
        if (activo) {
          setLoading(false);
        }
      }
    }, 300);

    return () => {
      activo = false;
      clearTimeout(timer);
    };
  }, [paginationModel, filtros, armarParamsFiltros]);

  useEffect(() => {
    const timer = setTimeout(() => {
      cargarProductos(productoSearch);
    }, 300);

    return () => clearTimeout(timer);
  }, [productoSearch]);

  const columns = [
    {
      field: 'numeroPedido',
      headerName: 'Pedido',
      width: 150
    },
    {
      field: 'fechaPedido',
      headerName: 'Fecha',
      width: 130,
      valueGetter: (_, row) => formatoFechaNegocio(row.fechaPedido)
    },
    {
      field: 'proveedor',
      headerName: 'Proveedor',
      flex: 1,
      valueGetter: (_, row) =>
        row.proveedor?.nombreComercial || ''
    },
    {
      field: 'empresaFacturacion',
      headerName: 'Empresa fact.',
      width: 190,
      valueGetter: (_, row) =>
        row.empresaFacturacion?.razonSocial || 'Sin asignar'
    },
    {
      field: 'transporte',
      headerName: 'Transporte',
      width: 170,
      valueGetter: (_, row) =>
        row.transporte?.nombre || 'Sin asignar'
    },
    {
      field: 'estado',
      headerName: 'Estado',
      width: 150,
      renderCell: (params) => (
        <Chip
          label={params.value}
          color={
            params.value === 'CANCELADO'
              ? 'error'
              : params.value === 'BORRADOR'
              ? 'default'
              : 'primary'
          }
          size="small"
        />
      )
    },
    {
      field: 'totalConIva',
      headerName: 'Total',
      width: 150,
      valueGetter: (_, row) => formatoMoneda(row.totalConIva)
    },
    {
      field: 'gestionAdministrativa',
      headerName: 'Adm.',
      width: 125,
      sortable: false,
      filterable: false,
      renderCell: (params) =>
        tieneGestionAdministrativaPendiente(params.row) ? (
          <Tooltip title="Tiene gestion administrativa pendiente">
            <Chip
              label="Pendiente"
              color="warning"
              size="small"
            />
          </Tooltip>
        ) : (
          <Chip
            label="OK"
            color="success"
            size="small"
            variant="outlined"
          />
        )
    },
    {
      field: 'acciones',
      headerName: 'Acciones',
      width: 300,
      sortable: false,
      filterable: false,
      renderCell: (params) => (
        <Box display="flex" gap={0.5}>
          <Tooltip title="Ver detalle">
            <IconButton
              color="default"
              onClick={() => verDetalle(params.row)}
            >
              <VisibilityIcon />
            </IconButton>
          </Tooltip>

          <Tooltip title="Editar">
            <IconButton
              color="primary"
              onClick={() => editar(params.row)}
              disabled={params.row.estado !== 'BORRADOR'}
            >
              <EditIcon />
            </IconButton>
          </Tooltip>

          <Tooltip title="Enviar pedido">
            <IconButton
              color="info"
              onClick={() => enviar(params.row.id)}
              disabled={params.row.estado !== 'BORRADOR'}
            >
              <SendIcon />
            </IconButton>
          </Tooltip>

          <Tooltip title="Confirmar pedido">
            <IconButton
              color="success"
              onClick={() => confirmar(params.row.id)}
              disabled={params.row.estado !== 'ENVIADO'}
            >
              <CheckCircleIcon />
            </IconButton>
          </Tooltip>

          <Tooltip title="Recepcionar">
            <IconButton
              color="warning"
              onClick={() => abrirRecepcion(params.row)}
              disabled={
                !['CONFIRMADO', 'RECIBIDO_PARCIAL'].includes(params.row.estado)
              }
            >
              <MoveToInboxIcon />
            </IconButton>
          </Tooltip>

          <Tooltip title="Cancelar">
            <IconButton
              color="error"
              onClick={() => cancelar(params.row.id)}
              disabled={[
                'CANCELADO',
                'RECIBIDO_PARCIAL',
                'RECIBIDO_COMPLETO'
              ].includes(params.row.estado)}
            >
              <CancelIcon />
            </IconButton>
          </Tooltip>

          <Tooltip title="Historial">
            <IconButton
              color="secondary"
              onClick={() => verHistorico(params.row.id)}
            >
              <HistoryIcon />
            </IconButton>
          </Tooltip>
        </Box>
      )
    }
  ];

  const columnsHistorico = [
    {
      field: 'accion',
      headerName: 'Accion',
      width: 130
    },
    {
      field: 'fechaAccion',
      headerName: 'Fecha',
      width: 200,
      valueGetter: (_, row) =>
        new Date(row.fechaAccion).toLocaleString(
          'es-AR',
          {
            timeZone: 'America/Argentina/Buenos_Aires'
          }
        )
    },
    {
      field: 'usuario',
      headerName: 'Usuario',
      width: 180,
      valueGetter: (_, row) => row.usuario?.nombre || ''
    },
    {
      field: 'resumen',
      headerName: 'Resumen',
      flex: 1
    }
  ];

  return (
    <Box>
      <GlobalStyles
        styles={{
          '@page': {
            size: 'A4 landscape',
            margin: '8mm'
          },
          '@media print': {
            'body *': {
              visibility: 'hidden'
            },
            'body > *:not(.MuiDialog-root)': {
              display: 'none !important'
            },
            '#reporte-recepcion-print, #reporte-recepcion-print *': {
              visibility: 'visible'
            },
            '#reporte-recepcion-print': {
              position: 'absolute',
              left: 0,
              top: 0,
              width: '100%',
              padding: '0'
            },
            '.no-print': {
              display: 'none !important'
            },
            '.MuiDataGrid-selectedRowCount, .MuiDataGrid-footerContainer': {
              display: 'none !important'
            }
          }
        }}
      />
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 3
        }}
      >
        <Box>
          <Typography variant="h4">
            Pedidos a Proveedor
          </Typography>
          <Typography
            variant="body2"
            color="text.secondary"
          >
            Borradores, descuentos, transporte opcional y montos
          </Typography>
        </Box>

        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={nuevo}
        >
          Nuevo Pedido
        </Button>
      </Box>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: '1fr',
            md: 'repeat(4, 1fr)'
          },
          gap: 2,
          mb: 2
        }}
      >
        <Paper variant="outlined" sx={{ p: 2 }}>
          <Typography variant="body2" color="text.secondary">
            Pedidos abiertos
          </Typography>
          <Typography variant="h6">
            {resumenVisible.cantidadAbiertos}
          </Typography>
          <Typography variant="body2">
            {formatoMoneda(resumenVisible.totalPedidosAbiertos)}
          </Typography>
        </Paper>
        <Paper variant="outlined" sx={{ p: 2 }}>
          <Typography variant="body2" color="text.secondary">
            Total pedido
          </Typography>
          <Typography variant="h6">
            {formatoMoneda(resumenVisible.totalPedidos)}
          </Typography>
          <Typography variant="body2">
            {resumenVisible.cantidadPedidos} pedidos
          </Typography>
        </Paper>
        <Paper variant="outlined" sx={{ p: 2 }}>
          <Typography variant="body2" color="text.secondary">
            Recibido por facturas
          </Typography>
          <Typography variant="h6">
            {formatoMoneda(resumenVisible.totalRecibidoFacturas)}
          </Typography>
          <Typography variant="body2">
            Pendiente {formatoMoneda(resumenVisible.totalPendienteEstimado)}
          </Typography>
        </Paper>
        <Paper variant="outlined" sx={{ p: 2 }}>
          <Typography variant="body2" color="text.secondary">
            Diferencia facturas
          </Typography>
          <Typography
            variant="h6"
            color={
              Math.abs(Number(resumenVisible.diferenciaFacturas || 0)) > 1
                ? 'error.main'
                : 'success.main'
            }
          >
            {formatoMoneda(resumenVisible.diferenciaFacturas)}
          </Typography>
          <Typography variant="body2">
            Proveedor vs sistema
          </Typography>
        </Paper>
      </Box>

      <Paper sx={{ p: 2, mb: 2 }}>
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: '1fr',
              md: '2fr 1fr 1fr 1fr 1fr auto'
            },
            gap: 2
          }}
        >
          <TextField
            label="Buscar"
            name="search"
            size="small"
            value={filtros.search}
            onChange={handleFiltro}
          />

          <TextField
            select
            label="Proveedor"
            name="proveedorId"
            size="small"
            value={filtros.proveedorId}
            onChange={handleFiltro}
          >
            <MenuItem value="">Todos</MenuItem>
            {proveedores.map((proveedor) => (
              <MenuItem
                key={proveedor.id}
                value={proveedor.id}
              >
                {proveedor.nombreComercial}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            select
            label="Empresa"
            name="empresaFacturacionId"
            size="small"
            value={filtros.empresaFacturacionId}
            onChange={handleFiltro}
          >
            <MenuItem value="">Todas</MenuItem>
            {empresas.map((empresa) => (
              <MenuItem
                key={empresa.id}
                value={String(empresa.id)}
              >
                {empresa.razonSocial}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            select
            label="Estado"
            name="estado"
            size="small"
            value={filtros.estado}
            onChange={handleFiltro}
          >
            <MenuItem value="">Todos</MenuItem>
            {estadosPedido.map((estado) => (
              <MenuItem
                key={estado}
                value={estado}
              >
                {estado}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            select
            label="Transporte"
            name="transporteId"
            size="small"
            value={filtros.transporteId}
            onChange={handleFiltro}
          >
            <MenuItem value="">Todos</MenuItem>
            {transportes.map((transporte) => (
              <MenuItem
                key={transporte.id}
                value={String(transporte.id)}
              >
                {transporte.nombre}
              </MenuItem>
            ))}
            <MenuItem value="SIN_TRANSPORTE">Sin asignar</MenuItem>
          </TextField>

          <Button
            onClick={() => {
              setLoading(true);
              setFiltros({
                search: '',
                proveedorId: '',
                empresaFacturacionId: '',
                estado: '',
                transporteId: ''
              });
            }}
          >
            Limpiar
          </Button>
        </Box>
      </Paper>

      <Paper sx={{ height: 560, width: '100%' }}>
        <DataGrid
          rows={pedidos}
          columns={columns}
          getRowId={(row) => row.id}
          loading={loading}
          rowCount={total}
          paginationMode="server"
          paginationModel={paginationModel}
          onPaginationModelChange={(model) => {
            setLoading(true);
            setPaginationModel(model);
          }}
          pageSizeOptions={[10, 20, 50]}
          showToolbar
          slots={{
            toolbar: GridToolbar
          }}
          slotProps={{
            toolbar: {
              csvOptions: {
                delimiter: ';',
                utf8WithBom: true,
                fileName: 'pedidos-proveedor'
              }
            }
          }}
        />
      </Paper>

      <Dialog
        open={open}
        onClose={cerrar}
        fullWidth
        maxWidth="xl"
      >
        <DialogTitle>
          {editando ? 'Editar Pedido' : 'Nuevo Pedido'}
        </DialogTitle>

        <DialogContent>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: {
                xs: '1fr',
                md: 'repeat(6, 1fr)'
              },
              gap: 2,
              pt: 1
            }}
          >
            <FormControl>
              <InputLabel>Proveedor</InputLabel>
              <Select
                label="Proveedor"
                name="proveedorId"
                value={form.proveedorId}
                onChange={handleFormChange}
              >
                <MenuItem value="">Seleccionar</MenuItem>
                {proveedores.map((proveedor) => (
                  <MenuItem
                    key={proveedor.id}
                    value={String(proveedor.id)}
                  >
                    {proveedor.nombreComercial}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl>
              <InputLabel>Razon social</InputLabel>
              <Select
                label="Razon social"
                name="proveedorRazonSocialId"
                value={form.proveedorRazonSocialId}
                onChange={handleFormChange}
                disabled={!form.proveedorId}
              >
                <MenuItem value="">Sin asignar</MenuItem>
                {razonesSociales.map((razon) => (
                  <MenuItem
                    key={razon.id}
                    value={String(razon.id)}
                  >
                    {razon.razonSocial}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              select
              label="Empresa facturacion"
              name="empresaFacturacionId"
              value={form.empresaFacturacionId}
              onChange={handleFormChange}
            >
              <MenuItem value="">Sin asignar</MenuItem>
              {empresas.map((empresa) => (
                <MenuItem
                  key={empresa.id}
                  value={String(empresa.id)}
                >
                  {empresa.razonSocial}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              select
              label="Local destino"
              name="localDestinoId"
              value={form.localDestinoId}
              onChange={handleFormChange}
            >
              <MenuItem value="">Sin asignar</MenuItem>
              {locales.map((local) => (
                <MenuItem
                  key={local.id}
                  value={String(local.id)}
                >
                  {local.nombre}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              select
              label="Transporte"
              name="transporteId"
              value={form.transporteId}
              onChange={handleFormChange}
            >
              <MenuItem value="">Sin asignar</MenuItem>
              {transportes.map((transporte) => (
                <MenuItem
                  key={transporte.id}
                  value={String(transporte.id)}
                >
                  {transporte.nombre}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              label="Fecha pedido"
              name="fechaPedido"
              type="date"
              value={form.fechaPedido}
              onChange={handleFormChange}
              InputLabelProps={{ shrink: true }}
            />

            <TextField
              label="Entrega estimada"
              name="fechaEstimadaEntrega"
              type="date"
              value={form.fechaEstimadaEntrega}
              onChange={handleFormChange}
              InputLabelProps={{ shrink: true }}
              sx={{ gridColumn: { md: '1 / 2' } }}
            />

            <TextField
              select
              label="Estado"
              name="estado"
              value={form.estado}
              onChange={handleFormChange}
              sx={{ gridColumn: { md: '2 / 3' } }}
            >
              {estadosPedido.map((estado) => (
                <MenuItem
                  key={estado}
                  value={estado}
                >
                  {estado}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              label="Descuentos generales"
              name="descuentosGeneralesTexto"
              value={form.descuentosGeneralesTexto}
              onChange={handleFormChange}
              placeholder="10 + 10 + 5"
              sx={{ gridColumn: { md: '3 / 4' } }}
            />

            <TextField
              label="Costo transporte"
              name="transporteCostoFinal"
              type="number"
              value={form.transporteCostoFinal}
              onChange={handleFormChange}
              sx={{ gridColumn: { md: '4 / 5' } }}
            />

            <TextField
              label="Observaciones transporte"
              name="transporteObservaciones"
              value={form.transporteObservaciones}
              onChange={handleFormChange}
              sx={{ gridColumn: { md: '5 / 7' } }}
            />

            <TextField
              label="Observaciones"
              name="observaciones"
              value={form.observaciones}
              onChange={handleFormChange}
              multiline
              minRows={2}
              sx={{ gridColumn: { md: '1 / 7' } }}
            />
          </Box>

          <Divider sx={{ my: 2 }} />

          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              mb: 2
            }}
          >
            <Typography variant="h6">
              Productos
            </Typography>

            <Button
              variant="outlined"
              startIcon={<AddIcon />}
              onClick={agregarDetalle}
            >
              Agregar Producto
            </Button>
          </Box>

          <TextField
            label="Buscar productos"
            size="small"
            value={productoSearch}
            onChange={(e) => setProductoSearch(e.target.value)}
            sx={{ mb: 2, width: { xs: '100%', md: 420 } }}
          />

          <Box
            sx={{
              display: 'grid',
              gap: 2
            }}
          >
            {detalles.map((detalle) => {
              const calculado = calcularDetalle(detalle);

              return (
                <Paper
                  key={detalle.tempId}
                  variant="outlined"
                  sx={{ p: 2 }}
                >
                  <Box
                    sx={{
                      display: 'grid',
                      gridTemplateColumns: {
                        xs: '1fr',
                        md: '2fr 0.8fr 1fr 1fr 1fr 0.8fr 1fr auto'
                      },
                      gap: 2,
                      alignItems: 'center'
                    }}
                  >
                    <TextField
                      select
                      label="Producto"
                      value={detalle.productoId}
                      onChange={(e) =>
                        cambiarDetalle(
                          detalle.tempId,
                          'productoId',
                          e.target.value
                        )
                      }
                    >
                      <MenuItem value="">Seleccionar</MenuItem>
                      {productosOpciones.map((producto) => (
                        <MenuItem
                          key={producto.id}
                          value={producto.id}
                        >
                          {producto.codigo
                            ? `${producto.codigo} - ${producto.nombre}`
                            : producto.nombre}
                        </MenuItem>
                      ))}
                    </TextField>

                    <TextField
                      label="Cantidad"
                      type="number"
                      value={detalle.cantidadPedida}
                      onChange={(e) =>
                        cambiarDetalle(
                          detalle.tempId,
                          'cantidadPedida',
                          e.target.value
                        )
                      }
                    />

                    <TextField
                      select
                      label="Tipo precio"
                      value={detalle.tipoPrecio}
                      onChange={(e) =>
                        cambiarDetalle(
                          detalle.tempId,
                          'tipoPrecio',
                          e.target.value
                        )
                      }
                    >
                      <MenuItem value="LISTA">Lista</MenuItem>
                      <MenuItem value="DESCUENTO">Descuento</MenuItem>
                      <MenuItem value="PROMOCION">Promocion</MenuItem>
                    </TextField>

                    <TextField
                      label="Precio proveedor s/IVA"
                      type="number"
                      value={detalle.precioListaSinIva}
                      onChange={(e) =>
                        cambiarDetalle(
                          detalle.tempId,
                          'precioListaSinIva',
                          e.target.value
                        )
                      }
                    />

                    <TextField
                      label="Desc."
                      value={detalle.descuentosTexto}
                      onChange={(e) =>
                        cambiarDetalle(
                          detalle.tempId,
                          'descuentosTexto',
                          e.target.value
                        )
                      }
                      placeholder="14 + 5"
                    />

                    <TextField
                      select
                      label="IVA"
                      value={detalle.ivaCondicion}
                      onChange={(e) =>
                        cambiarDetalle(
                          detalle.tempId,
                          'ivaCondicion',
                          e.target.value
                        )
                      }
                    >
                      <MenuItem value="GRAVADO">Gravado</MenuItem>
                      <MenuItem value="EXENTO">Exento</MenuItem>
                      <MenuItem value="NO_GRAVADO">No gravado</MenuItem>
                    </TextField>

                    <TextField
                      label="% IVA"
                      type="number"
                      value={detalle.ivaPorcentaje}
                      onChange={(e) =>
                        cambiarDetalle(
                          detalle.tempId,
                          'ivaPorcentaje',
                          e.target.value
                        )
                      }
                      disabled={detalle.ivaCondicion === 'EXENTO'}
                    />

                    <Tooltip title="Eliminar">
                      <IconButton
                        color="error"
                        onClick={() => eliminarDetalle(detalle.tempId)}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Tooltip>
                  </Box>

                  <Box
                    sx={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: 2,
                      mt: 2,
                      color: 'text.secondary'
                    }}
                  >
                    <Typography variant="body2">
                      Desc. efectivo: {calculado.descuentoEfectivo}%
                    </Typography>
                    <Typography variant="body2">
                      Unit. s/IVA: {formatoMoneda(calculado.precioUnitarioSinIva)}
                    </Typography>
                    <Typography variant="body2">
                      Unit. c/IVA: {formatoMoneda(calculado.precioUnitarioConIva)}
                    </Typography>
                    <Typography variant="body2">
                      Total linea antes desc. gral:{' '}
                      {formatoMoneda(calculado.totalConIva)}
                    </Typography>
                  </Box>
                </Paper>
              );
            })}
          </Box>

          <Paper
            variant="outlined"
            sx={{
              mt: 2,
              p: 2,
              display: 'grid',
              gridTemplateColumns: {
                xs: '1fr',
                md: 'repeat(6, 1fr)'
              },
              gap: 2
            }}
          >
            <Typography>
              Subtotal s/IVA: {formatoMoneda(totales.subtotalSinIva)}
            </Typography>
            <Typography>
              Total antes desc. gral: {formatoMoneda(totales.totalConIvaAntes)}
            </Typography>
            <Typography>
              Desc. general: {totales.descuentoEfectivo}% -{' '}
              {formatoMoneda(totales.descuentoImporte)}
            </Typography>
            <Typography>
              Base c/desc.: {formatoMoneda(totales.baseConDescuento)}
            </Typography>
            <Typography>
              IVA: {formatoMoneda(totales.ivaImporte)}
            </Typography>
            <Typography fontWeight={700}>
              Total: {formatoMoneda(totales.totalConIva)}
            </Typography>
          </Paper>
        </DialogContent>

        <DialogActions>
          <Button onClick={cerrar}>
            Cancelar
          </Button>
          <Button
            variant="contained"
            onClick={guardar}
          >
            {editando ? 'Actualizar' : 'Guardar'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={openRecepcion}
        onClose={cerrarRecepcion}
        fullWidth
        maxWidth="xl"
      >
        <DialogTitle>
          Recepcionar {pedidoRecepcion?.numeroPedido}
        </DialogTitle>

        <DialogContent>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: {
                xs: '1fr',
                md: 'repeat(4, 1fr)'
              },
              gap: 2,
              pt: 1
            }}
          >
            <TextField
              label="Fecha recepcion"
              name="fechaRecepcion"
              type="date"
              value={formRecepcion.fechaRecepcion}
              onChange={cambiarRecepcion}
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              label="Remito"
              name="numeroRemito"
              value={formRecepcion.numeroRemito}
              onChange={cambiarRecepcion}
            />
            <TextField
              label="Punto venta"
              name="facturaPuntoVenta"
              value={formRecepcion.facturaPuntoVenta}
              onChange={cambiarRecepcion}
              placeholder="00025"
            />
            <TextField
              label="Numero factura"
              name="facturaNumero"
              value={formRecepcion.facturaNumero}
              onChange={cambiarRecepcion}
              placeholder="00004578"
            />
            <TextField
              label="Total factura proveedor"
              name="totalFacturaProveedor"
              type="number"
              value={formRecepcion.totalFacturaProveedor}
              onChange={cambiarRecepcion}
              helperText={`Sistema: ${formatoMoneda(
                totalesRecepcion.totalFacturaSistema
              )}`}
            />
            <TextField
              select
              label="Empresa facturada"
              name="empresaFacturacionId"
              value={formRecepcion.empresaFacturacionId}
              onChange={cambiarRecepcion}
            >
              <MenuItem value="">Sin asignar</MenuItem>
              {empresas.map((empresa) => (
                <MenuItem
                  key={empresa.id}
                  value={String(empresa.id)}
                >
                  {empresa.razonSocial}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              label="Local destino"
              value={pedidoRecepcion?.localDestino?.nombre || ''}
              InputProps={{ readOnly: true }}
            />
            <TextField
              select
              label="Razon social facturante"
              name="proveedorRazonSocialId"
              value={formRecepcion.proveedorRazonSocialId}
              onChange={cambiarRecepcion}
            >
              <MenuItem value="">Sin asignar</MenuItem>
              {razonesSociales.map((razon) => (
                <MenuItem
                  key={razon.id}
                  value={String(razon.id)}
                >
                  {razon.razonSocial}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              label="Redondeo precio publico"
              name="redondeoBase"
              type="number"
              value={formRecepcion.redondeoBase}
              onChange={cambiarRecepcion}
              helperText="Ej: 1, 10, 50, 100"
            />
            <TextField
              label="Margenes publico general"
              name="margenesPrecioPublicoGeneralTexto"
              value={formRecepcion.margenesPrecioPublicoGeneralTexto}
              onChange={cambiarRecepcion}
              placeholder="68 + 50"
              helperText="Se copia a todos los productos"
            />
            <TextField
              label="Observaciones"
              name="observaciones"
              value={formRecepcion.observaciones}
              onChange={cambiarRecepcion}
              multiline
              minRows={2}
              sx={{ gridColumn: { md: '1 / 5' } }}
            />
          </Box>

          <Divider sx={{ my: 2 }} />

          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              mb: 2
            }}
          >
            <Typography variant="h6">
              Impuestos y otros importes de factura
            </Typography>
            <Button
              variant="outlined"
              startIcon={<AddIcon />}
              onClick={agregarImporteRecepcion}
            >
              Agregar Importe
            </Button>
          </Box>

          {otrosImportesRecepcion.length > 0 && (
            <Box sx={{ display: 'grid', gap: 1.5, mb: 2 }}>
              {otrosImportesRecepcion.map((importe) => (
                <Paper
                  key={importe.tempId}
                  variant="outlined"
                  sx={{ p: 2 }}
                >
                  <Box
                    sx={{
                      display: 'grid',
                      gridTemplateColumns: {
                        xs: '1fr',
                        md: '1fr 2fr 1fr 1fr auto'
                      },
                      gap: 2,
                      alignItems: 'center'
                    }}
                  >
                    <TextField
                      select
                      label="Tipo"
                      value={importe.tipo}
                      onChange={(e) =>
                        cambiarImporteRecepcion(
                          importe.tempId,
                          'tipo',
                          e.target.value
                        )
                      }
                    >
                      <MenuItem value="PERCEPCION">Percepcion</MenuItem>
                      <MenuItem value="INGRESOS_BRUTOS">
                        Ingresos brutos
                      </MenuItem>
                      <MenuItem value="FLETE">Flete</MenuItem>
                      <MenuItem value="OTRO">Otro</MenuItem>
                    </TextField>
                    <TextField
                      label="Descripcion"
                      value={importe.descripcion}
                      onChange={(e) =>
                        cambiarImporteRecepcion(
                          importe.tempId,
                          'descripcion',
                          e.target.value
                        )
                      }
                    />
                    <TextField
                      label="%"
                      type="number"
                      value={importe.porcentaje}
                      onChange={(e) =>
                        cambiarImporteRecepcion(
                          importe.tempId,
                          'porcentaje',
                          e.target.value
                        )
                      }
                    />
                    <TextField
                      label="Importe"
                      type="number"
                      value={importe.importe}
                      onChange={(e) =>
                        cambiarImporteRecepcion(
                          importe.tempId,
                          'importe',
                          e.target.value
                        )
                      }
                    />
                    <Tooltip title="Eliminar">
                      <IconButton
                        color="error"
                        onClick={() =>
                          eliminarImporteRecepcion(importe.tempId)
                        }
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </Paper>
              ))}
            </Box>
          )}

          <Divider sx={{ my: 2 }} />

          <Box sx={{ display: 'grid', gap: 2 }}>
            {detallesRecepcion.map((detalle) => {
              const precioRecepcion = calcularPrecioRecepcion(
                detalle,
                formRecepcion.redondeoBase
              );

              return (
                <Paper
                  key={detalle.pedidoProveedorDetalleId}
                  variant="outlined"
                  sx={{ p: 2 }}
                >
                  <Typography
                    variant="subtitle1"
                    fontWeight={700}
                    sx={{ mb: 2 }}
                  >
                    {detalle.producto}
                  </Typography>

                  <Box
                    sx={{
                      display: 'grid',
                      gridTemplateColumns: {
                        xs: '1fr',
                        md: 'repeat(7, 1fr)'
                      },
                      gap: 2,
                      alignItems: 'center'
                    }}
                  >
                    <TextField
                      label="Pedido"
                      value={detalle.cantidadPedida}
                      InputProps={{ readOnly: true }}
                    />
                    <TextField
                      label="Pendiente"
                      value={detalle.pendiente}
                      InputProps={{ readOnly: true }}
                    />
                    <TextField
                      label="Facturado"
                      type="number"
                      value={detalle.cantidadFacturada}
                      onChange={(e) =>
                        cambiarDetalleRecepcion(
                          detalle.pedidoProveedorDetalleId,
                          'cantidadFacturada',
                          e.target.value
                        )
                      }
                    />
                    <TextField
                      label="Recibido fisico"
                      type="number"
                      value={detalle.cantidadRecibida}
                      onChange={(e) =>
                        cambiarDetalleRecepcion(
                          detalle.pedidoProveedorDetalleId,
                          'cantidadRecibida',
                          e.target.value
                        )
                      }
                    />
                    <TextField
                      label="Excedente"
                      value={detalle.cantidadExcedente}
                      InputProps={{ readOnly: true }}
                    />
                    <TextField
                      select
                      label="Accion excedente"
                      value={detalle.accionExcedente}
                      onChange={(e) =>
                        cambiarDetalleRecepcion(
                          detalle.pedidoProveedorDetalleId,
                          'accionExcedente',
                          e.target.value
                        )
                      }
                      disabled={Number(detalle.cantidadExcedente || 0) <= 0}
                    >
                      <MenuItem value="SIN_EXCEDENTE">Sin excedente</MenuItem>
                      <MenuItem value="ACEPTAR">Aceptar e ingresar</MenuItem>
                      <MenuItem value="DEVOLVER">Devolver</MenuItem>
                      <MenuItem value="PENDIENTE">Pendiente</MenuItem>
                    </TextField>
                    <TextField
                      label="Rechazado"
                      type="number"
                      value={detalle.cantidadRechazada}
                      onChange={(e) =>
                        cambiarDetalleRecepcion(
                          detalle.pedidoProveedorDetalleId,
                          'cantidadRechazada',
                          e.target.value
                        )
                      }
                    />
                  </Box>

                  <Box
                    sx={{
                      display: 'grid',
                      gridTemplateColumns: {
                        xs: '1fr',
                        md: 'repeat(6, 1fr)'
                      },
                      gap: 2,
                      alignItems: 'flex-start',
                      mt: 2
                    }}
                  >
                    <TextField
                      label="Lista proveedor s/IVA"
                      type="number"
                      value={detalle.precioListaProveedor}
                      onChange={(e) =>
                        cambiarDetalleRecepcion(
                          detalle.pedidoProveedorDetalleId,
                          'precioListaProveedor',
                          e.target.value
                        )
                      }
                      helperText=" "
                    />
                    <TextField
                      label="Desc. proveedor"
                      value={detalle.descuentosProveedorTexto}
                      onChange={(e) =>
                        cambiarDetalleRecepcion(
                          detalle.pedidoProveedorDetalleId,
                          'descuentosProveedorTexto',
                          e.target.value
                        )
                      }
                      placeholder="20 o 10 + 10 + 5"
                      helperText="General + item; puede agregar extra"
                    />
                    <TextField
                      label="% IVA"
                      type="number"
                      value={detalle.ivaPorcentaje}
                      onChange={(e) =>
                        cambiarDetalleRecepcion(
                          detalle.pedidoProveedorDetalleId,
                          'ivaPorcentaje',
                          e.target.value
                        )
                      }
                      helperText=" "
                    />
                    <TextField
                      label="Margenes publico"
                      value={detalle.margenesPrecioPublicoTexto}
                      onChange={(e) =>
                        cambiarDetalleRecepcion(
                          detalle.pedidoProveedorDetalleId,
                          'margenesPrecioPublicoTexto',
                          e.target.value
                        )
                      }
                      placeholder="68 + 50"
                      helperText=" "
                    />
                    <TextField
                      label="Precio publico nuevo"
                      type="number"
                      value={detalle.precioPublicoNuevo}
                      onChange={(e) =>
                        cambiarDetalleRecepcion(
                          detalle.pedidoProveedorDetalleId,
                          'precioPublicoNuevo',
                          e.target.value
                        )
                      }
                      helperText={`Sugerido ${formatoMoneda(
                        precioRecepcion.precioPublicoRedondeado
                      )}`}
                    />
                    <FormControlLabel
                      sx={{ alignSelf: 'center', minHeight: 56 }}
                      control={
                        <Switch
                          checked={detalle.actualizarPrecioPublico}
                          onChange={(e) =>
                            cambiarDetalleRecepcion(
                              detalle.pedidoProveedorDetalleId,
                              'actualizarPrecioPublico',
                              e.target.checked
                            )
                          }
                        />
                      }
                      label="Actualizar precio"
                    />
                  </Box>

                  <Box
                    sx={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: 2,
                      mt: 2,
                      color: 'text.secondary'
                    }}
                  >
                    <Typography variant="body2">
                      Faltante factura:{' '}
                      {Math.max(
                        Number(detalle.cantidadFacturada || 0) -
                          Number(detalle.cantidadRecibida || 0),
                        0
                      )}
                    </Typography>
                    <Typography variant="body2">
                      Sobrante factura:{' '}
                      {Math.max(
                        Number(detalle.cantidadRecibida || 0) -
                          Number(detalle.cantidadFacturada || 0),
                        0
                      )}
                    </Typography>
                    <Typography variant="body2">
                      Anterior: {formatoMoneda(detalle.precioPublicoAnterior)}
                    </Typography>
                    <Typography variant="body2">
                      Neto: {formatoMoneda(precioRecepcion.precioConDescuento)}
                    </Typography>
                    <Typography variant="body2">
                      Con IVA: {formatoMoneda(precioRecepcion.precioConIva)}
                    </Typography>
                    <Typography variant="body2">
                      Calculado: {formatoMoneda(precioRecepcion.precioPublicoCalculado)}
                    </Typography>
                    <Typography variant="body2" fontWeight={700}>
                      Redondeado: {formatoMoneda(precioRecepcion.precioPublicoRedondeado)}
                    </Typography>
                  </Box>
                </Paper>
              );
            })}
          </Box>

          {detallesRecepcion.length === 0 && (
            <Typography color="text.secondary">
              No hay productos pendientes para recibir.
            </Typography>
          )}

          <Paper
            variant="outlined"
            sx={{
              mt: 2,
              p: 2,
              display: 'grid',
              gridTemplateColumns: {
                xs: '1fr',
                md: 'repeat(5, 1fr)'
              },
              gap: 2
            }}
          >
            <Typography>
              Productos s/IVA: {formatoMoneda(totalesRecepcion.subtotalProductos)}
            </Typography>
            <Typography>
              IVA productos: {formatoMoneda(totalesRecepcion.ivaProductos)}
            </Typography>
            <Typography>
              Importes extra: {formatoMoneda(totalesRecepcion.otrosImportesTotal)}
            </Typography>
            <Typography fontWeight={700}>
              Total sistema: {formatoMoneda(totalesRecepcion.totalFacturaSistema)}
            </Typography>
            <Typography
              fontWeight={700}
              color={
                Math.abs(totalesRecepcion.diferenciaFactura) > 1
                  ? 'error.main'
                  : 'success.main'
              }
            >
              Diferencia: {formatoMoneda(totalesRecepcion.diferenciaFactura)}
            </Typography>
          </Paper>
        </DialogContent>

        <DialogActions>
          <Button onClick={cerrarRecepcion}>
            Cancelar
          </Button>
          <Button
            variant="contained"
            onClick={guardarRecepcion}
            disabled={detallesRecepcion.length === 0}
          >
            Guardar Recepcion
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={openDetalle}
        onClose={cerrarDetalle}
        fullWidth
        maxWidth="xl"
      >
        <DialogTitle>
          Detalle {pedidoDetalle?.numeroPedido}
        </DialogTitle>
        <DialogContent>
          {pedidoDetalle && (
            <Box sx={{ display: 'grid', gap: 2, pt: 1 }}>
              <Paper
                variant="outlined"
                sx={{
                  p: 2,
                  display: 'grid',
                  gridTemplateColumns: {
                    xs: '1fr',
                    md: 'repeat(4, 1fr)'
                  },
                  gap: 2
                }}
              >
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Proveedor
                  </Typography>
                  <Typography fontWeight={700}>
                    {pedidoDetalle.proveedor?.nombreComercial || ''}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Razon social
                  </Typography>
                  <Typography>
                    {pedidoDetalle.proveedorRazonSocial?.razonSocial ||
                      'Sin asignar'}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Empresa facturada
                  </Typography>
                  <Typography>
                    {pedidoDetalle.empresaFacturacion?.razonSocial ||
                      'Sin asignar'}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Local destino
                  </Typography>
                  <Typography>
                    {pedidoDetalle.localDestino?.nombre || 'Sin asignar'}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Estado
                  </Typography>
                  <Chip label={pedidoDetalle.estado} size="small" />
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Transporte
                  </Typography>
                  <Typography>
                    {pedidoDetalle.transporte?.nombre || 'Sin asignar'}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Fecha pedido
                  </Typography>
                  <Typography>
                    {formatoFechaNegocio(pedidoDetalle.fechaPedido)}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Total pedido
                  </Typography>
                  <Typography fontWeight={700}>
                    {formatoMoneda(pedidoDetalle.totalConIva)}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Desc. proveedor
                  </Typography>
                  <Typography>
                    {descuentosToTexto(pedidoDetalle.descuentosGenerales) ||
                      descuentoValorToTexto(
                        pedidoDetalle.descuentoGeneralPorcentaje
                      ) ||
                      '0'}
                    %
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Observaciones
                  </Typography>
                  <Typography>
                    {pedidoDetalle.observaciones || '-'}
                  </Typography>
                </Box>
              </Paper>

              <Typography variant="h6">
                Productos pedidos
              </Typography>
              <Box sx={{ display: 'grid', gap: 1.5 }}>
                {(pedidoDetalle.detalles || []).map((detalle) => {
                  const recibido = calcularTotalRecibidoDetalle(detalle);
                  const pendiente = Math.max(
                    Number(detalle.cantidadPedida || 0) -
                      Number(detalle.cantidadCancelada || 0) -
                      recibido,
                    0
                  );
                  const descuentoProductoTexto =
                    descuentosToTexto(detalle.descuentosPorcentaje) ||
                    descuentoValorToTexto(detalle.descuentoPorcentaje) ||
                    '0';

                  return (
                    <Paper
                      key={detalle.id}
                      variant="outlined"
                      sx={{ p: 2 }}
                    >
                      <Box
                        sx={{
                          display: 'grid',
                          gridTemplateColumns: {
                            xs: '1fr',
                            md: '2fr repeat(8, 1fr)'
                          },
                          gap: 2,
                          alignItems: 'center'
                        }}
                      >
                        <Typography fontWeight={700}>
                          {detalle.producto?.codigo
                            ? `${detalle.producto.codigo} - ${detalle.producto.nombre}`
                            : detalle.producto?.nombre}
                        </Typography>
                        <Typography>
                          Pedido: {detalle.cantidadPedida}
                        </Typography>
                        <Typography>
                          Recibido: {recibido}
                        </Typography>
                        <Typography>
                          Pendiente: {pendiente}
                        </Typography>
                        <Typography>
                          Lista: {formatoMoneda(detalle.precioListaSinIva)}
                        </Typography>
                        <Typography>
                          IVA: {detalle.ivaPorcentaje}%
                        </Typography>
                        <Typography variant="body2">
                          Prod.: {descuentoProductoTexto}%
                        </Typography>
                        <Typography>
                          Total bruto: {formatoMoneda(detalle.totalConIva)}
                        </Typography>
                        <Typography fontWeight={700}>
                          Total c/desc.:{' '}
                          {formatoMoneda(
                            totalDetalleConDescuentosGenerales(
                              detalle,
                              pedidoDetalle
                            )
                          )}
                        </Typography>
                      </Box>
                    </Paper>
                  );
                })}
              </Box>

              <Typography variant="h6">
                Recepciones
              </Typography>
              {(pedidoDetalle.recepciones || []).length === 0 ? (
                <Typography color="text.secondary">
                  Todavia no hay recepciones para este pedido.
                </Typography>
              ) : (
                <Box sx={{ display: 'grid', gap: 2 }}>
                  {pedidoDetalle.recepciones.map((recepcion) => (
                    <Paper
                      key={recepcion.id}
                      variant="outlined"
                      sx={{ p: 2 }}
                    >
                      <Box
                        sx={{
                          display: 'grid',
                          gridTemplateColumns: {
                            xs: '1fr',
                            md: 'repeat(7, 1fr)'
                          },
                          gap: 2,
                          mb: 2
                        }}
                      >
                        <Typography>
                          Fecha:{' '}
                          {formatoFechaNegocio(recepcion.fechaRecepcion)}
                        </Typography>
                        <Box>
                          <Chip
                            label={recepcion.estado}
                            color={
                              recepcion.estado === 'PENDIENTE_CONTROL'
                                ? 'warning'
                                : 'success'
                            }
                            size="small"
                          />
                        </Box>
                        <Typography>
                          Factura:{' '}
                          {recepcion.facturaPuntoVenta ||
                            recepcion.numeroFactura ||
                            '-'}
                          {recepcion.facturaNumero
                            ? `-${recepcion.facturaNumero}`
                            : ''}
                        </Typography>
                        <Typography>
                          Empresa:{' '}
                          {recepcion.empresaFacturacion?.razonSocial ||
                            'Sin asignar'}
                        </Typography>
                        <Typography>
                          Total proveedor:{' '}
                          {formatoMoneda(recepcion.totalFacturaProveedor)}
                        </Typography>
                        <Typography>
                          Total sistema:{' '}
                          {formatoMoneda(recepcion.totalFacturaSistema)}
                        </Typography>
                        <Typography
                          fontWeight={700}
                          color={
                            Math.abs(
                              Number(recepcion.diferenciaFactura || 0)
                            ) > 1
                              ? 'error.main'
                              : 'success.main'
                          }
                        >
                          Dif.: {formatoMoneda(recepcion.diferenciaFactura)}
                        </Typography>
                        <Box>
                          <Box display="flex" gap={1} flexWrap="wrap">
                            <Button
                              size="small"
                              variant="outlined"
                              startIcon={<PrintIcon />}
                              onClick={() => abrirReporteRecepcion(recepcion)}
                            >
                              Reporte
                            </Button>
                            <Button
                              size="small"
                              variant="outlined"
                              color="warning"
                              onClick={() => abrirCorregirFactura(recepcion)}
                            >
                              Corregir factura
                            </Button>
                            {recepcion.estado === 'PENDIENTE_CONTROL' && (
                              <Button
                                size="small"
                                variant="contained"
                                color="success"
                                startIcon={<CheckCircleIcon />}
                                onClick={() =>
                                  abrirControlRecepcion(recepcion)
                                }
                              >
                                Cerrar control
                              </Button>
                            )}
                          </Box>
                        </Box>
                      </Box>

                      {recepcion.requiereGestionAdministrativa && (
                        <Alert
                          severity={
                            recepcion.gestionAdministrativaEstado ===
                            'RESUELTA'
                              ? 'success'
                              : 'warning'
                          }
                          sx={{ mb: 2 }}
                          action={
                            recepcion.gestionAdministrativaEstado ===
                            'PENDIENTE' ? (
                              <Button
                                color="inherit"
                                size="small"
                                onClick={() =>
                                  abrirGestionAdministrativa(recepcion)
                                }
                              >
                                Resolver
                              </Button>
                            ) : null
                          }
                        >
                          Alerta para administracion:{' '}
                          {recepcion.gestionAdministrativaTipo}{' '}
                          ({recepcion.gestionAdministrativaEstado})
                          {' '}Importe estimado:{' '}
                          {formatoMoneda(
                            calcularImporteGestionAdministrativa(recepcion)
                          )}
                          {recepcion.gestionAdministrativaEstado ===
                            'RESUELTA' &&
                            recepcion.gestionAdministrativaComprobanteTipo &&
                            ` - ${recepcion.gestionAdministrativaComprobanteTipo} ${recepcion.gestionAdministrativaComprobanteNumero || ''}`}
                        </Alert>
                      )}

                      {(recepcion.otrosImportes || []).length > 0 && (
                        <Box sx={{ mb: 2 }}>
                          <Typography
                            variant="body2"
                            fontWeight={700}
                            sx={{ mb: 1 }}
                          >
                            Impuestos y otros importes
                          </Typography>
                          {(recepcion.otrosImportes || []).map((importe) => (
                            <Typography
                              key={importe.id}
                              variant="body2"
                              color="text.secondary"
                            >
                              {importe.tipo}: {formatoMoneda(importe.importe)}
                              {importe.descripcion
                                ? ` - ${importe.descripcion}`
                                : ''}
                            </Typography>
                          ))}
                        </Box>
                      )}

                      <Box sx={{ display: 'grid', gap: 1 }}>
                        {(recepcion.detalles || []).map((detalle) => (
                          <Box
                            key={detalle.id}
                            sx={{
                              display: 'grid',
                              gridTemplateColumns: {
                                xs: '1fr',
                                md: '2fr repeat(6, 1fr)'
                              },
                              gap: 1.5
                            }}
                          >
                            <Typography variant="body2">
                              {detalle.pedidoProveedorDetalle?.producto?.codigo
                                ? `${detalle.pedidoProveedorDetalle.producto.codigo} - ${detalle.pedidoProveedorDetalle.producto.nombre}`
                                : detalle.pedidoProveedorDetalle?.producto
                                    ?.nombre}
                            </Typography>
                            <Typography variant="body2">
                              Fact.: {detalle.cantidadFacturada}
                            </Typography>
                            <Typography variant="body2">
                              Rec.: {detalle.cantidadRecibida}
                            </Typography>
                            {detalle.cantidadControlada !== null &&
                              detalle.cantidadControlada !== undefined && (
                                <Typography
                                  variant="body2"
                                  color={
                                    Number(
                                      detalle.cantidadDiferenciaControl || 0
                                    ) !== 0
                                      ? 'warning.main'
                                      : 'text.primary'
                                  }
                                >
                                  Ctrl.: {detalle.cantidadControlada}
                                  {Number(
                                    detalle.cantidadDiferenciaControl || 0
                                  ) !== 0
                                    ? ` (${detalle.cantidadDiferenciaControl})`
                                    : ''}
                                </Typography>
                              )}
                            <Typography variant="body2">
                              Exc.: {detalle.cantidadExcedente}
                            </Typography>
                            <Typography variant="body2">
                              {detalle.accionExcedente}
                            </Typography>
                            <Typography variant="body2">
                              Precio publico nuevo:{' '}
                              {formatoMoneda(detalle.precioPublicoNuevo)}
                            </Typography>
                            <Typography variant="body2">
                              Act.:{' '}
                              {detalle.actualizarPrecioPublico ? 'Si' : 'No'}
                            </Typography>
                          </Box>
                        ))}
                      </Box>
                    </Paper>
                  ))}
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={cerrarDetalle}>
            Cerrar
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={openCorregirFactura}
        onClose={cerrarCorregirFactura}
        fullWidth
        maxWidth="md"
      >
        <DialogTitle>
          Corregir factura de recepcion
        </DialogTitle>
        <DialogContent>
          <Alert severity="info" sx={{ mb: 2 }}>
            Esta correccion solo modifica datos del comprobante y recalcula la
            diferencia de factura. No mueve stock ni cambia el control fisico.
          </Alert>

          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: {
                xs: '1fr',
                md: 'repeat(4, 1fr)'
              },
              gap: 2,
              mt: 1
            }}
          >
            <TextField
              label="Remito"
              name="numeroRemito"
              value={formCorregirFactura.numeroRemito}
              onChange={handleCorregirFacturaChange}
            />
            <TextField
              label="Factura texto"
              name="numeroFactura"
              value={formCorregirFactura.numeroFactura}
              onChange={handleCorregirFacturaChange}
            />
            <TextField
              label="Punto venta"
              name="facturaPuntoVenta"
              value={formCorregirFactura.facturaPuntoVenta}
              onChange={handleCorregirFacturaChange}
            />
            <TextField
              label="Numero factura"
              name="facturaNumero"
              value={formCorregirFactura.facturaNumero}
              onChange={handleCorregirFacturaChange}
            />
            <TextField
              label="Total proveedor"
              name="totalFacturaProveedor"
              type="number"
              value={formCorregirFactura.totalFacturaProveedor}
              onChange={handleCorregirFacturaChange}
              helperText={`Sistema: ${formatoMoneda(
                recepcionCorregirFactura?.totalFacturaSistema
              )}`}
              sx={{ gridColumn: { md: '1 / 3' } }}
            />
            <TextField
              label="Diferencia nueva"
              value={formatoMoneda(
                Number(formCorregirFactura.totalFacturaProveedor || 0) -
                  Number(
                    recepcionCorregirFactura?.totalFacturaSistema || 0
                  )
              )}
              InputProps={{ readOnly: true }}
              sx={{ gridColumn: { md: '3 / 5' } }}
            />
            {Math.abs(
              Number(formCorregirFactura.totalFacturaProveedor || 0) -
                Number(recepcionCorregirFactura?.totalFacturaSistema || 0)
            ) > 1000 && (
              <Alert severity="warning" sx={{ gridColumn: { md: '1 / 5' } }}>
                La diferencia sigue siendo alta. Revise si el total proveedor
                fue cargado correctamente.
              </Alert>
            )}
            <TextField
              label="Observaciones"
              name="observaciones"
              value={formCorregirFactura.observaciones}
              onChange={handleCorregirFacturaChange}
              multiline
              minRows={2}
              sx={{ gridColumn: { md: '1 / 5' } }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={cerrarCorregirFactura}>
            Cancelar
          </Button>
          <Button
            variant="contained"
            onClick={guardarCorreccionFactura}
          >
            Guardar correccion
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={openControlRecepcion}
        onClose={cerrarControlRecepcion}
        fullWidth
        maxWidth="lg"
      >
        <DialogTitle>
          Cerrar control de recepcion
        </DialogTitle>
        <DialogContent>
          <Alert severity="info" sx={{ mb: 2 }}>
            Cargue la cantidad fisica controlada por Central. Si no coincide
            con la factura, el sistema ajusta stock y deja una alerta
            administrativa para administracion.
          </Alert>

          <Box sx={{ display: 'grid', gap: 2 }}>
            {detallesControlRecepcion.map((detalle) => {
              const diferencia =
                Number(detalle.cantidadControlada || 0) -
                Number(detalle.cantidadRecibida || 0);
              const requiereGestion =
                diferencia !== 0 ||
                Number(detalle.cantidadFalladaControl || 0) > 0;

              return (
                <Paper
                  key={detalle.detalleId}
                  variant="outlined"
                  sx={{ p: 2 }}
                >
                  <Typography fontWeight={700} sx={{ mb: 1 }}>
                    {detalle.producto}
                  </Typography>

                  <Box
                    sx={{
                      display: 'grid',
                      gridTemplateColumns: {
                        xs: '1fr',
                        md: '120px 120px 150px 130px 1fr'
                      },
                      gap: 2,
                      alignItems: 'center'
                    }}
                  >
                    <TextField
                      label="Facturado"
                      value={detalle.cantidadFacturada}
                      InputProps={{ readOnly: true }}
                    />

                    <TextField
                      label="Informe"
                      value={detalle.cantidadRecibida}
                      InputProps={{ readOnly: true }}
                    />

                    <TextField
                      label="Control fisico"
                      type="number"
                      value={detalle.cantidadControlada}
                      onChange={(event) =>
                        cambiarDetalleControl(
                          detalle.detalleId,
                          'cantidadControlada',
                          event.target.value
                        )
                      }
                    />

                    <TextField
                      label="Fallado"
                      type="number"
                      value={detalle.cantidadFalladaControl}
                      onChange={(event) =>
                        cambiarDetalleControl(
                          detalle.detalleId,
                          'cantidadFalladaControl',
                          event.target.value
                        )
                      }
                    />

                    <TextField
                      label="Observacion control"
                      value={detalle.observacionesControl}
                      onChange={(event) =>
                        cambiarDetalleControl(
                          detalle.detalleId,
                          'observacionesControl',
                          event.target.value
                        )
                      }
                    />
                  </Box>

                  {requiereGestion && (
                    <Alert severity="warning" sx={{ mt: 2 }}>
                      {diferencia < 0 &&
                        `Faltan ${Math.abs(diferencia)} unidades: administracion debe revisar nota de credito o reclamo.`}
                      {diferencia > 0 &&
                        `Sobran ${diferencia} unidades: administracion debe revisar factura pendiente.`}
                      {diferencia === 0 &&
                        Number(detalle.cantidadFalladaControl || 0) > 0 &&
                        'Hay mercaderia fallada: administracion debe revisar reclamo al proveedor.'}
                    </Alert>
                  )}
                </Paper>
              );
            })}
          </Box>

          <TextField
            label="Observaciones generales del control"
            value={observacionesControlRecepcion}
            onChange={(event) =>
              setObservacionesControlRecepcion(event.target.value)
            }
            fullWidth
            multiline
            minRows={2}
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={cerrarControlRecepcion}>
            Cancelar
          </Button>
          <Button
            variant="contained"
            color="success"
            onClick={aprobarControlRecepcion}
          >
            Confirmar control
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={openGestionAdministrativa}
        onClose={cerrarGestionAdministrativa}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>
          Resolver administracion
        </DialogTitle>
        <DialogContent>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: {
                xs: '1fr',
                md: '1fr 1fr'
              },
              gap: 2,
              mt: 1
            }}
          >
            <TextField
              select
              label="Responsable"
              name="responsable"
              value={formGestionAdministrativa.responsable}
              onChange={handleGestionAdministrativaChange}
            >
              <MenuItem value="PROVEEDOR">Proveedor</MenuItem>
              <MenuItem value="TRANSPORTE">Transporte</MenuItem>
              <MenuItem value="INTERNO">Interno / Ajuste</MenuItem>
            </TextField>

            <TextField
              select
              label="Comprobante"
              name="comprobanteTipo"
              value={formGestionAdministrativa.comprobanteTipo}
              onChange={handleGestionAdministrativaChange}
            >
              <MenuItem value="NOTA_CREDITO">Nota de credito</MenuItem>
              <MenuItem value="FACTURA">Factura</MenuItem>
              <MenuItem value="RECLAMO_RESUELTO">Reclamo resuelto</MenuItem>
              <MenuItem value="AJUSTE_INTERNO">Ajuste interno</MenuItem>
            </TextField>

            <TextField
              label="Numero comprobante"
              name="comprobanteNumero"
              value={formGestionAdministrativa.comprobanteNumero}
              onChange={handleGestionAdministrativaChange}
            />

            <TextField
              label="Fecha resolucion"
              name="fechaResolucion"
              type="date"
              value={formGestionAdministrativa.fechaResolucion}
              onChange={handleGestionAdministrativaChange}
              InputLabelProps={{ shrink: true }}
            />

            <TextField
              label="Importe"
              name="importe"
              type="number"
              value={formGestionAdministrativa.importe}
              onChange={handleGestionAdministrativaChange}
              sx={{ gridColumn: { md: '1 / 3' } }}
            />

            <TextField
              label="Observacion"
              name="observacion"
              value={formGestionAdministrativa.observacion}
              onChange={handleGestionAdministrativaChange}
              multiline
              minRows={3}
              sx={{ gridColumn: { md: '1 / 3' } }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={cerrarGestionAdministrativa}>
            Cancelar
          </Button>
          <Button
            variant="contained"
            onClick={guardarGestionAdministrativa}
          >
            Guardar resolucion
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={openReporteRecepcion}
        onClose={cerrarReporteRecepcion}
        fullWidth
        maxWidth="xl"
      >
        <DialogTitle className="no-print">
          Reporte de Control de Recepcion
        </DialogTitle>
        <DialogContent>
          {recepcionReporte && pedidoDetalle && (() => {
            const detallesReporte = recepcionReporte.detalles || [];
            const localesDesdeStocks = Array.from(
              new Map(
                detallesReporte
                  .flatMap((detalle) =>
                    detalle.pedidoProveedorDetalle?.producto?.stocks || []
                  )
                  .filter((stock) => stock.local)
                  .map((stock) => [stock.localId, stock.local])
              ).values()
            );
            const localesReporte = (locales.length > 0
              ? locales.filter((local) => local.habilitado !== false)
              : localesDesdeStocks
            ).sort((a, b) =>
              nombreCortoLocal(a).localeCompare(nombreCortoLocal(b), 'es')
            );

            const factura = [
              recepcionReporte.facturaPuntoVenta ||
                recepcionReporte.numeroFactura,
              recepcionReporte.facturaNumero
            ].filter(Boolean).join('-') || '-';

            return (
              <Box
                id="reporte-recepcion-print"
                sx={{
                  p: 1,
                  color: 'text.primary',
                  fontSize: 11,
                  '@media print': {
                    fontSize: 10
                  }
                }}
              >
                <Typography
                  sx={{
                    fontSize: 16,
                    fontWeight: 700,
                    mb: 0.75
                  }}
                >
                  Reporte de Control de Recepcion
                </Typography>

                <Box
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(4, 1fr)',
                    gap: 0.5,
                    mb: 1,
                    '& .MuiTypography-root': {
                      fontSize: 12,
                      lineHeight: 1.2
                    }
                  }}
                >
                  <Typography>Pedido: {pedidoDetalle.numeroPedido}</Typography>
                  <Typography>
                    Fecha: {formatoFechaNegocio(recepcionReporte.fechaRecepcion)}
                  </Typography>
                  <Typography>Remito: {recepcionReporte.numeroRemito || '-'}</Typography>
                  <Typography>Factura: {factura}</Typography>
                  <Typography>
                    Proveedor: {pedidoDetalle.proveedor?.nombreComercial || ''}
                  </Typography>
                  <Typography>
                    Razon social:{' '}
                    {recepcionReporte.proveedorRazonSocial?.razonSocial ||
                      pedidoDetalle.proveedorRazonSocial?.razonSocial ||
                      'Sin asignar'}
                  </Typography>
                  <Typography>
                    Empresa:{' '}
                    {recepcionReporte.empresaFacturacion?.razonSocial ||
                      pedidoDetalle.empresaFacturacion?.razonSocial ||
                      'Sin asignar'}
                  </Typography>
                  <Typography>
                    Local: {pedidoDetalle.localDestino?.nombre || 'Sin asignar'}
                  </Typography>
                  <Typography>
                    Transporte: {pedidoDetalle.transporte?.nombre || 'Sin asignar'}
                  </Typography>
                  <Typography>
                    Total factura: {formatoMoneda(recepcionReporte.totalFacturaProveedor)}
                  </Typography>
                  <Typography>
                    Total sistema: {formatoMoneda(recepcionReporte.totalFacturaSistema)}
                  </Typography>
                  <Typography>
                    Diferencia: {formatoMoneda(recepcionReporte.diferenciaFactura)}
                  </Typography>
                </Box>

                <Box
                  component="table"
                  sx={{
                    width: '100%',
                    borderCollapse: 'collapse',
                    tableLayout: 'fixed',
                    '& th, & td': {
                      border: '1px solid #222',
                      px: 0.35,
                      py: 0.25,
                      lineHeight: 1.15,
                      verticalAlign: 'middle'
                    },
                    '& th': {
                      bgcolor: '#eeeeee',
                      fontWeight: 700,
                      fontSize: 11
                    },
                    '& td': {
                      fontSize: 12
                    }
                  }}
                >
                  <Box component="thead">
                    <Box component="tr">
                      <Box component="th" sx={{ width: 72 }}>Cod.</Box>
                      <Box component="th" sx={{ width: 200 }}>Producto</Box>
                      <Box component="th" sx={{ width: 38 }}>Fact.</Box>
                      <Box component="th" sx={{ width: 48 }}>Ctrl.</Box>
                      {localesReporte.map((local) => (
                        <Box
                          key={local.id}
                          component="th"
                          sx={{ width: 36 }}
                        >
                          {nombreCortoLocal(local)}
                        </Box>
                      ))}
                      <Box component="th" sx={{ width: 58 }}>P.Pub.</Box>
                      <Box component="th" sx={{ width: 96 }}>Cod.Barra</Box>
                    </Box>
                  </Box>
                  <Box component="tbody">
                    {detallesReporte.map((detalle) => {
                      const producto =
                        detalle.pedidoProveedorDetalle?.producto || {};
                      const stocksByLocal = new Map(
                        (producto.stocks || []).map((stock) => [
                          stock.localId,
                          stock
                        ])
                      );
                      const cantidadFacturada = Number(
                        detalle.cantidadFacturada ||
                          detalle.cantidadRecibida ||
                          0
                      );

                      return (
                        <Fragment key={detalle.id}>
                          <Box component="tr">
                            <Box component="td">{producto.codigo || '-'}</Box>
                            <Box component="td">
                              {truncarTexto(producto.nombre, 30)}
                            </Box>
                            <Box component="td" sx={{ textAlign: 'right' }}>
                              {cantidadFacturada}
                            </Box>
                            <Box component="td" sx={{ textAlign: 'center' }}>
                              ______
                            </Box>
                            {localesReporte.map((local) => (
                              <Box
                                key={local.id}
                                component="td"
                                sx={{ textAlign: 'right' }}
                              >
                                {stocksByLocal.get(local.id)?.cantidad ?? 0}
                              </Box>
                            ))}
                            <Box component="td" sx={{ textAlign: 'right' }}>
                              {Number(detalle.precioPublicoNuevo || 0)
                                .toLocaleString('es-AR', {
                                  maximumFractionDigits: 0
                                })}
                            </Box>
                            <Box component="td">
                              {producto.codigoBarra || 'SIN COD.'}
                            </Box>
                          </Box>
                          {detalle.observaciones && (
                            <Box component="tr" key={`${detalle.id}-obs`}>
                              <Box
                                component="td"
                                colSpan={6 + localesReporte.length}
                                sx={{ fontStyle: 'italic' }}
                              >
                                Obs.: {detalle.observaciones}
                              </Box>
                            </Box>
                          )}
                        </Fragment>
                      );
                    })}
                  </Box>
                </Box>

                <Box
                  sx={{
                    mt: 1,
                    display: 'grid',
                    gridTemplateColumns: '1.2fr 1fr 1fr',
                    gap: 2,
                    fontSize: 13,
                    border: '1px solid #222',
                    p: 0.75
                  }}
                >
                  <Box>Observaciones:</Box>
                  <Box>Controlo: ____________________</Box>
                  <Box>Fecha/Firma: ____/____/________ ____________________</Box>
                </Box>
              </Box>
            );
          })()}
        </DialogContent>
        <DialogActions className="no-print">
          <Button onClick={cerrarReporteRecepcion}>
            Cerrar
          </Button>
          <Button
            variant="contained"
            startIcon={<PrintIcon />}
            onClick={imprimirReporteRecepcion}
          >
            Imprimir
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={openHistorico}
        onClose={() => setOpenHistorico(false)}
        fullWidth
        maxWidth="md"
      >
        <DialogTitle>
          Historial Pedido
        </DialogTitle>
        <DialogContent>
          <DataGrid
            rows={historico}
            columns={columnsHistorico}
            getRowId={(row) => row.id}
            autoHeight
            pageSizeOptions={[5, 10, 20]}
            initialState={{
              pagination: {
                paginationModel: {
                  pageSize: 5
                }
              }
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenHistorico(false)}>
            Cerrar
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() =>
          setSnackbar({
            ...snackbar,
            open: false
          })
        }
      >
        <Alert
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}

export default PedidosProveedorPage;
