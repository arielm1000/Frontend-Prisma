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
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import HistoryIcon from '@mui/icons-material/History';
import {
  createMarcaRequest,
  deleteMarcaRequest,
  getHistoricoMarcaRequest,
  getMarcasRequest,
  updateMarcaRequest
} from '../../services/marca.service';

function MarcasPage() {
  const [marcas, setMarcas] = useState([]);
  const [open, setOpen] = useState(false);
  const [editando, setEditando] = useState(false);
  const [marcaId, setMarcaId] = useState(null);
  const [openHistorico, setOpenHistorico] = useState(false);
  const [historico, setHistorico] = useState([]);
  const [form, setForm] = useState({
    nombre: '',
    descripcion: '',
    habilitado: true
  });
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  const cargarMarcas = async () => {
    try {
      const data = await getMarcasRequest();
      setMarcas(data);
    } catch (error) {
      console.log(error);
    }
  };

  const handleOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setEditando(false);
    setMarcaId(null);
    setForm({
      nombre: '',
      descripcion: '',
      habilitado: true
    });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm({
      ...form,
      [name]: value
    });
  };

  const handleToggle = (e) => {
    setForm({
      ...form,
      habilitado: e.target.checked
    });
  };

  const handleSave = async () => {
    if (!form.nombre.trim()) {
      setSnackbar({
        open: true,
        message: 'Debe ingresar el nombre de la marca',
        severity: 'warning'
      });
      return;
    }

    try {
      if (editando) {
        await updateMarcaRequest(marcaId, form);
        setSnackbar({
          open: true,
          message: 'Marca actualizada correctamente',
          severity: 'success'
        });
      } else {
        await createMarcaRequest(form);
        setSnackbar({
          open: true,
          message: 'Marca creada correctamente',
          severity: 'success'
        });
      }

      handleClose();
      cargarMarcas();
    } catch (error) {
      console.log(error);
      setSnackbar({
        open: true,
        message:
          error.response?.data?.mensaje ||
          'Error guardando marca',
        severity: 'error'
      });
    }
  };

  const handleEdit = (marca) => {
    setEditando(true);
    setMarcaId(marca.id);
    setForm({
      nombre: marca.nombre || '',
      descripcion: marca.descripcion || '',
      habilitado: marca.habilitado
    });
    setOpen(true);
  };

  const handleDelete = async (id) => {
    const confirmar = window.confirm(
      'Eliminar marca?'
    );

    if (!confirmar) return;

    try {
      await deleteMarcaRequest(id);
      cargarMarcas();
      setSnackbar({
        open: true,
        message: 'Marca eliminada',
        severity: 'success'
      });
    } catch (error) {
      console.log(error);
      setSnackbar({
        open: true,
        message:
          error.response?.data?.mensaje ||
          'Error eliminando marca',
        severity: 'error'
      });
    }
  };

  const handleHistorico = async (id) => {
    try {
      const data = await getHistoricoMarcaRequest(id);
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
        const data = await getMarcasRequest();

        if (!activo) return;

        setMarcas(data);
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
      headerName: 'Nombre',
      flex: 1
    },
    {
      field: 'descripcion',
      headerName: 'Descripcion',
      flex: 2
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

          <Tooltip title="Historial">
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
      width: 200,
      valueGetter: (_, row) =>
        row.usuario?.nombre || ''
    },
    {
      field: 'nombre',
      headerName: 'Nombre',
      flex: 1
    },
    {
      field: 'descripcion',
      headerName: 'Descripcion',
      flex: 1
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
          Marcas
        </Typography>

        <Button
          variant="contained"
          onClick={handleOpen}
        >
          Nueva Marca
        </Button>
      </Box>

      <Paper
        sx={{
          height: 500,
          width: '100%'
        }}
      >
        <DataGrid
          rows={marcas}
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
                fileName: 'marcas'
              }
            }
          }}
        />
      </Paper>

      <Dialog
        open={open}
        onClose={handleClose}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>
          {editando ? 'Editar Marca' : 'Nueva Marca'}
        </DialogTitle>

        <DialogContent>
          <TextField
            label="Nombre"
            name="nombre"
            fullWidth
            margin="normal"
            value={form.nombre}
            onChange={handleChange}
          />

          <TextField
            label="Descripcion"
            name="descripcion"
            fullWidth
            margin="normal"
            value={form.descripcion}
            onChange={handleChange}
          />

          <FormControlLabel
            control={
              <Switch
                checked={form.habilitado}
                onChange={handleToggle}
              />
            }
            label="Habilitado"
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
          Historial Marca
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

export default MarcasPage;
