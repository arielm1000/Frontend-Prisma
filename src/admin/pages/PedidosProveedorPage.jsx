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
  InputAdornment,
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
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import HistoryIcon from '@mui/icons-material/History';
import MoveToInboxIcon from '@mui/icons-material/MoveToInbox';
import PrintIcon from '@mui/icons-material/Print';
import ReplayIcon from '@mui/icons-material/Replay';
import RestoreIcon from '@mui/icons-material/Restore';
import SendIcon from '@mui/icons-material/Send';
import VisibilityIcon from '@mui/icons-material/Visibility';
import {
  cancelarPedidoProveedorRequest,
  cancelarPendientePedidoProveedorRequest,
  confirmarPedidoProveedorRequest,
  createPedidoProveedorRequest,
  enviarPedidoProveedorRequest,
  getHistoricoPedidoProveedorRequest,
  getPedidosProveedorRequest,
  getResumenPedidosProveedorRequest,
  reactivarPendientePedidoProveedorRequest,
  reactivarPedidoProveedorRequest,
  updatePedidoProveedorRequest
} from '../../services/pedidoProveedor.service';
import {
  ajustarControlPosteriorRecepcionRequest,
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
import ProductoNoPedidoDialog from './ProductoNoPedidoDialog';

const CampoMoneda = ({
  value,
  onChange,
  onBlur,
  onFocus,
  inputProps,
  InputProps,
  ...props
}) => {
  const [enEdicion, setEnEdicion] = useState(false);
  const numero = Number(value);
  const valorVisible =
    enEdicion || value === '' || value === null || value === undefined
      ? value ?? ''
      : Number.isFinite(numero)
        ? numero.toFixed(2)
        : '0.00';

  const normalizar = (event) => {
    setEnEdicion(false);
    const valorNumerico = Number(event.target.value || 0);
    const valorNormalizado = Number.isFinite(valorNumerico)
      ? valorNumerico.toFixed(2)
      : '0.00';

    onChange?.({
      target: {
        name: event.target.name,
        value: valorNormalizado
      }
    });
    onBlur?.(event);
  };

  return (
    <TextField
      {...props}
      type="number"
      value={valorVisible}
      onChange={onChange}
      onFocus={(event) => {
        setEnEdicion(true);
        onFocus?.(event);
      }}
      onBlur={normalizar}
      inputProps={{
        ...inputProps,
        step: '0.01',
        style: {
          textAlign: 'right',
          ...inputProps?.style
        }
      }}
      InputProps={{
        ...InputProps,
        startAdornment:
          InputProps?.startAdornment || (
            <InputAdornment position="start">$</InputAdornment>
          )
      }}
    />
  );
};

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
  costoSinIvaProveedor: '',
  descuentoProveedorImporte: '',
  ivaProveedorImporte: '',
  totalFacturaProveedor: 0,
  redondeoBase: 100,
  margenesPrecioPublicoGeneralTexto: '',
  observaciones: ''
};

const importeFacturaInicial = {
  tipo: 'PERCEPCION_IVA',
  descripcion: '',
  porcentaje: 0,
  importe: 0
};

const tiposImporteFactura = [
  {
    value: 'PERCEPCION_IVA',
    label: 'Percepcion de IVA'
  },
  {
    value: 'PERCEPCION_IIBB',
    label: 'Percepcion de Ingresos Brutos (IIBB)'
  },
  {
    value: 'PERCEPCION_MUNICIPAL',
    label: 'Percepcion de Impuestos Municipales'
  },
  {
    value: 'IMPUESTOS_INTERNOS',
    label: 'Impuestos Internos adicionales'
  },
  {
    value: 'OTRO',
    label: 'Otro'
  }
];

const obtenerLabelTipoImporteFactura = (tipo) =>
  tiposImporteFactura.find((opcion) => opcion.value === tipo)?.label ||
  tipo ||
  'Otro';

const tiposAjustePosteriorRecepcion = [
  {
    value: 'CORRECCION_CONTEO',
    label: 'Correccion de control'
  },
  {
    value: 'FALTANTE_POSTERIOR',
    label: 'Faltante detectado despues'
  },
  {
    value: 'SOBRANTE_POSTERIOR',
    label: 'Sobrante detectado despues'
  }
];

const obtenerLabelTipoAjustePosterior = (tipo) =>
  tiposAjustePosteriorRecepcion.find((opcion) => opcion.value === tipo)
    ?.label || (tipo === 'FALLADO_POSTERIOR'
    ? 'Producto fallado detectado despues'
    : null) ||
  tipo ||
  'Ajuste posterior';

const cantidadAjustePosterior = (ajuste) => {
  const cantidad = Number(ajuste.cantidad || 0);

  return ['FALTANTE_POSTERIOR', 'FALLADO_POSTERIOR'].includes(ajuste.tipo)
    ? -cantidad
    : cantidad;
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

const calcularTotalPedidoVigente = (pedido) => {
  const totalAntesDescuento = redondear(
    (pedido.detalles || []).reduce((total, detalle) => {
      const cantidadVigente = Math.max(
        Number(detalle.cantidadPedida || 0) -
          Number(detalle.cantidadCancelada || 0),
        0
      );

      return total + cantidadVigente * Number(detalle.precioUnitarioConIva || 0);
    }, 0)
  );
  const descuentosGenerales =
    porcentajesDesdeValor(pedido.descuentosGenerales).length > 0
      ? porcentajesDesdeValor(pedido.descuentosGenerales)
      : porcentajesDesdeValor(pedido.descuentoGeneralPorcentaje);

  return aplicarDescuentos(totalAntesDescuento, descuentosGenerales);
};

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

const descuentoDetalleTexto = (detalle) =>
  descuentosToTexto(detalle.descuentosPorcentaje) ||
  descuentoValorToTexto(detalle.descuentoPorcentaje) ||
  '0';

const totalListaDetalle = (detalle) =>
  redondear(
    Number(detalle.cantidadPedida || 0) *
      Number(detalle.precioListaSinIva || 0)
  );

const totalDetalleSinIva = (detalle) =>
  redondear(
    Number(detalle.subtotalSinIva) ||
      Number(detalle.cantidadPedida || 0) *
        aplicarDescuentos(
          Number(detalle.precioListaSinIva || 0),
          porcentajesDesdeValor(detalle.descuentosPorcentaje).length > 0
            ? porcentajesDesdeValor(detalle.descuentosPorcentaje)
            : porcentajesDesdeValor(detalle.descuentoPorcentaje)
        )
  );

const resumenPedidoDetalleCompacto = (pedido) => {
  const detalles = pedido?.detalles || [];
  const totalCantidad = detalles.reduce(
    (total, detalle) => total + Number(detalle.cantidadPedida || 0),
    0
  );
  const totalLista = redondear(
    detalles.reduce((total, detalle) => total + totalListaDetalle(detalle), 0)
  );
  const totalProductos = redondear(
    detalles.reduce(
      (total, detalle) => total + totalDetalleSinIva(detalle),
      0
    )
  );
  const descuentoGeneralImporte = Number(
    pedido?.descuentoGeneralImporte || 0
  );
  const totalConDescuento = redondear(
    Number(pedido?.baseConDescuento ?? totalProductos - descuentoGeneralImporte)
  );
  const ivaImporte = Number(pedido?.ivaImporte || 0);

  return {
    totalCantidad,
    totalLista,
    totalProductos,
    descuentoGeneralTexto:
      descuentosToTexto(pedido?.descuentosGenerales) ||
      descuentoValorToTexto(pedido?.descuentoGeneralPorcentaje) ||
      '0',
    descuentoGeneralImporte,
    totalConDescuento,
    ivaImporte,
    totalGeneral: Number(pedido?.totalConIva || 0)
  };
};

const descargarArchivo = (nombre, contenido, tipo) => {
  const blob = new Blob([contenido], {
    type: tipo
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = nombre;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
};

const escapeHtml = (valor) =>
  String(valor ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');

const calcularTotalRecibidoDetalle = (detalle) =>
  Math.min(
    (detalle.recepcionesDetalle || []).reduce((total, recepcion) => {
      const ajustes = recepcion.ajustesPosteriores || [];

      if (ajustes.length === 0) {
        return total + Number(
          recepcion.cantidadAplicadaPedido ??
          recepcion.cantidadRecibida ??
          0
        );
      }

      const cantidadBase = Number(
        recepcion.cantidadControlada ??
        recepcion.cantidadAplicadaPedido ??
        recepcion.cantidadRecibida ??
        0
      );
      const cantidadAjustada = ajustes.reduce(
        (acumulado, ajuste) =>
          acumulado + cantidadAjustePosterior(ajuste),
        cantidadBase
      );

      return total + Math.max(cantidadAjustada, 0);
    }, 0),
    Math.max(
      Number(detalle.cantidadPedida || 0) -
        Number(detalle.cantidadCancelada || 0),
      0
    )
  );

const calcularResumenPedidosDesdeLista = (pedidosLista = []) => {
  const abiertos = [
    'ENVIADO',
    'CONFIRMADO',
    'RECIBIDO_PARCIAL'
  ];

  return pedidosLista.reduce(
    (acumulado, pedido) => {
      const pedidoCancelado = pedido.estado === 'CANCELADO';
      const totalPedido = calcularTotalPedidoVigente(pedido);
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

      if (!pedidoCancelado) {
        acumulado.cantidadPedidos += 1;
        acumulado.totalPedidos += totalPedido;
        acumulado.totalRecibidoFacturas += totalRecepciones;
        acumulado.totalPendienteEstimado += pendienteEstimado;
        acumulado.diferenciaFacturas += diferenciaFacturas;
      }

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
  const [openProductoNoPedido, setOpenProductoNoPedido] = useState(false);
  const [otrosImportesRecepcion, setOtrosImportesRecepcion] = useState([]);
  const [recepcionesCargadas, setRecepcionesCargadas] = useState([]);
  const [openDetalle, setOpenDetalle] = useState(false);
  const [pedidoDetalle, setPedidoDetalle] = useState(null);
  const [openCancelarPendiente, setOpenCancelarPendiente] = useState(false);
  const [pedidoCancelarPendiente, setPedidoCancelarPendiente] = useState(null);
  const [detallesCancelarPendiente, setDetallesCancelarPendiente] = useState([]);
  const [openReactivarPendiente, setOpenReactivarPendiente] = useState(false);
  const [pedidoReactivarPendiente, setPedidoReactivarPendiente] = useState(null);
  const [detallesReactivarPendiente, setDetallesReactivarPendiente] = useState([]);
  const [openReporteRecepcion, setOpenReporteRecepcion] = useState(false);
  const [recepcionReporte, setRecepcionReporte] = useState(null);
  const [openControlRecepcion, setOpenControlRecepcion] = useState(false);
  const [recepcionControl, setRecepcionControl] = useState(null);
  const [detallesControlRecepcion, setDetallesControlRecepcion] = useState([]);
  const [observacionesControlRecepcion, setObservacionesControlRecepcion] =
    useState('');
  const [openAjustePosterior, setOpenAjustePosterior] = useState(false);
  const [recepcionAjustePosterior, setRecepcionAjustePosterior] =
    useState(null);
  const [detallesAjustePosterior, setDetallesAjustePosterior] = useState([]);
  const [observacionesAjustePosterior, setObservacionesAjustePosterior] =
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
    const costoSinIvaSistema = redondear(
      detallesRecepcion.reduce(
        (total, detalle) =>
          total +
          Number(detalle.cantidadFacturada || detalle.cantidadRecibida || 0) *
            Number(detalle.precioListaProveedor || 0),
        0
      )
    );
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
    const descuentoSistemaImporte = redondear(
      costoSinIvaSistema - subtotalProductos
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
      costoSinIvaSistema,
      subtotalProductos,
      descuentoSistemaImporte,
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

  const reactivar = async (pedido) => {
    const confirmar = window.confirm(
      pedido.estado === 'CANCELADO'
        ? 'Reactivar pedido cancelado?'
        : 'Volver este pedido a BORRADOR?'
    );

    if (!confirmar) return;

    try {
      await reactivarPedidoProveedorRequest(pedido.id);
      setLoading(true);
      await cargarPedidos();
      await cargarResumenPedidos();
      setSnackbar({
        open: true,
        message: 'Pedido vuelto a borrador',
        severity: 'success'
      });
    } catch (error) {
      console.log(error);
      setSnackbar({
        open: true,
        message:
          error.response?.data?.mensaje ||
          'Error reactivando pedido',
        severity: 'error'
      });
    }
  };

  const abrirCancelarPendiente = (pedido) => {
    setPedidoCancelarPendiente(pedido);
    setDetallesCancelarPendiente(
      (pedido.detalles || [])
        .map((detalle) => ({
          tempId: `pedido-${detalle.id}`,
          pedidoProveedorDetalleId: detalle.id,
          productoId: detalle.productoId,
          origen: 'PEDIDO',
          producto: `${detalle.producto?.codigo || ''} - ${detalle.producto?.nombre || ''}`,
          cantidadPedida: Number(detalle.cantidadPedida || 0),
          cantidadRecibida: calcularRecibido(detalle),
          cantidadCancelada: Number(detalle.cantidadCancelada || 0),
          pendiente: Math.max(calcularPendiente(detalle), 0),
          cantidadCancelar: '',
          motivo: ''
        }))
        .filter((detalle) => detalle.pendiente > 0)
    );
    setOpenCancelarPendiente(true);
  };

  const cerrarCancelarPendiente = () => {
    setOpenCancelarPendiente(false);
    setPedidoCancelarPendiente(null);
    setDetallesCancelarPendiente([]);
  };

  const cambiarDetalleCancelarPendiente = (id, name, value) => {
    setDetallesCancelarPendiente((actuales) =>
      actuales.map((detalle) =>
        detalle.pedidoProveedorDetalleId === id
          ? {
              ...detalle,
              [name]: value
            }
          : detalle
      )
    );
  };

  const guardarCancelarPendiente = async () => {
    const detallesAEnviar = detallesCancelarPendiente
      .map((detalle) => ({
        pedidoProveedorDetalleId: detalle.pedidoProveedorDetalleId,
        cantidadCancelar: Number(detalle.cantidadCancelar || 0),
        motivo: detalle.motivo
      }))
      .filter((detalle) => detalle.cantidadCancelar > 0);

    if (detallesAEnviar.length === 0) {
      setSnackbar({
        open: true,
        message: 'Debe indicar al menos una cantidad a cancelar',
        severity: 'warning'
      });
      return;
    }

    const superaPendiente = detallesAEnviar.some((detalle) => {
      const original = detallesCancelarPendiente.find(
        (item) =>
          item.pedidoProveedorDetalleId === detalle.pedidoProveedorDetalleId
      );

      return detalle.cantidadCancelar > Number(original?.pendiente || 0);
    });

    if (superaPendiente) {
      setSnackbar({
        open: true,
        message: 'Hay cantidades que superan el pendiente',
        severity: 'warning'
      });
      return;
    }

    try {
      await cancelarPendientePedidoProveedorRequest(
        pedidoCancelarPendiente.id,
        {
          detalles: detallesAEnviar
        }
      );
      setLoading(true);
      await cargarPedidos();
      await cargarResumenPedidos();
      cerrarCancelarPendiente();
      setSnackbar({
        open: true,
        message: 'Pendiente cancelado correctamente',
        severity: 'success'
      });
    } catch (error) {
      console.log(error);
      setSnackbar({
        open: true,
        message:
          error.response?.data?.mensaje ||
          'Error cancelando pendiente',
        severity: 'error'
      });
    }
  };

  const abrirReactivarPendiente = (pedido) => {
    setPedidoReactivarPendiente(pedido);
    setDetallesReactivarPendiente(
      (pedido.detalles || [])
        .filter((detalle) => Number(detalle.cantidadCancelada || 0) > 0)
        .map((detalle) => ({
          pedidoProveedorDetalleId: detalle.id,
          producto: `${detalle.producto?.codigo || ''} - ${detalle.producto?.nombre || ''}`,
          cantidadPedida: Number(detalle.cantidadPedida || 0),
          cantidadRecibida: calcularTotalRecibidoDetalle(detalle),
          cantidadCancelada: Number(detalle.cantidadCancelada || 0),
          cantidadReactivar: '',
          motivo: ''
        }))
    );
    setOpenReactivarPendiente(true);
  };

  const cerrarReactivarPendiente = () => {
    setOpenReactivarPendiente(false);
    setPedidoReactivarPendiente(null);
    setDetallesReactivarPendiente([]);
  };

  const cambiarDetalleReactivarPendiente = (id, name, value) => {
    setDetallesReactivarPendiente((actuales) =>
      actuales.map((detalle) =>
        detalle.pedidoProveedorDetalleId === id
          ? {
              ...detalle,
              [name]: value
            }
          : detalle
      )
    );
  };

  const guardarReactivarPendiente = async () => {
    const detallesAEnviar = detallesReactivarPendiente
      .map((detalle) => ({
        pedidoProveedorDetalleId: detalle.pedidoProveedorDetalleId,
        cantidadReactivar: Number(detalle.cantidadReactivar || 0),
        motivo: detalle.motivo
      }))
      .filter((detalle) => detalle.cantidadReactivar > 0);

    if (detallesAEnviar.length === 0) {
      setSnackbar({
        open: true,
        message: 'Debe indicar al menos una cantidad a reactivar',
        severity: 'warning'
      });
      return;
    }

    const detalleInvalido = detallesAEnviar.some((detalle) => {
      const original = detallesReactivarPendiente.find(
        (item) =>
          item.pedidoProveedorDetalleId === detalle.pedidoProveedorDetalleId
      );

      return (
        detalle.cantidadReactivar > Number(original?.cantidadCancelada || 0) ||
        !detalle.motivo?.trim()
      );
    });

    if (detalleInvalido) {
      setSnackbar({
        open: true,
        message: 'Revise cantidades y motivos de la reactivacion',
        severity: 'warning'
      });
      return;
    }

    try {
      await reactivarPendientePedidoProveedorRequest(
        pedidoReactivarPendiente.id,
        {
          detalles: detallesAEnviar
        }
      );
      setLoading(true);
      await cargarPedidos();
      await cargarResumenPedidos();
      cerrarReactivarPendiente();
      setSnackbar({
        open: true,
        message: 'Saldo cancelado reactivado correctamente',
        severity: 'success'
      });
    } catch (error) {
      console.log(error);
      setSnackbar({
        open: true,
        message:
          error.response?.data?.mensaje ||
          'Error reactivando saldo cancelado',
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

  const exportarPedidoExcel = () => {
    if (!pedidoDetalle) return;

    const resumen = resumenPedidoDetalleCompacto(pedidoDetalle);
    const detalles = pedidoDetalle.detalles || [];
    const productoAncho = Math.min(
      Math.max(
        ...detalles.map((detalle) =>
          String(detalle.producto?.nombre || '').length * 7
        ),
        220
      ),
      460
    );
    const filaDescuentoGeneral =
      resumen.descuentoGeneralImporte > 0
        ? `
          <tr>
            <td colspan="5"></td>
            <td class="label">Desc. gral. ${escapeHtml(resumen.descuentoGeneralTexto)}%</td>
            <td class="num">-${resumen.descuentoGeneralImporte}</td>
          </tr>
        `
        : '';
    const html = `
      <html>
        <head>
          <meta charset="utf-8" />
          <style>
            table { border-collapse: collapse; font-family: Arial, sans-serif; font-size: 12px; }
            th, td { border: 1px solid #cfd8dc; padding: 5px; vertical-align: top; }
            th { background: #eef2f7; font-weight: bold; }
            .sin-borde td { border: 0; }
            .label { font-weight: bold; }
            .num { text-align: right; }
            .total td { font-weight: bold; background: #f8fafc; }
            .final td { font-weight: bold; }
          </style>
        </head>
        <body>
          <table>
            <colgroup>
              <col style="width: 120px" />
              <col style="width: ${productoAncho}px" />
              <col style="width: 90px" />
              <col style="width: 120px" />
              <col style="width: 70px" />
              <col style="width: 110px" />
              <col style="width: 130px" />
            </colgroup>
            <tbody>
              <tr><td class="label">Pedido</td><td colspan="6">${escapeHtml(pedidoDetalle.numeroPedido || '')}</td></tr>
              <tr><td class="label">Estado</td><td colspan="6">${escapeHtml(pedidoDetalle.estado || '')}</td></tr>
              <tr><td class="label">Fecha</td><td colspan="6">${formatoFechaNegocio(pedidoDetalle.fechaPedido)}</td></tr>
              <tr><td class="label">Entrega estimada</td><td colspan="6">${formatoFechaNegocio(pedidoDetalle.fechaEstimadaEntrega)}</td></tr>
              <tr><td class="label">Proveedor</td><td colspan="6">${escapeHtml(pedidoDetalle.proveedor?.nombreComercial || '')}</td></tr>
              <tr><td class="label">Razon social</td><td colspan="6">${escapeHtml(pedidoDetalle.proveedorRazonSocial?.razonSocial || 'Sin asignar')}</td></tr>
              <tr><td class="label">Empresa facturada</td><td colspan="6">${escapeHtml(pedidoDetalle.empresaFacturacion?.razonSocial || 'Sin asignar')}</td></tr>
              <tr><td class="label">Transporte</td><td colspan="6">${escapeHtml(pedidoDetalle.transporte?.nombre || 'Sin asignar')}</td></tr>
              <tr><td class="label">Local destino</td><td colspan="6">${escapeHtml(pedidoDetalle.localDestino?.nombre || 'Sin asignar')}</td></tr>
              <tr><td class="label">Desc. general</td><td colspan="6">${escapeHtml(resumen.descuentoGeneralTexto)}%</td></tr>
              <tr class="sin-borde"><td colspan="7"></td></tr>
              <tr>
                <th>Codigo</th>
                <th>Producto</th>
                <th>Cantidad solicitada</th>
                <th>Precio lista</th>
                <th>IVA</th>
                <th>Descuento</th>
                <th>Total producto</th>
              </tr>
              ${detalles
                .map((detalle) => `
                  <tr>
                    <td>${escapeHtml(detalle.producto?.codigo || '')}</td>
                    <td>${escapeHtml(detalle.producto?.nombre || '')}</td>
                    <td class="num">${Number(detalle.cantidadPedida || 0)}</td>
                    <td class="num">${Number(detalle.precioListaSinIva || 0)}</td>
                    <td class="num">${Number(detalle.ivaPorcentaje || 0)}%</td>
                    <td class="num">${escapeHtml(descuentoDetalleTexto(detalle))}%</td>
                    <td class="num">${totalDetalleSinIva(detalle)}</td>
                  </tr>
                `)
                .join('')}
              <tr class="total">
                <td></td>
                <td>Totales</td>
                <td class="num">${resumen.totalCantidad}</td>
                <td class="num">${resumen.totalLista}</td>
                <td></td>
                <td></td>
                <td class="num">${resumen.totalProductos}</td>
              </tr>
              <tr class="sin-borde"><td colspan="7"></td></tr>
              ${filaDescuentoGeneral}
              <tr>
                <td colspan="5"></td>
                <td class="label">Total con desc.</td>
                <td class="num">${resumen.totalConDescuento}</td>
              </tr>
              <tr>
                <td colspan="5"></td>
                <td class="label">IVA</td>
                <td class="num">${resumen.ivaImporte}</td>
              </tr>
              <tr class="final">
                <td colspan="5"></td>
                <td>Total general</td>
                <td class="num">${resumen.totalGeneral}</td>
              </tr>
            </tbody>
          </table>
        </body>
      </html>
    `;

    descargarArchivo(
      `${pedidoDetalle.numeroPedido || 'pedido'}-borrador.xls`,
      html,
      'application/vnd.ms-excel;charset=utf-8'
    );
  };

  const exportarPedidoPdf = () => {
    if (!pedidoDetalle) return;

    const resumen = resumenPedidoDetalleCompacto(pedidoDetalle);
    const filas = (pedidoDetalle.detalles || [])
      .map((detalle) => `
        <tr>
          <td>${escapeHtml(detalle.producto?.codigo || '')}</td>
          <td>${escapeHtml(detalle.producto?.nombre || '')}</td>
          <td class="num">${Number(detalle.cantidadPedida || 0)}</td>
          <td class="num">${formatoMoneda(detalle.precioListaSinIva)}</td>
          <td class="num">${Number(detalle.ivaPorcentaje || 0)}%</td>
          <td class="num">${escapeHtml(descuentoDetalleTexto(detalle))}%</td>
          <td class="num">${formatoMoneda(totalDetalleSinIva(detalle))}</td>
        </tr>
      `)
      .join('');
    const filaDescuentoGeneral =
      resumen.descuentoGeneralImporte > 0
        ? `<tr><td>Desc. gral. ${escapeHtml(resumen.descuentoGeneralTexto)}%</td><td class="num">-${formatoMoneda(resumen.descuentoGeneralImporte)}</td></tr>`
        : '';

    const html = `
      <!doctype html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>${escapeHtml(pedidoDetalle.numeroPedido || 'Pedido')}</title>
          <style>
            @page { size: A4 portrait; margin: 12mm; }
            body { font-family: Arial, sans-serif; color: #111827; font-size: 12px; }
            h1 { font-size: 18px; margin: 0 0 8px; }
            .header { display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px 14px; margin-bottom: 12px; }
            .label { color: #6b7280; font-size: 10px; text-transform: uppercase; }
            .value { font-weight: 700; }
            table { width: 100%; border-collapse: collapse; }
            col.codigo { width: 13%; }
            col.producto { width: 28%; }
            col.cantidad { width: 9%; }
            col.precio { width: 14%; }
            col.iva { width: 8%; }
            col.descuento { width: 10%; }
            col.total { width: 18%; }
            th { background: #f3f4f6; text-align: left; }
            th, td { border: 1px solid #d1d5db; padding: 5px; vertical-align: top; }
            .num { text-align: right; white-space: nowrap; }
            .total-row td { font-weight: 700; background: #f9fafb; }
            .totales { margin-top: 0; width: 38%; margin-left: auto; }
            .totales td:first-child { font-weight: 700; }
          </style>
        </head>
        <body>
          <h1>Pedido ${escapeHtml(pedidoDetalle.numeroPedido || '')}</h1>
          <div class="header">
            <div><div class="label">Estado</div><div class="value">${escapeHtml(pedidoDetalle.estado)}</div></div>
            <div><div class="label">Fecha</div><div class="value">${formatoFechaNegocio(pedidoDetalle.fechaPedido)}</div></div>
            <div><div class="label">Entrega estimada</div><div class="value">${formatoFechaNegocio(pedidoDetalle.fechaEstimadaEntrega)}</div></div>
            <div><div class="label">Proveedor</div><div class="value">${escapeHtml(pedidoDetalle.proveedor?.nombreComercial || '')}</div></div>
            <div><div class="label">Razon social</div><div class="value">${escapeHtml(pedidoDetalle.proveedorRazonSocial?.razonSocial || 'Sin asignar')}</div></div>
            <div><div class="label">Empresa facturada</div><div class="value">${escapeHtml(pedidoDetalle.empresaFacturacion?.razonSocial || 'Sin asignar')}</div></div>
            <div><div class="label">Transporte</div><div class="value">${escapeHtml(pedidoDetalle.transporte?.nombre || 'Sin asignar')}</div></div>
            <div><div class="label">Local destino</div><div class="value">${escapeHtml(pedidoDetalle.localDestino?.nombre || 'Sin asignar')}</div></div>
            <div><div class="label">Desc. general</div><div class="value">${escapeHtml(resumen.descuentoGeneralTexto)}%</div></div>
          </div>
          <table>
            <colgroup>
              <col class="codigo" />
              <col class="producto" />
              <col class="cantidad" />
              <col class="precio" />
              <col class="iva" />
              <col class="descuento" />
              <col class="total" />
            </colgroup>
            <thead>
              <tr>
                <th>Codigo</th>
                <th>Producto</th>
                <th class="num">Cant.</th>
                <th class="num">Precio lista</th>
                <th class="num">IVA</th>
                <th class="num">Desc.</th>
                <th class="num">Total producto</th>
              </tr>
            </thead>
            <tbody>
              ${filas}
              <tr class="total-row">
                <td></td>
                <td>Totales</td>
                <td class="num">${resumen.totalCantidad}</td>
                <td class="num">${formatoMoneda(resumen.totalLista)}</td>
                <td></td>
                <td></td>
                <td class="num">${formatoMoneda(resumen.totalProductos)}</td>
              </tr>
            </tbody>
          </table>
          <table class="totales">
            <tbody>
              ${filaDescuentoGeneral}
              <tr><td>Total con desc.</td><td class="num">${formatoMoneda(resumen.totalConDescuento)}</td></tr>
              <tr><td>IVA</td><td class="num">${formatoMoneda(resumen.ivaImporte)}</td></tr>
              <tr><td>Total general</td><td class="num">${formatoMoneda(resumen.totalGeneral)}</td></tr>
            </tbody>
          </table>
        </body>
      </html>
    `;
    const ventana = window.open('', '_blank');
    if (!ventana) return;

    ventana.document.write(html);
    ventana.document.close();
    ventana.focus();
    ventana.print();
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
        producto: (detalle.producto ||
          detalle.pedidoProveedorDetalle?.producto)?.codigo
          ? `${(detalle.producto || detalle.pedidoProveedorDetalle.producto).codigo} - ${(detalle.producto || detalle.pedidoProveedorDetalle.producto).nombre}`
          : (detalle.producto || detalle.pedidoProveedorDetalle?.producto)?.nombre || '',
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

  const abrirAjustePosteriorRecepcion = (recepcion) => {
    setRecepcionAjustePosterior(recepcion);
    setObservacionesAjustePosterior('');
    setDetallesAjustePosterior(
      (recepcion.detalles || []).map((detalle) => {
        const cantidadControlada = Number(
          detalle.cantidadControlada ?? detalle.cantidadRecibida ?? 0
        );
        const ajustesAcumulados = (recepcion.ajustesPosteriores || [])
          .filter((ajuste) => ajuste.recepcionDetalleId === detalle.id)
          .reduce(
            (total, ajuste) => total + cantidadAjustePosterior(ajuste),
            0
          );
        const cantidadActual = cantidadControlada + ajustesAcumulados;

        return {
          recepcionDetalleId: detalle.id,
          producto: (detalle.producto ||
            detalle.pedidoProveedorDetalle?.producto)?.codigo
            ? `${(detalle.producto || detalle.pedidoProveedorDetalle.producto).codigo} - ${(detalle.producto || detalle.pedidoProveedorDetalle.producto).nombre}`
            : (detalle.producto || detalle.pedidoProveedorDetalle?.producto)?.nombre || '',
          cantidadFacturada: Number(detalle.cantidadFacturada || 0),
          cantidadControlada,
          tipo:
            cantidadActual < Number(detalle.cantidadFacturada || 0)
              ? 'CORRECCION_CONTEO'
              : 'FALTANTE_POSTERIOR',
          cantidad: '',
          motivo: '',
          observaciones: ''
        };
      })
    );
    setOpenAjustePosterior(true);
  };

  const cerrarAjustePosteriorRecepcion = () => {
    setOpenAjustePosterior(false);
    setRecepcionAjustePosterior(null);
    setDetallesAjustePosterior([]);
    setObservacionesAjustePosterior('');
  };

  const cambiarDetalleAjustePosterior = (id, name, value) => {
    setDetallesAjustePosterior((actuales) =>
      actuales.map((detalle) =>
        detalle.recepcionDetalleId === id
          ? {
              ...detalle,
              [name]: value
            }
          : detalle
      )
    );
  };

  const imprimirHistorialAjustesPosteriores = () => {
    const recepcion = recepcionAjustePosterior;
    const ajustes = recepcion?.ajustesPosteriores || [];

    if (!recepcion || ajustes.length === 0) return;

    const pedido = recepcion.pedidoProveedor || pedidoDetalle || {};
    const factura = [recepcion.facturaPuntoVenta, recepcion.facturaNumero]
      .filter(Boolean)
      .join('-') || recepcion.numeroFactura || '-';
    const filas = ajustes.map((ajuste) => {
      const movimiento = cantidadAjustePosterior(ajuste);
      const fecha = ajuste.createdAt
        ? new Date(ajuste.createdAt).toLocaleString('es-AR')
        : '-';
      const producto = ajuste.producto?.codigo
        ? `${ajuste.producto.codigo} - ${ajuste.producto.nombre}`
        : ajuste.producto?.nombre || '-';

      return `
        <tr>
          <td>${escapeHtml(fecha)}</td>
          <td>${escapeHtml(ajuste.usuario?.nombre || ajuste.usuario?.email || '-')}</td>
          <td>${escapeHtml(producto)}</td>
          <td>${escapeHtml(obtenerLabelTipoAjustePosterior(ajuste.tipo))}</td>
          <td class="num">${movimiento > 0 ? '+' : ''}${movimiento}</td>
          <td>${escapeHtml(ajuste.motivo || '-')}</td>
          <td>${escapeHtml(ajuste.observaciones || '-')}</td>
        </tr>
      `;
    }).join('');
    const html = `
      <!doctype html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>Historial de ajustes posteriores</title>
          <style>
            @page { size: A4 landscape; margin: 12mm; }
            body { font-family: Arial, sans-serif; color: #111827; font-size: 11px; }
            h1 { font-size: 18px; margin: 0 0 10px; }
            .datos { display: grid; grid-template-columns: repeat(3, 1fr); gap: 5px 18px; margin-bottom: 12px; }
            .label { color: #4b5563; font-weight: 700; }
            table { width: 100%; border-collapse: collapse; }
            th { background: #eef2f7; text-align: left; }
            th, td { border: 1px solid #cbd5e1; padding: 6px; vertical-align: top; }
            .num { text-align: right; white-space: nowrap; font-weight: 700; }
            .observaciones { margin-top: 12px; border: 1px solid #cbd5e1; padding: 8px; min-height: 28px; }
          </style>
        </head>
        <body>
          <h1>Historial de ajustes posteriores</h1>
          <div class="datos">
            <div><span class="label">Pedido:</span> ${escapeHtml(pedido.numeroPedido || '-')}</div>
            <div><span class="label">Factura:</span> ${escapeHtml(factura)}</div>
            <div><span class="label">Fecha recepcion:</span> ${formatoFechaNegocio(recepcion.fechaRecepcion)}</div>
            <div><span class="label">Proveedor:</span> ${escapeHtml(pedido.proveedor?.nombreComercial || '-')}</div>
            <div><span class="label">Empresa:</span> ${escapeHtml(recepcion.empresaFacturacion?.razonSocial || pedido.empresaFacturacion?.razonSocial || '-')}</div>
            <div><span class="label">Local:</span> ${escapeHtml(pedido.localDestino?.nombre || '-')}</div>
          </div>
          <table>
            <thead>
              <tr>
                <th>Fecha y hora</th>
                <th>Usuario</th>
                <th>Producto</th>
                <th>Tipo</th>
                <th>Stock</th>
                <th>Motivo</th>
                <th>Observaciones</th>
              </tr>
            </thead>
            <tbody>${filas}</tbody>
          </table>
          <div class="observaciones">
            <span class="label">Observaciones del control:</span>
            ${escapeHtml(recepcion.observacionesControl || '-')}
          </div>
        </body>
      </html>
    `;
    const ventana = window.open('', '_blank');
    if (!ventana) return;

    ventana.document.write(html);
    ventana.document.close();
    ventana.focus();
    ventana.print();
  };

  const guardarAjustePosteriorRecepcion = async () => {
    const ajustes = detallesAjustePosterior
      .map((detalle) => ({
        recepcionDetalleId: detalle.recepcionDetalleId,
        tipo: detalle.tipo,
        cantidad: Number(detalle.cantidad || 0),
        motivo: detalle.motivo,
        observaciones: detalle.observaciones
      }))
      .filter((ajuste) => ajuste.cantidad > 0);

    if (ajustes.length === 0) {
      setSnackbar({
        open: true,
        message: 'Debe indicar al menos una cantidad a ajustar',
        severity: 'warning'
      });
      return;
    }

    if (ajustes.some((ajuste) => !ajuste.motivo?.trim())) {
      setSnackbar({
        open: true,
        message: 'Debe indicar motivo en cada ajuste',
        severity: 'warning'
      });
      return;
    }

    try {
      const recepcionActualizada =
        await ajustarControlPosteriorRecepcionRequest(
          recepcionAjustePosterior.id,
          {
            ajustes,
            observaciones: observacionesAjustePosterior
          }
        );

      setRecepcionesCargadas((actuales) =>
        actuales.map((recepcion) =>
          recepcion.id === recepcionActualizada.id
            ? recepcionActualizada
            : recepcion
        )
      );
      cerrarAjustePosteriorRecepcion();
      setLoading(true);
      await cargarPedidos();
      await cargarResumenPedidos();
      setSnackbar({
        open: true,
        message: 'Ajuste posterior guardado',
        severity: 'success'
      });
    } catch (error) {
      console.log(error);
      setSnackbar({
        open: true,
        message:
          error.response?.data?.mensaje ||
          'Error guardando ajuste posterior',
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
    setRecepcionesCargadas(pedido.recepciones || []);
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
    setOpenProductoNoPedido(false);
    setOpenRecepcion(false);
    setPedidoRecepcion(null);
    setFormRecepcion(recepcionInicial);
    setDetallesRecepcion([]);
    setOtrosImportesRecepcion([]);
    setRecepcionesCargadas([]);
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
        if (detalle.tempId !== id) {
          return detalle;
        }

        const actualizado = {
          ...detalle,
          [name]: value
        };

        if (name === 'cantidadRecibida' && detalle.origen === 'PEDIDO') {
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

  const agregarProductoNoPedido = (producto) => {
    const yaIncluido =
      detallesRecepcion.some(
        (detalle) => Number(detalle.productoId) === Number(producto.id)
      ) ||
      (pedidoRecepcion?.detalles || []).some(
        (detalle) => Number(detalle.productoId) === Number(producto.id)
      );

    if (yaIncluido) {
      setSnackbar({
        open: true,
        message: 'El producto ya forma parte del pedido o de esta recepcion',
        severity: 'warning'
      });
      return false;
    }

    setDetallesRecepcion((actuales) => [
      ...actuales,
      {
        tempId: `no-pedido-${Date.now()}-${producto.id}`,
        pedidoProveedorDetalleId: null,
        productoId: producto.id,
        origen: 'NO_PEDIDO',
        producto: `${producto.codigo || ''} - ${producto.nombre || ''}`,
        cantidadPedida: 0,
        pendiente: 0,
        cantidadFacturada: 1,
        cantidadRecibida: 1,
        cantidadExcedente: 0,
        cantidadRechazada: 0,
        accionExcedente: 'SIN_EXCEDENTE',
        precioListaProveedor: 0,
        descuentosProveedorTexto: '',
        ivaPorcentaje: 21,
        margenesPrecioPublicoTexto:
          formRecepcion.margenesPrecioPublicoGeneralTexto || '',
        precioPublicoAnterior: Number(producto.precioPublico || 0),
        precioPublicoNuevo: '',
        actualizarPrecioPublico: true,
        observaciones: ''
      }
    ]);
    return true;
  };

  const eliminarProductoNoPedido = (tempId) => {
    setDetallesRecepcion((actuales) =>
      actuales.filter((detalle) => detalle.tempId !== tempId)
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
    try {
      const recepcionCreada = await createRecepcionPedidoProveedorRequest({
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
            pedidoProveedorDetalleId:
              detalle.origen === 'PEDIDO'
                ? detalle.pedidoProveedorDetalleId
                : null,
            productoId: detalle.productoId,
            origen: detalle.origen,
            cantidadFacturada: Number(detalle.cantidadFacturada || 0),
            cantidadRecibida: Number(detalle.cantidadFacturada || 0),
            cantidadRechazada: 0,
            accionExcedente: detalle.origen === 'NO_PEDIDO'
              ? 'SIN_EXCEDENTE'
              :
              Number(detalle.cantidadFacturada || 0) >
              Number(detalle.pendiente || 0)
                ? 'PENDIENTE'
                : 'SIN_EXCEDENTE',
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

      setRecepcionesCargadas((actuales) => [
        recepcionCreada,
        ...actuales
      ]);
      setLoading(true);
      await cargarPedidos();
      await cargarResumenPedidos();
      setSnackbar({
        open: true,
        message: 'Factura cargada pendiente de control',
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
      align: 'right',
      headerAlign: 'right',
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
      width: 380,
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

          <Tooltip title="Cancelar pendiente">
            <IconButton
              color="warning"
              onClick={() => abrirCancelarPendiente(params.row)}
              disabled={
                !['ENVIADO', 'CONFIRMADO', 'RECIBIDO_PARCIAL'].includes(
                  params.row.estado
                )
              }
            >
              <CancelIcon />
            </IconButton>
          </Tooltip>

          <Tooltip title="Reactivar saldo cancelado">
            <span>
              <IconButton
                color="secondary"
                onClick={() => abrirReactivarPendiente(params.row)}
                disabled={
                  ![
                    'ENVIADO',
                    'CONFIRMADO',
                    'RECIBIDO_PARCIAL',
                    'RECIBIDO_COMPLETO'
                  ].includes(params.row.estado) ||
                  !(params.row.detalles || []).some(
                    (detalle) => Number(detalle.cantidadCancelada || 0) > 0
                  )
                }
              >
                <RestoreIcon />
              </IconButton>
            </span>
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

          <Tooltip
            title={
              params.row.estado === 'CANCELADO'
                ? 'Reactivar'
                : 'Volver a borrador'
            }
          >
            <IconButton
              color="success"
              onClick={() => reactivar(params.row)}
              disabled={
                !['CANCELADO', 'ENVIADO', 'CONFIRMADO'].includes(
                  params.row.estado
                )
              }
            >
              <ReplayIcon />
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
            'html, body': {
              height: 'auto !important',
              overflow: 'visible !important'
            },
            'body *': {
              visibility: 'hidden'
            },
            'body > *:not(.MuiDialog-root)': {
              display: 'none !important'
            },
            '.MuiBackdrop-root': {
              display: 'none !important'
            },
            '.MuiDialog-root:not(:has(#reporte-recepcion-print))': {
              display: 'none !important'
            },
            '.MuiDialog-root:has(#reporte-recepcion-print), .MuiDialog-root:has(#reporte-recepcion-print) .MuiDialog-container, .MuiDialog-root:has(#reporte-recepcion-print) .MuiDialog-scrollPaper, .MuiDialog-root:has(#reporte-recepcion-print) .MuiDialog-paper, .MuiDialog-root:has(#reporte-recepcion-print) .MuiDialogContent-root': {
              position: 'static !important',
              display: 'block !important',
              alignItems: 'initial !important',
              justifyContent: 'initial !important',
              width: 'auto !important',
              maxWidth: 'none !important',
              height: 'auto !important',
              maxHeight: 'none !important',
              minHeight: '0 !important',
              margin: '0 !important',
              padding: '0 !important',
              overflow: 'visible !important',
              boxShadow: 'none !important',
              transform: 'none !important'
            },
            '#reporte-recepcion-print, #reporte-recepcion-print *': {
              visibility: 'visible'
            },
            '#reporte-recepcion-print': {
              position: 'static',
              left: 0,
              top: 0,
              width: '100%',
              padding: '0',
              margin: '0',
              pageBreakAfter: 'avoid',
              breakAfter: 'avoid'
            },
            '#reporte-recepcion-print table, #reporte-recepcion-print tr': {
              pageBreakInside: 'avoid',
              breakInside: 'avoid'
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

            <CampoMoneda
              label="Costo transporte"
              name="transporteCostoFinal"
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

                    <CampoMoneda
                      label="Precio proveedor s/IVA"
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
        open={openCancelarPendiente}
        onClose={cerrarCancelarPendiente}
        fullWidth
        maxWidth="lg"
      >
        <DialogTitle>
          Cancelar pendiente {pedidoCancelarPendiente?.numeroPedido}
        </DialogTitle>
        <DialogContent>
          <Alert severity="info" sx={{ mb: 2 }}>
            Esta accion no modifica la cantidad original pedida. Solo registra
            cantidad cancelada y actualiza los totales vigentes.
          </Alert>

          <Box sx={{ display: 'grid', gap: 1.5 }}>
            {detallesCancelarPendiente.length === 0 ? (
              <Typography color="text.secondary">
                No hay productos pendientes para cancelar.
              </Typography>
            ) : (
              detallesCancelarPendiente.map((detalle) => (
                <Paper
                  key={detalle.tempId}
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
                        md: 'repeat(7, 1fr)'
                      },
                      gap: 1.5,
                      alignItems: 'center'
                    }}
                  >
                    <Typography variant="body2">
                      Pedido: {detalle.cantidadPedida}
                    </Typography>
                    <Typography variant="body2">
                      Recibido: {detalle.cantidadRecibida}
                    </Typography>
                    <Typography variant="body2">
                      Cancelado: {detalle.cantidadCancelada}
                    </Typography>
                    <Typography variant="body2" fontWeight={700}>
                      Pendiente: {detalle.pendiente}
                    </Typography>
                    <TextField
                      label="Cancelar"
                      type="number"
                      value={detalle.cantidadCancelar}
                      onChange={(e) =>
                        cambiarDetalleCancelarPendiente(
                          detalle.pedidoProveedorDetalleId,
                          'cantidadCancelar',
                          e.target.value
                        )
                      }
                      inputProps={{
                        min: 0,
                        max: detalle.pendiente
                      }}
                    />
                    <TextField
                      label="Motivo"
                      value={detalle.motivo}
                      onChange={(e) =>
                        cambiarDetalleCancelarPendiente(
                          detalle.pedidoProveedorDetalleId,
                          'motivo',
                          e.target.value
                        )
                      }
                      sx={{ gridColumn: { md: '6 / 8' } }}
                    />
                  </Box>
                </Paper>
              ))
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={cerrarCancelarPendiente}>
            Cerrar
          </Button>
          <Button
            variant="contained"
            color="warning"
            onClick={guardarCancelarPendiente}
            disabled={detallesCancelarPendiente.length === 0}
          >
            Guardar cancelacion
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={openReactivarPendiente}
        onClose={cerrarReactivarPendiente}
        fullWidth
        maxWidth="lg"
      >
        <DialogTitle>
          Reactivar saldo cancelado {pedidoReactivarPendiente?.numeroPedido}
        </DialogTitle>
        <DialogContent>
          <Alert severity="info" sx={{ mb: 2 }}>
            Esta accion recupera cantidades canceladas y las vuelve a dejar
            pendientes de recepcion. No modifica lo recibido ni la cuenta
            corriente.
          </Alert>

          <Box sx={{ display: 'grid', gap: 1.5 }}>
            {detallesReactivarPendiente.length === 0 ? (
              <Typography color="text.secondary">
                No hay cantidades canceladas para reactivar.
              </Typography>
            ) : (
              detallesReactivarPendiente.map((detalle) => (
                <Paper
                  key={detalle.pedidoProveedorDetalleId}
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
                        md: 'repeat(6, 1fr)'
                      },
                      gap: 1.5,
                      alignItems: 'center'
                    }}
                  >
                    <Typography variant="body2">
                      Pedido: {detalle.cantidadPedida}
                    </Typography>
                    <Typography variant="body2">
                      Recibido: {detalle.cantidadRecibida}
                    </Typography>
                    <Typography variant="body2" fontWeight={700}>
                      Cancelado: {detalle.cantidadCancelada}
                    </Typography>
                    <TextField
                      label="Reactivar"
                      type="number"
                      value={detalle.cantidadReactivar}
                      onChange={(event) =>
                        cambiarDetalleReactivarPendiente(
                          detalle.pedidoProveedorDetalleId,
                          'cantidadReactivar',
                          event.target.value
                        )
                      }
                      inputProps={{
                        min: 0,
                        max: detalle.cantidadCancelada
                      }}
                    />
                    <TextField
                      label="Motivo"
                      value={detalle.motivo}
                      onChange={(event) =>
                        cambiarDetalleReactivarPendiente(
                          detalle.pedidoProveedorDetalleId,
                          'motivo',
                          event.target.value
                        )
                      }
                      sx={{ gridColumn: { md: '5 / 7' } }}
                    />
                  </Box>
                </Paper>
              ))
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={cerrarReactivarPendiente}>
            Cerrar
          </Button>
          <Button
            variant="contained"
            color="secondary"
            onClick={guardarReactivarPendiente}
            disabled={detallesReactivarPendiente.length === 0}
          >
            Reactivar saldo
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
                md: 'repeat(12, 1fr)'
              },
              gap: 1.25,
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
              size="small"
              sx={{ gridColumn: { md: 'span 2' } }}
            />
            <TextField
              select
              label="Empresa facturada"
              name="empresaFacturacionId"
              value={formRecepcion.empresaFacturacionId}
              onChange={cambiarRecepcion}
              size="small"
              sx={{ gridColumn: { md: 'span 3' } }}
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
              label="Razon social facturante"
              name="proveedorRazonSocialId"
              value={formRecepcion.proveedorRazonSocialId}
              onChange={cambiarRecepcion}
              size="small"
              sx={{ gridColumn: { md: 'span 3' } }}
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
              label="Destino"
              value={pedidoRecepcion?.localDestino?.nombre || ''}
              InputProps={{ readOnly: true }}
              size="small"
              sx={{ gridColumn: { md: 'span 2' } }}
            />
            <TextField
              label="Remito"
              name="numeroRemito"
              value={formRecepcion.numeroRemito}
              onChange={cambiarRecepcion}
              size="small"
              sx={{ gridColumn: { md: 'span 2' } }}
            />
            <TextField
              label="Punto venta"
              name="facturaPuntoVenta"
              value={formRecepcion.facturaPuntoVenta}
              onChange={cambiarRecepcion}
              placeholder="00025"
              size="small"
              sx={{ gridColumn: { md: 'span 2' } }}
            />
            <TextField
              label="Factura"
              name="facturaNumero"
              value={formRecepcion.facturaNumero}
              onChange={cambiarRecepcion}
              placeholder="00004578"
              size="small"
              sx={{ gridColumn: { md: 'span 2' } }}
            />
            <CampoMoneda
              label="Costo s/IVA prov."
              name="costoSinIvaProveedor"
              value={formRecepcion.costoSinIvaProveedor}
              onChange={cambiarRecepcion}
              helperText={`Sistema: ${formatoMoneda(totalesRecepcion.costoSinIvaSistema)} | Dif.: ${formatoMoneda(
                Number(formRecepcion.costoSinIvaProveedor || 0) -
                  totalesRecepcion.costoSinIvaSistema
              )}`}
              size="small"
              sx={{ gridColumn: { md: 'span 2' } }}
            />
            <CampoMoneda
              label="Desc. prov."
              name="descuentoProveedorImporte"
              value={formRecepcion.descuentoProveedorImporte}
              onChange={cambiarRecepcion}
              helperText={`Sistema: ${formatoMoneda(totalesRecepcion.descuentoSistemaImporte)} | Dif.: ${formatoMoneda(
                Number(formRecepcion.descuentoProveedorImporte || 0) -
                  totalesRecepcion.descuentoSistemaImporte
              )}`}
              size="small"
              sx={{ gridColumn: { md: 'span 2' } }}
            />
            <CampoMoneda
              label="IVA prov."
              name="ivaProveedorImporte"
              value={formRecepcion.ivaProveedorImporte}
              onChange={cambiarRecepcion}
              helperText={`Sistema: ${formatoMoneda(totalesRecepcion.ivaProductos)} | Dif.: ${formatoMoneda(
                Number(formRecepcion.ivaProveedorImporte || 0) -
                  totalesRecepcion.ivaProductos
              )}`}
              size="small"
              sx={{ gridColumn: { md: 'span 2' } }}
            />
            <CampoMoneda
              label="Total factura"
              name="totalFacturaProveedor"
              value={formRecepcion.totalFacturaProveedor}
              onChange={cambiarRecepcion}
              helperText={`Sistema: ${formatoMoneda(totalesRecepcion.totalFacturaSistema)} | Dif.: ${formatoMoneda(
                totalesRecepcion.diferenciaFactura
              )}`}
              size="small"
              sx={{ gridColumn: { md: 'span 2' } }}
            />
            <CampoMoneda
              label="Redondeo precio publico"
              name="redondeoBase"
              value={formRecepcion.redondeoBase}
              onChange={cambiarRecepcion}
              helperText="Ej: 1, 10, 50, 100"
              size="small"
              sx={{ gridColumn: { md: 'span 2' } }}
            />
            <TextField
              label="Margenes publico general"
              name="margenesPrecioPublicoGeneralTexto"
              value={formRecepcion.margenesPrecioPublicoGeneralTexto}
              onChange={cambiarRecepcion}
              placeholder="68 + 50"
              helperText="Se copia a todos los productos"
              size="small"
              sx={{ gridColumn: { md: 'span 2' } }}
            />
            <TextField
              label="Observaciones"
              name="observaciones"
              value={formRecepcion.observaciones}
              onChange={cambiarRecepcion}
              multiline
              minRows={2}
              size="small"
              sx={{ gridColumn: { md: 'span 4' } }}
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
                      {tiposImporteFactura.map((opcion) => (
                        <MenuItem key={opcion.value} value={opcion.value}>
                          {opcion.label}
                        </MenuItem>
                      ))}
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
                    <CampoMoneda
                      label="Importe"
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

          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 1.5 }}>
            <Button
              variant="outlined"
              startIcon={<AddIcon />}
              onClick={() => setOpenProductoNoPedido(true)}
            >
              Agregar producto no pedido
            </Button>
          </Box>

          <Box sx={{ display: 'grid', gap: 2 }}>
            {detallesRecepcion.map((detalle) => {
              const precioRecepcion = calcularPrecioRecepcion(
                detalle,
                formRecepcion.redondeoBase
              );

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
                        md: '2.4fr 0.7fr 0.7fr 0.8fr 1fr 0.9fr 0.7fr 0.9fr 1fr 0.8fr'
                      },
                      gap: 1,
                      alignItems: 'flex-start'
                    }}
                  >
                    <Box>
                      {detalle.origen === 'NO_PEDIDO' && (
                        <Chip
                          label="NO PEDIDO"
                          size="small"
                          color="warning"
                          sx={{ mb: 0.5 }}
                        />
                      )}
                      <Typography
                        variant="body2"
                        fontWeight={700}
                        sx={{
                          lineHeight: 1.25,
                          maxHeight: 38,
                          overflow: 'hidden'
                        }}
                      >
                        {detalle.producto}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Ant.: {formatoMoneda(detalle.precioPublicoAnterior)}
                      </Typography>
                    </Box>
                    <TextField
                      label="Pedido"
                      value={detalle.origen === 'NO_PEDIDO' ? '-' : detalle.cantidadPedida}
                      InputProps={{ readOnly: true }}
                      size="small"
                    />
                    <TextField
                      label="Pendiente"
                      value={detalle.origen === 'NO_PEDIDO' ? '-' : detalle.pendiente}
                      InputProps={{ readOnly: true }}
                      size="small"
                    />
                    <TextField
                      label="Facturado"
                      type="number"
                      value={detalle.cantidadFacturada}
                      onChange={(e) =>
                        cambiarDetalleRecepcion(
                          detalle.tempId,
                          'cantidadFacturada',
                          e.target.value
                        )
                      }
                      size="small"
                    />
                    <CampoMoneda
                      label="Lista proveedor s/IVA"
                      value={detalle.precioListaProveedor}
                      onChange={(e) =>
                        cambiarDetalleRecepcion(
                          detalle.tempId,
                          'precioListaProveedor',
                          e.target.value
                        )
                      }
                      size="small"
                      helperText=" "
                    />
                    <TextField
                      label="Desc. proveedor"
                      value={detalle.descuentosProveedorTexto}
                      onChange={(e) =>
                        cambiarDetalleRecepcion(
                          detalle.tempId,
                          'descuentosProveedorTexto',
                          e.target.value
                        )
                      }
                      placeholder="20 o 10 + 10 + 5"
                      size="small"
                      helperText=" "
                    />
                    <TextField
                      label="% IVA"
                      type="number"
                      value={detalle.ivaPorcentaje}
                      onChange={(e) =>
                        cambiarDetalleRecepcion(
                          detalle.tempId,
                          'ivaPorcentaje',
                          e.target.value
                        )
                      }
                      size="small"
                      helperText=" "
                    />
                    <TextField
                      label="Margenes publico"
                      value={detalle.margenesPrecioPublicoTexto}
                      onChange={(e) =>
                        cambiarDetalleRecepcion(
                          detalle.tempId,
                          'margenesPrecioPublicoTexto',
                          e.target.value
                        )
                      }
                      placeholder="68 + 50"
                      size="small"
                      helperText=" "
                    />
                    <CampoMoneda
                      label="Precio publico nuevo"
                      value={detalle.precioPublicoNuevo}
                      onChange={(e) =>
                        cambiarDetalleRecepcion(
                          detalle.tempId,
                          'precioPublicoNuevo',
                          e.target.value
                        )
                      }
                      helperText={`Sugerido ${formatoMoneda(
                        precioRecepcion.precioPublicoRedondeado
                      )}`}
                      size="small"
                    />
                    <FormControlLabel
                      sx={{
                        alignSelf: 'center',
                        minHeight: 40,
                        m: 0,
                        '& .MuiFormControlLabel-label': {
                          fontSize: 12
                        }
                      }}
                      control={
                        <Switch
                          size="small"
                          checked={detalle.actualizarPrecioPublico}
                          onChange={(e) =>
                            cambiarDetalleRecepcion(
                              detalle.tempId,
                              'actualizarPrecioPublico',
                              e.target.checked
                            )
                          }
                        />
                      }
                      label="Actualizar precio"
                    />
                  </Box>

                  {detalle.origen === 'NO_PEDIDO' && (
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
                      <Tooltip title="Quitar producto no pedido">
                        <IconButton
                          color="error"
                          size="small"
                          onClick={() => eliminarProductoNoPedido(detalle.tempId)}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  )}

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

          {recepcionesCargadas.length > 0 && (
            <Paper variant="outlined" sx={{ mt: 2, p: 2 }}>
              <Typography fontWeight={700} sx={{ mb: 1 }}>
                Facturas cargadas
              </Typography>
              <Box sx={{ display: 'grid', gap: 1 }}>
                {recepcionesCargadas.map((recepcion) => (
                  <Box
                    key={recepcion.id}
                    sx={{
                      display: 'grid',
                      gridTemplateColumns: {
                        xs: '1fr',
                        md: '1.2fr 1fr 1fr 1fr auto'
                      },
                      gap: 1,
                      alignItems: 'center'
                    }}
                  >
                    <Typography variant="body2">
                      {recepcion.facturaPuntoVenta ||
                        recepcion.numeroFactura ||
                        '-'}
                      {recepcion.facturaNumero
                        ? `-${recepcion.facturaNumero}`
                        : ''}
                    </Typography>
                    <Typography variant="body2">
                      {formatoFechaNegocio(recepcion.fechaRecepcion)}
                    </Typography>
                    <Typography variant="body2">
                      {formatoMoneda(recepcion.totalFacturaProveedor)}
                    </Typography>
                    <Chip
                      label={recepcion.estado}
                      color={
                        recepcion.estado === 'PENDIENTE_CONTROL'
                          ? 'warning'
                          : 'success'
                      }
                      size="small"
                    />
                    <Box display="flex" gap={1} flexWrap="wrap">
                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={<PrintIcon />}
                        onClick={() => abrirReporteRecepcion(recepcion)}
                      >
                        Reporte
                      </Button>
                      {recepcion.estado === 'PENDIENTE_CONTROL' && (
                        <Button
                          size="small"
                          variant="contained"
                          color="success"
                          onClick={() => abrirControlRecepcion(recepcion)}
                        >
                          Cerrar control
                        </Button>
                      )}
                      {recepcion.estado === 'CONTROLADO' && (
                        <Button
                          size="small"
                          variant="outlined"
                          color="secondary"
                          onClick={() =>
                            abrirAjustePosteriorRecepcion(recepcion)
                          }
                        >
                          Ajuste posterior
                        </Button>
                      )}
                    </Box>
                  </Box>
                ))}
              </Box>
            </Paper>
          )}
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
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: 2
            }}
          >
            <Typography variant="h6">
              Detalle {pedidoDetalle?.numeroPedido}
            </Typography>
            {pedidoDetalle && (
              <Box display="flex" gap={1}>
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<PrintIcon />}
                  onClick={exportarPedidoPdf}
                >
                  PDF
                </Button>
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<FileDownloadIcon />}
                  onClick={exportarPedidoExcel}
                >
                  Excel
                </Button>
              </Box>
            )}
          </Box>
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
                    md: 'repeat(5, 1fr)'
                  },
                  gap: 1.25
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
                    Entrega estimada
                  </Typography>
                  <Typography>
                    {formatoFechaNegocio(pedidoDetalle.fechaEstimadaEntrega)}
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
                    Total pedido
                  </Typography>
                  <Typography fontWeight={700}>
                    {formatoMoneda(pedidoDetalle.totalConIva)}
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
              {pedidoDetalle.estado === 'BORRADOR' ? (() => {
                const resumen = resumenPedidoDetalleCompacto(pedidoDetalle);

                return (
                  <Paper variant="outlined" sx={{ overflowX: 'auto' }}>
                    <Box
                      component="table"
                      sx={{
                        width: '100%',
                        tableLayout: 'fixed',
                        borderCollapse: 'collapse',
                        '& th': {
                          bgcolor: 'grey.100',
                          color: 'text.secondary',
                          fontSize: 12,
                          fontWeight: 700,
                          textAlign: 'left',
                          px: 1,
                          py: 0.75,
                          borderBottom: '1px solid',
                          borderColor: 'divider'
                        },
                        '& td': {
                          px: 1,
                          py: 0.75,
                          borderBottom: '1px solid',
                          borderColor: 'divider',
                          fontSize: 13
                        },
                        '& .num': {
                          textAlign: 'right',
                          whiteSpace: 'nowrap'
                        },
                        '& .producto': {
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        },
                        '& .fila-total td': {
                          bgcolor: 'grey.50',
                          fontWeight: 700
                        }
                      }}
                    >
                      <Box component="colgroup">
                        <Box component="col" sx={{ width: '12%' }} />
                        <Box component="col" sx={{ width: '28%' }} />
                        <Box component="col" sx={{ width: '8%' }} />
                        <Box component="col" sx={{ width: '15%' }} />
                        <Box component="col" sx={{ width: '8%' }} />
                        <Box component="col" sx={{ width: '10%' }} />
                        <Box component="col" sx={{ width: '19%' }} />
                      </Box>
                      <Box component="thead">
                        <Box component="tr">
                          <Box component="th">Codigo</Box>
                          <Box component="th">Producto</Box>
                          <Box component="th" className="num">Cant.</Box>
                          <Box component="th" className="num">Precio lista</Box>
                          <Box component="th" className="num">IVA</Box>
                          <Box component="th" className="num">Desc.</Box>
                          <Box component="th" className="num">Total producto</Box>
                        </Box>
                      </Box>
                      <Box component="tbody">
                        {(pedidoDetalle.detalles || []).map((detalle) => (
                          <Box component="tr" key={detalle.id}>
                            <Box component="td">
                              {detalle.producto?.codigo || ''}
                            </Box>
                            <Box
                              component="td"
                              className="producto"
                              title={detalle.producto?.nombre || ''}
                            >
                              {detalle.producto?.nombre || ''}
                            </Box>
                            <Box component="td" className="num">
                              {detalle.cantidadPedida}
                            </Box>
                            <Box component="td" className="num">
                              {formatoMoneda(detalle.precioListaSinIva)}
                            </Box>
                            <Box component="td" className="num">
                              {detalle.ivaPorcentaje}%
                            </Box>
                            <Box component="td" className="num">
                              {descuentoDetalleTexto(detalle)}%
                            </Box>
                            <Box component="td" className="num">
                              {formatoMoneda(totalDetalleSinIva(detalle))}
                            </Box>
                          </Box>
                        ))}
                        <Box component="tr" className="fila-total">
                          <Box component="td" />
                          <Box component="td">Totales</Box>
                          <Box component="td" className="num">
                            {resumen.totalCantidad}
                          </Box>
                          <Box component="td" className="num">
                            {formatoMoneda(resumen.totalLista)}
                          </Box>
                          <Box component="td" />
                          <Box component="td" />
                          <Box component="td" className="num">
                            {formatoMoneda(resumen.totalProductos)}
                          </Box>
                        </Box>
                      </Box>
                    </Box>
                    <Box
                      sx={{
                        display: 'grid',
                        gridTemplateColumns: {
                          xs: '1fr',
                          md: '12% 28% 8% 15% 8% 10% 19%'
                        },
                        rowGap: 0.5,
                        columnGap: 0,
                        p: 1.5
                      }}
                    >
                      {resumen.descuentoGeneralImporte > 0 && (
                        <>
                          <Typography
                            color="text.secondary"
                            sx={{ gridColumn: { md: '6 / 7' } }}
                          >
                            Desc. gral. {resumen.descuentoGeneralTexto}%
                          </Typography>
                          <Typography
                            fontWeight={700}
                            sx={{
                              gridColumn: { md: '7 / 8' },
                              textAlign: 'right'
                            }}
                          >
                            -{formatoMoneda(resumen.descuentoGeneralImporte)}
                          </Typography>
                        </>
                      )}
                      <Typography
                        color="text.secondary"
                        sx={{ gridColumn: { md: '6 / 7' } }}
                      >
                        Total con desc.
                      </Typography>
                      <Typography
                        fontWeight={700}
                        sx={{
                          gridColumn: { md: '7 / 8' },
                          textAlign: 'right'
                        }}
                      >
                        {formatoMoneda(resumen.totalConDescuento)}
                      </Typography>
                      <Typography
                        color="text.secondary"
                        sx={{ gridColumn: { md: '6 / 7' } }}
                      >
                        IVA
                      </Typography>
                      <Typography
                        fontWeight={700}
                        sx={{
                          gridColumn: { md: '7 / 8' },
                          textAlign: 'right'
                        }}
                      >
                        {formatoMoneda(resumen.ivaImporte)}
                      </Typography>
                      <Typography
                        fontWeight={800}
                        sx={{
                          gridColumn: { md: '6 / 7' },
                          mt: 0.75,
                          pt: 0.75,
                          borderTop: { md: '1px solid' },
                          borderColor: 'divider'
                        }}
                      >
                        Total general
                      </Typography>
                      <Typography
                        fontWeight={800}
                        sx={{
                          gridColumn: { md: '7 / 8' },
                          textAlign: 'right',
                          mt: 0.75,
                          pt: 0.75,
                          borderTop: { md: '1px solid' },
                          borderColor: 'divider'
                        }}
                      >
                        {formatoMoneda(resumen.totalGeneral)}
                      </Typography>
                    </Box>
                  </Paper>
                );
              })() : (
                <Box sx={{ display: 'grid', gap: 1.5 }}>
                  {(pedidoDetalle.detalles || []).map((detalle) => {
                    const recibido = calcularTotalRecibidoDetalle(detalle);
                    const pendiente = Math.max(
                      Number(detalle.cantidadPedida || 0) -
                        Number(detalle.cantidadCancelada || 0) -
                        recibido,
                      0
                    );
                    const descuentoProductoTexto = descuentoDetalleTexto(detalle);

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
              )}

              {pedidoDetalle.estado !== 'BORRADOR' && (
                <Box sx={{ display: 'grid', gap: 2 }}>
                  <Typography variant="h6">
                    Recepciones
                  </Typography>
                  {(pedidoDetalle.recepciones || []).length === 0 ? (
                    <Typography color="text.secondary">
                      Todavia no hay recepciones para este pedido.
                    </Typography>
                  ) : (
                    <>
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
                            {recepcion.estado === 'CONTROLADO' && (
                              <Button
                                size="small"
                                variant="outlined"
                                color="secondary"
                                onClick={() =>
                                  abrirAjustePosteriorRecepcion(recepcion)
                                }
                              >
                                Ajuste posterior
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
                              {obtenerLabelTipoImporteFactura(importe.tipo)}:{' '}
                              {formatoMoneda(importe.importe)}
                              {importe.descripcion
                                ? ` - ${importe.descripcion}`
                                : ''}
                            </Typography>
                          ))}
                        </Box>
                      )}

                      {(recepcion.ajustesPosteriores || []).length > 0 && (
                        <Box sx={{ mb: 2 }}>
                          <Typography
                            variant="body2"
                            fontWeight={700}
                            sx={{ mb: 1 }}
                          >
                            Ajustes posteriores
                          </Typography>
                          {(recepcion.ajustesPosteriores || []).map((ajuste) => (
                            <Typography
                              key={ajuste.id}
                              variant="body2"
                              color="text.secondary"
                            >
                              {obtenerLabelTipoAjustePosterior(ajuste.tipo)}:{' '}
                              {ajuste.cantidad} - {ajuste.motivo}
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
                              {(detalle.producto ||
                                detalle.pedidoProveedorDetalle?.producto)?.codigo
                                ? `${(detalle.producto || detalle.pedidoProveedorDetalle.producto).codigo} - ${(detalle.producto || detalle.pedidoProveedorDetalle.producto).nombre}`
                                : (detalle.producto ||
                                    detalle.pedidoProveedorDetalle?.producto)?.nombre}
                              {detalle.origen === 'NO_PEDIDO' && ' (NO PEDIDO)'}
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
                    </>
                  )}
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
            <CampoMoneda
              label="Total proveedor"
              name="totalFacturaProveedor"
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
              inputProps={{ style: { textAlign: 'right' } }}
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
        open={openAjustePosterior}
        onClose={cerrarAjustePosteriorRecepcion}
        fullWidth
        maxWidth="lg"
      >
        <DialogTitle>
          Ajuste posterior de control
        </DialogTitle>
        <DialogContent>
          <Alert severity="info" sx={{ mb: 2 }}>
            Use esta opcion cuando el control ya fue cerrado y luego se detecta
            un faltante, sobrante o error de control. Los productos fallados se
            gestionan posteriormente mediante una devolucion al proveedor.
          </Alert>

          <Box sx={{ display: 'grid', gap: 2 }}>
            {detallesAjustePosterior.map((detalle) => (
              <Paper
                key={detalle.recepcionDetalleId}
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
                      md: '110px 110px 1.4fr 110px 1.2fr 1.2fr'
                    },
                    gap: 1.5,
                    alignItems: 'center'
                  }}
                >
                  <TextField
                    label="Facturado"
                    value={detalle.cantidadFacturada}
                    InputProps={{ readOnly: true }}
                    size="small"
                  />
                  <TextField
                    label="Controlado"
                    value={detalle.cantidadControlada}
                    InputProps={{ readOnly: true }}
                    size="small"
                  />
                  <TextField
                    select
                    label="Tipo ajuste"
                    value={detalle.tipo}
                    onChange={(event) =>
                      cambiarDetalleAjustePosterior(
                        detalle.recepcionDetalleId,
                        'tipo',
                        event.target.value
                      )
                    }
                    size="small"
                  >
                    {tiposAjustePosteriorRecepcion.map((opcion) => (
                      <MenuItem key={opcion.value} value={opcion.value}>
                        {opcion.label}
                      </MenuItem>
                    ))}
                  </TextField>
                  <TextField
                    label="Cantidad"
                    type="number"
                    value={detalle.cantidad}
                    onChange={(event) =>
                      cambiarDetalleAjustePosterior(
                        detalle.recepcionDetalleId,
                        'cantidad',
                        event.target.value
                      )
                    }
                    size="small"
                  />
                  <TextField
                    label="Motivo"
                    value={detalle.motivo}
                    onChange={(event) =>
                      cambiarDetalleAjustePosterior(
                        detalle.recepcionDetalleId,
                        'motivo',
                        event.target.value
                      )
                    }
                    size="small"
                  />
                  <TextField
                    label="Observaciones"
                    value={detalle.observaciones}
                    onChange={(event) =>
                      cambiarDetalleAjustePosterior(
                        detalle.recepcionDetalleId,
                        'observaciones',
                        event.target.value
                      )
                    }
                    size="small"
                  />
                </Box>
              </Paper>
            ))}
          </Box>

          <TextField
            label="Observaciones generales"
            value={observacionesAjustePosterior}
            onChange={(event) =>
              setObservacionesAjustePosterior(event.target.value)
            }
            fullWidth
            multiline
            minRows={2}
            sx={{ mt: 2 }}
          />

          <Divider sx={{ my: 2.5 }} />

          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: 2,
              mb: 1.5
            }}
          >
            <Typography variant="h6">
              Historial de ajustes posteriores
            </Typography>
            <Button
              variant="outlined"
              size="small"
              startIcon={<PrintIcon />}
              onClick={imprimirHistorialAjustesPosteriores}
              disabled={
                !(recepcionAjustePosterior?.ajustesPosteriores || []).length
              }
            >
              Imprimir historial
            </Button>
          </Box>

          {(recepcionAjustePosterior?.ajustesPosteriores || []).length === 0 ? (
            <Typography color="text.secondary">
              Todavia no se registraron ajustes posteriores.
            </Typography>
          ) : (
            <Paper variant="outlined" sx={{ overflowX: 'auto' }}>
              <Box
                component="table"
                sx={{
                  width: '100%',
                  borderCollapse: 'collapse',
                  minWidth: 920,
                  '& th': {
                    bgcolor: 'grey.100',
                    color: 'text.secondary',
                    fontSize: 12,
                    fontWeight: 700,
                    textAlign: 'left'
                  },
                  '& th, & td': {
                    px: 1.25,
                    py: 1,
                    borderBottom: '1px solid',
                    borderColor: 'divider',
                    verticalAlign: 'top'
                  },
                  '& td': {
                    fontSize: 13
                  },
                  '& .num': {
                    textAlign: 'right',
                    whiteSpace: 'nowrap',
                    fontWeight: 700
                  }
                }}
              >
                <Box component="thead">
                  <Box component="tr">
                    <Box component="th">Fecha y hora</Box>
                    <Box component="th">Usuario</Box>
                    <Box component="th">Producto</Box>
                    <Box component="th">Tipo</Box>
                    <Box component="th" className="num">Stock</Box>
                    <Box component="th">Motivo</Box>
                    <Box component="th">Observaciones</Box>
                  </Box>
                </Box>
                <Box component="tbody">
                  {(recepcionAjustePosterior?.ajustesPosteriores || []).map(
                    (ajuste) => {
                      const movimiento = cantidadAjustePosterior(ajuste);
                      const producto = ajuste.producto?.codigo
                        ? `${ajuste.producto.codigo} - ${ajuste.producto.nombre}`
                        : ajuste.producto?.nombre || '-';

                      return (
                        <Box component="tr" key={ajuste.id}>
                          <Box component="td">
                            {ajuste.createdAt
                              ? new Date(ajuste.createdAt).toLocaleString(
                                  'es-AR'
                                )
                              : '-'}
                          </Box>
                          <Box component="td">
                            {ajuste.usuario?.nombre ||
                              ajuste.usuario?.email ||
                              '-'}
                          </Box>
                          <Box component="td">{producto}</Box>
                          <Box component="td">
                            {obtenerLabelTipoAjustePosterior(ajuste.tipo)}
                          </Box>
                          <Box component="td" className="num">
                            {movimiento > 0 ? '+' : ''}{movimiento}
                          </Box>
                          <Box component="td">{ajuste.motivo || '-'}</Box>
                          <Box component="td">
                            {ajuste.observaciones || '-'}
                          </Box>
                        </Box>
                      );
                    }
                  )}
                </Box>
              </Box>
            </Paper>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={cerrarAjustePosteriorRecepcion}>
            Cancelar
          </Button>
          <Button
            variant="contained"
            color="secondary"
            onClick={guardarAjustePosteriorRecepcion}
          >
            Guardar ajuste
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
          <Alert severity="info" sx={{ mb: 2 }}>
            Si el responsable es proveedor se genera el movimiento en cuenta
            corriente del proveedor. Si es transporte o interno, solo queda
            constancia en la recepcion.
          </Alert>
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
              helperText={
                formGestionAdministrativa.responsable === 'PROVEEDOR' &&
                formGestionAdministrativa.comprobanteTipo === 'NOTA_CREDITO'
                  ? 'Si queda vacio se guarda como PENDIENTE'
                  : ' '
              }
            />

            <TextField
              label="Fecha resolucion"
              name="fechaResolucion"
              type="date"
              value={formGestionAdministrativa.fechaResolucion}
              onChange={handleGestionAdministrativaChange}
              InputLabelProps={{ shrink: true }}
            />

            <CampoMoneda
              label="Importe"
              name="importe"
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
          {recepcionReporte && (() => {
            const pedidoReporte =
              pedidoDetalle ||
              pedidoRecepcion ||
              recepcionReporte.pedidoProveedor ||
              {};
            const detallesReporte = recepcionReporte.detalles || [];
            const localesDesdeStocks = Array.from(
              new Map(
                detallesReporte
                  .flatMap((detalle) =>
                    (detalle.producto ||
                      detalle.pedidoProveedorDetalle?.producto)?.stocks || []
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
                  <Typography>Pedido: {pedidoReporte.numeroPedido}</Typography>
                  <Typography>
                    Fecha: {formatoFechaNegocio(recepcionReporte.fechaRecepcion)}
                  </Typography>
                  <Typography>Remito: {recepcionReporte.numeroRemito || '-'}</Typography>
                  <Typography>Factura: {factura}</Typography>
                  <Typography>
                    Proveedor: {pedidoReporte.proveedor?.nombreComercial || ''}
                  </Typography>
                  <Typography>
                    Razon social:{' '}
                    {recepcionReporte.proveedorRazonSocial?.razonSocial ||
                      pedidoReporte.proveedorRazonSocial?.razonSocial ||
                      'Sin asignar'}
                  </Typography>
                  <Typography>
                    Empresa:{' '}
                    {recepcionReporte.empresaFacturacion?.razonSocial ||
                      pedidoReporte.empresaFacturacion?.razonSocial ||
                      'Sin asignar'}
                  </Typography>
                  <Typography>
                    Local: {pedidoReporte.localDestino?.nombre || 'Sin asignar'}
                  </Typography>
                  <Typography>
                    Transporte: {pedidoReporte.transporte?.nombre || 'Sin asignar'}
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
                        detalle.producto ||
                        detalle.pedidoProveedorDetalle?.producto ||
                        {};
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
                              {truncarTexto(
                                `${producto.nombre || ''}${
                                  detalle.origen === 'NO_PEDIDO'
                                    ? ' [NO PEDIDO]'
                                    : ''
                                }`,
                                30
                              )}
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

      <ProductoNoPedidoDialog
        open={openProductoNoPedido}
        onClose={() => setOpenProductoNoPedido(false)}
        onAgregar={agregarProductoNoPedido}
      />

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
