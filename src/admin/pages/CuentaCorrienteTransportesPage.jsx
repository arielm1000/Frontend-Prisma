import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  IconButton,
  InputLabel,
  ListItemText,
  MenuItem,
  Paper,
  Select,
  Snackbar,
  Tab,
  Tabs,
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
import ReportProblemIcon from '@mui/icons-material/ReportProblem';
import RestoreIcon from '@mui/icons-material/Restore';
import { getTransportesRequest } from '../../services/transporte.service';
import { getProveedoresRequest } from '../../services/proveedor.service';
import { getEmpresasRequest } from '../../services/empresa.service';
import { getProvinciasRequest } from '../../services/geografia.service';
import { getPedidosProveedorRequest } from '../../services/pedidoProveedor.service';
import {
  anularCuentaCorrienteTransporteMovimientoRequest,
  createCuentaCorrienteTransporteMovimientoRequest,
  getCuentaCorrienteTransporteRequest,
  getResumenCuentaCorrienteTransporteRequest,
  reactivarCuentaCorrienteTransporteMovimientoRequest
} from '../../services/cuentaCorrienteTransporte.service';
import {
  anularGuiaTransporteRequest,
  confirmarGuiaTransporteRequest,
  createGuiaTransporteRequest,
  getGuiasTransporteRequest,
  updateGuiaTransporteRequest
} from '../../services/guiaTransporte.service';
import {
  createReclamoTransporteRequest,
  getReclamosTransporteRequest,
  resolverReclamoTransporteRequest
} from '../../services/reclamoTransporte.service';
import {
  anularResumenTransporteRequest,
  createPagoResumenTransporteRequest,
  confirmarResumenTransporteRequest,
  createResumenTransporteRequest,
  getResumenesTransporteRequest,
  reactivarResumenTransporteRequest,
  updateResumenTransporteRequest
} from '../../services/resumenTransporte.service';
import {
  createTransporteTarifaRequest,
  deleteTransporteTarifaRequest,
  getTransporteTarifasRequest,
  updateTransporteTarifaRequest
} from '../../services/transporteTarifa.service';

const fechaInputDesdeHoy = () => {
  const fecha = new Date();
  const year = fecha.getFullYear();
  const month = String(fecha.getMonth() + 1).padStart(2, '0');
  const day = String(fecha.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
};

const formatoFecha = (valor) => {
  if (!valor) return '';
  const [year, month, day] = String(valor).slice(0, 10).split('-');
  return `${day}/${month}/${year}`;
};

const formatoMoneda = (valor) =>
  Number(valor || 0).toLocaleString('es-AR', {
    style: 'currency',
    currency: 'ARS'
  });

const redondear = (valor) =>
  Math.round((Number(valor || 0) + Number.EPSILON) * 100) / 100;

const tieneValor = (valor) => valor !== undefined && valor !== null && valor !== '';

const totalPagadoResumen = (resumen) =>
  (resumen?.pagos || [])
    .filter((pago) => pago.estado === 'APLICADO')
    .reduce((total, pago) => total + Number(pago.importeTotal || 0), 0);

const saldoResumen = (resumen) =>
  redondear(Number(resumen?.totalFacturado || 0) - totalPagadoResumen(resumen));

const tiposOperacion = [
  {
    value: 'RECEPCION_COMPRA',
    label: 'Recepcion compra'
  },
  {
    value: 'DEVOLUCION_PROVEEDOR',
    label: 'Devolucion proveedor'
  },
  {
    value: 'ENVIO_VENTA',
    label: 'Envio venta'
  }
];

const basesCalculo = [
  {
    value: 'FACTURA_COMPRA_SIN_IVA_CON_DESCUENTO',
    label: 'Factura compra sin IVA c/desc.'
  },
  {
    value: 'PRODUCTOS_DEVUELTOS_SIN_IVA',
    label: 'Productos devueltos sin IVA'
  },
  {
    value: 'FACTURA_VENTA_SIN_IVA_CON_DESCUENTO',
    label: 'Factura venta sin IVA c/desc.'
  },
  {
    value: 'MONTO_DECLARADO',
    label: 'Monto declarado'
  }
];

const guiaInicial = {
  transporteId: '',
  numeroGuia: '',
  fechaGuia: fechaInputDesdeHoy(),
  tipoOperacion: 'RECEPCION_COMPRA',
  pedidoProveedorId: '',
  proveedorId: '',
  empresaId: '',
  provinciaCodigo: '',
  cantidadBultos: '',
  valorDeclarado: '',
  montoEsperado: '',
  fleteImporte: '',
  seguroImporte: '',
  subtotalSinIva: '',
  ivaImporte: '',
  totalFacturado: '',
  montoCobrado: '',
  observaciones: ''
};

const tarifaInicial = {
  transporteId: '',
  tipoOperacion: 'RECEPCION_COMPRA',
  provinciaCodigo: '',
  porcentaje: '',
  montoMinimo: '',
  baseCalculo: 'FACTURA_COMPRA_SIN_IVA_CON_DESCUENTO',
  observaciones: '',
  habilitado: true
};

const movimientoInicial = {
  transporteId: '',
  empresaId: '',
  fecha: fechaInputDesdeHoy(),
  tipo: 'NOTA_CREDITO',
  comprobanteTipo: '',
  comprobanteNumero: '',
  importe: '',
  concepto: '',
  observaciones: ''
};

const resumenInicial = {
  transporteId: '',
  empresaId: '',
  numeroResumen: '',
  fechaResumen: fechaInputDesdeHoy(),
  fechaVencimiento: '',
  totalFlete: '',
  totalSeguro: '',
  totalIva: '',
  totalFacturado: '',
  guiaIds: [],
  observaciones: ''
};

const detallePagoInicial = {
  medioPago: 'EFECTIVO',
  importe: '',
  banco: '',
  numeroCheque: '',
  fechaEmision: fechaInputDesdeHoy(),
  fechaCobro: fechaInputDesdeHoy(),
  observaciones: ''
};

const pagoResumenInicial = {
  fechaPago: fechaInputDesdeHoy(),
  importeTotal: '',
  detalles: [{ ...detallePagoInicial }],
  observaciones: ''
};

const reclamoInicial = {
  guiaTransporteId: '',
  fecha: fechaInputDesdeHoy(),
  motivo: 'DIFERENCIA_IMPORTE',
  importeReclamado: '',
  observaciones: ''
};

const resolucionReclamoInicial = {
  estado: 'RESUELTO_CON_NOTA_CREDITO',
  comprobanteTipo: 'NOTA_CREDITO',
  comprobanteNumero: '',
  fechaResolucion: fechaInputDesdeHoy(),
  importeReconocido: '',
  observacionesResolucion: ''
};

const estadosResolucionReclamo = [
  {
    value: 'RESUELTO_CON_NOTA_CREDITO',
    label: 'Nota de credito'
  },
  {
    value: 'RESUELTO_CON_AJUSTE',
    label: 'Ajuste transporte'
  },
  {
    value: 'RECHAZADO',
    label: 'Rechazado'
  },
  {
    value: 'AJUSTE_INTERNO',
    label: 'Aceptado interno'
  }
];

function CuentaCorrienteTransportesPage() {
  const [tab, setTab] = useState(0);
  const [transportes, setTransportes] = useState([]);
  const [proveedores, setProveedores] = useState([]);
  const [empresas, setEmpresas] = useState([]);
  const [provincias, setProvincias] = useState([]);
  const [pedidos, setPedidos] = useState([]);
  const [guias, setGuias] = useState([]);
  const [resumenes, setResumenes] = useState([]);
  const [tarifas, setTarifas] = useState([]);
  const [movimientos, setMovimientos] = useState([]);
  const [reclamos, setReclamos] = useState([]);
  const [resumen, setResumen] = useState({
    saldo: 0,
    porTransporte: []
  });
  const [totalGuias, setTotalGuias] = useState(0);
  const [totalMovimientos, setTotalMovimientos] = useState(0);
  const [loading, setLoading] = useState(false);
  const [paginationGuias, setPaginationGuias] = useState({
    page: 0,
    pageSize: 25
  });
  const [paginationMovimientos, setPaginationMovimientos] = useState({
    page: 0,
    pageSize: 50
  });
  const [filtros, setFiltros] = useState({
    search: '',
    transporteId: '',
    empresaId: '',
    tipoOperacion: '',
    estado: ''
  });
  const [openGuia, setOpenGuia] = useState(false);
  const [editandoGuia, setEditandoGuia] = useState(false);
  const [guiaId, setGuiaId] = useState(null);
  const [formGuia, setFormGuia] = useState(guiaInicial);
  const [openTarifa, setOpenTarifa] = useState(false);
  const [editandoTarifa, setEditandoTarifa] = useState(false);
  const [tarifaId, setTarifaId] = useState(null);
  const [formTarifa, setFormTarifa] = useState(tarifaInicial);
  const [openMovimiento, setOpenMovimiento] = useState(false);
  const [formMovimiento, setFormMovimiento] = useState(movimientoInicial);
  const [movimientoAnular, setMovimientoAnular] = useState(null);
  const [openResumen, setOpenResumen] = useState(false);
  const [editandoResumen, setEditandoResumen] = useState(false);
  const [resumenId, setResumenId] = useState(null);
  const [formResumen, setFormResumen] = useState(resumenInicial);
  const [openPagoResumen, setOpenPagoResumen] = useState(false);
  const [resumenPago, setResumenPago] = useState(null);
  const [formPagoResumen, setFormPagoResumen] = useState(pagoResumenInicial);
  const [openReclamo, setOpenReclamo] = useState(false);
  const [formReclamo, setFormReclamo] = useState(reclamoInicial);
  const [openResolverReclamo, setOpenResolverReclamo] = useState(false);
  const [reclamoResolucion, setReclamoResolucion] = useState(null);
  const [formResolucionReclamo, setFormResolucionReclamo] = useState(
    resolucionReclamoInicial
  );
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  const filtrosGuias = useMemo(
    () => ({
      search: filtros.search,
      transporteId: filtros.transporteId,
      empresaId: filtros.empresaId,
      tipoOperacion: filtros.tipoOperacion,
      estado: filtros.estado,
      page: paginationGuias.page,
      pageSize: paginationGuias.pageSize
    }),
    [filtros, paginationGuias]
  );

  const filtrosMovimientos = useMemo(
    () => ({
      search: filtros.search,
      transporteId: filtros.transporteId,
      empresaId: filtros.empresaId,
      tipo: '',
      estado: '',
      page: paginationMovimientos.page,
      pageSize: paginationMovimientos.pageSize
    }),
    [filtros.search, filtros.transporteId, filtros.empresaId, paginationMovimientos]
  );

  const tarifaGuia = useMemo(
    () =>
      tarifas.find((tarifa) =>
        Number(tarifa.transporteId) === Number(formGuia.transporteId) &&
        tarifa.tipoOperacion === formGuia.tipoOperacion &&
        tarifa.provinciaCodigo === formGuia.provinciaCodigo &&
        tarifa.habilitado
      ),
    [
      tarifas,
      formGuia.transporteId,
      formGuia.tipoOperacion,
      formGuia.provinciaCodigo
    ]
  );

  const calculoGuia = useMemo(() => {
    const valorDeclarado = Number(formGuia.valorDeclarado || 0);
    const porcentaje = Number(tarifaGuia?.porcentaje || 0);
    const baseMinima = Number(tarifaGuia?.montoMinimo || 0);
    const baseAplicada = Math.max(valorDeclarado, baseMinima);
    const montoCalculadoSistema = redondear(baseAplicada * porcentaje / 100);
    const montoEsperado = formGuia.montoEsperado !== ''
      ? Number(formGuia.montoEsperado || 0)
      : montoCalculadoSistema;
    const totalFacturado = tieneValor(formGuia.totalFacturado)
      ? Number(formGuia.totalFacturado || 0)
      : Number(formGuia.montoCobrado || 0);
    const diferencia = redondear(totalFacturado - montoEsperado);

    return {
      porcentaje,
      baseMinima,
      montoCalculadoSistema,
      montoEsperado,
      totalFacturado,
      diferencia
    };
  }, [formGuia, tarifaGuia]);

  const guiasDisponiblesResumen = useMemo(
    () =>
      guias.filter((guia) =>
        guia.transporteId === Number(formResumen.transporteId) &&
        guia.empresaId === Number(formResumen.empresaId) &&
        guia.estado !== 'ANULADA' &&
        (
          !(guia.resumenDetalle || []).some((detalle) =>
            detalle.resumenTransporte?.estado !== 'ANULADO'
          ) ||
          formResumen.guiaIds.includes(guia.id)
        )
      ),
    [guias, formResumen]
  );

  const totalesGuiasResumen = useMemo(
    () =>
      guias
        .filter((guia) => formResumen.guiaIds.includes(guia.id))
        .reduce(
          (totales, guia) => ({
            flete: redondear(totales.flete + Number(guia.fleteImporte || 0)),
            seguro: redondear(totales.seguro + Number(guia.seguroImporte || 0)),
            iva: redondear(totales.iva + Number(guia.ivaImporte || 0)),
            total: redondear(totales.total + Number(guia.totalFacturado || 0))
          }),
          {
            flete: 0,
            seguro: 0,
            iva: 0,
            total: 0
          }
        ),
    [guias, formResumen.guiaIds]
  );

  const totalMediosPagoResumen = useMemo(
    () =>
      redondear(
        formPagoResumen.detalles.reduce(
          (total, detalle) => total + Number(detalle.importe || 0),
          0
        )
      ),
    [formPagoResumen.detalles]
  );

  const saldoCargaPagoResumen = useMemo(
    () => redondear(Number(formPagoResumen.importeTotal || 0) - totalMediosPagoResumen),
    [formPagoResumen.importeTotal, totalMediosPagoResumen]
  );

  const cargarDatos = useCallback(async () => {
    try {
      setLoading(true);
      const [
        guiasData,
        movimientosData,
        resumenData,
        tarifasData,
        reclamosData,
        resumenesData
      ] = await Promise.all([
        getGuiasTransporteRequest(filtrosGuias),
        getCuentaCorrienteTransporteRequest(filtrosMovimientos),
        getResumenCuentaCorrienteTransporteRequest({
          transporteId: filtros.transporteId,
          empresaId: filtros.empresaId
        }),
        getTransporteTarifasRequest(),
        getReclamosTransporteRequest({
          transporteId: filtros.transporteId,
          empresaId: filtros.empresaId,
          search: filtros.search
        }),
        getResumenesTransporteRequest({
          transporteId: filtros.transporteId,
          empresaId: filtros.empresaId,
          search: filtros.search
        })
      ]);

      setGuias(guiasData.data || []);
      setTotalGuias(guiasData.total || 0);
      setMovimientos(movimientosData.data || []);
      setTotalMovimientos(movimientosData.total || 0);
      setResumen({
        saldo: resumenData.saldo || 0,
        porTransporte: resumenData.porTransporte || []
      });
      setTarifas(tarifasData || []);
      setReclamos(reclamosData || []);
      setResumenes(resumenesData || []);
    } catch (error) {
      console.log(error);
      setSnackbar({
        open: true,
        message: 'Error cargando transporte',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  }, [
    filtros.search,
    filtros.transporteId,
    filtros.empresaId,
    filtrosGuias,
    filtrosMovimientos
  ]);

  useEffect(() => {
    let activo = true;

    const cargarInicial = async () => {
      try {
        const [
          transportesData,
          proveedoresData,
          empresasData,
          provinciasData,
          pedidosData
        ] = await Promise.all([
          getTransportesRequest(),
          getProveedoresRequest(),
          getEmpresasRequest(),
          getProvinciasRequest(),
          getPedidosProveedorRequest({
            page: 0,
            pageSize: 200
          })
        ]);

        if (!activo) return;

        setTransportes(transportesData);
        setProveedores(proveedoresData);
        setEmpresas(empresasData);
        setProvincias(provinciasData);
        setPedidos(pedidosData.data || []);
      } catch (error) {
        console.log(error);
      }
    };

    cargarInicial();

    return () => {
      activo = false;
    };
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      cargarDatos();
    }, 250);

    return () => clearTimeout(timer);
  }, [cargarDatos]);

  const handleFiltro = (event) => {
    const { name, value } = event.target;
    setPaginationGuias((actual) => ({ ...actual, page: 0 }));
    setPaginationMovimientos((actual) => ({ ...actual, page: 0 }));
    setFiltros((actual) => ({
      ...actual,
      [name]: value
    }));
  };

  const handleGuia = (event) => {
    const { name, value } = event.target;
    setFormGuia((actual) => {
        const siguiente = {
          ...actual,
          [name]: value
        };

        if (['fleteImporte', 'seguroImporte'].includes(name)) {
          const subtotal = redondear(
            Number(siguiente.fleteImporte || 0) +
              Number(siguiente.seguroImporte || 0)
          );
          const iva = redondear(subtotal * 0.21);
          const total = redondear(subtotal + iva);

          return {
            ...siguiente,
            subtotalSinIva: subtotal,
            ivaImporte: iva,
            totalFacturado: total,
            montoCobrado: total
          };
        }

        if (name === 'subtotalSinIva') {
          const subtotal = Number(value || 0);
          const iva = redondear(subtotal * 0.21);
          const total = redondear(subtotal + iva);

          return {
            ...siguiente,
            ivaImporte: iva,
            totalFacturado: total,
            montoCobrado: total
          };
        }

        if (name === 'ivaImporte') {
          const total = redondear(
            Number(siguiente.subtotalSinIva || 0) + Number(value || 0)
          );

          return {
            ...siguiente,
            totalFacturado: total,
            montoCobrado: total
          };
        }

        if (name === 'totalFacturado') {
          return {
            ...siguiente,
            montoCobrado: value
          };
        }

        return siguiente;
    });
  };

  const handleTarifa = (event) => {
    const { name, value } = event.target;
    setFormTarifa((actual) => ({
      ...actual,
      [name]: value
    }));
  };

  const handleMovimiento = (event) => {
    const { name, value } = event.target;
    setFormMovimiento((actual) => ({
      ...actual,
      [name]: value
    }));
  };

  const handleResumen = (event) => {
    const { name, value } = event.target;
    setFormResumen((actual) => ({
      ...actual,
      [name]: value
    }));
  };

  const handleGuiasResumen = (event) => {
    const value = event.target.value;
    setFormResumen((actual) => ({
      ...actual,
      guiaIds: typeof value === 'string'
        ? value.split(',').map(Number)
        : value
    }));
  };

  const handlePagoResumen = (event) => {
    const { name, value } = event.target;
    setFormPagoResumen((actual) => ({
      ...actual,
      [name]: value
    }));
  };

  const handleDetallePagoResumen = (index, event) => {
    const { name, value } = event.target;
    setFormPagoResumen((actual) => ({
      ...actual,
      detalles: actual.detalles.map((detalle, detalleIndex) =>
        detalleIndex === index
          ? {
            ...detalle,
            [name]: value
          }
          : detalle
      )
    }));
  };

  const handleReclamo = (event) => {
    const { name, value } = event.target;
    setFormReclamo((actual) => ({
      ...actual,
      [name]: value
    }));
  };

  const handleResolucionReclamo = (event) => {
    const { name, value } = event.target;
    setFormResolucionReclamo((actual) => ({
      ...actual,
      [name]: value
    }));
  };

  const abrirNuevaGuia = () => {
    setEditandoGuia(false);
    setGuiaId(null);
    setFormGuia({
      ...guiaInicial,
      transporteId: filtros.transporteId || ''
    });
    setOpenGuia(true);
  };

  const editarGuia = (guia) => {
    setEditandoGuia(true);
    setGuiaId(guia.id);
    setFormGuia({
      transporteId: guia.transporteId || '',
      numeroGuia: guia.numeroGuia || '',
      fechaGuia: String(guia.fechaGuia || '').slice(0, 10),
      tipoOperacion: guia.tipoOperacion || 'RECEPCION_COMPRA',
      pedidoProveedorId: guia.pedidoProveedorId || '',
      proveedorId: guia.proveedorId || '',
      empresaId: guia.empresaId || '',
      provinciaCodigo: guia.provinciaCodigo || '',
      cantidadBultos: guia.cantidadBultos || '',
      valorDeclarado: guia.valorDeclarado || '',
      montoEsperado: guia.montoEsperado || '',
      fleteImporte: guia.fleteImporte || '',
      seguroImporte: guia.seguroImporte || '',
      subtotalSinIva: guia.subtotalSinIva || '',
      ivaImporte: guia.ivaImporte || '',
      totalFacturado: guia.totalFacturado || guia.montoCobrado || '',
      montoCobrado: guia.montoCobrado || '',
      observaciones: guia.observaciones || ''
    });
    setOpenGuia(true);
  };

  const cerrarGuia = () => {
    setOpenGuia(false);
    setEditandoGuia(false);
    setGuiaId(null);
    setFormGuia(guiaInicial);
  };

  const guardarGuia = async () => {
    try {
      if (editandoGuia) {
        await updateGuiaTransporteRequest(guiaId, formGuia);
      } else {
        await createGuiaTransporteRequest(formGuia);
      }

      cerrarGuia();
      await cargarDatos();
      setSnackbar({
        open: true,
        message: 'Guia guardada',
        severity: 'success'
      });
    } catch (error) {
      console.log(error);
      setSnackbar({
        open: true,
        message: error.response?.data?.mensaje || 'Error guardando guia',
        severity: 'error'
      });
    }
  };

  const confirmarGuia = async (id) => {
    try {
      await confirmarGuiaTransporteRequest(id);
      await cargarDatos();
      setSnackbar({
        open: true,
        message: 'Guia confirmada y cta cte actualizada',
        severity: 'success'
      });
    } catch (error) {
      console.log(error);
      setSnackbar({
        open: true,
        message: error.response?.data?.mensaje || 'Error confirmando guia',
        severity: 'error'
      });
    }
  };

  const anularGuia = async (id) => {
    try {
      await anularGuiaTransporteRequest(id);
      await cargarDatos();
      setSnackbar({
        open: true,
        message: 'Guia anulada',
        severity: 'success'
      });
    } catch (error) {
      console.log(error);
      setSnackbar({
        open: true,
        message: error.response?.data?.mensaje || 'Error anulando guia',
        severity: 'error'
      });
    }
  };

  const abrirNuevaTarifa = () => {
    setEditandoTarifa(false);
    setTarifaId(null);
    setFormTarifa({
      ...tarifaInicial,
      transporteId: filtros.transporteId || ''
    });
    setOpenTarifa(true);
  };

  const editarTarifa = (tarifa) => {
    setEditandoTarifa(true);
    setTarifaId(tarifa.id);
    setFormTarifa({
      transporteId: tarifa.transporteId || '',
      tipoOperacion: tarifa.tipoOperacion || 'RECEPCION_COMPRA',
      provinciaCodigo: tarifa.provinciaCodigo || '',
      porcentaje: tarifa.porcentaje || '',
      montoMinimo: tarifa.montoMinimo || '',
      baseCalculo: tarifa.baseCalculo || 'MONTO_DECLARADO',
      observaciones: tarifa.observaciones || '',
      habilitado: tarifa.habilitado
    });
    setOpenTarifa(true);
  };

  const cerrarTarifa = () => {
    setOpenTarifa(false);
    setEditandoTarifa(false);
    setTarifaId(null);
    setFormTarifa(tarifaInicial);
  };

  const guardarTarifa = async () => {
    try {
      if (editandoTarifa) {
        await updateTransporteTarifaRequest(tarifaId, formTarifa);
      } else {
        await createTransporteTarifaRequest(formTarifa);
      }

      cerrarTarifa();
      await cargarDatos();
      setSnackbar({
        open: true,
        message: 'Tarifa guardada',
        severity: 'success'
      });
    } catch (error) {
      console.log(error);
      setSnackbar({
        open: true,
        message: error.response?.data?.mensaje || 'Error guardando tarifa',
        severity: 'error'
      });
    }
  };

  const eliminarTarifa = async (id) => {
    try {
      await deleteTransporteTarifaRequest(id);
      await cargarDatos();
      setSnackbar({
        open: true,
        message: 'Tarifa eliminada',
        severity: 'success'
      });
    } catch (error) {
      console.log(error);
      setSnackbar({
        open: true,
        message: 'Error eliminando tarifa',
        severity: 'error'
      });
    }
  };

  const abrirNuevoMovimiento = () => {
    setFormMovimiento({
      ...movimientoInicial,
      transporteId: filtros.transporteId || '',
      empresaId: filtros.empresaId || ''
    });
    setOpenMovimiento(true);
  };

  const cerrarMovimiento = () => {
    setOpenMovimiento(false);
    setFormMovimiento(movimientoInicial);
  };

  const guardarMovimiento = async () => {
    try {
      await createCuentaCorrienteTransporteMovimientoRequest(formMovimiento);
      cerrarMovimiento();
      await cargarDatos();
      setSnackbar({
        open: true,
        message: 'Ajuste cargado',
        severity: 'success'
      });
    } catch (error) {
      console.log(error);
      setSnackbar({
        open: true,
        message: error.response?.data?.mensaje || 'Error cargando ajuste',
        severity: 'error'
      });
    }
  };

  const abrirConfirmarAnularMovimiento = (movimiento) => {
    setMovimientoAnular(movimiento);
  };

  const cerrarConfirmarAnularMovimiento = () => {
    setMovimientoAnular(null);
  };

  const anularMovimiento = async () => {
    try {
      await anularCuentaCorrienteTransporteMovimientoRequest(movimientoAnular.id);
      cerrarConfirmarAnularMovimiento();
      await cargarDatos();
      setSnackbar({
        open: true,
        message: 'Movimiento anulado',
        severity: 'success'
      });
    } catch (error) {
      console.log(error);
      setSnackbar({
        open: true,
        message: error.response?.data?.mensaje || 'Error anulando movimiento',
        severity: 'error'
      });
    }
  };

  const reactivarMovimiento = async (id) => {
    try {
      await reactivarCuentaCorrienteTransporteMovimientoRequest(id);
      await cargarDatos();
      setSnackbar({
        open: true,
        message: 'Movimiento reactivado',
        severity: 'success'
      });
    } catch (error) {
      console.log(error);
      setSnackbar({
        open: true,
        message: error.response?.data?.mensaje || 'Error reactivando movimiento',
        severity: 'error'
      });
    }
  };

  const abrirNuevoResumen = () => {
    setEditandoResumen(false);
    setResumenId(null);
    setFormResumen({
      ...resumenInicial,
      transporteId: filtros.transporteId || '',
      empresaId: filtros.empresaId || ''
    });
    setOpenResumen(true);
  };

  const editarResumen = (resumen) => {
    setEditandoResumen(true);
    setResumenId(resumen.id);
    setFormResumen({
      transporteId: resumen.transporteId || '',
      empresaId: resumen.empresaId || '',
      numeroResumen: resumen.numeroResumen || '',
      fechaResumen: String(resumen.fechaResumen || '').slice(0, 10),
      fechaVencimiento: resumen.fechaVencimiento
        ? String(resumen.fechaVencimiento).slice(0, 10)
        : '',
      totalFlete: resumen.totalFlete || '',
      totalSeguro: resumen.totalSeguro || '',
      totalIva: resumen.totalIva || '',
      totalFacturado: resumen.totalFacturado || '',
      guiaIds: (resumen.detalles || []).map((detalle) => detalle.guiaTransporteId),
      observaciones: resumen.observaciones || ''
    });
    setOpenResumen(true);
  };

  const cerrarResumen = () => {
    setOpenResumen(false);
    setEditandoResumen(false);
    setResumenId(null);
    setFormResumen(resumenInicial);
  };

  const guardarResumen = async () => {
    try {
      if (editandoResumen) {
        await updateResumenTransporteRequest(resumenId, formResumen);
      } else {
        await createResumenTransporteRequest(formResumen);
      }

      cerrarResumen();
      await cargarDatos();
      setSnackbar({
        open: true,
        message: 'Resumen guardado',
        severity: 'success'
      });
    } catch (error) {
      console.log(error);
      setSnackbar({
        open: true,
        message: error.response?.data?.mensaje || 'Error guardando resumen',
        severity: 'error'
      });
    }
  };

  const confirmarResumen = async (id) => {
    try {
      await confirmarResumenTransporteRequest(id);
      await cargarDatos();
      setSnackbar({
        open: true,
        message: 'Resumen confirmado',
        severity: 'success'
      });
    } catch (error) {
      console.log(error);
      setSnackbar({
        open: true,
        message: error.response?.data?.mensaje || 'Error confirmando resumen',
        severity: 'error'
      });
    }
  };

  const anularResumen = async (id) => {
    try {
      await anularResumenTransporteRequest(id);
      await cargarDatos();
      setSnackbar({
        open: true,
        message: 'Resumen anulado',
        severity: 'success'
      });
    } catch (error) {
      console.log(error);
      setSnackbar({
        open: true,
        message: error.response?.data?.mensaje || 'Error anulando resumen',
        severity: 'error'
      });
    }
  };

  const reactivarResumen = async (id) => {
    try {
      await reactivarResumenTransporteRequest(id);
      await cargarDatos();
      setSnackbar({
        open: true,
        message: 'Resumen reactivado',
        severity: 'success'
      });
    } catch (error) {
      console.log(error);
      setSnackbar({
        open: true,
        message: error.response?.data?.mensaje || 'Error reactivando resumen',
        severity: 'error'
      });
    }
  };

  const abrirPagoResumen = (resumen) => {
    const saldo = saldoResumen(resumen);
    setResumenPago(resumen);
    setFormPagoResumen({
      ...pagoResumenInicial,
      importeTotal: saldo,
      detalles: [
        {
          ...detallePagoInicial,
          importe: saldo
        }
      ]
    });
    setOpenPagoResumen(true);
  };

  const cerrarPagoResumen = () => {
    setOpenPagoResumen(false);
    setResumenPago(null);
    setFormPagoResumen(pagoResumenInicial);
  };

  const agregarDetallePagoResumen = () => {
    setFormPagoResumen((actual) => ({
      ...actual,
      detalles: [
        ...actual.detalles,
        {
          ...detallePagoInicial,
          fechaEmision: fechaInputDesdeHoy(),
          fechaCobro: fechaInputDesdeHoy()
        }
      ]
    }));
  };

  const quitarDetallePagoResumen = (index) => {
    setFormPagoResumen((actual) => ({
      ...actual,
      detalles: actual.detalles.filter((_, detalleIndex) => detalleIndex !== index)
    }));
  };

  const guardarPagoResumen = async () => {
    try {
      const detalleFechaInvalida = formPagoResumen.detalles.find((detalle) =>
        ['CHEQUE', 'ECHEQ'].includes(detalle.medioPago) &&
        detalle.fechaEmision &&
        detalle.fechaCobro &&
        detalle.fechaEmision > detalle.fechaCobro
      );

      if (detalleFechaInvalida) {
        setSnackbar({
          open: true,
          message: 'La fecha de emision debe ser menor o igual a la fecha de cobro',
          severity: 'error'
        });
        return;
      }

      await createPagoResumenTransporteRequest(resumenPago.id, formPagoResumen);
      cerrarPagoResumen();
      await cargarDatos();
      setSnackbar({
        open: true,
        message: 'Pago de resumen aplicado',
        severity: 'success'
      });
    } catch (error) {
      console.log(error);
      setSnackbar({
        open: true,
        message: error.response?.data?.mensaje || 'Error aplicando pago',
        severity: 'error'
      });
    }
  };

  const abrirReclamoGuia = (guia) => {
    setFormReclamo({
      ...reclamoInicial,
      guiaTransporteId: guia.id,
      importeReclamado: Math.abs(Number(guia.diferencia || 0)),
      observaciones: `Diferencia guia ${guia.numeroGuia}`
    });
    setOpenReclamo(true);
  };

  const cerrarReclamo = () => {
    setOpenReclamo(false);
    setFormReclamo(reclamoInicial);
  };

  const guardarReclamo = async () => {
    try {
      await createReclamoTransporteRequest(formReclamo);
      cerrarReclamo();
      await cargarDatos();
      setSnackbar({
        open: true,
        message: 'Reclamo cargado',
        severity: 'success'
      });
    } catch (error) {
      console.log(error);
      setSnackbar({
        open: true,
        message: error.response?.data?.mensaje || 'Error cargando reclamo',
        severity: 'error'
      });
    }
  };

  const abrirResolverReclamo = (reclamo) => {
    setReclamoResolucion(reclamo);
    setFormResolucionReclamo({
      ...resolucionReclamoInicial,
      importeReconocido: reclamo.importeReclamado || ''
    });
    setOpenResolverReclamo(true);
  };

  const cerrarResolverReclamo = () => {
    setOpenResolverReclamo(false);
    setReclamoResolucion(null);
    setFormResolucionReclamo(resolucionReclamoInicial);
  };

  const resolverReclamo = async () => {
    try {
      await resolverReclamoTransporteRequest(
        reclamoResolucion.id,
        formResolucionReclamo
      );
      cerrarResolverReclamo();
      await cargarDatos();
      setSnackbar({
        open: true,
        message: 'Reclamo resuelto',
        severity: 'success'
      });
    } catch (error) {
      console.log(error);
      setSnackbar({
        open: true,
        message: error.response?.data?.mensaje || 'Error resolviendo reclamo',
        severity: 'error'
      });
    }
  };

  const guiaColumns = [
    {
      field: 'fechaGuia',
      headerName: 'Fecha',
      width: 115,
      valueGetter: (_, row) => formatoFecha(row.fechaGuia)
    },
    {
      field: 'numeroGuia',
      headerName: 'Guia factura',
      width: 145
    },
    {
      field: 'transporte',
      headerName: 'Transporte',
      minWidth: 170,
      flex: 1,
      valueGetter: (_, row) => row.transporte?.nombre || ''
    },
    {
      field: 'tipoOperacion',
      headerName: 'Operacion',
      width: 175
    },
    {
      field: 'proveedor',
      headerName: 'Proveedor',
      minWidth: 170,
      flex: 1,
      valueGetter: (_, row) => row.proveedor?.nombreComercial || ''
    },
    {
      field: 'empresa',
      headerName: 'Empresa',
      minWidth: 180,
      flex: 1,
      valueGetter: (_, row) => row.empresa?.razonSocial || ''
    },
    {
      field: 'provincia',
      headerName: 'Provincia',
      width: 130,
      valueGetter: (_, row) => row.provincia?.nombre || ''
    },
    {
      field: 'cantidadBultos',
      headerName: 'Bultos',
      width: 85
    },
    {
      field: 'valorDeclarado',
      headerName: 'Valor',
      width: 120,
      valueGetter: (_, row) => formatoMoneda(row.valorDeclarado)
    },
    {
      field: 'montoCalculadoSistema',
      headerName: 'Calculado',
      width: 125,
      valueGetter: (_, row) => formatoMoneda(row.montoCalculadoSistema)
    },
    {
      field: 'montoEsperado',
      headerName: 'Esperado',
      width: 125,
      valueGetter: (_, row) => formatoMoneda(row.montoEsperado)
    },
    {
      field: 'montoCobrado',
      headerName: 'Total fact.',
      width: 125,
      valueGetter: (_, row) => formatoMoneda(row.montoCobrado)
    },
    {
      field: 'diferencia',
      headerName: 'Dif.',
      width: 110,
      valueGetter: (_, row) => formatoMoneda(row.diferencia)
    },
    {
      field: 'estado',
      headerName: 'Estado',
      width: 150,
      renderCell: (params) => (
        <Chip
          label={params.row.estado}
          color={
            params.row.estado === 'PENDIENTE_CORRECCION'
              ? 'warning'
              : params.row.estado === 'ANULADA'
              ? 'error'
              : 'success'
          }
          size="small"
        />
      )
    },
    {
      field: 'acciones',
      headerName: '',
      width: 185,
      sortable: false,
      filterable: false,
      renderCell: (params) => (
        <Box display="flex" gap={0.5}>
          <Tooltip title="Editar">
            <span>
              <IconButton
                color="primary"
                disabled={params.row.estado !== 'BORRADOR'}
                onClick={() => editarGuia(params.row)}
              >
                <EditIcon />
              </IconButton>
            </span>
          </Tooltip>
          <Tooltip title="Confirmar">
            <span>
              <IconButton
                color="success"
                disabled={
                  ['CONFIRMADA', 'PENDIENTE_CORRECCION', 'ANULADA'].includes(
                    params.row.estado
                  )
                }
                onClick={() => confirmarGuia(params.row.id)}
              >
                <CheckCircleIcon />
              </IconButton>
            </span>
          </Tooltip>
          <Tooltip title="Anular">
            <span>
              <IconButton
                color="error"
                disabled={params.row.estado === 'ANULADA'}
                onClick={() => anularGuia(params.row.id)}
              >
                <CancelIcon />
              </IconButton>
            </span>
          </Tooltip>
          <Tooltip title="Reclamar diferencia">
            <span>
              <IconButton
                color="warning"
                disabled={
                  Number(params.row.diferencia || 0) === 0 ||
                  params.row.estado === 'ANULADA'
                }
                onClick={() => abrirReclamoGuia(params.row)}
              >
                <ReportProblemIcon />
              </IconButton>
            </span>
          </Tooltip>
        </Box>
      )
    }
  ];

  const tarifaColumns = [
    {
      field: 'transporte',
      headerName: 'Transporte',
      flex: 1,
      minWidth: 180,
      valueGetter: (_, row) => row.transporte?.nombre || ''
    },
    {
      field: 'tipoOperacion',
      headerName: 'Operacion',
      width: 190
    },
    {
      field: 'provincia',
      headerName: 'Provincia',
      flex: 1,
      minWidth: 150,
      valueGetter: (_, row) => row.provincia?.nombre || ''
    },
    {
      field: 'porcentaje',
      headerName: '%',
      width: 90,
      valueGetter: (_, row) => `${Number(row.porcentaje || 0)}%`
    },
    {
      field: 'montoMinimo',
      headerName: 'Base minima',
      width: 125,
      valueGetter: (_, row) => formatoMoneda(row.montoMinimo)
    },
    {
      field: 'baseCalculo',
      headerName: 'Base',
      flex: 1,
      minWidth: 220
    },
    {
      field: 'habilitado',
      headerName: 'Estado',
      width: 110,
      renderCell: (params) => (
        <Chip
          label={params.row.habilitado ? 'Activa' : 'Inactiva'}
          color={params.row.habilitado ? 'success' : 'default'}
          size="small"
        />
      )
    },
    {
      field: 'acciones',
      headerName: '',
      width: 100,
      sortable: false,
      filterable: false,
      renderCell: (params) => (
        <Box display="flex">
          <IconButton color="primary" onClick={() => editarTarifa(params.row)}>
            <EditIcon />
          </IconButton>
          <IconButton color="error" onClick={() => eliminarTarifa(params.row.id)}>
            <DeleteIcon />
          </IconButton>
        </Box>
      )
    }
  ];

  const movimientoColumns = [
    {
      field: 'fecha',
      headerName: 'Fecha',
      width: 115,
      valueGetter: (_, row) => formatoFecha(row.fecha)
    },
    {
      field: 'transporte',
      headerName: 'Transporte',
      flex: 1,
      minWidth: 180,
      valueGetter: (_, row) => row.transporte?.nombre || ''
    },
    {
      field: 'empresa',
      headerName: 'Empresa',
      flex: 1,
      minWidth: 180,
      valueGetter: (_, row) => row.empresa?.razonSocial || ''
    },
    {
      field: 'tipo',
      headerName: 'Tipo',
      width: 170
    },
    {
      field: 'concepto',
      headerName: 'Concepto',
      flex: 1.3,
      minWidth: 220
    },
    {
      field: 'comprobanteNumero',
      headerName: 'Comprobante',
      width: 160,
      valueGetter: (_, row) =>
        [row.comprobanteTipo, row.comprobanteNumero].filter(Boolean).join(' ')
    },
    {
      field: 'debe',
      headerName: 'Debe',
      width: 125,
      valueGetter: (_, row) => formatoMoneda(row.debe)
    },
    {
      field: 'haber',
      headerName: 'Haber',
      width: 125,
      valueGetter: (_, row) => formatoMoneda(row.haber)
    },
    {
      field: 'estado',
      headerName: 'Estado',
      width: 110
    },
    {
      field: 'origen',
      headerName: 'Origen',
      width: 95
    },
    {
      field: 'acciones',
      headerName: '',
      width: 90,
      sortable: false,
      filterable: false,
      renderCell: (params) => {
        if (params.row.estado === 'ANULADO') {
          return (
            <Tooltip title="Reactivar">
              <span>
                <IconButton
                  color="success"
                  disabled={params.row.origen === 'AUTO'}
                  onClick={() => reactivarMovimiento(params.row.id)}
                >
                  <RestoreIcon />
                </IconButton>
              </span>
            </Tooltip>
          );
        }

        return (
          <Tooltip title="Anular">
            <span>
              <IconButton
                color="error"
                disabled={params.row.origen === 'AUTO'}
                onClick={() => abrirConfirmarAnularMovimiento(params.row)}
              >
                <CancelIcon />
              </IconButton>
            </span>
          </Tooltip>
        );
      }
    }
  ];

  const resumenColumns = [
    {
      field: 'fechaResumen',
      headerName: 'Fecha',
      width: 115,
      valueGetter: (_, row) => formatoFecha(row.fechaResumen)
    },
    {
      field: 'numeroResumen',
      headerName: 'Resumen',
      width: 150
    },
    {
      field: 'transporte',
      headerName: 'Transporte',
      minWidth: 170,
      flex: 1,
      valueGetter: (_, row) => row.transporte?.nombre || ''
    },
    {
      field: 'empresa',
      headerName: 'Empresa',
      minWidth: 190,
      flex: 1,
      valueGetter: (_, row) => row.empresa?.razonSocial || ''
    },
    {
      field: 'guias',
      headerName: 'Guias',
      width: 85,
      valueGetter: (_, row) => row.detalles?.length || 0
    },
    {
      field: 'totalFlete',
      headerName: 'Flete',
      width: 120,
      valueGetter: (_, row) => formatoMoneda(row.totalFlete)
    },
    {
      field: 'totalSeguro',
      headerName: 'Seguro',
      width: 120,
      valueGetter: (_, row) => formatoMoneda(row.totalSeguro)
    },
    {
      field: 'totalIva',
      headerName: 'IVA',
      width: 120,
      valueGetter: (_, row) => formatoMoneda(row.totalIva)
    },
    {
      field: 'totalFacturado',
      headerName: 'Total',
      width: 125,
      valueGetter: (_, row) => formatoMoneda(row.totalFacturado)
    },
    {
      field: 'pagado',
      headerName: 'Pagado',
      width: 125,
      valueGetter: (_, row) => formatoMoneda(totalPagadoResumen(row))
    },
    {
      field: 'saldo',
      headerName: 'Saldo',
      width: 125,
      valueGetter: (_, row) => formatoMoneda(saldoResumen(row))
    },
    {
      field: 'diferenciaTotal',
      headerName: 'Dif.',
      width: 110,
      valueGetter: (_, row) => formatoMoneda(row.diferenciaTotal)
    },
    {
      field: 'estado',
      headerName: 'Estado',
      width: 125,
      renderCell: (params) => (
        <Chip
          label={params.row.estado}
          color={params.row.estado === 'ANULADO' ? 'error' : 'success'}
          size="small"
        />
      )
    },
    {
      field: 'acciones',
      headerName: '',
      width: 180,
      sortable: false,
      filterable: false,
      renderCell: (params) => (
        <Box display="flex" gap={0.5}>
          {params.row.estado === 'ANULADO' ? (
            <Tooltip title="Reactivar">
              <span>
                <IconButton
                  color="success"
                  onClick={() => reactivarResumen(params.row.id)}
                >
                  <RestoreIcon />
                </IconButton>
              </span>
            </Tooltip>
          ) : (
            <>
              <Tooltip title="Editar">
                <span>
                  <IconButton
                    color="primary"
                    disabled={params.row.estado !== 'BORRADOR'}
                    onClick={() => editarResumen(params.row)}
                  >
                    <EditIcon />
                  </IconButton>
                </span>
              </Tooltip>
              <Tooltip title="Confirmar">
                <span>
                  <IconButton
                    color="success"
                    disabled={params.row.estado !== 'BORRADOR'}
                    onClick={() => confirmarResumen(params.row.id)}
                  >
                    <CheckCircleIcon />
                  </IconButton>
                </span>
              </Tooltip>
              <Tooltip title="Anular">
                <span>
                  <IconButton
                    color="error"
                    onClick={() => anularResumen(params.row.id)}
                  >
                    <CancelIcon />
                  </IconButton>
                </span>
              </Tooltip>
            </>
          )}
          <Tooltip title="Pagar resumen">
            <span>
              <IconButton
                color="primary"
                disabled={
                  !['CONFIRMADO', 'PAGADO_PARCIAL'].includes(params.row.estado) ||
                  saldoResumen(params.row) <= 0
                }
                onClick={() => abrirPagoResumen(params.row)}
              >
                <AddIcon />
              </IconButton>
            </span>
          </Tooltip>
        </Box>
      )
    }
  ];

  const reclamoColumns = [
    {
      field: 'fecha',
      headerName: 'Fecha',
      width: 115,
      valueGetter: (_, row) => formatoFecha(row.fecha)
    },
    {
      field: 'transporte',
      headerName: 'Transporte',
      minWidth: 170,
      flex: 1,
      valueGetter: (_, row) => row.transporte?.nombre || ''
    },
    {
      field: 'guiaTransporte',
      headerName: 'Guia',
      width: 150,
      valueGetter: (_, row) => row.guiaTransporte?.numeroGuia || ''
    },
    {
      field: 'motivo',
      headerName: 'Motivo',
      width: 180
    },
    {
      field: 'importeReclamado',
      headerName: 'Reclamado',
      width: 130,
      valueGetter: (_, row) => formatoMoneda(row.importeReclamado)
    },
    {
      field: 'importeReconocido',
      headerName: 'Reconocido',
      width: 130,
      valueGetter: (_, row) => formatoMoneda(row.importeReconocido)
    },
    {
      field: 'comprobanteNumero',
      headerName: 'Comprobante',
      width: 165,
      valueGetter: (_, row) =>
        [row.comprobanteTipo, row.comprobanteNumero].filter(Boolean).join(' ')
    },
    {
      field: 'estado',
      headerName: 'Estado',
      width: 190,
      renderCell: (params) => (
        <Chip
          label={params.row.estado}
          color={params.row.estado === 'PENDIENTE' ? 'warning' : 'success'}
          size="small"
        />
      )
    },
    {
      field: 'acciones',
      headerName: '',
      width: 95,
      sortable: false,
      filterable: false,
      renderCell: (params) => (
        <Tooltip title="Resolver reclamo">
          <span>
            <IconButton
              color="success"
              disabled={params.row.estado !== 'PENDIENTE'}
              onClick={() => abrirResolverReclamo(params.row)}
            >
              <CheckCircleIcon />
            </IconButton>
          </span>
        </Tooltip>
      )
    }
  ];

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <Box>
          <Typography variant="h5" fontWeight={700}>
            Cuenta Corriente Transportes
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Guias factura, tarifas, pagos, notas de credito y trazabilidad.
          </Typography>
        </Box>
        <Box display="flex" gap={1}>
          <Button variant="outlined" startIcon={<AddIcon />} onClick={abrirNuevaTarifa}>
            Tarifa
          </Button>
          <Button variant="outlined" startIcon={<AddIcon />} onClick={abrirNuevoResumen}>
            Resumen
          </Button>
          <Button variant="outlined" startIcon={<AddIcon />} onClick={abrirNuevoMovimiento}>
            Ajuste
          </Button>
          <Button variant="contained" startIcon={<AddIcon />} onClick={abrirNuevaGuia}>
            Guia factura
          </Button>
        </Box>
      </Box>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: '1fr',
            md: '1fr 1fr 1fr'
          },
          gap: 2,
          mb: 2
        }}
      >
        <Paper sx={{ p: 2 }}>
          <Typography variant="body2" color="text.secondary">
            Saldo filtros
          </Typography>
          <Typography
            variant="h5"
            fontWeight={700}
            color={Number(resumen.saldo || 0) >= 0 ? 'error.main' : 'success.main'}
          >
            {formatoMoneda(resumen.saldo)}
          </Typography>
        </Paper>
        <Paper sx={{ p: 2 }}>
          <Typography variant="body2" color="text.secondary">
            Transportes con saldo
          </Typography>
          <Typography variant="h5" fontWeight={700}>
            {resumen.porTransporte.length}
          </Typography>
        </Paper>
        <Paper sx={{ p: 2 }}>
          <Typography variant="body2" color="text.secondary">
            Guias factura
          </Typography>
          <Typography variant="h5" fontWeight={700}>
            {totalGuias}
          </Typography>
        </Paper>
      </Box>

      <Paper sx={{ p: 2, mb: 2 }}>
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: '1fr',
              md: '1.4fr 1fr 1fr 1fr 1fr'
            },
            gap: 2
          }}
        >
          <TextField
            label="Buscar"
            name="search"
            value={filtros.search}
            onChange={handleFiltro}
          />

          <FormControl>
            <InputLabel>Transporte</InputLabel>
            <Select
              label="Transporte"
              name="transporteId"
              value={filtros.transporteId}
              onChange={handleFiltro}
            >
              <MenuItem value="">Todos</MenuItem>
              {transportes.map((transporte) => (
                <MenuItem key={transporte.id} value={transporte.id}>
                  {transporte.nombre}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl>
            <InputLabel>Empresa</InputLabel>
            <Select
              label="Empresa"
              name="empresaId"
              value={filtros.empresaId}
              onChange={handleFiltro}
            >
              <MenuItem value="">Todas</MenuItem>
              {empresas.map((empresa) => (
                <MenuItem key={empresa.id} value={empresa.id}>
                  {empresa.razonSocial}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl>
            <InputLabel>Operacion</InputLabel>
            <Select
              label="Operacion"
              name="tipoOperacion"
              value={filtros.tipoOperacion}
              onChange={handleFiltro}
            >
              <MenuItem value="">Todas</MenuItem>
              {tiposOperacion.map((tipo) => (
                <MenuItem key={tipo.value} value={tipo.value}>
                  {tipo.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl>
            <InputLabel>Estado guia</InputLabel>
            <Select
              label="Estado guia"
              name="estado"
              value={filtros.estado}
              onChange={handleFiltro}
            >
              <MenuItem value="">Todos</MenuItem>
              <MenuItem value="BORRADOR">BORRADOR</MenuItem>
              <MenuItem value="CONFIRMADA">CONFIRMADA</MenuItem>
              <MenuItem value="PENDIENTE_CORRECCION">PENDIENTE_CORRECCION</MenuItem>
              <MenuItem value="ANULADA">ANULADA</MenuItem>
            </Select>
          </FormControl>
        </Box>
      </Paper>

      <Paper sx={{ mb: 2 }}>
        <Tabs value={tab} onChange={(_, value) => setTab(value)}>
          <Tab label="Guias factura" />
          <Tab label="Resumenes" />
          <Tab label="Cuenta corriente" />
          <Tab label="Reclamos" />
          <Tab label="Tarifas" />
        </Tabs>
      </Paper>

      {tab === 0 && (
        <Paper sx={{ height: 610 }}>
          <DataGrid
            rows={guias}
            columns={guiaColumns}
            loading={loading}
            rowCount={totalGuias}
            paginationMode="server"
            paginationModel={paginationGuias}
            onPaginationModelChange={setPaginationGuias}
            pageSizeOptions={[25, 50, 100]}
            slots={{ toolbar: GridToolbar }}
            disableRowSelectionOnClick
          />
        </Paper>
      )}

      {tab === 1 && (
        <Paper sx={{ height: 610 }}>
          <DataGrid
            rows={resumenes}
            columns={resumenColumns}
            loading={loading}
            pageSizeOptions={[25, 50, 100]}
            slots={{ toolbar: GridToolbar }}
            disableRowSelectionOnClick
          />
        </Paper>
      )}

      {tab === 2 && (
        <Paper sx={{ height: 610 }}>
          <DataGrid
            rows={movimientos}
            columns={movimientoColumns}
            loading={loading}
            rowCount={totalMovimientos}
            paginationMode="server"
            paginationModel={paginationMovimientos}
            onPaginationModelChange={setPaginationMovimientos}
            pageSizeOptions={[25, 50, 100]}
            slots={{ toolbar: GridToolbar }}
            disableRowSelectionOnClick
          />
        </Paper>
      )}

      {tab === 3 && (
        <Paper sx={{ height: 610 }}>
          <DataGrid
            rows={reclamos}
            columns={reclamoColumns}
            loading={loading}
            pageSizeOptions={[25, 50, 100]}
            slots={{ toolbar: GridToolbar }}
            disableRowSelectionOnClick
          />
        </Paper>
      )}

      {tab === 4 && (
        <Paper sx={{ height: 610 }}>
          <DataGrid
            rows={tarifas}
            columns={tarifaColumns}
            loading={loading}
            pageSizeOptions={[25, 50, 100]}
            slots={{ toolbar: GridToolbar }}
            disableRowSelectionOnClick
          />
        </Paper>
      )}

      <Dialog open={openResumen} onClose={cerrarResumen} fullWidth maxWidth="lg">
        <DialogTitle>
          {editandoResumen ? 'Editar resumen transporte' : 'Nuevo resumen transporte'}
        </DialogTitle>
        <DialogContent>
          <Alert severity="info" sx={{ mb: 2 }}>
            El resumen agrupa guias factura ya cargadas. No genera deuda nueva:
            la cuenta corriente sigue naciendo desde cada guia factura.
          </Alert>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: {
                xs: '1fr',
                md: '1fr 1fr 1fr'
              },
              gap: 2,
              mt: 1
            }}
          >
            <FormControl>
              <InputLabel>Transporte</InputLabel>
              <Select
                label="Transporte"
                name="transporteId"
                value={formResumen.transporteId}
                onChange={handleResumen}
              >
                {transportes.map((transporte) => (
                  <MenuItem key={transporte.id} value={transporte.id}>
                    {transporte.nombre}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl>
              <InputLabel>Empresa</InputLabel>
              <Select
                label="Empresa"
                name="empresaId"
                value={formResumen.empresaId}
                onChange={handleResumen}
              >
                {empresas.map((empresa) => (
                  <MenuItem key={empresa.id} value={empresa.id}>
                    {empresa.razonSocial}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              label="Nro. resumen"
              name="numeroResumen"
              value={formResumen.numeroResumen}
              onChange={handleResumen}
            />

            <TextField
              label="Fecha resumen"
              name="fechaResumen"
              type="date"
              value={formResumen.fechaResumen}
              onChange={handleResumen}
              InputLabelProps={{ shrink: true }}
            />

            <TextField
              label="Fecha vencimiento"
              name="fechaVencimiento"
              type="date"
              value={formResumen.fechaVencimiento}
              onChange={handleResumen}
              InputLabelProps={{ shrink: true }}
            />

            <FormControl
              sx={{
                gridColumn: {
                  md: '1 / -1'
                }
              }}
            >
              <InputLabel>Guias factura</InputLabel>
              <Select
                multiple
                label="Guias factura"
                name="guiaIds"
                value={formResumen.guiaIds}
                onChange={handleGuiasResumen}
                renderValue={(selected) =>
                  selected
                    .map((id) =>
                      guias.find((guia) => guia.id === id)?.numeroGuia
                    )
                    .filter(Boolean)
                    .join(', ')
                }
              >
                {guiasDisponiblesResumen.map((guia) => (
                  <MenuItem key={guia.id} value={guia.id}>
                    <Checkbox checked={formResumen.guiaIds.includes(guia.id)} />
                    <ListItemText
                      primary={`${guia.numeroGuia} - ${formatoMoneda(guia.totalFacturado)}`}
                      secondary={`${formatoFecha(guia.fechaGuia)} - ${guia.proveedor?.nombreComercial || ''}`}
                    />
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              label="Total flete resumen"
              name="totalFlete"
              type="number"
              value={formResumen.totalFlete}
              onChange={handleResumen}
              helperText={`Guias: ${formatoMoneda(totalesGuiasResumen.flete)}`}
            />

            <TextField
              label="Total seguro resumen"
              name="totalSeguro"
              type="number"
              value={formResumen.totalSeguro}
              onChange={handleResumen}
              helperText={`Guias: ${formatoMoneda(totalesGuiasResumen.seguro)}`}
            />

            <TextField
              label="Total IVA resumen"
              name="totalIva"
              type="number"
              value={formResumen.totalIva}
              onChange={handleResumen}
              helperText={`Guias: ${formatoMoneda(totalesGuiasResumen.iva)}`}
            />

            <TextField
              label="Total facturado resumen"
              name="totalFacturado"
              type="number"
              value={formResumen.totalFacturado}
              onChange={handleResumen}
              helperText={`Guias: ${formatoMoneda(totalesGuiasResumen.total)}`}
            />

            <TextField
              label="Diferencia total"
              value={formatoMoneda(
                Number(formResumen.totalFacturado || 0) - totalesGuiasResumen.total
              )}
              InputProps={{
                readOnly: true
              }}
            />

            <TextField
              label="Observaciones"
              name="observaciones"
              value={formResumen.observaciones}
              onChange={handleResumen}
              multiline
              rows={2}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={cerrarResumen}>Cancelar</Button>
          <Button variant="contained" onClick={guardarResumen}>
            Guardar
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={openPagoResumen} onClose={cerrarPagoResumen} fullWidth maxWidth="lg">
        <DialogTitle>Pagar resumen transporte</DialogTitle>
        <DialogContent>
          {resumenPago && (
            <Alert severity="info" sx={{ mb: 2 }}>
              Resumen {resumenPago.numeroResumen} - Total{' '}
              {formatoMoneda(resumenPago.totalFacturado)} - Pagado{' '}
              {formatoMoneda(totalPagadoResumen(resumenPago))} - Saldo{' '}
              {formatoMoneda(saldoResumen(resumenPago))}
            </Alert>
          )}
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
              label="Fecha pago"
              name="fechaPago"
              type="date"
              value={formPagoResumen.fechaPago}
              onChange={handlePagoResumen}
              InputLabelProps={{ shrink: true }}
            />

            <TextField
              label="Importe total"
              name="importeTotal"
              type="number"
              value={formPagoResumen.importeTotal}
              onChange={handlePagoResumen}
              helperText={`Medios: ${formatoMoneda(totalMediosPagoResumen)} | Saldo: ${formatoMoneda(saldoCargaPagoResumen)}`}
            />

            <TextField
              label="Observaciones"
              name="observaciones"
              value={formPagoResumen.observaciones}
              onChange={handlePagoResumen}
              multiline
              rows={2}
              sx={{
                gridColumn: {
                  md: '1 / -1'
                }
              }}
            />
          </Box>

          <Box sx={{ mt: 2, display: 'grid', gap: 2 }}>
            {formPagoResumen.detalles.map((detalle, index) => (
              <Paper key={index} variant="outlined" sx={{ p: 2 }}>
                <Box
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: {
                      xs: '1fr',
                      md: '1fr 1fr 1fr'
                    },
                    gap: 2,
                    alignItems: 'start'
                  }}
                >
                  <TextField
                    select
                    label="Medio"
                    name="medioPago"
                    value={detalle.medioPago}
                    onChange={(event) => handleDetallePagoResumen(index, event)}
                  >
                    <MenuItem value="EFECTIVO">Efectivo</MenuItem>
                    <MenuItem value="CHEQUE">Cheque</MenuItem>
                    <MenuItem value="ECHEQ">eCheq</MenuItem>
                    <MenuItem value="TRANSFERENCIA">Transferencia</MenuItem>
                  </TextField>

                  <TextField
                    label="Importe"
                    name="importe"
                    type="number"
                    value={detalle.importe}
                    onChange={(event) => handleDetallePagoResumen(index, event)}
                  />

                  <TextField
                    label="Banco"
                    name="banco"
                    value={detalle.banco}
                    onChange={(event) => handleDetallePagoResumen(index, event)}
                    disabled={!['CHEQUE', 'ECHEQ'].includes(detalle.medioPago)}
                  />

                  <TextField
                    label="Numero cheque/eCheq"
                    name="numeroCheque"
                    value={detalle.numeroCheque}
                    onChange={(event) => handleDetallePagoResumen(index, event)}
                    disabled={!['CHEQUE', 'ECHEQ'].includes(detalle.medioPago)}
                  />

                  <TextField
                    label="Fecha emision"
                    name="fechaEmision"
                    type="date"
                    value={detalle.fechaEmision}
                    onChange={(event) => handleDetallePagoResumen(index, event)}
                    InputLabelProps={{ shrink: true }}
                    disabled={!['CHEQUE', 'ECHEQ'].includes(detalle.medioPago)}
                  />

                  <TextField
                    label="Fecha cobro"
                    name="fechaCobro"
                    type="date"
                    value={detalle.fechaCobro}
                    onChange={(event) => handleDetallePagoResumen(index, event)}
                    InputLabelProps={{ shrink: true }}
                    disabled={!['CHEQUE', 'ECHEQ'].includes(detalle.medioPago)}
                  />

                  <Box display="flex" alignItems="center">
                    <Button
                      color="error"
                      startIcon={<DeleteIcon />}
                      disabled={formPagoResumen.detalles.length === 1}
                      onClick={() => quitarDetallePagoResumen(index)}
                    >
                      Quitar
                    </Button>
                  </Box>
                </Box>
              </Paper>
            ))}
          </Box>

          <Box sx={{ mt: 2 }}>
            <Button variant="outlined" startIcon={<AddIcon />} onClick={agregarDetallePagoResumen}>
              Medio de pago
            </Button>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={cerrarPagoResumen}>Cancelar</Button>
          <Button variant="contained" onClick={guardarPagoResumen}>
            Aplicar pago
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={openGuia} onClose={cerrarGuia} fullWidth maxWidth="md">
        <DialogTitle>
          {editandoGuia ? 'Editar guia factura' : 'Nueva guia factura'}
        </DialogTitle>
        <DialogContent>
          <Alert severity="info" sx={{ mb: 2 }}>
            Al confirmar una guia factura se genera automaticamente el debe en la
            cuenta corriente del transporte.
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
            <FormControl>
              <InputLabel>Transporte</InputLabel>
              <Select
                label="Transporte"
                name="transporteId"
                value={formGuia.transporteId}
                onChange={handleGuia}
              >
                {transportes.map((transporte) => (
                  <MenuItem key={transporte.id} value={transporte.id}>
                    {transporte.nombre}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              label="Nro. guia factura"
              name="numeroGuia"
              value={formGuia.numeroGuia}
              onChange={handleGuia}
            />

            <TextField
              label="Fecha guia factura"
              name="fechaGuia"
              type="date"
              value={formGuia.fechaGuia}
              onChange={handleGuia}
              InputLabelProps={{ shrink: true }}
            />

            <TextField
              select
              label="Operacion"
              name="tipoOperacion"
              value={formGuia.tipoOperacion}
              onChange={handleGuia}
            >
              {tiposOperacion.map((tipo) => (
                <MenuItem key={tipo.value} value={tipo.value}>
                  {tipo.label}
                </MenuItem>
              ))}
            </TextField>

            <FormControl>
              <InputLabel>Provincia tarifa</InputLabel>
              <Select
                label="Provincia tarifa"
                name="provinciaCodigo"
                value={formGuia.provinciaCodigo}
                onChange={handleGuia}
              >
                <MenuItem value="">Sin provincia</MenuItem>
                {provincias.map((provincia) => (
                  <MenuItem key={provincia.codigo} value={provincia.codigo}>
                    {provincia.nombre}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl>
              <InputLabel>Proveedor</InputLabel>
              <Select
                label="Proveedor"
                name="proveedorId"
                value={formGuia.proveedorId}
                onChange={handleGuia}
              >
                <MenuItem value="">Sin proveedor</MenuItem>
                {proveedores.map((proveedor) => (
                  <MenuItem key={proveedor.id} value={proveedor.id}>
                    {proveedor.nombreComercial}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl>
              <InputLabel>Empresa facturada</InputLabel>
              <Select
                label="Empresa facturada"
                name="empresaId"
                value={formGuia.empresaId}
                onChange={handleGuia}
              >
                <MenuItem value="">Sin empresa</MenuItem>
                {empresas.map((empresa) => (
                  <MenuItem key={empresa.id} value={empresa.id}>
                    {empresa.razonSocial}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl>
              <InputLabel>Pedido proveedor</InputLabel>
              <Select
                label="Pedido proveedor"
                name="pedidoProveedorId"
                value={formGuia.pedidoProveedorId}
                onChange={handleGuia}
              >
                <MenuItem value="">Sin pedido</MenuItem>
                {pedidos.map((pedido) => (
                  <MenuItem key={pedido.id} value={pedido.id}>
                    {pedido.numeroPedido} - {pedido.proveedor?.nombreComercial}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              label="Bultos"
              name="cantidadBultos"
              type="number"
              value={formGuia.cantidadBultos}
              onChange={handleGuia}
            />

            <TextField
              label="Valor declarado"
              name="valorDeclarado"
              type="number"
              value={formGuia.valorDeclarado}
              onChange={handleGuia}
            />

            <TextField
              label="Monto calculado sistema"
              value={calculoGuia.montoCalculadoSistema}
              InputProps={{
                readOnly: true
              }}
              helperText={`Tarifa ${calculoGuia.porcentaje}% - Base minima ${formatoMoneda(calculoGuia.baseMinima)}`}
            />

            <TextField
              label="Monto esperado aceptado"
              name="montoEsperado"
              type="number"
              value={formGuia.montoEsperado}
              onChange={handleGuia}
              placeholder={String(calculoGuia.montoCalculadoSistema || '')}
              helperText="Puede ajustarse si la diferencia operativa es aceptada"
            />

            <TextField
              label="Flete"
              name="fleteImporte"
              type="number"
              value={formGuia.fleteImporte}
              onChange={handleGuia}
            />

            <TextField
              label="Seguro"
              name="seguroImporte"
              type="number"
              value={formGuia.seguroImporte}
              onChange={handleGuia}
            />

            <TextField
              label="Subtotal sin IVA"
              name="subtotalSinIva"
              type="number"
              value={formGuia.subtotalSinIva}
              onChange={handleGuia}
              helperText="Flete + seguro. Editable por redondeos"
            />

            <TextField
              label="IVA 21%"
              name="ivaImporte"
              type="number"
              value={formGuia.ivaImporte}
              onChange={handleGuia}
              helperText="Calculado automaticamente, editable"
            />

            <TextField
              label="Total facturado"
              name="totalFacturado"
              type="number"
              value={formGuia.totalFacturado}
              onChange={handleGuia}
              helperText="Este total impacta en la cuenta corriente"
            />

            <TextField
              label="Diferencia prevista"
              value={calculoGuia.diferencia}
              InputProps={{
                readOnly: true
              }}
            />

            <TextField
              label="Observaciones"
              name="observaciones"
              value={formGuia.observaciones}
              onChange={handleGuia}
              multiline
              rows={2}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={cerrarGuia}>Cancelar</Button>
          <Button variant="contained" onClick={guardarGuia}>
            Guardar
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={openTarifa} onClose={cerrarTarifa} fullWidth maxWidth="md">
        <DialogTitle>{editandoTarifa ? 'Editar tarifa' : 'Nueva tarifa'}</DialogTitle>
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
            <FormControl>
              <InputLabel>Transporte</InputLabel>
              <Select
                label="Transporte"
                name="transporteId"
                value={formTarifa.transporteId}
                onChange={handleTarifa}
              >
                {transportes.map((transporte) => (
                  <MenuItem key={transporte.id} value={transporte.id}>
                    {transporte.nombre}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              select
              label="Operacion"
              name="tipoOperacion"
              value={formTarifa.tipoOperacion}
              onChange={handleTarifa}
            >
              {tiposOperacion.map((tipo) => (
                <MenuItem key={tipo.value} value={tipo.value}>
                  {tipo.label}
                </MenuItem>
              ))}
            </TextField>

            <FormControl>
              <InputLabel>Provincia</InputLabel>
              <Select
                label="Provincia"
                name="provinciaCodigo"
                value={formTarifa.provinciaCodigo}
                onChange={handleTarifa}
              >
                {provincias.map((provincia) => (
                  <MenuItem key={provincia.codigo} value={provincia.codigo}>
                    {provincia.nombre}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              label="Porcentaje"
              name="porcentaje"
              type="number"
              value={formTarifa.porcentaje}
              onChange={handleTarifa}
            />

            <TextField
              label="Base minima"
              name="montoMinimo"
              type="number"
              value={formTarifa.montoMinimo}
              onChange={handleTarifa}
              helperText="Si el valor declarado es menor, se calcula sobre esta base"
            />

            <TextField
              select
              label="Base calculo"
              name="baseCalculo"
              value={formTarifa.baseCalculo}
              onChange={handleTarifa}
            >
              {basesCalculo.map((base) => (
                <MenuItem key={base.value} value={base.value}>
                  {base.label}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              label="Observaciones"
              name="observaciones"
              value={formTarifa.observaciones}
              onChange={handleTarifa}
              multiline
              rows={2}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={cerrarTarifa}>Cancelar</Button>
          <Button variant="contained" onClick={guardarTarifa}>
            Guardar
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={openMovimiento}
        onClose={cerrarMovimiento}
        fullWidth
        maxWidth="md"
      >
        <DialogTitle>Nuevo ajuste transporte</DialogTitle>
        <DialogContent>
          <Alert severity="info" sx={{ mb: 2 }}>
            Use este formulario solo para notas de credito o ajustes manuales
            fuera del pago de resumen.
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
            <FormControl>
              <InputLabel>Transporte</InputLabel>
              <Select
                label="Transporte"
                name="transporteId"
                value={formMovimiento.transporteId}
                onChange={handleMovimiento}
              >
                {transportes.map((transporte) => (
                  <MenuItem key={transporte.id} value={transporte.id}>
                    {transporte.nombre}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl>
              <InputLabel>Empresa</InputLabel>
              <Select
                label="Empresa"
                name="empresaId"
                value={formMovimiento.empresaId}
                onChange={handleMovimiento}
              >
                <MenuItem value="">Sin empresa</MenuItem>
                {empresas.map((empresa) => (
                  <MenuItem key={empresa.id} value={empresa.id}>
                    {empresa.razonSocial}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              label="Fecha"
              name="fecha"
              type="date"
              value={formMovimiento.fecha}
              onChange={handleMovimiento}
              InputLabelProps={{ shrink: true }}
            />

            <TextField
              select
              label="Tipo"
              name="tipo"
              value={formMovimiento.tipo}
              onChange={handleMovimiento}
            >
              <MenuItem value="NOTA_CREDITO">Nota de credito</MenuItem>
              <MenuItem value="AJUSTE_DEBITO">Ajuste debito</MenuItem>
              <MenuItem value="AJUSTE_CREDITO">Ajuste credito</MenuItem>
            </TextField>

            <TextField
              label="Importe"
              name="importe"
              type="number"
              value={formMovimiento.importe}
              onChange={handleMovimiento}
            />

            <TextField
              label="Tipo comprobante"
              name="comprobanteTipo"
              value={formMovimiento.comprobanteTipo}
              onChange={handleMovimiento}
            />

            <TextField
              label="Numero comprobante"
              name="comprobanteNumero"
              value={formMovimiento.comprobanteNumero}
              onChange={handleMovimiento}
            />

            <TextField
              label="Concepto"
              name="concepto"
              value={formMovimiento.concepto}
              onChange={handleMovimiento}
            />

            <TextField
              label="Observaciones"
              name="observaciones"
              value={formMovimiento.observaciones}
              onChange={handleMovimiento}
              multiline
              rows={2}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={cerrarMovimiento}>Cancelar</Button>
          <Button variant="contained" onClick={guardarMovimiento}>
            Guardar
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={openReclamo} onClose={cerrarReclamo} fullWidth maxWidth="md">
        <DialogTitle>Nuevo reclamo transporte</DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2 }}>
            Use este reclamo cuando la guia queda con una diferencia que no se
            acepta directamente y debe quedar pendiente de respuesta del
            transporte.
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
            <FormControl>
              <InputLabel>Guia</InputLabel>
              <Select
                label="Guia"
                name="guiaTransporteId"
                value={formReclamo.guiaTransporteId}
                onChange={handleReclamo}
              >
                {guias.map((guia) => (
                  <MenuItem key={guia.id} value={guia.id}>
                    {guia.numeroGuia} - {guia.transporte?.nombre}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              label="Fecha"
              name="fecha"
              type="date"
              value={formReclamo.fecha}
              onChange={handleReclamo}
              InputLabelProps={{ shrink: true }}
            />

            <TextField
              select
              label="Motivo"
              name="motivo"
              value={formReclamo.motivo}
              onChange={handleReclamo}
            >
              <MenuItem value="DIFERENCIA_IMPORTE">Diferencia importe</MenuItem>
              <MenuItem value="MERCADERIA_FALTANTE">Mercaderia faltante</MenuItem>
              <MenuItem value="GUIA_MAL_FACTURADA">Guia mal facturada</MenuItem>
              <MenuItem value="OTRO">Otro</MenuItem>
            </TextField>

            <TextField
              label="Importe reclamado"
              name="importeReclamado"
              type="number"
              value={formReclamo.importeReclamado}
              onChange={handleReclamo}
            />

            <TextField
              label="Observaciones"
              name="observaciones"
              value={formReclamo.observaciones}
              onChange={handleReclamo}
              multiline
              rows={2}
              sx={{
                gridColumn: {
                  md: '1 / -1'
                }
              }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={cerrarReclamo}>Cancelar</Button>
          <Button variant="contained" onClick={guardarReclamo}>
            Guardar reclamo
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={openResolverReclamo}
        onClose={cerrarResolverReclamo}
        fullWidth
        maxWidth="md"
      >
        <DialogTitle>Resolver reclamo transporte</DialogTitle>
        <DialogContent>
          {reclamoResolucion && (
            <Alert severity="info" sx={{ mb: 2 }}>
              Reclamo {formatoMoneda(reclamoResolucion.importeReclamado)} por
              guia {reclamoResolucion.guiaTransporte?.numeroGuia}. Si el
              transporte reconoce otro importe, cargue ese valor y el reclamo
              queda cerrado con trazabilidad.
            </Alert>
          )}
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
              label="Resolucion"
              name="estado"
              value={formResolucionReclamo.estado}
              onChange={handleResolucionReclamo}
            >
              {estadosResolucionReclamo.map((estado) => (
                <MenuItem key={estado.value} value={estado.value}>
                  {estado.label}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              label="Importe reconocido"
              name="importeReconocido"
              type="number"
              value={formResolucionReclamo.importeReconocido}
              onChange={handleResolucionReclamo}
              helperText="Puede ser menor, igual o mayor al reclamado"
            />

            <TextField
              label="Tipo comprobante"
              name="comprobanteTipo"
              value={formResolucionReclamo.comprobanteTipo}
              onChange={handleResolucionReclamo}
            />

            <TextField
              label="Numero comprobante"
              name="comprobanteNumero"
              value={formResolucionReclamo.comprobanteNumero}
              onChange={handleResolucionReclamo}
            />

            <TextField
              label="Fecha resolucion"
              name="fechaResolucion"
              type="date"
              value={formResolucionReclamo.fechaResolucion}
              onChange={handleResolucionReclamo}
              InputLabelProps={{ shrink: true }}
            />

            <TextField
              label="Observaciones"
              name="observacionesResolucion"
              value={formResolucionReclamo.observacionesResolucion}
              onChange={handleResolucionReclamo}
              multiline
              rows={2}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={cerrarResolverReclamo}>Cancelar</Button>
          <Button variant="contained" onClick={resolverReclamo}>
            Resolver
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={Boolean(movimientoAnular)}
        onClose={cerrarConfirmarAnularMovimiento}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle>Anular movimiento</DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2 }}>
            Esta accion quita el movimiento de la cuenta corriente. Luego podra
            reactivarse desde la misma grilla.
          </Alert>
          {movimientoAnular && (
            <Box>
              <Typography variant="body2">
                {movimientoAnular.concepto || movimientoAnular.tipo}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Debe {formatoMoneda(movimientoAnular.debe)} - Haber{' '}
                {formatoMoneda(movimientoAnular.haber)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {[movimientoAnular.comprobanteTipo, movimientoAnular.comprobanteNumero]
                  .filter(Boolean)
                  .join(' ')}
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={cerrarConfirmarAnularMovimiento}>Cancelar</Button>
          <Button color="error" variant="contained" onClick={anularMovimiento}>
            Anular movimiento
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={3500}
        onClose={() => setSnackbar((actual) => ({ ...actual, open: false }))}
      >
        <Alert severity={snackbar.severity}>{snackbar.message}</Alert>
      </Snackbar>
    </Box>
  );
}

export default CuentaCorrienteTransportesPage;
