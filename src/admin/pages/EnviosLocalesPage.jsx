import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
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
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import DeleteIcon from '@mui/icons-material/Delete';
import PrintIcon from '@mui/icons-material/Print';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { getLocalesRequest } from '../../services/local.service';
import { getProductosRequest } from '../../services/producto.service';
import {
  createEnvioLocalRequest,
  getEnviosLocalesRequest,
  recibirEnvioLocalRequest,
  resolverDiferenciaEnvioLocalRequest
} from '../../services/envioLocal.service';

const fechaInputDesdeHoy = () => {
  const fecha = new Date();
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

const envioInicial = {
  localOrigenId: '',
  localDestinoId: '',
  fechaEnvio: fechaInputDesdeHoy(),
  observaciones: ''
};

const detalleInicial = {
  producto: null,
  productoTexto: '',
  cantidadEnviada: 1,
  observaciones: ''
};

const filtrosIniciales = {
  search: '',
  localOrigenId: '',
  localDestinoId: '',
  estado: ''
};

const estadosEnvio = [
  'PENDIENTE_RECEPCION',
  'RECIBIDO',
  'RECIBIDO_CON_DIFERENCIAS',
  'DIFERENCIAS_RESUELTAS',
  'CANCELADO'
];

const tiposResolucion = [
  {
    value: 'DEVOLVER_ORIGEN',
    label: 'Devolver al origen'
  },
  {
    value: 'MERMA',
    label: 'Merma'
  },
  {
    value: 'EN_TRANSITO',
    label: 'En transito'
  },
  {
    value: 'ENVIADA_OTRO_LOCAL',
    label: 'Enviada a otro local'
  },
  {
    value: 'AJUSTE_MANUAL',
    label: 'Ajuste manual'
  }
];

const estadoColor = (estado) => {
  if (estado === 'RECIBIDO' || estado === 'DIFERENCIAS_RESUELTAS') return 'success';
  if (estado === 'RECIBIDO_CON_DIFERENCIAS') return 'warning';
  if (estado === 'CANCELADO') return 'error';
  return 'info';
};

const productoLabel = (producto) =>
  producto ? `${producto.codigo} - ${producto.nombre}` : '';

const stockProductoEnLocal = (producto, localId) => {
  const stock = producto?.stocks?.find(
    (item) => Number(item.localId) === Number(localId)
  );

  return Number(stock?.cantidad || 0);
};

function EnviosLocalesPage() {
  const [envios, setEnvios] = useState([]);
  const [locales, setLocales] = useState([]);
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filtros, setFiltros] = useState(filtrosIniciales);
  const [openForm, setOpenForm] = useState(false);
  const [openRecepcion, setOpenRecepcion] = useState(false);
  const [openDetalle, setOpenDetalle] = useState(false);
  const [openResolucion, setOpenResolucion] = useState(false);
  const [envioSeleccionado, setEnvioSeleccionado] = useState(null);
  const [detalleSeleccionado, setDetalleSeleccionado] = useState(null);
  const [form, setForm] = useState(envioInicial);
  const [detalleForm, setDetalleForm] = useState(detalleInicial);
  const [detalles, setDetalles] = useState([]);
  const [recepcionDetalles, setRecepcionDetalles] = useState([]);
  const [observacionesRecepcion, setObservacionesRecepcion] = useState('');
  const [resolucion, setResolucion] = useState({
    tipoResolucion: 'DEVOLVER_ORIGEN',
    localResolucionId: '',
    cantidad: 1,
    observacion: ''
  });
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  const localCentral = useMemo(
    () => locales.find((local) =>
      local.nombre?.toLowerCase().includes('central')
    ),
    [locales]
  );

  const cargarEnvios = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getEnviosLocalesRequest(filtros);
      setEnvios(data);
    } catch (error) {
      console.log(error);
      setSnackbar({
        open: true,
        message: 'Error cargando envios',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  }, [filtros]);

  useEffect(() => {
    let activo = true;

    const cargarInicial = async () => {
      try {
        const [localesData, enviosData] = await Promise.all([
          getLocalesRequest(),
          getEnviosLocalesRequest()
        ]);

        if (!activo) return;

        setLocales(localesData);
        setEnvios(enviosData);
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
    const timeoutId = setTimeout(() => {
      cargarEnvios();
    }, 250);

    return () => clearTimeout(timeoutId);
  }, [cargarEnvios]);

  const buscarProductos = async (search) => {
    try {
      const data = await getProductosRequest({
        search,
        page: 0,
        pageSize: 20,
        habilitado: true
      });

      setProductos(data.data || []);
    } catch (error) {
      console.log(error);
    }
  };

  const abrirNuevo = () => {
    setForm({
      ...envioInicial,
      localOrigenId: localCentral?.id || ''
    });
    setDetalleForm(detalleInicial);
    setDetalles([]);
    setProductos([]);
    setOpenForm(true);
  };

  const agregarDetalle = () => {
    const producto = detalleForm.producto;
    const cantidad = Number(detalleForm.cantidadEnviada || 0);

    if (!producto || cantidad <= 0) {
      setSnackbar({
        open: true,
        message: 'Seleccione producto y cantidad',
        severity: 'warning'
      });
      return;
    }

    const stockDisponible = stockProductoEnLocal(producto, form.localOrigenId);

    if (cantidad > stockDisponible) {
      setSnackbar({
        open: true,
        message: `Stock insuficiente. Disponible: ${stockDisponible}`,
        severity: 'error'
      });
      return;
    }

    const existe = detalles.find((detalle) => detalle.productoId === producto.id);

    if (existe) {
      setSnackbar({
        open: true,
        message: 'El producto ya esta agregado',
        severity: 'warning'
      });
      return;
    }

    setDetalles((actuales) => [
      ...actuales,
      {
        productoId: producto.id,
        producto,
        cantidadEnviada: cantidad,
        stockDisponible,
        observaciones: detalleForm.observaciones
      }
    ]);
    setDetalleForm(detalleInicial);
  };

  const quitarDetalle = (productoId) => {
    setDetalles((actuales) =>
      actuales.filter((detalle) => detalle.productoId !== productoId)
    );
  };

  const guardarEnvio = async () => {
    try {
      if (!form.localOrigenId || !form.localDestinoId) {
        setSnackbar({
          open: true,
          message: 'Seleccione local origen y destino',
          severity: 'warning'
        });
        return;
      }

      if (!detalles.length) {
        setSnackbar({
          open: true,
          message: 'Agregue al menos un producto',
          severity: 'warning'
        });
        return;
      }

      const payload = {
        ...form,
        detalles: detalles.map((detalle) => ({
          productoId: detalle.productoId,
          cantidadEnviada: detalle.cantidadEnviada,
          observaciones: detalle.observaciones
        }))
      };

      await createEnvioLocalRequest(payload);
      setOpenForm(false);
      await cargarEnvios();
      setSnackbar({
        open: true,
        message: 'Envio creado correctamente',
        severity: 'success'
      });
    } catch (error) {
      console.log(error);
      setSnackbar({
        open: true,
        message: error.response?.data?.mensaje || 'Error creando envio',
        severity: 'error'
      });
    }
  };

  const abrirRecepcion = (envio) => {
    setEnvioSeleccionado(envio);
    setObservacionesRecepcion('');
    setRecepcionDetalles(
      envio.detalles.map((detalle) => ({
        detalleId: detalle.id,
        cantidadEnviada: detalle.cantidadEnviada,
        cantidadRecibida: detalle.cantidadEnviada,
        cantidadFallada: 0,
        observaciones: ''
      }))
    );
    setOpenRecepcion(true);
  };

  const actualizarRecepcionDetalle = (detalleId, campo, valor) => {
    setRecepcionDetalles((actuales) =>
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

  const guardarRecepcion = async () => {
    try {
      await recibirEnvioLocalRequest(envioSeleccionado.id, {
        observacionesRecepcion,
        detalles: recepcionDetalles.map((detalle) => ({
          ...detalle,
          cantidadRecibida: Number(detalle.cantidadRecibida || 0),
          cantidadFallada: Number(detalle.cantidadFallada || 0)
        }))
      });

      setOpenRecepcion(false);
      await cargarEnvios();
      setSnackbar({
        open: true,
        message: 'Recepcion guardada',
        severity: 'success'
      });
    } catch (error) {
      console.log(error);
      setSnackbar({
        open: true,
        message: error.response?.data?.mensaje || 'Error guardando recepcion',
        severity: 'error'
      });
    }
  };

  const abrirDetalle = (envio) => {
    setEnvioSeleccionado(envio);
    setOpenDetalle(true);
  };

  const abrirResolucion = (detalle) => {
    setDetalleSeleccionado(detalle);
    const diferenciaPendiente =
      Number(detalle.cantidadFaltante || 0) +
      Number(detalle.cantidadSobrante || 0) +
      Number(detalle.cantidadFallada || 0) -
      detalle.diferencias
        .filter((diferencia) => diferencia.tipoResolucion !== 'EN_TRANSITO')
        .reduce(
          (total, diferencia) => total + Number(diferencia.cantidad || 0),
          0
        );

    setResolucion({
      tipoResolucion: 'DEVOLVER_ORIGEN',
      localResolucionId: '',
      cantidad: Math.max(diferenciaPendiente, 1),
      observacion: ''
    });
    setOpenResolucion(true);
  };

  const guardarResolucion = async () => {
    try {
      const envioActualizado = await resolverDiferenciaEnvioLocalRequest(
        detalleSeleccionado.id,
        resolucion
      );

      setEnvioSeleccionado(envioActualizado);
      setOpenResolucion(false);
      await cargarEnvios();
      setSnackbar({
        open: true,
        message: 'Diferencia resuelta',
        severity: 'success'
      });
    } catch (error) {
      console.log(error);
      setSnackbar({
        open: true,
        message: error.response?.data?.mensaje || 'Error resolviendo diferencia',
        severity: 'error'
      });
    }
  };

  const imprimirComprobante = (envio) => {
    const filas = envio.detalles
      .map((detalle) => `
        <tr>
          <td class="producto">${detalle.producto.codigo}<br>${detalle.producto.nombre}</td>
          <td class="cantidad">${detalle.cantidadEnviada}</td>
        </tr>
      `)
      .join('');

    const ventana = window.open('', '_blank', 'width=420,height=650');

    ventana.document.write(`
      <html>
        <head>
          <title>${envio.numeroEnvio}</title>
          <style>
            @page {
              size: 80mm auto;
              margin: 0;
            }

            * {
              box-sizing: border-box;
            }

            html,
            body {
              width: 80mm;
              margin: 0;
              padding: 0;
              background: #fff;
            }

            body {
              font-family: Arial, Helvetica, sans-serif;
              color: #000;
              font-size: 16px;
              line-height: 1.25;
            }

            .ticket {
              width: 80mm;
              padding: 2mm 3mm 6mm 3mm;
            }

            h2 {
              margin: 0 0 8px;
              font-size: 22px;
              line-height: 1.1;
              text-align: center;
            }

            p {
              margin: 0 0 6px;
              font-size: 16px;
            }

            table { width: 100%; border-collapse: collapse; }
            td {
              border-top: 1px dashed #000;
              padding: 7px 0;
              vertical-align: top;
              font-size: 15px;
            }

            .producto {
              width: 65%;
              word-break: break-word;
            }

            .cantidad {
              width: 35%;
              text-align: right;
              font-size: 18px;
              font-weight: 700;
            }

            .firmas {
              margin-top: 14px;
              font-size: 15px;
            }
          </style>
        </head>
        <body>
          <div class="ticket">
            <h2>${envio.numeroEnvio}</h2>
            <p><strong>Origen:</strong> ${envio.localOrigen?.nombre || ''}</p>
            <p><strong>Destino:</strong> ${envio.localDestino?.nombre || ''}</p>
            <p><strong>Fecha:</strong> ${formatoFechaNegocio(envio.fechaEnvio)}</p>
            <p><strong>Usuario:</strong> ${envio.usuarioCrea?.nombre || envio.usuarioCrea?.email || ''}</p>
            <table>${filas}</table>
            <p class="firmas">Firma origen: __________________</p>
            <p class="firmas">Firma destino: _________________</p>
          </div>
        </body>
      </html>
    `);
    ventana.document.close();
    ventana.focus();
    setTimeout(() => {
      ventana.print();
    }, 250);
  };

  const columns = useMemo(
    () => [
      {
        field: 'numeroEnvio',
        headerName: 'Envio',
        width: 140
      },
      {
        field: 'fechaEnvio',
        headerName: 'Fecha',
        width: 115,
        valueGetter: (_, row) =>
          formatoFechaNegocio(row.fechaEnvio)
      },
      {
        field: 'localOrigen',
        headerName: 'Origen',
        flex: 1,
        minWidth: 150,
        valueGetter: (_, row) => row.localOrigen?.nombre || ''
      },
      {
        field: 'localDestino',
        headerName: 'Destino',
        flex: 1,
        minWidth: 150,
        valueGetter: (_, row) => row.localDestino?.nombre || ''
      },
      {
        field: 'estado',
        headerName: 'Estado',
        width: 190,
        renderCell: (params) => (
          <Chip
            label={params.row.estado}
            color={estadoColor(params.row.estado)}
            size="small"
          />
        )
      },
      {
        field: 'items',
        headerName: 'Items',
        width: 80,
        valueGetter: (_, row) => row.detalles?.length || 0
      },
      {
        field: 'acciones',
        headerName: 'Acciones',
        width: 170,
        sortable: false,
        renderCell: (params) => (
          <Box>
            <Tooltip title="Ver detalle">
              <IconButton onClick={() => abrirDetalle(params.row)}>
                <VisibilityIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Recibir">
              <span>
                <IconButton
                  color="success"
                  disabled={params.row.estado !== 'PENDIENTE_RECEPCION'}
                  onClick={() => abrirRecepcion(params.row)}
                >
                  <CheckCircleIcon />
                </IconButton>
              </span>
            </Tooltip>
            <Tooltip title="Imprimir comprobante">
              <IconButton onClick={() => imprimirComprobante(params.row)}>
                <PrintIcon />
              </IconButton>
            </Tooltip>
          </Box>
        )
      }
    ],
    []
  );

  const stockDisponibleDetalle = stockProductoEnLocal(
    detalleForm.producto,
    form.localOrigenId
  );

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
            Envios a Locales
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Movimientos desde central u otro local con control de recepcion.
          </Typography>
        </Box>

        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={abrirNuevo}
        >
          Nuevo envio
        </Button>
      </Box>

      <Paper sx={{ p: 2, mb: 2 }}>
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: '1fr',
              md: '1.2fr 1fr 1fr 1fr'
            },
            gap: 2
          }}
        >
          <TextField
            label="Buscar"
            value={filtros.search}
            onChange={(event) =>
              setFiltros((actual) => ({
                ...actual,
                search: event.target.value
              }))
            }
          />

          <FormControl>
            <InputLabel>Origen</InputLabel>
            <Select
              label="Origen"
              value={filtros.localOrigenId}
              onChange={(event) =>
                setFiltros((actual) => ({
                  ...actual,
                  localOrigenId: event.target.value
                }))
              }
            >
              <MenuItem value="">Todos</MenuItem>
              {locales.map((local) => (
                <MenuItem key={local.id} value={local.id}>
                  {local.nombre}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl>
            <InputLabel>Destino</InputLabel>
            <Select
              label="Destino"
              value={filtros.localDestinoId}
              onChange={(event) =>
                setFiltros((actual) => ({
                  ...actual,
                  localDestinoId: event.target.value
                }))
              }
            >
              <MenuItem value="">Todos</MenuItem>
              {locales.map((local) => (
                <MenuItem key={local.id} value={local.id}>
                  {local.nombre}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl>
            <InputLabel>Estado</InputLabel>
            <Select
              label="Estado"
              value={filtros.estado}
              onChange={(event) =>
                setFiltros((actual) => ({
                  ...actual,
                  estado: event.target.value
                }))
              }
            >
              <MenuItem value="">Todos</MenuItem>
              {estadosEnvio.map((estado) => (
                <MenuItem key={estado} value={estado}>
                  {estado}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
      </Paper>

      <Paper sx={{ height: 560 }}>
        <DataGrid
          rows={envios}
          columns={columns}
          loading={loading}
          getRowId={(row) => row.id}
          slots={{
            toolbar: GridToolbar
          }}
          initialState={{
            pagination: {
              paginationModel: {
                pageSize: 10
              }
            }
          }}
          pageSizeOptions={[10, 25, 50]}
          disableRowSelectionOnClick
        />
      </Paper>

      <Dialog
        open={openForm}
        onClose={() => setOpenForm(false)}
        fullWidth
        maxWidth="lg"
      >
        <DialogTitle>Nuevo envio a local</DialogTitle>
        <DialogContent>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: {
                xs: '1fr',
                md: '1fr 1fr 180px'
              },
              gap: 2,
              mt: 1
            }}
          >
            <FormControl>
              <InputLabel>Local origen</InputLabel>
              <Select
                label="Local origen"
                value={form.localOrigenId}
                onChange={(event) =>
                  setForm((actual) => ({
                    ...actual,
                    localOrigenId: event.target.value
                  }))
                }
              >
                {locales.map((local) => (
                  <MenuItem key={local.id} value={local.id}>
                    {local.nombre}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl>
              <InputLabel>Local destino</InputLabel>
              <Select
                label="Local destino"
                value={form.localDestinoId}
                onChange={(event) =>
                  setForm((actual) => ({
                    ...actual,
                    localDestinoId: event.target.value
                  }))
                }
              >
                {locales
                  .filter((local) => Number(local.id) !== Number(form.localOrigenId))
                  .map((local) => (
                    <MenuItem key={local.id} value={local.id}>
                      {local.nombre}
                    </MenuItem>
                  ))}
              </Select>
            </FormControl>

            <TextField
              label="Fecha envio"
              type="date"
              value={form.fechaEnvio}
              onChange={(event) =>
                setForm((actual) => ({
                  ...actual,
                  fechaEnvio: event.target.value
                }))
              }
              InputLabelProps={{ shrink: true }}
            />
          </Box>

          <TextField
            label="Observaciones"
            value={form.observaciones}
            onChange={(event) =>
              setForm((actual) => ({
                ...actual,
                observaciones: event.target.value
              }))
            }
            fullWidth
            multiline
            minRows={2}
            sx={{ mt: 2 }}
          />

          <Divider sx={{ my: 2 }} />

          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: {
                xs: '1fr',
                md: '1fr 130px 120px 160px'
              },
              gap: 2,
              alignItems: 'center'
            }}
          >
            <Autocomplete
              options={productos}
              value={detalleForm.producto}
              inputValue={detalleForm.productoTexto}
              filterOptions={(options) => options}
              getOptionLabel={productoLabel}
              isOptionEqualToValue={(option, value) => option.id === value.id}
              onInputChange={(_, value) => {
                setDetalleForm((actual) => ({
                  ...actual,
                  productoTexto: value
                }));
                if (value?.trim()?.length >= 2) {
                  buscarProductos(value);
                }
              }}
              onChange={(_, value) =>
                setDetalleForm((actual) => ({
                  ...actual,
                  producto: value
                }))
              }
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Producto"
                  placeholder="Codigo o descripcion"
                />
              )}
            />

            <TextField
              label="Cantidad"
              type="number"
              value={detalleForm.cantidadEnviada}
              onChange={(event) =>
                setDetalleForm((actual) => ({
                  ...actual,
                  cantidadEnviada: event.target.value
                }))
              }
            />

            <TextField
              label="Stock origen"
              value={stockDisponibleDetalle}
              InputProps={{ readOnly: true }}
            />

            <Button
              variant="outlined"
              onClick={agregarDetalle}
              sx={{ minHeight: 54 }}
            >
              Agregar producto
            </Button>
          </Box>

          <Paper variant="outlined" sx={{ mt: 2 }}>
            <DataGrid
              rows={detalles}
              columns={[
                {
                  field: 'codigo',
                  headerName: 'Codigo',
                  width: 150,
                  valueGetter: (_, row) => row.producto?.codigo || ''
                },
                {
                  field: 'nombre',
                  headerName: 'Producto',
                  flex: 1,
                  valueGetter: (_, row) => row.producto?.nombre || ''
                },
                {
                  field: 'stockDisponible',
                  headerName: 'Stock origen',
                  width: 120
                },
                {
                  field: 'cantidadEnviada',
                  headerName: 'Cantidad',
                  width: 110
                },
                {
                  field: 'acciones',
                  headerName: '',
                  width: 80,
                  sortable: false,
                  renderCell: (params) => (
                    <IconButton
                      color="error"
                      onClick={() => quitarDetalle(params.row.productoId)}
                    >
                      <DeleteIcon />
                    </IconButton>
                  )
                }
              ]}
              getRowId={(row) => row.productoId}
              autoHeight
              hideFooter
              disableRowSelectionOnClick
            />
          </Paper>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenForm(false)}>
            Cancelar
          </Button>
          <Button variant="contained" onClick={guardarEnvio}>
            Guardar envio
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={openRecepcion}
        onClose={() => setOpenRecepcion(false)}
        fullWidth
        maxWidth="md"
      >
        <DialogTitle>Recibir envio {envioSeleccionado?.numeroEnvio}</DialogTitle>
        <DialogContent>
          {envioSeleccionado?.detalles.map((detalle) => {
            const recepcion = recepcionDetalles.find(
              (item) => item.detalleId === detalle.id
            );

            return (
              <Paper
                key={detalle.id}
                variant="outlined"
                sx={{ p: 2, mb: 2 }}
              >
                <Typography fontWeight={700}>
                  {detalle.producto.codigo} - {detalle.producto.nombre}
                </Typography>
                <Box
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: {
                      xs: '1fr',
                      md: '120px 140px 140px 1fr'
                    },
                    gap: 2,
                    mt: 1
                  }}
                >
                  <TextField
                    label="Enviado"
                    value={detalle.cantidadEnviada}
                    InputProps={{ readOnly: true }}
                  />
                  <TextField
                    label="Recibido"
                    type="number"
                    value={recepcion?.cantidadRecibida || 0}
                    onChange={(event) =>
                      actualizarRecepcionDetalle(
                        detalle.id,
                        'cantidadRecibida',
                        event.target.value
                      )
                    }
                  />
                  <TextField
                    label="Fallado"
                    type="number"
                    value={recepcion?.cantidadFallada || 0}
                    onChange={(event) =>
                      actualizarRecepcionDetalle(
                        detalle.id,
                        'cantidadFallada',
                        event.target.value
                      )
                    }
                  />
                  <TextField
                    label="Observaciones"
                    value={recepcion?.observaciones || ''}
                    onChange={(event) =>
                      actualizarRecepcionDetalle(
                        detalle.id,
                        'observaciones',
                        event.target.value
                      )
                    }
                  />
                </Box>
              </Paper>
            );
          })}

          <TextField
            label="Observaciones de recepcion"
            value={observacionesRecepcion}
            onChange={(event) => setObservacionesRecepcion(event.target.value)}
            fullWidth
            multiline
            minRows={2}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenRecepcion(false)}>
            Cancelar
          </Button>
          <Button variant="contained" onClick={guardarRecepcion}>
            Guardar recepcion
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={openDetalle}
        onClose={() => setOpenDetalle(false)}
        fullWidth
        maxWidth="lg"
      >
        <DialogTitle>Detalle {envioSeleccionado?.numeroEnvio}</DialogTitle>
        <DialogContent>
          <Box sx={{ mb: 2 }}>
            <Typography>
              Origen: {envioSeleccionado?.localOrigen?.nombre} | Destino:{' '}
              {envioSeleccionado?.localDestino?.nombre}
            </Typography>
            <Typography color="text.secondary">
              Estado: {envioSeleccionado?.estado}
            </Typography>
          </Box>

          {envioSeleccionado?.detalles.map((detalle) => {
            const diferencia =
              Number(detalle.cantidadFaltante || 0) +
              Number(detalle.cantidadSobrante || 0) +
              Number(detalle.cantidadFallada || 0);

            return (
              <Paper
                key={detalle.id}
                variant="outlined"
                sx={{ p: 2, mb: 2 }}
              >
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    gap: 2,
                    flexWrap: 'wrap'
                  }}
                >
                  <Box>
                    <Typography fontWeight={700}>
                      {detalle.producto.codigo} - {detalle.producto.nombre}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Enviado {detalle.cantidadEnviada} | Recibido{' '}
                      {detalle.cantidadRecibida} | Faltante{' '}
                      {detalle.cantidadFaltante} | Sobrante{' '}
                      {detalle.cantidadSobrante} | Fallado{' '}
                      {detalle.cantidadFallada}
                    </Typography>
                  </Box>

                  {diferencia > 0 && detalle.estadoDiferencia !== 'AJUSTADA' && (
                    <Button
                      variant="outlined"
                      onClick={() => abrirResolucion(detalle)}
                    >
                      Resolver diferencia
                    </Button>
                  )}
                </Box>

                {detalle.diferencias.length > 0 && (
                  <Box sx={{ mt: 1 }}>
                    {detalle.diferencias.map((diferenciaItem) => (
                      <Typography
                        key={diferenciaItem.id}
                        variant="body2"
                        color="text.secondary"
                      >
                        {diferenciaItem.tipoResolucion} - Cantidad:{' '}
                        {diferenciaItem.cantidad}
                        {diferenciaItem.localResolucion?.nombre
                          ? ` - ${diferenciaItem.localResolucion.nombre}`
                          : ''}
                      </Typography>
                    ))}
                  </Box>
                )}
              </Paper>
            );
          })}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDetalle(false)}>
            Cerrar
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={openResolucion}
        onClose={() => setOpenResolucion(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Resolver diferencia</DialogTitle>
        <DialogContent>
          <FormControl fullWidth sx={{ mt: 1 }}>
            <InputLabel>Resolucion</InputLabel>
            <Select
              label="Resolucion"
              value={resolucion.tipoResolucion}
              onChange={(event) =>
                setResolucion((actual) => ({
                  ...actual,
                  tipoResolucion: event.target.value
                }))
              }
            >
              {tiposResolucion.map((tipo) => (
                <MenuItem key={tipo.value} value={tipo.value}>
                  {tipo.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {resolucion.tipoResolucion === 'ENVIADA_OTRO_LOCAL' && (
            <FormControl fullWidth sx={{ mt: 2 }}>
              <InputLabel>Local que recibio</InputLabel>
              <Select
                label="Local que recibio"
                value={resolucion.localResolucionId}
                onChange={(event) =>
                  setResolucion((actual) => ({
                    ...actual,
                    localResolucionId: event.target.value
                  }))
                }
              >
                {locales.map((local) => (
                  <MenuItem key={local.id} value={local.id}>
                    {local.nombre}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}

          <TextField
            label="Cantidad"
            type="number"
            value={resolucion.cantidad}
            onChange={(event) =>
              setResolucion((actual) => ({
                ...actual,
                cantidad: event.target.value
              }))
            }
            fullWidth
            sx={{ mt: 2 }}
          />

          <TextField
            label="Observacion"
            value={resolucion.observacion}
            onChange={(event) =>
              setResolucion((actual) => ({
                ...actual,
                observacion: event.target.value
              }))
            }
            fullWidth
            multiline
            minRows={2}
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenResolucion(false)}>
            Cancelar
          </Button>
          <Button variant="contained" onClick={guardarResolucion}>
            Guardar resolucion
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

export default EnviosLocalesPage;
