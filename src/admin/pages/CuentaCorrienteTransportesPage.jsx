import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  IconButton,
  InputLabel,
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
import { getTransportesRequest } from '../../services/transporte.service';
import { getProveedoresRequest } from '../../services/proveedor.service';
import { getProvinciasRequest } from '../../services/geografia.service';
import { getPedidosProveedorRequest } from '../../services/pedidoProveedor.service';
import {
  anularCuentaCorrienteTransporteMovimientoRequest,
  createCuentaCorrienteTransporteMovimientoRequest,
  getCuentaCorrienteTransporteRequest,
  getResumenCuentaCorrienteTransporteRequest
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
  provinciaCodigo: '',
  cantidadBultos: '',
  valorDeclarado: '',
  montoEsperado: '',
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
  fecha: fechaInputDesdeHoy(),
  tipo: 'PAGO',
  comprobanteTipo: '',
  comprobanteNumero: '',
  importe: '',
  concepto: '',
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
  const [provincias, setProvincias] = useState([]);
  const [pedidos, setPedidos] = useState([]);
  const [guias, setGuias] = useState([]);
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
      tipo: '',
      estado: '',
      page: paginationMovimientos.page,
      pageSize: paginationMovimientos.pageSize
    }),
    [filtros.search, filtros.transporteId, paginationMovimientos]
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
    const diferencia = redondear(Number(formGuia.montoCobrado || 0) - montoEsperado);

    return {
      porcentaje,
      baseMinima,
      montoCalculadoSistema,
      montoEsperado,
      diferencia
    };
  }, [formGuia, tarifaGuia]);

  const cargarDatos = useCallback(async () => {
    try {
      setLoading(true);
      const [
        guiasData,
        movimientosData,
        resumenData,
        tarifasData,
        reclamosData
      ] = await Promise.all([
        getGuiasTransporteRequest(filtrosGuias),
        getCuentaCorrienteTransporteRequest(filtrosMovimientos),
        getResumenCuentaCorrienteTransporteRequest({
          transporteId: filtros.transporteId
        }),
        getTransporteTarifasRequest(),
        getReclamosTransporteRequest({
          transporteId: filtros.transporteId,
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
  }, [filtros.search, filtros.transporteId, filtrosGuias, filtrosMovimientos]);

  useEffect(() => {
    let activo = true;

    const cargarInicial = async () => {
      try {
        const [
          transportesData,
          proveedoresData,
          provinciasData,
          pedidosData
        ] = await Promise.all([
          getTransportesRequest(),
          getProveedoresRequest(),
          getProvinciasRequest(),
          getPedidosProveedorRequest({
            page: 0,
            pageSize: 200
          })
        ]);

        if (!activo) return;

        setTransportes(transportesData);
        setProveedores(proveedoresData);
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
    setFormGuia((actual) => ({
      ...actual,
      [name]: value
    }));
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
      provinciaCodigo: guia.provinciaCodigo || '',
      cantidadBultos: guia.cantidadBultos || '',
      valorDeclarado: guia.valorDeclarado || '',
      montoEsperado: guia.montoEsperado || '',
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
      transporteId: filtros.transporteId || ''
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
        message: 'Movimiento cargado',
        severity: 'success'
      });
    } catch (error) {
      console.log(error);
      setSnackbar({
        open: true,
        message: error.response?.data?.mensaje || 'Error cargando movimiento',
        severity: 'error'
      });
    }
  };

  const anularMovimiento = async (id) => {
    try {
      await anularCuentaCorrienteTransporteMovimientoRequest(id);
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
      headerName: 'Guia',
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
      headerName: 'Cobrado',
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
      width: 80,
      sortable: false,
      filterable: false,
      renderCell: (params) => (
        <Tooltip title="Anular">
          <span>
            <IconButton
              color="error"
              disabled={
                params.row.origen === 'AUTO' ||
                params.row.estado === 'ANULADO'
              }
              onClick={() => anularMovimiento(params.row.id)}
            >
              <CancelIcon />
            </IconButton>
          </span>
        </Tooltip>
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
            Guias, tarifas, pagos, notas de credito y trazabilidad.
          </Typography>
        </Box>
        <Box display="flex" gap={1}>
          <Button variant="outlined" startIcon={<AddIcon />} onClick={abrirNuevaTarifa}>
            Tarifa
          </Button>
          <Button variant="outlined" startIcon={<AddIcon />} onClick={abrirNuevoMovimiento}>
            Movimiento
          </Button>
          <Button variant="contained" startIcon={<AddIcon />} onClick={abrirNuevaGuia}>
            Guia
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
            Guias
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
              md: '1.4fr 1fr 1fr 1fr'
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
          <Tab label="Guias" />
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

      {tab === 2 && (
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

      {tab === 3 && (
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

      <Dialog open={openGuia} onClose={cerrarGuia} fullWidth maxWidth="md">
        <DialogTitle>{editandoGuia ? 'Editar guia' : 'Nueva guia'}</DialogTitle>
        <DialogContent>
          <Alert severity="info" sx={{ mb: 2 }}>
            Al confirmar una guia se genera automaticamente el debe en la
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
              label="Numero guia"
              name="numeroGuia"
              value={formGuia.numeroGuia}
              onChange={handleGuia}
            />

            <TextField
              label="Fecha guia"
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
              label="Monto cobrado"
              name="montoCobrado"
              type="number"
              value={formGuia.montoCobrado}
              onChange={handleGuia}
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
        <DialogTitle>Nuevo movimiento transporte</DialogTitle>
        <DialogContent>
          <Alert severity="info" sx={{ mb: 2 }}>
            Las guias confirmadas generan deuda automaticamente. Use este
            formulario para pagos, notas de credito y ajustes manuales.
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
              <MenuItem value="PAGO">Pago</MenuItem>
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
