import { useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  IconButton,
  MenuItem,
  Paper,
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
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import HistoryIcon from '@mui/icons-material/History';
import {
  createTransporteRequest,
  deleteTransporteRequest,
  getHistoricoTransporteRequest,
  getTransportesRequest,
  updateTransporteRequest
} from '../../services/transporte.service';
import {
  getLocalidadesRequest,
  getProvinciasRequest
} from '../../services/geografia.service';
import {
  formatearCuit,
  limpiarCuit,
  validarCuit
} from '../../utils/validarCuit';
import { validarEmail } from '../../utils/validarEmail';

const formInicial = {
  nombre: '',
  cuit: '',
  telefono: '',
  email: '',
  calle: '',
  numero: '',
  piso: '',
  departamento: '',
  provinciaCodigo: '',
  localidadCodigo: '',
  codigoPostal: '',
  tarifaBase: 0,
  observaciones: '',
  habilitado: true
};

const formatoMoneda = (valor) =>
  Number(valor || 0).toLocaleString('es-AR', {
    style: 'currency',
    currency: 'ARS'
  });

function TransportesPage() {
  const [transportes, setTransportes] = useState([]);
  const [provincias, setProvincias] = useState([]);
  const [localidades, setLocalidades] = useState([]);
  const [open, setOpen] = useState(false);
  const [editando, setEditando] = useState(false);
  const [transporteId, setTransporteId] = useState(null);
  const [form, setForm] = useState(formInicial);
  const [openHistorico, setOpenHistorico] = useState(false);
  const [historico, setHistorico] = useState([]);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  const cargarTransportes = async () => {
    try {
      const data = await getTransportesRequest();
      setTransportes(data);
    } catch (error) {
      console.log(error);
    }
  };

  const cerrar = () => {
    setOpen(false);
    setEditando(false);
    setTransporteId(null);
    setLocalidades([]);
    setForm(formInicial);
  };

  const nuevo = () => {
    setEditando(false);
    setTransporteId(null);
    setLocalidades([]);
    setForm(formInicial);
    setOpen(true);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm({
      ...form,
      [name]: name === 'cuit' ? limpiarCuit(value) : value
    });
  };

  const handleProvinciaChange = async (e) => {
    const provinciaCodigo = e.target.value;

    setForm({
      ...form,
      provinciaCodigo,
      localidadCodigo: ''
    });

    if (!provinciaCodigo) {
      setLocalidades([]);
      return;
    }

    try {
      const data = await getLocalidadesRequest(provinciaCodigo);
      setLocalidades(data);
    } catch (error) {
      console.log(error);
    }
  };

  const guardar = async () => {
    if (!form.nombre.trim()) {
      setSnackbar({
        open: true,
        message: 'Debe ingresar el nombre del transporte',
        severity: 'warning'
      });
      return;
    }

    if (form.cuit && !validarCuit(form.cuit)) {
      setSnackbar({
        open: true,
        message: 'CUIT invalido',
        severity: 'warning'
      });
      return;
    }

    if (!validarEmail(form.email)) {
      setSnackbar({
        open: true,
        message: 'Email invalido',
        severity: 'warning'
      });
      return;
    }

    try {
      if (editando) {
        await updateTransporteRequest(transporteId, form);
        setSnackbar({
          open: true,
          message: 'Transporte actualizado correctamente',
          severity: 'success'
        });
      } else {
        await createTransporteRequest(form);
        setSnackbar({
          open: true,
          message: 'Transporte creado correctamente',
          severity: 'success'
        });
      }

      cerrar();
      cargarTransportes();
    } catch (error) {
      console.log(error);
      setSnackbar({
        open: true,
        message:
          error.response?.data?.mensaje ||
          'Error guardando transporte',
        severity: 'error'
      });
    }
  };

  const editar = async (transporte) => {
    setEditando(true);
    setTransporteId(transporte.id);
    setForm({
      nombre: transporte.nombre || '',
      cuit: transporte.cuit || '',
      telefono: transporte.telefono || '',
      email: transporte.email || '',
      calle: transporte.calle || '',
      numero: transporte.numero || '',
      piso: transporte.piso || '',
      departamento: transporte.departamento || '',
      provinciaCodigo: transporte.provinciaCodigo || '',
      localidadCodigo: transporte.localidadCodigo || '',
      codigoPostal: transporte.codigoPostal || '',
      tarifaBase: Number(transporte.tarifaBase || 0),
      observaciones: transporte.observaciones || '',
      habilitado: transporte.habilitado
    });

    if (transporte.provinciaCodigo) {
      const data = await getLocalidadesRequest(
        transporte.provinciaCodigo
      );
      setLocalidades(data);
    } else {
      setLocalidades([]);
    }

    setOpen(true);
  };

  const eliminar = async (id) => {
    const confirmar = window.confirm(
      'Eliminar transporte?'
    );

    if (!confirmar) return;

    try {
      await deleteTransporteRequest(id);
      cargarTransportes();
      setSnackbar({
        open: true,
        message: 'Transporte eliminado',
        severity: 'success'
      });
    } catch (error) {
      console.log(error);
      setSnackbar({
        open: true,
        message:
          error.response?.data?.mensaje ||
          'Error eliminando transporte',
        severity: 'error'
      });
    }
  };

  const verHistorico = async (id) => {
    try {
      const data = await getHistoricoTransporteRequest(id);
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

    const cargarDatosIniciales = async () => {
      try {
        const [transportesData, provinciasData] =
          await Promise.all([
            getTransportesRequest(),
            getProvinciasRequest()
          ]);

        if (!activo) return;

        setTransportes(transportesData);
        setProvincias(provinciasData);
      } catch (error) {
        console.log(error);
      }
    };

    cargarDatosIniciales();

    return () => {
      activo = false;
    };
  }, []);

  const columns = [
    {
      field: 'nombre',
      headerName: 'Transporte',
      flex: 1,
      minWidth: 180
    },
    {
      field: 'cuit',
      headerName: 'CUIT',
      width: 140,
      valueGetter: (_, row) => formatearCuit(row.cuit)
    },
    {
      field: 'telefono',
      headerName: 'Telefono',
      width: 150
    },
    {
      field: 'localidad',
      headerName: 'Localidad',
      width: 170,
      valueGetter: (_, row) =>
        row.localidad?.nombre || ''
    },
    {
      field: 'tarifaBase',
      headerName: 'Tarifa base',
      width: 140,
      valueGetter: (_, row) => formatoMoneda(row.tarifaBase)
    },
    {
      field: 'habilitado',
      headerName: 'Estado',
      width: 120,
      renderCell: (params) => (
        <Chip
          label={params.value ? 'Activo' : 'Inactivo'}
          color={params.value ? 'success' : 'error'}
          size="small"
        />
      )
    },
    {
      field: 'acciones',
      headerName: 'Acciones',
      width: 160,
      sortable: false,
      filterable: false,
      renderCell: (params) => (
        <Box display="flex" gap={1}>
          <Tooltip title="Editar">
            <IconButton
              color="primary"
              onClick={() => editar(params.row)}
            >
              <EditIcon />
            </IconButton>
          </Tooltip>

          <Tooltip title="Eliminar">
            <IconButton
              color="error"
              onClick={() => eliminar(params.row.id)}
            >
              <DeleteIcon />
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
      width: 140,
      renderCell: (params) => {
        let color = 'default';

        if (params.value === 'CREATE') color = 'success';
        if (params.value === 'UPDATE') color = 'warning';
        if (params.value === 'DELETE') color = 'error';

        return (
          <Chip
            label={params.value}
            color={color}
            size="small"
          />
        );
      }
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
      field: 'nombre',
      headerName: 'Transporte',
      flex: 1
    },
    {
      field: 'tarifaBase',
      headerName: 'Tarifa base',
      width: 140,
      valueGetter: (_, row) => formatoMoneda(row.tarifaBase)
    },
    {
      field: 'habilitado',
      headerName: 'Estado',
      width: 120,
      renderCell: (params) => (
        <Chip
          label={params.value ? 'Activo' : 'Inactivo'}
          color={params.value ? 'success' : 'error'}
          size="small"
        />
      )
    }
  ];

  return (
    <Box>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 3
        }}
      >
        <Typography variant="h4">
          Transportes
        </Typography>

        <Button
          variant="contained"
          onClick={nuevo}
        >
          Nuevo Transporte
        </Button>
      </Box>

      <Paper sx={{ height: 520, width: '100%' }}>
        <DataGrid
          rows={transportes}
          columns={columns}
          getRowId={(row) => row.id}
          pageSizeOptions={[5, 10, 20]}
          showToolbar
          initialState={{
            pagination: {
              paginationModel: {
                pageSize: 5
              }
            }
          }}
          slots={{
            toolbar: GridToolbar
          }}
          slotProps={{
            toolbar: {
              csvOptions: {
                delimiter: ';',
                utf8WithBom: true,
                fileName: 'transportes'
              }
            }
          }}
        />
      </Paper>

      <Dialog
        open={open}
        onClose={cerrar}
        fullWidth
        maxWidth="md"
      >
        <DialogTitle>
          {editando ? 'Editar Transporte' : 'Nuevo Transporte'}
        </DialogTitle>

        <DialogContent>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: {
                xs: '1fr',
                md: 'repeat(2, 1fr)'
              },
              gap: 2,
              mt: 1
            }}
          >
            <TextField
              label="Nombre"
              name="nombre"
              value={form.nombre}
              onChange={handleChange}
            />
            <TextField
              label="CUIT"
              name="cuit"
              value={formatearCuit(form.cuit)}
              onChange={handleChange}
              inputProps={{
                maxLength: 13,
                inputMode: 'numeric'
              }}
            />
            <TextField
              label="Telefono"
              name="telefono"
              value={form.telefono}
              onChange={handleChange}
            />
            <TextField
              label="Email"
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
            />
            <TextField
              label="Calle"
              name="calle"
              value={form.calle}
              onChange={handleChange}
            />
            <TextField
              label="Numero"
              name="numero"
              value={form.numero}
              onChange={handleChange}
            />
            <TextField
              label="Piso"
              name="piso"
              value={form.piso}
              onChange={handleChange}
            />
            <TextField
              label="Departamento"
              name="departamento"
              value={form.departamento}
              onChange={handleChange}
            />
            <TextField
              select
              label="Provincia"
              name="provinciaCodigo"
              value={form.provinciaCodigo}
              onChange={handleProvinciaChange}
            >
              <MenuItem value="">
                Sin provincia
              </MenuItem>
              {provincias.map((provincia) => (
                <MenuItem
                  key={provincia.codigo}
                  value={provincia.codigo}
                >
                  {provincia.nombre}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              select
              label="Localidad"
              name="localidadCodigo"
              value={form.localidadCodigo}
              onChange={handleChange}
              disabled={!form.provinciaCodigo}
            >
              <MenuItem value="">
                Sin localidad
              </MenuItem>
              {localidades.map((localidad) => (
                <MenuItem
                  key={localidad.codigo}
                  value={localidad.codigo}
                >
                  {localidad.nombre}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              label="Codigo postal"
              name="codigoPostal"
              value={form.codigoPostal}
              onChange={handleChange}
            />
            <TextField
              label="Tarifa base"
              name="tarifaBase"
              type="number"
              value={form.tarifaBase}
              onChange={handleChange}
            />
          </Box>

          <TextField
            label="Observaciones"
            name="observaciones"
            fullWidth
            multiline
            minRows={3}
            margin="normal"
            value={form.observaciones}
            onChange={handleChange}
          />

          <FormControlLabel
            control={
              <Switch
                checked={form.habilitado}
                onChange={(e) =>
                  setForm({
                    ...form,
                    habilitado: e.target.checked
                  })
                }
              />
            }
            label="Habilitado"
          />
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
        open={openHistorico}
        onClose={() => setOpenHistorico(false)}
        fullWidth
        maxWidth="md"
      >
        <DialogTitle>
          Historial Transporte
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
          <Button
            onClick={() => setOpenHistorico(false)}
          >
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

export default TransportesPage;
