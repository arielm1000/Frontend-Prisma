import {
  useEffect,
  useState
} from 'react';

import {
  Box,
  Paper,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Snackbar,
  Alert,
  Chip,
  IconButton,
  Tooltip
} from '@mui/material';

import {
  DataGrid,
  GridToolbar
} from '@mui/x-data-grid';

import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import HistoryIcon from '@mui/icons-material/History';

import {
  getLocalesRequest,
  createLocalRequest,
  updateLocalRequest,
  deleteLocalRequest,
  getHistoricoLocalRequest
} from '../../services/local.service';

import {
  getEmpresasRequest
} from '../../services/empresa.service';

import {
  getProvinciasRequest,
  getLocalidadesRequest
} from '../../services/geografia.service';

function LocalPage() {
  const [locales, setLocales] = useState([]);

  const [empresas, setEmpresas] = useState([]);
  const [provincias, setProvincias] = useState([]);
  const [localidades, setLocalidades] = useState([]);

  const [open, setOpen] = useState(false);
  const [editando, setEditando] = useState(false);
  const [localId, setLocalId] = useState(null);

  const [openHistorico, setOpenHistorico] = useState(false);
  const [historico, setHistorico] = useState([]);

  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  const [form, setForm] = useState({
    empresaId: '',
    nombre: '',
    direccion: '',
    telefono: '',
    provinciaCodigo: '',
    localidadCodigo: '',
    codigoPostal: '',
    puntoVenta: '',
    habilitado: true
  });

  const cargarLocales = async () => {
    try {
      const data = await getLocalesRequest();
      setLocales(data);
    } catch (error) {
      console.log(error);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({
      ...form,
      [name]:
        name === 'empresaId' || name === 'puntoVenta'
          ? Number(value)
          : value
    });
  };

  const handleProvinciaChange = async (e) => {
    const provinciaCodigo = e.target.value;
    setForm({
      ...form,
      provinciaCodigo,
      localidadCodigo: ''
    });
    try {
      const data = await getLocalidadesRequest(provinciaCodigo);
      setLocalidades(data);
    } catch (error) {
      console.log(error);
    }
  };

  const handleOpen = () => {
    setEditando(false);
    setLocalId(null);
    setForm({
      empresaId: '',
      nombre: '',
      direccion: '',
      telefono: '',
      provinciaCodigo: '',
      localidadCodigo: '',
      codigoPostal: '',
      puntoVenta: '',
      habilitado: true
    });
    setLocalidades([]);
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setEditando(false);
    setLocalId(null);
    setForm({
      empresaId: '',
      nombre: '',
      direccion: '',
      telefono: '',
      provinciaCodigo: '',
      localidadCodigo: '',
      codigoPostal: '',
      puntoVenta: '',
      habilitado: true
    });
    setLocalidades([]);
  };

  const handleEdit = async (local) => {
    setEditando(true);
    setLocalId(local.id);
    setForm({
      empresaId: local.empresaId || local.empresa?.id || '',
      nombre: local.nombre || '',
      direccion: local.direccion || '',
      telefono: local.telefono || '',
      provinciaCodigo: local.provinciaCodigo || local.provincia?.codigo || '',
      localidadCodigo: local.localidadCodigo || local.localidad?.codigo || '',
      codigoPostal: local.codigoPostal || '',
      puntoVenta: local.puntoVenta || '',
      habilitado: local.habilitado
    });
    if (local.provinciaCodigo || local.provincia?.codigo) {
      const data = await getLocalidadesRequest(
        local.provinciaCodigo || local.provincia.codigo
      );
      setLocalidades(data);
    }
    setOpen(true);
  };

  const validarForm = () => {
    if (!form.empresaId) {
      setSnackbar({
        open: true,
        message: 'Debe seleccionar una empresa',
        severity: 'warning'
      });
      return false;
    }
    if (!form.nombre.trim()) {
      setSnackbar({
        open: true,
        message: 'Debe ingresar el nombre del local',
        severity: 'warning'
      });
      return false;
    }
    if (!form.provinciaCodigo) {
      setSnackbar({
        open: true,
        message: 'Debe seleccionar una provincia',
        severity: 'warning'
      });
      return false;
    }
    if (!form.localidadCodigo) {
      setSnackbar({
        open: true,
        message: 'Debe seleccionar una localidad',
        severity: 'warning'
      });
      return false;
    }
    if (!form.puntoVenta) {
      setSnackbar({
        open: true,
        message: 'Debe ingresar el punto de venta',
        severity: 'warning'
      });
      return false;
    }
    return true;
  };

  const handleSave = async () => {
    if (!validarForm()) return;

    try {
      if (editando) {
        await updateLocalRequest(localId, form);

        setSnackbar({
          open: true,
          message: 'Local actualizado correctamente',
          severity: 'success'
        });
      } else {
        await createLocalRequest(form);

        setSnackbar({
          open: true,
          message: 'Local creado correctamente',
          severity: 'success'
        });
      }

      handleClose();
      cargarLocales();

    } catch (error) {
      console.log(error);

      setSnackbar({
        open: true,
        message:
          error.response?.data?.mensaje ||
          'Error guardando local',
        severity: 'error'
      });
    }
  };

  const handleDelete = async (id) => {
    const confirmar = window.confirm(
      '¿Eliminar local?'
    );

    if (!confirmar) return;

    try {
      await deleteLocalRequest(id);

      cargarLocales();

      setSnackbar({
        open: true,
        message: 'Local eliminado correctamente',
        severity: 'success'
      });

    } catch (error) {
      console.log(error);

      setSnackbar({
        open: true,
        message:
          error.response?.data?.mensaje ||
          'Error eliminando local',
        severity: 'error'
      });
    }
  };

  const handleHistorico = async (id) => {
    try {
      const data = await getHistoricoLocalRequest(id);

      setHistorico(data);
      setOpenHistorico(true);

    } catch (error) {
      console.log(error);

      setSnackbar({
        open: true,
        message: 'Error cargando histórico',
        severity: 'error'
      });
    }
  };

  useEffect(() => {
    let activo = true;

    const cargarDatosIniciales = async () => {
      try {
        const [
          localesData,
          empresasData,
          provinciasData
        ] = await Promise.all([
          getLocalesRequest(),
          getEmpresasRequest(),
          getProvinciasRequest()
        ]);

        if (!activo) return;

        setLocales(localesData);
        setEmpresas(empresasData);
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
      headerName: 'Local',
      flex: 1
    },
    {
      field: 'empresa',
      headerName: 'Empresa',
      flex: 1,
      valueGetter: (_, row) =>
        row.empresa?.razonSocial || ''
    },
    {
      field: 'direccion',
      headerName: 'Dirección',
      flex: 1
    },
    {
      field: 'provincia',
      headerName: 'Provincia',
      flex: 1,
      valueGetter: (_, row) =>
        row.provincia?.nombre || ''
    },
    {
      field: 'localidad',
      headerName: 'Localidad',
      flex: 1,
      valueGetter: (_, row) =>
        row.localidad?.nombre || ''
    },
    {
      field: 'puntoVenta',
      headerName: 'PV',
      width: 90
    },
    {
      field: 'habilitado',
      headerName: 'Estado',
      width: 130,
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
              onClick={() => handleEdit(params.row)}
            >
              <EditIcon />
            </IconButton>
          </Tooltip>

          <Tooltip title="Eliminar">
            <IconButton
              color="error"
              onClick={() => handleDelete(params.row.id)}
            >
              <DeleteIcon />
            </IconButton>
          </Tooltip>

          <Tooltip title="Histórico">
            <IconButton
              color="secondary"
              onClick={() => handleHistorico(params.row.id)}
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
      headerName: 'Acción',
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
      width: 200,
      valueGetter: (_, row) =>
        row.usuario?.nombre || ''
    },
    {
      field: 'nombre',
      headerName: 'Local',
      flex: 1
    },
    {
      field: 'puntoVenta',
      headerName: 'PV',
      width: 100
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
        Locales
      </Typography>

      <Button
        variant="contained"
        onClick={handleOpen}
      >
        Nuevo Local
      </Button>
    </Box>

    <Paper
      sx={{
        height: 500,
        width: '100%'
      }}
    >
      <DataGrid
        rows={locales}
        columns={columns}
        getRowId={(row) => row.id}
        pageSizeOptions={[5, 10, 20]}
        initialState={{
          pagination: {
            paginationModel: {
              pageSize: 5
            }
          }
        }}
        showToolbar
        slots={{
          toolbar: GridToolbar
        }}
        slotProps={{
          toolbar: {
          csvOptions: {
          delimiter: ';',
          utf8WithBom: true,
          fileName: 'locales'
        }
    }
  }}
      />
    </Paper>

    <Dialog
      open={open}
      onClose={handleClose}
      fullWidth
      maxWidth="md"
    >
      <DialogTitle>
        {editando ? 'Editar Local' : 'Nuevo Local'}
      </DialogTitle>

      <DialogContent>
        <TextField
          select
          label="Empresa"
          name="empresaId"
          fullWidth
          margin="normal"
          value={form.empresaId}
          onChange={handleChange}
        >
          {empresas.map((empresa) => (
            <MenuItem
              key={empresa.id}
              value={empresa.id}
            >
              {empresa.razonSocial}
            </MenuItem>
          ))}
        </TextField>

        <TextField
          label="Nombre"
          name="nombre"
          fullWidth
          margin="normal"
          value={form.nombre}
          onChange={handleChange}
        />

        <TextField
          label="Dirección"
          name="direccion"
          fullWidth
          margin="normal"
          value={form.direccion}
          onChange={handleChange}
        />

        <TextField
          label="Teléfono"
          name="telefono"
          fullWidth
          margin="normal"
          value={form.telefono}
          onChange={handleChange}
        />

        <TextField
          select
          label="Provincia"
          name="provinciaCodigo"
          fullWidth
          margin="normal"
          value={form.provinciaCodigo}
          onChange={handleProvinciaChange}
        >
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
          fullWidth
          margin="normal"
          value={form.localidadCodigo}
          onChange={handleChange}
          disabled={!form.provinciaCodigo}
        >
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
          label="Código Postal"
          name="codigoPostal"
          fullWidth
          margin="normal"
          value={form.codigoPostal}
          onChange={handleChange}
        />

        <TextField
          label="Punto de Venta"
          name="puntoVenta"
          type="number"
          fullWidth
          margin="normal"
          value={form.puntoVenta}
          onChange={handleChange}
        />
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose}>
          Cancelar
        </Button>

        <Button
          variant="contained"
          onClick={handleSave}
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
        Histórico Local
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

export default LocalPage;
