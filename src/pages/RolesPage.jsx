import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getRoles,
         createRole,
         updateRole,
         deleteRole
        } from '../services/role.service';
import { useEffect, useState } from 'react';
import { Paper, 
         Box, 
         Button, 
         Typography, 
         Dialog, 
         DialogTitle,
         DialogContent,
         DialogActions,
         TextField,
         Snackbar,
         Alert
        } from '@mui/material';
import { DataGrid, GridToolbar } from '@mui/x-data-grid';

function RolesPage() {
  const { usuario } = useAuth();
  const [roles, setRoles] =  useState([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    nombre: '',
    descripcion: ''
  });
  const [editando, setEditando] = useState(false);
  const [roleId, setRoleId] = useState(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  if (usuario?.rol !== 'admin') {
    return <Navigate to="/" />;
  }

  const cargarRoles =
    async () => {
        try {
        const data = await getRoles();
        setRoles(data);
    } catch (error) {
      console.log(error);
    }
  };

  const handleSave = async () => {
    try {
        if (editando) {
        await updateRole(roleId, form);
        } else {
        await createRole(form);
        }
        handleClose();
        cargarRoles();
    } catch (error) {
        console.log(error);
    }    
  };

  const handleClose = () => {
      setOpen(false);
      setEditando(false);
      setRoleId(null);
      setForm({
        nombre: '',
        descripcion: ''
      });
    };

  const handleChange = (e) => {
      setForm({
        ...form,
        [e.target.name]:
        e.target.value
      });
    };    

  const handleEdit = (role) => {
      setEditando(true);
      setRoleId(role.id);
      setForm({
        nombre: role.nombre,
        descripcion:
        role.descripcion || ''
      });
      setOpen(true);
    };

  const handleDelete = async (id) => {
    const confirmar =
        window.confirm(
        '¿Eliminar rol?'
        );
    if (!confirmar) return;
    try {
        await deleteRole(id);
        cargarRoles();
        setSnackbar({
            open: true,
            message: 'Rol eliminado',
            severity: 'success'
        });
    } catch (error) {
        console.log(error);
        setSnackbar({
        open: true,
        message: error.response?.data?.mensaje || 'Error eliminando rol',
        severity: 'error'
        });
    }
  };    

  useEffect(() => {
    cargarRoles();
  }, []);

  const columns = [
    {
        field: 'id',
        headerName: 'ID',
        width: 80
    },
    {
        field: 'nombre',
        headerName: 'Nombre',
        flex: 1
    },
    {
        field: 'descripcion',
        headerName: 'Descripción',
        flex: 2
    },
    {
        field: 'acciones',
        headerName: 'Acciones',
        width: 250,
        renderCell: (params) => (
        <Box display="flex" gap={1}>
            <Button
            variant="contained"
            size="small"
            onClick={() =>
                handleEdit(params.row)
            }
            >
            Editar
            </Button>
            <Button
            variant="contained"
            color="error"
            size="small"
            onClick={() =>
                handleDelete(params.row.id)
            }
            >
            Eliminar
            </Button>
        </Box>
        )
    }
    ];

  return (
    <Paper
        sx={{
            height: 500,
            width: '100%'
        }}
        >
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
        <Typography variant="h4"
                  variant="h4"
          sx={{
            flex: '0 1 auto',
            minWidth: 0,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            mr: 2
          }}>
            Roles
        </Typography>
        <Button
            variant="contained"
            sx={{ flex: '0 0 auto', ml: 20 }}
            onClick={() => setOpen(true)}
        >
            Nuevo Rol
        </Button>
        </Box>

        <DataGrid
            rows={roles}
            columns={columns}
            getRowId={(row) => row.id}
            pageSizeOptions={[5,10,20]}
            showToolbar
            initialState={{
              pagination: {
                paginationModel: {
                pageSize: 5
              }}
            }}            
            slots={{
            toolbar: GridToolbar
            }}
        />
        <Dialog
        open={open}
        onClose={handleClose}
        fullWidth
        maxWidth="sm"
        >
        <DialogTitle>
            {
                editando
                ? 'Editar Rol'
                : 'Nuevo Rol'
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
            label="Descripción"
            name="descripcion"
            fullWidth
            margin="normal"
            value={form.descripcion}
            onChange={handleChange}
            />
        </DialogContent>
        <DialogActions>
            <Button
            onClick={handleClose}
            >
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
    </Paper>
  );
}

export default RolesPage;