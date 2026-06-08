import {
  useEffect,
  useState
} from 'react';

import {
  getEmpresasRequest,
  createEmpresaRequest,
  updateEmpresaRequest,
  deleteEmpresaRequest,
  getHistoricoEmpresaRequest
} from '../../services/empresa.service';

import {
  Paper,
  Typography,
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Snackbar,
  Alert,
  Tooltip
} from '@mui/material';

import {
  DataGrid,
  GridToolbar
} from '@mui/x-data-grid';
import { Chip } from '@mui/material';
import { getTiposFiscalesRequest } from '../../services/tipoFiscal.service';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import HistoryIcon from '@mui/icons-material/History';
import IconButton from '@mui/material/IconButton';
import { validarCuit } from '../../utils/validarCuit';

function EmpresasPage() {
  const [empresas, setEmpresas] =  useState([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    razonSocial: '',
    nombreFantasia: '',
    cuit: '',
    ingresosBrutos: '',
    tipoFiscalId: '',
    habilitado: true
  });
  const [tiposFiscales, setTiposFiscales] = useState([]);
  const [editando, setEditando] = useState(false);
  const [empresaId, setEmpresaId] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success'});
  const [openHistorico, setOpenHistorico] =  useState(false);
  const [historico, setHistorico] =  useState([]);

  const cargarEmpresas = async () => {
      try {
        const data = await getEmpresasRequest();
        setEmpresas(data);
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
    setEmpresaId(null);
    setForm({
        razonSocial: '',
        nombreFantasia: '',
        cuit: '',
        ingresosBrutos: '',
        tipoFiscalId: '',
        habilitado: true
    });
  };

/*   const handleChange = (e) => {
      setForm({...form, [e.target.name] : e.target.name === 'tipoFiscalId' ? Number(e.target.value) : e.target.value }); 
    }; */
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({
        ...form,
        [name]:
        name === 'tipoFiscalId'
            ? Number(value)
            : name === 'cuit'
            ? value
                .replace(/\D/g, '')
                .slice(0, 11)
            : value
    });
  };

  const handleSave = async () => {
    try {
      if (!form.razonSocial.trim()) {
        return alert('Ingrese razón social');
      }
      if (!form.tipoFiscalId) {
        return alert('Seleccione tipo fiscal');
      }
/*       if (form.cuit && !validarCuit(form.cuit)) {
        return alert('CUIT inválido');
      }
 */   if (!validarCuit(form.cuit)) {
        setSnackbar({
            open: true,
            message: 'CUIT inválido',
            severity: 'error'
        });
        return;
      }
      if (editando) {
        await updateEmpresaRequest( empresaId, form );
        setSnackbar({
            open: true,
            message: 'Empresa actualizada correctamente',
            severity: 'success'
        });
      }
      else {
        await createEmpresaRequest( form );
        setSnackbar({
            open: true,
            message: 'Empresa creada correctamente',
            severity: 'success'
        });
      }
      handleClose();
      cargarEmpresas();
    }
    catch (error) {
      console.log(error);
      setSnackbar({
        open: true,
        message: error.response?.data?.mensaje || 'Error guardando empresa', 
        severity: 'error'});
    }
  };

  const handleEdit = ( empresa ) => {
    setEditando(true);
    setEmpresaId( empresa.id );
    setForm({
        razonSocial: empresa.razonSocial || '',
        nombreFantasia: empresa.nombreFantasia || '',
        cuit: empresa.cuit || '',
        ingresosBrutos: empresa.ingresosBrutos || '',
        tipoFiscalId: empresa.tipoFiscalId || '',
        habilitado: empresa.habilitado
    });
    setOpen(true);
  };

  const handleDelete = async (id) => {
    const confirmar =
        window.confirm(
        '¿Eliminar empresa?'
        );
    if (!confirmar) return;

    try {
        await deleteEmpresaRequest(id);
        cargarEmpresas();
        setSnackbar({
        open: true,
        message:
            'Empresa eliminada',
        severity: 'success'
        });
    } catch (error) {
        console.log(error);
        setSnackbar({
        open: true,
        message:
            'Error eliminando empresa',
        severity: 'error'
        });
    }
  };

  const handleHistorico =
    async (empresaId) => {
        try {
        const data =
            await getHistoricoEmpresaRequest(
            empresaId
            );
        setHistorico(data);
        setOpenHistorico(true);
        } catch (error) {
        console.log(error);
        setSnackbar({
            open: true,
            message:
            'Error cargando historial',
            severity: 'error'
        });
        }
  };

  const formatearCuit = (valor) => {
    const numeros =
        valor.replace(/\D/g, '');
    if (numeros.length <= 2) {
        return numeros;
    }
    if (numeros.length <= 10) {
        return (
        numeros.slice(0, 2) +
        '-' +
        numeros.slice(2)
        );
    }
    return (
        numeros.slice(0, 2) +
        '-' +
        numeros.slice(2, 10) +
        '-' +
        numeros.slice(10, 11)
    );
  };

  useEffect(() => {
    let activo = true;

    const cargarDatosIniciales = async () => {
      try {
        const [empresasData, tiposData] =
          await Promise.all([
            getEmpresasRequest(),
            getTiposFiscalesRequest()
          ]);

        if (!activo) return;

        setEmpresas(empresasData);
        setTiposFiscales(tiposData);
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
        field: 'razonSocial',
        headerName: 'Razón Social',
        flex: 1
    },
    {
        field: 'nombreFantasia',
        headerName: 'Nombre Fantasía',
        flex: 1
    },
    {
        field: 'cuit',
        headerName: 'CUIT',
        flex: 1,
        valueGetter: (_, row) => formatearCuit(row.cuit)
    },
    {
        field: 'tipoFiscal',
        headerName: 'Tipo Fiscal',
        flex: 1,
        valueGetter: (_, row) =>
        row.tipoFiscal?.nombre || ''
    },
    {
    field: 'habilitado',
    headerName: 'Estado',
    width: 100,
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
        size="small"
        />
    )
    },
    {
    field: 'acciones',
    headerName: 'Acciones',
    width: 150,
    renderCell: ( params ) => (
        <Box>
        <Tooltip title="Editar">
        <IconButton
            color="primary"
            onClick={() =>
            handleEdit(params.row)
            }
        >
            <EditIcon />
        </IconButton>
        </Tooltip>
        <Tooltip title="Eliminar">
        <IconButton
            color="error"
            onClick={() =>
            handleDelete(params.row.id)
            }
        >
            <DeleteIcon />
        </IconButton>
        </Tooltip>
        <Tooltip title="Historial">
        <IconButton
            color="secondary"
            onClick={() =>
            handleHistorico(params.row.id)
            }
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

        if (params.value === 'CREATE')
        color = 'success';

        if (params.value === 'UPDATE')
        color = 'warning';

        if (params.value === 'DELETE')
        color = 'error';

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
        new Date(
            row.fechaAccion
        ).toLocaleString(
            'es-AR'
        )
    },
    {
        field: 'usuario',
        headerName: 'Usuario',
        width: 200,
        valueGetter: (_, row) =>
        row.usuario?.nombre || ''
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
            Empresas
        </Typography>
        <Button
            variant="contained"
            onClick={handleOpen}
        >
            Nueva Empresa
        </Button>
    </Box>
    <Paper
      sx={{
        height: 500,
        width: '100%'
      }}
    >
      <DataGrid
        rows={empresas}
        columns={columns}
        getRowId={(row) => row.id}
        pageSizeOptions={[
          5,
          10,
          20
        ]}
        initialState={{
          pagination: {
            paginationModel: {
              pageSize: 5
            }
          }
        }}
        showToolbar
        slots={{
          toolbar:
            GridToolbar
        }}
        slotProps={{
            toolbar: {
            csvOptions: {
            delimiter: ';',
            utf8WithBom: true,
            fileName: 'empresas'
            }
            }
        }}
      />

      <Dialog
        open={open}
        onClose={handleClose}
        fullWidth
        maxWidth="md"
        >
        <DialogTitle>
        {
            editando
            ? 'Editar Empresa'
            : 'Nueva Empresa'
        }
        </DialogTitle>
        <DialogContent>
            <TextField
            label="Razón Social"
            name="razonSocial"
            fullWidth
            margin="normal"
            value={form.razonSocial}
            onChange={handleChange}
            />

            <TextField
            label="Nombre Fantasía"
            name="nombreFantasia"
            fullWidth
            margin="normal"
            value={form.nombreFantasia}
            onChange={handleChange}
            />

            <TextField
            label="CUIT"
            name="cuit"
            fullWidth
            margin="normal"
            value={formatearCuit(form.cuit)}
            onChange={handleChange}
            inputProps={{ maxLength: 13 }}
            />

            <TextField
            label="Ingresos Brutos"
            name="ingresosBrutos"
            fullWidth
            margin="normal"
            value={form.ingresosBrutos}
            onChange={handleChange}
            />

            <FormControl
            fullWidth
            margin="normal"
            >
                <InputLabel>
                    Tipo Fiscal
                </InputLabel>
                <Select
                    name="tipoFiscalId"
                    value={form.tipoFiscalId}
                    label="Tipo Fiscal"
                    onChange={handleChange}
                >
                    {
                    tiposFiscales.map(
                        (tipo) => (
                        <MenuItem
                            key={tipo.id}
                            value={tipo.id}
                        >
                            {tipo.nombre}
                        </MenuItem>
                        )
                    )
                    }
                </Select>
            </FormControl>            
        </DialogContent>
        <DialogActions>
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

            <Button
            onClick={handleClose}
            >
            Cancelar
            </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={openHistorico}
        onClose={() =>
            setOpenHistorico(false)
        }
        maxWidth="md"
        fullWidth
        >
        <DialogTitle>
            Historial Empresa
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
            onClick={() =>
                setOpenHistorico(false)
            }
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
    </Paper>
  </Box>
);
}

export default EmpresasPage;
