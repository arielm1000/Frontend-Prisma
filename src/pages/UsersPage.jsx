import {
  useEffect,
  useState
} from 'react';

import {
  Paper,
  Typography,
  Box,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Snackbar,
  Alert  
} from '@mui/material';

import {
  DataGrid,
  GridToolbar,
  GridToolbarExport
} from '@mui/x-data-grid';

import {   getUsersRequest,
           createUserRequest,
           updateUserRequest,
           deleteUserRequest} from '../services/user.service';

import { useAuth } from '../context/AuthContext';

function UsersPage() {
  const { usuario } = useAuth();
  const [usuarios, setUsuarios] = useState([]);
  const [open, setOpen] = useState(false);
  const [editando, setEditando] = useState(false);
  const [usuarioId, setUsuarioId] = useState(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });
  const [form, setForm] = useState({
    nombre: '',
    email: '',
    password: '',
    rol: 'usuario',
    habilitado: true
 });
  // =========================
  // CARGAR USUARIOS
  // =========================

  const cargarUsuarios = async () => {
    try {
      const data = await getUsersRequest();
      setUsuarios(data);
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
    setUsuarioId(null);
  };
  const handleChange = (e) => {
     setForm({
    ...form,
    [e.target.name]: e.target.value
     });
  };
  
  const handleSave = async () => {
    try {
        // =========================
        // EDITAR
        // =========================
        if (editando) {
        await updateUserRequest(
            usuarioId,
            form
        );
        }
        // =========================
        // CREAR
        // =========================
        else {
        await createUserRequest(form);
        }
        // cerrar
        handleClose();
        // refrescar
        cargarUsuarios();
        // limpiar
        setForm({
        nombre: '',
        email: '',
        password: '',
        rol: 'usuario',
        habilitado: true
        });
    } catch (error) {
        console.log(error);
    }
  };

  const handleEdit = (usuario) => {
    setEditando(true);
    setUsuarioId(usuario.id);
    setForm({
        nombre: usuario.nombre,
        email: usuario.email,
        password: '',
        rol: usuario.rol,
        habilitado: usuario.habilitado
    });
    setOpen(true);
  };

  const handleDelete = async (id) => {
    const confirmar = window.confirm(
        '¿Eliminar usuario?'
    );
    if (!confirmar) return;
    try {
        await deleteUserRequest(id);
        // refrescar
        cargarUsuarios();
        // snackbar
        setSnackbar({
        open: true,
        message: 'Usuario eliminado',
        severity: 'success'
        });
    } catch (error) {
        console.log(error);
        setSnackbar({
        open: true,
        message: 'Error eliminando usuario',
        severity: 'error'
        });
    }
  };

  useEffect(() => {
    cargarUsuarios();
  }, []);
  // =========================
  // COLUMNAS
  // =========================
  const columns = [
    {
      field: 'nombre',
      headerName: 'Nombre',
      flex: 1
    },
    {
      field: 'email',
      headerName: 'Email',
      flex: 1
    },
    {
      field: 'rol',
      headerName: 'Rol',
      flex: 1
    },
    {
      field: 'habilitado',
      headerName: 'Estado',
      flex: 1,
      renderCell: (params) => (
        <Chip
          label={
            params.value
              ? 'Activo'
              : 'Inactivo'
          }
          color={
            params.value
              ? 'success'
              : 'error'
          }
        />
      )
    },
    {
      field: 'acciones',
      headerName: 'Acciones',
      flex: 1,
      renderCell: (params) => {
        if (usuario?.rol !== 'admin') {
          return null;
        }
        return (
          <Box display="flex" gap={1}>
            <Button
              variant="contained"
              size="small"
              onClick={() => handleEdit(params.row)}
            >
              Editar
            </Button>
            <Button
              variant="contained"
              color="error"
              size="small"
              onClick={() => handleDelete(params.row.id)}
            >
              Eliminar
            </Button>
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
            justifyContent: 'flex-start',
            alignItems: 'center',
            flexWrap: 'nowrap',
            width: '100%',
            mb: 3
          }}
        >
        <Typography
          variant="h4"
          sx={{
            flex: '0 1 auto',
            minWidth: 0,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            mr: 2
          }}
        >
            Usuarios
        </Typography>
          {
            usuario?.rol === 'admin' && (
              <Button
                variant="contained"
                sx={{ flex: '0 0 auto', ml: 20 }}
                onClick={handleOpen}
              >
                Nuevo Usuario
              </Button>
            )
          }
        </Box>
      <Paper
        sx={{
          height: 500,
          width: '100%'
        }}
      >
        <DataGrid
          rows={usuarios}
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
        />
      </Paper>

      <Dialog
            open={open}
            onClose={handleClose}
            fullWidth
            maxWidth="sm"
            >
            <DialogTitle>
                {
                    editando
                    ? 'Editar Usuario'
                    : 'Nuevo Usuario'
                }
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
                label="Email"
                name="email"
                fullWidth
                margin="normal"
                value={form.email}
                onChange={handleChange}
                />
                <TextField
                label="Password"
                name="password"
                type="password"
                fullWidth
                margin="normal"
                value={form.password}
                onChange={handleChange}
                />
                <TextField
                select
                label="Rol"
                name="rol"
                fullWidth
                margin="normal"
                value={form.rol}
                onChange={handleChange}
                >
                <MenuItem value="admin">
                    Admin
                </MenuItem>
                <MenuItem value="usuario">
                    Usuario
                </MenuItem>
                </TextField>
            </DialogContent>
            <DialogActions>
                <Button onClick={handleClose}>
                Cancelar
                </Button>
                <Button
                variant="contained"
                onClick={handleSave}
                >
                    {
                    editando
                        ? 'Actualizar'
                        : 'Guardar'
                    }
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

export default UsersPage;