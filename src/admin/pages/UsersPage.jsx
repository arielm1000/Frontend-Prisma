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
  Alert,
  FormControl,
  InputLabel,
  Select
} from '@mui/material';

import {
  DataGrid,
  GridToolbar
} from '@mui/x-data-grid';

import {   getUsersRequest,
           createUserRequest,
           updateUserRequest,
           deleteUserRequest,
           getHistoricoUserRequest} from '../../services/user.service';

import { useAuth } from '../../hooks/useAuth';
import { getRoles } from '../../services/role.service';
import { getLocalesRequest } from '../../services/local.service';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import HistoryIcon from '@mui/icons-material/History';

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
    roleId: '',
    localId: '',
    habilitado: true
    });
  const [roles, setRoles] = useState([]);
  const [locales, setLocales] = useState([]);
  const [openHistorico, setOpenHistorico] = useState(false);
  const [historico, setHistorico] = useState([]);
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
    setForm({
      nombre: '',
      email: '',
      password: '',
      roleId: '',
      localId: '',
      habilitado: true
    });    
    };
  // const handleChange = (e) => {
  //    setForm({
  //   ...form,
  //   [e.target.name]: e.target.value
  //    });
  // };
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({
      ...form,
      [name]:
        name === 'roleId' || name === 'localId'
          ? value === ''
            ? ''
            : Number(value)
          : value
    });
  };
  const handleSave = async () => {
    try {
        // =========================
        // EDITAR
        // =========================
        if (!form.roleId) {
          setSnackbar({
            open: true,
            message: 'Debe seleccionar un rol',
            severity: 'warning'
          });
          return;
        }

        const rolSeleccionado = roles.find(
          (role) => role.id === Number(form.roleId)
        );

        if (
          rolSeleccionado?.nombre !== 'admin' &&
          !form.localId
        ) {
          setSnackbar({
            open: true,
            message: 'Debe seleccionar un local',
            severity: 'warning'
          });
          return;
        }

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
        //rol: 'usuario',
        roleId: '',
        localId: '',
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
        roleId: usuario.role?.id || '',
        localId: usuario.local?.id || usuario.localId || '',
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
  
  const handleHistorico = async (id) => {
    try {
      const data = await getHistoricoUserRequest(id);

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
        const [usuariosData, rolesData, localesData] =
          await Promise.all([
            getUsersRequest(),
            getRoles(),
            getLocalesRequest()
          ]);

        if (!activo) return;

        setUsuarios(usuariosData);
        setRoles(rolesData);
        setLocales(localesData);
      } catch (error) {
        console.log(error);
      }
    };

    cargarDatosIniciales();

    return () => {
      activo = false;
    };
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
/*     {
      field: 'rol',
      headerName: 'Rol',
      flex: 1
    }, */
    {
      field: 'role',
      headerName: 'Rol',
      width: 150,
      valueGetter: (_, row) => row.role?.nombre
    },
    {
      field: 'local',
      headerName: 'Local',
      flex: 1,
      valueGetter: (_, row) =>
        row.local?.nombre || 'Sin local'
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
      width: 170,
      sortable: false,
      filterable: false,
      renderCell: (params) => {
        if (usuario?.rol !== 'admin') {
          return null;
        }

        return (
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
        );
      }
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
      headerName: 'Realizado por',
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
      field: 'email',
      headerName: 'Email',
      flex: 1
    },
    {
      field: 'roleNombre',
      headerName: 'Rol',
      width: 140,
      valueGetter: (_, row) =>
        row.roleNombre || ''
    },
    {
      field: 'localNombre',
      headerName: 'Local',
      width: 160,
      valueGetter: (_, row) =>
        row.localNombre || 'Sin local'
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
            slotProps={{
              toolbar: {
              csvOptions: {
                delimiter: ';',
                utf8WithBom: true,
                fileName: 'usuarios'
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
{/*                 <TextField
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
                </TextField> */}
                <FormControl fullWidth margin="normal">

                  <InputLabel>
                    Rol
                  </InputLabel>

                  <Select
                    name="roleId"
                    value={form.roleId}
                    label="Rol"
                    onChange={handleChange}
                  >
                    {roles.map((role) => (
                      <MenuItem
                        key={role.id}
                        value={role.id}
                      >
                        {role.nombre}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl> 
                <FormControl fullWidth margin="normal">
                  <InputLabel>
                    Local
                  </InputLabel>

                  <Select
                    name="localId"
                    value={form.localId}
                    label="Local"
                    onChange={handleChange}
                  >
                    <MenuItem value="">
                      Sin local
                    </MenuItem>

                    {locales.map((local) => (
                      <MenuItem
                        key={local.id}
                        value={local.id}
                      >
                        {local.nombre}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>                               
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
  
      <Dialog
        open={openHistorico}
        onClose={() => setOpenHistorico(false)}
        fullWidth
        maxWidth="lg"
      >
        <DialogTitle>
          Historial Usuario
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

export default UsersPage;
