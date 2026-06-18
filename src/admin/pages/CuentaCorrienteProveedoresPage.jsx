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
import EditIcon from '@mui/icons-material/Edit';
import { getProveedoresRequest } from '../../services/proveedor.service';
import {
  anularCuentaCorrienteProveedorMovimientoRequest,
  completarNotaCreditoProveedorRequest,
  createCuentaCorrienteProveedorMovimientoRequest,
  getCuentaCorrienteProveedorRequest,
  getResumenCuentaCorrienteProveedorRequest
} from '../../services/cuentaCorrienteProveedor.service';

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

const movimientoInicial = {
  proveedorId: '',
  fecha: fechaInputDesdeHoy(),
  tipo: 'PAGO',
  comprobanteTipo: '',
  comprobanteNumero: '',
  importe: '',
  concepto: '',
  observaciones: ''
};

const comprobanteNotaCreditoInicial = {
  puntoVenta: '',
  numero: '',
  fecha: fechaInputDesdeHoy(),
  observaciones: ''
};

function CuentaCorrienteProveedoresPage() {
  const [movimientos, setMovimientos] = useState([]);
  const [proveedores, setProveedores] = useState([]);
  const [resumen, setResumen] = useState({
    saldo: 0,
    porProveedor: []
  });
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [paginationModel, setPaginationModel] = useState({
    page: 0,
    pageSize: 50
  });
  const [filtros, setFiltros] = useState({
    search: '',
    proveedorId: '',
    tipo: '',
    estado: ''
  });
  const [openMovimiento, setOpenMovimiento] = useState(false);
  const [formMovimiento, setFormMovimiento] = useState(movimientoInicial);
  const [openComprobanteNC, setOpenComprobanteNC] = useState(false);
  const [movimientoComprobanteNC, setMovimientoComprobanteNC] = useState(null);
  const [formComprobanteNC, setFormComprobanteNC] = useState(
    comprobanteNotaCreditoInicial
  );
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  const paramsFiltros = useMemo(
    () => ({
      ...filtros,
      page: paginationModel.page,
      pageSize: paginationModel.pageSize
    }),
    [filtros, paginationModel]
  );

  const cargarDatos = useCallback(async () => {
    try {
      setLoading(true);
      const [movimientosData, resumenData] = await Promise.all([
        getCuentaCorrienteProveedorRequest(paramsFiltros),
        getResumenCuentaCorrienteProveedorRequest(filtros)
      ]);

      setMovimientos(movimientosData.data || []);
      setTotal(movimientosData.total || 0);
      setResumen({
        saldo: resumenData.saldo || 0,
        porProveedor: resumenData.porProveedor || []
      });
    } catch (error) {
      console.log(error);
      setSnackbar({
        open: true,
        message: 'Error cargando cuenta corriente',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  }, [filtros, paramsFiltros]);

  useEffect(() => {
    let activo = true;

    const cargarInicial = async () => {
      try {
        const data = await getProveedoresRequest();

        if (!activo) return;

        setProveedores(data);
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

  const abrirNuevoMovimiento = () => {
    setFormMovimiento({
      ...movimientoInicial,
      proveedorId: filtros.proveedorId || ''
    });
    setOpenMovimiento(true);
  };

  const cerrarMovimiento = () => {
    setOpenMovimiento(false);
    setFormMovimiento(movimientoInicial);
  };

  const handleFiltro = (event) => {
    const { name, value } = event.target;

    setPaginationModel((actual) => ({
      ...actual,
      page: 0
    }));
    setFiltros((actual) => ({
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

  const guardarMovimiento = async () => {
    try {
      await createCuentaCorrienteProveedorMovimientoRequest(formMovimiento);
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
        message:
          error.response?.data?.mensaje ||
          'Error cargando movimiento',
        severity: 'error'
      });
    }
  };

  const anularMovimiento = async (id) => {
    try {
      await anularCuentaCorrienteProveedorMovimientoRequest(id);
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
        message:
          error.response?.data?.mensaje ||
          'Error anulando movimiento',
        severity: 'error'
      });
    }
  };

  const abrirCompletarNotaCredito = (movimiento) => {
    setMovimientoComprobanteNC(movimiento);
    setFormComprobanteNC({
      ...comprobanteNotaCreditoInicial,
      fecha: String(movimiento.fecha || '').slice(0, 10) || fechaInputDesdeHoy(),
      observaciones: movimiento.observaciones || ''
    });
    setOpenComprobanteNC(true);
  };

  const cerrarCompletarNotaCredito = () => {
    setOpenComprobanteNC(false);
    setMovimientoComprobanteNC(null);
    setFormComprobanteNC(comprobanteNotaCreditoInicial);
  };

  const handleComprobanteNC = (event) => {
    const { name, value } = event.target;

    setFormComprobanteNC((actual) => ({
      ...actual,
      [name]: value
    }));
  };

  const guardarComprobanteNC = async () => {
    try {
      await completarNotaCreditoProveedorRequest(
        movimientoComprobanteNC.id,
        formComprobanteNC
      );
      cerrarCompletarNotaCredito();
      await cargarDatos();
      setSnackbar({
        open: true,
        message: 'Comprobante actualizado',
        severity: 'success'
      });
    } catch (error) {
      console.log(error);
      setSnackbar({
        open: true,
        message:
          error.response?.data?.mensaje ||
          'Error completando comprobante',
        severity: 'error'
      });
    }
  };

  const columns = [
    {
      field: 'fecha',
      headerName: 'Fecha',
      width: 115,
      valueGetter: (_, row) => formatoFecha(row.fecha)
    },
    {
      field: 'proveedor',
      headerName: 'Proveedor',
      flex: 1,
      minWidth: 180,
      valueGetter: (_, row) => row.proveedor?.nombreComercial || ''
    },
    {
      field: 'tipo',
      headerName: 'Tipo',
      width: 175,
      renderCell: (params) => (
        <Chip
          label={params.row.tipo}
          color={
            ['FACTURA', 'FACTURA_COMPLEMENTARIA', 'AJUSTE_DEBITO'].includes(
              params.row.tipo
            )
              ? 'warning'
              : 'success'
          }
          size="small"
          variant={params.row.estado === 'ANULADO' ? 'outlined' : 'filled'}
        />
      )
    },
    {
      field: 'concepto',
      headerName: 'Concepto',
      flex: 1.2,
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
      width: 130,
      valueGetter: (_, row) => formatoMoneda(row.debe)
    },
    {
      field: 'haber',
      headerName: 'Haber',
      width: 130,
      valueGetter: (_, row) => formatoMoneda(row.haber)
    },
    {
      field: 'estado',
      headerName: 'Estado',
      width: 115
    },
    {
      field: 'origen',
      headerName: 'Origen',
      width: 100
    },
    {
      field: 'acciones',
      headerName: '',
      width: 120,
      sortable: false,
      filterable: false,
      renderCell: (params) => {
        const puedeCompletarNC =
          params.row.tipo === 'NOTA_CREDITO' &&
          params.row.origen === 'AUTO' &&
          (!params.row.comprobanteNumero ||
            params.row.comprobanteNumero === 'PENDIENTE') &&
          params.row.estado !== 'ANULADO';

        return (
          <Box display="flex" gap={0.5}>
            {puedeCompletarNC && (
              <Tooltip title="Completar comprobante">
                <IconButton
                  color="primary"
                  onClick={() => abrirCompletarNotaCredito(params.row)}
                >
                  <EditIcon />
                </IconButton>
              </Tooltip>
            )}
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
          </Box>
        );
      }
    }
  ];

  return (
    <Box>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 2
        }}
      >
        <Box>
          <Typography variant="h5" fontWeight={700}>
            Cuenta Corriente Proveedores
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Facturas, notas de credito, pagos, anticipos y ajustes.
          </Typography>
        </Box>

        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={abrirNuevoMovimiento}
        >
          Nuevo movimiento
        </Button>
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
            Proveedores con saldo
          </Typography>
          <Typography variant="h5" fontWeight={700}>
            {resumen.porProveedor.length}
          </Typography>
        </Paper>
        <Paper sx={{ p: 2 }}>
          <Typography variant="body2" color="text.secondary">
            Movimientos
          </Typography>
          <Typography variant="h5" fontWeight={700}>
            {total}
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
            <InputLabel>Proveedor</InputLabel>
            <Select
              label="Proveedor"
              name="proveedorId"
              value={filtros.proveedorId}
              onChange={handleFiltro}
            >
              <MenuItem value="">Todos</MenuItem>
              {proveedores.map((proveedor) => (
                <MenuItem key={proveedor.id} value={proveedor.id}>
                  {proveedor.nombreComercial}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl>
            <InputLabel>Tipo</InputLabel>
            <Select
              label="Tipo"
              name="tipo"
              value={filtros.tipo}
              onChange={handleFiltro}
            >
              <MenuItem value="">Todos</MenuItem>
              {[
                'FACTURA',
                'FACTURA_COMPLEMENTARIA',
                'NOTA_CREDITO',
                'PAGO',
                'ANTICIPO',
                'AJUSTE_DEBITO',
                'AJUSTE_CREDITO'
              ].map((tipo) => (
                <MenuItem key={tipo} value={tipo}>
                  {tipo}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl>
            <InputLabel>Estado</InputLabel>
            <Select
              label="Estado"
              name="estado"
              value={filtros.estado}
              onChange={handleFiltro}
            >
              <MenuItem value="">Todos</MenuItem>
              <MenuItem value="PENDIENTE">PENDIENTE</MenuItem>
              <MenuItem value="APLICADO">APLICADO</MenuItem>
              <MenuItem value="ANULADO">ANULADO</MenuItem>
            </Select>
          </FormControl>
        </Box>
      </Paper>

      <Paper sx={{ height: 600 }}>
        <DataGrid
          rows={movimientos}
          columns={columns}
          loading={loading}
          rowCount={total}
          paginationMode="server"
          paginationModel={paginationModel}
          onPaginationModelChange={setPaginationModel}
          pageSizeOptions={[25, 50, 100]}
          slots={{
            toolbar: GridToolbar
          }}
          disableRowSelectionOnClick
        />
      </Paper>

      <Dialog
        open={openMovimiento}
        onClose={cerrarMovimiento}
        fullWidth
        maxWidth="md"
      >
        <DialogTitle>Nuevo movimiento proveedor</DialogTitle>
        <DialogContent>
          <Alert severity="info" sx={{ mb: 2 }}>
            Las facturas y notas de credito automáticas se generan desde
            recepciones. Use este formulario para pagos, anticipos y ajustes.
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
              <InputLabel>Proveedor</InputLabel>
              <Select
                label="Proveedor"
                name="proveedorId"
                value={formMovimiento.proveedorId}
                onChange={handleMovimiento}
              >
                {proveedores.map((proveedor) => (
                  <MenuItem key={proveedor.id} value={proveedor.id}>
                    {proveedor.nombreComercial}
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
              <MenuItem value="ANTICIPO">Anticipo</MenuItem>
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
              sx={{ gridColumn: { md: '1 / 3' } }}
            />

            <TextField
              label="Observaciones"
              name="observaciones"
              value={formMovimiento.observaciones}
              onChange={handleMovimiento}
              multiline
              minRows={2}
              sx={{ gridColumn: { md: '1 / 3' } }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={cerrarMovimiento}>
            Cancelar
          </Button>
          <Button variant="contained" onClick={guardarMovimiento}>
            Guardar
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={openComprobanteNC}
        onClose={cerrarCompletarNotaCredito}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Completar nota de credito</DialogTitle>
        <DialogContent>
          <Alert severity="info" sx={{ mb: 2 }}>
            Esta accion solo completa el numero del comprobante pendiente. No
            crea otro movimiento ni cambia el importe.
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
              label="Punto venta"
              name="puntoVenta"
              value={formComprobanteNC.puntoVenta}
              onChange={handleComprobanteNC}
              placeholder="00025"
            />
            <TextField
              label="Numero"
              name="numero"
              value={formComprobanteNC.numero}
              onChange={handleComprobanteNC}
              placeholder="00012345"
            />
            <TextField
              label="Fecha"
              name="fecha"
              type="date"
              value={formComprobanteNC.fecha}
              onChange={handleComprobanteNC}
              InputLabelProps={{ shrink: true }}
              sx={{ gridColumn: { md: '1 / 3' } }}
            />
            <TextField
              label="Observaciones"
              name="observaciones"
              value={formComprobanteNC.observaciones}
              onChange={handleComprobanteNC}
              multiline
              minRows={2}
              sx={{ gridColumn: { md: '1 / 3' } }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={cerrarCompletarNotaCredito}>
            Cancelar
          </Button>
          <Button variant="contained" onClick={guardarComprobanteNC}>
            Guardar
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() =>
          setSnackbar((actual) => ({
            ...actual,
            open: false
          }))
        }
      >
        <Alert
          severity={snackbar.severity}
          onClose={() =>
            setSnackbar((actual) => ({
              ...actual,
              open: false
            }))
          }
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}

export default CuentaCorrienteProveedoresPage;
