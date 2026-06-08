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
  FormControl,
  FormControlLabel,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Select,
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
import BusinessIcon from '@mui/icons-material/Business';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import HistoryIcon from '@mui/icons-material/History';
import {
  createProveedorRequest,
  createRazonSocialRequest,
  deleteProveedorRequest,
  deleteRazonSocialRequest,
  getHistoricoProveedorRequest,
  getHistoricoRazonSocialRequest,
  getProveedoresRequest,
  getRazonesSocialesRequest,
  updateProveedorRequest,
  updateRazonSocialRequest
} from '../../services/proveedor.service';
import {
  getLocalidadesRequest,
  getProvinciasRequest
} from '../../services/geografia.service';
import { getTiposFiscalesRequest } from '../../services/tipoFiscal.service';
import {
  formatearCuit,
  limpiarCuit,
  validarCuit
} from '../../utils/validarCuit';
import { validarEmail } from '../../utils/validarEmail';

const proveedorInicial = {
  nombreComercial: '',
  modoCuentaCorriente: 'AGRUPADA',
  observaciones: '',
  habilitado: true
};

const razonInicial = {
  razonSocial: '',
  nombreFantasia: '',
  cuit: '',
  tipoFiscalId: '',
  calle: '',
  numero: '',
  piso: '',
  departamento: '',
  provinciaCodigo: '',
  localidadCodigo: '',
  codigoPostal: '',
  telefono: '',
  email: '',
  contactoNombre: '',
  contactoTelefono: '',
  contactoEmail: '',
  observaciones: '',
  principal: false,
  habilitado: true
};

function ProveedoresPage() {
  const [proveedores, setProveedores] = useState([]);
  const [openProveedor, setOpenProveedor] = useState(false);
  const [editandoProveedor, setEditandoProveedor] = useState(false);
  const [proveedorId, setProveedorId] = useState(null);
  const [formProveedor, setFormProveedor] = useState(proveedorInicial);

  const [proveedorSeleccionado, setProveedorSeleccionado] = useState(null);
  const [razonesSociales, setRazonesSociales] = useState([]);
  const [openRazones, setOpenRazones] = useState(false);
  const [openRazonForm, setOpenRazonForm] = useState(false);
  const [editandoRazon, setEditandoRazon] = useState(false);
  const [razonId, setRazonId] = useState(null);
  const [formRazon, setFormRazon] = useState(razonInicial);

  const [provincias, setProvincias] = useState([]);
  const [localidades, setLocalidades] = useState([]);
  const [tiposFiscales, setTiposFiscales] = useState([]);

  const [openHistorico, setOpenHistorico] = useState(false);
  const [historicoTitulo, setHistoricoTitulo] = useState('');
  const [historico, setHistorico] = useState([]);

  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  const cargarProveedores = async () => {
    try {
      const data = await getProveedoresRequest();
      setProveedores(data);
    } catch (error) {
      console.log(error);
    }
  };

  const cargarRazonesSociales = async (id) => {
    const data = await getRazonesSocialesRequest(id);
    setRazonesSociales(data);
  };

  const cerrarProveedor = () => {
    setOpenProveedor(false);
    setEditandoProveedor(false);
    setProveedorId(null);
    setFormProveedor(proveedorInicial);
  };

  const cerrarRazon = () => {
    setOpenRazonForm(false);
    setEditandoRazon(false);
    setRazonId(null);
    setLocalidades([]);
    setFormRazon(razonInicial);
  };

  const handleProveedorChange = (e) => {
    const { name, value } = e.target;

    setFormProveedor({
      ...formProveedor,
      [name]: value
    });
  };

  const handleRazonChange = (e) => {
    const { name, value } = e.target;

    setFormRazon({
      ...formRazon,
      [name]: name === 'cuit' ? limpiarCuit(value) : value
    });
  };

  const handleProvinciaChange = async (e) => {
    const provinciaCodigo = e.target.value;

    setFormRazon({
      ...formRazon,
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

  const guardarProveedor = async () => {
    if (!formProveedor.nombreComercial.trim()) {
      setSnackbar({
        open: true,
        message: 'Debe ingresar el nombre comercial',
        severity: 'warning'
      });
      return;
    }

    try {
      if (editandoProveedor) {
        await updateProveedorRequest(proveedorId, formProveedor);
        setSnackbar({
          open: true,
          message: 'Proveedor actualizado correctamente',
          severity: 'success'
        });
      } else {
        await createProveedorRequest(formProveedor);
        setSnackbar({
          open: true,
          message: 'Proveedor creado correctamente',
          severity: 'success'
        });
      }

      cerrarProveedor();
      cargarProveedores();
    } catch (error) {
      console.log(error);
      setSnackbar({
        open: true,
        message:
          error.response?.data?.mensaje ||
          'Error guardando proveedor',
        severity: 'error'
      });
    }
  };

  const editarProveedor = (proveedor) => {
    setEditandoProveedor(true);
    setProveedorId(proveedor.id);
    setFormProveedor({
      nombreComercial: proveedor.nombreComercial || '',
      modoCuentaCorriente:
        proveedor.modoCuentaCorriente || 'AGRUPADA',
      observaciones: proveedor.observaciones || '',
      habilitado: proveedor.habilitado
    });
    setOpenProveedor(true);
  };

  const eliminarProveedor = async (id) => {
    const confirmar = window.confirm(
      'Eliminar proveedor?'
    );

    if (!confirmar) return;

    try {
      await deleteProveedorRequest(id);
      cargarProveedores();
      setSnackbar({
        open: true,
        message: 'Proveedor eliminado',
        severity: 'success'
      });
    } catch (error) {
      console.log(error);
      setSnackbar({
        open: true,
        message:
          error.response?.data?.mensaje ||
          'Error eliminando proveedor',
        severity: 'error'
      });
    }
  };

  const abrirRazones = async (proveedor) => {
    try {
      setProveedorSeleccionado(proveedor);
      await cargarRazonesSociales(proveedor.id);
      setOpenRazones(true);
    } catch (error) {
      console.log(error);
      setSnackbar({
        open: true,
        message: 'Error cargando razones sociales',
        severity: 'error'
      });
    }
  };

  const nuevaRazon = () => {
    setEditandoRazon(false);
    setRazonId(null);
    setFormRazon(razonInicial);
    setLocalidades([]);
    setOpenRazonForm(true);
  };

  const editarRazon = async (razon) => {
    setEditandoRazon(true);
    setRazonId(razon.id);
    setFormRazon({
      razonSocial: razon.razonSocial || '',
      nombreFantasia: razon.nombreFantasia || '',
      cuit: razon.cuit || '',
      tipoFiscalId: razon.tipoFiscal?.id || razon.tipoFiscalId || '',
      calle: razon.calle || '',
      numero: razon.numero || '',
      piso: razon.piso || '',
      departamento: razon.departamento || '',
      provinciaCodigo: razon.provinciaCodigo || '',
      localidadCodigo: razon.localidadCodigo || '',
      codigoPostal: razon.codigoPostal || '',
      telefono: razon.telefono || '',
      email: razon.email || '',
      contactoNombre: razon.contactoNombre || '',
      contactoTelefono: razon.contactoTelefono || '',
      contactoEmail: razon.contactoEmail || '',
      observaciones: razon.observaciones || '',
      principal: razon.principal,
      habilitado: razon.habilitado
    });

    if (razon.provinciaCodigo) {
      const data = await getLocalidadesRequest(razon.provinciaCodigo);
      setLocalidades(data);
    } else {
      setLocalidades([]);
    }

    setOpenRazonForm(true);
  };

  const guardarRazon = async () => {
    if (!formRazon.razonSocial.trim()) {
      setSnackbar({
        open: true,
        message: 'Debe ingresar la razon social',
        severity: 'warning'
      });
      return;
    }

    if (formRazon.cuit && !validarCuit(formRazon.cuit)) {
      setSnackbar({
        open: true,
        message: 'CUIT invalido',
        severity: 'warning'
      });
      return;
    }

    if (!validarEmail(formRazon.email)) {
      setSnackbar({
        open: true,
        message: 'Email invalido',
        severity: 'warning'
      });
      return;
    }

    if (!validarEmail(formRazon.contactoEmail)) {
      setSnackbar({
        open: true,
        message: 'Email de contacto invalido',
        severity: 'warning'
      });
      return;
    }

    try {
      if (editandoRazon) {
        await updateRazonSocialRequest(razonId, formRazon);
        setSnackbar({
          open: true,
          message: 'Razon social actualizada correctamente',
          severity: 'success'
        });
      } else {
        await createRazonSocialRequest(
          proveedorSeleccionado.id,
          formRazon
        );
        setSnackbar({
          open: true,
          message: 'Razon social creada correctamente',
          severity: 'success'
        });
      }

      cerrarRazon();
      await cargarRazonesSociales(proveedorSeleccionado.id);
      cargarProveedores();
    } catch (error) {
      console.log(error);
      setSnackbar({
        open: true,
        message:
          error.response?.data?.mensaje ||
          'Error guardando razon social',
        severity: 'error'
      });
    }
  };

  const eliminarRazon = async (id) => {
    const confirmar = window.confirm(
      'Eliminar razon social?'
    );

    if (!confirmar) return;

    try {
      await deleteRazonSocialRequest(id);
      await cargarRazonesSociales(proveedorSeleccionado.id);
      cargarProveedores();
      setSnackbar({
        open: true,
        message: 'Razon social eliminada',
        severity: 'success'
      });
    } catch (error) {
      console.log(error);
      setSnackbar({
        open: true,
        message:
          error.response?.data?.mensaje ||
          'Error eliminando razon social',
        severity: 'error'
      });
    }
  };

  const verHistoricoProveedor = async (id) => {
    try {
      const data = await getHistoricoProveedorRequest(id);
      setHistoricoTitulo('Historial Proveedor');
      setHistorico(data);
      setOpenHistorico(true);
    } catch (error) {
      console.log(error);
    }
  };

  const verHistoricoRazon = async (id) => {
    try {
      const data = await getHistoricoRazonSocialRequest(id);
      setHistoricoTitulo('Historial Razon Social');
      setHistorico(data);
      setOpenHistorico(true);
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    let activo = true;

    const cargarDatosIniciales = async () => {
      try {
        const [
          proveedoresData,
          provinciasData,
          tiposFiscalesData
        ] =
          await Promise.all([
            getProveedoresRequest(),
            getProvinciasRequest(),
            getTiposFiscalesRequest()
          ]);

        if (!activo) return;

        setProveedores(proveedoresData);
        setProvincias(provinciasData);
        setTiposFiscales(tiposFiscalesData);
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
      field: 'nombreComercial',
      headerName: 'Proveedor',
      flex: 1
    },
    {
      field: 'modoCuentaCorriente',
      headerName: 'Cuenta corriente',
      width: 180,
      valueGetter: (_, row) =>
        row.modoCuentaCorriente === 'AGRUPADA'
          ? 'Agrupada'
          : 'Por razon social'
    },
    {
      field: 'razonesSociales',
      headerName: 'Razones',
      width: 110,
      valueGetter: (_, row) =>
        row.razonesSociales?.length || 0
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
      width: 210,
      sortable: false,
      filterable: false,
      renderCell: (params) => (
        <Box display="flex" gap={1}>
          <Tooltip title="Razones sociales">
            <IconButton
              color="info"
              onClick={() => abrirRazones(params.row)}
            >
              <BusinessIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Editar">
            <IconButton
              color="primary"
              onClick={() => editarProveedor(params.row)}
            >
              <EditIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Eliminar">
            <IconButton
              color="error"
              onClick={() => eliminarProveedor(params.row.id)}
            >
              <DeleteIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Historial">
            <IconButton
              color="secondary"
              onClick={() => verHistoricoProveedor(params.row.id)}
            >
              <HistoryIcon />
            </IconButton>
          </Tooltip>
        </Box>
      )
    }
  ];

  const columnsRazones = [
    {
      field: 'razonSocial',
      headerName: 'Razon social',
      flex: 1
    },
    {
      field: 'cuit',
      headerName: 'CUIT',
      width: 140,
      valueGetter: (_, row) => formatearCuit(row.cuit)
    },
    {
      field: 'tipoFiscal',
      headerName: 'Condicion',
      width: 180,
      valueGetter: (_, row) =>
        row.tipoFiscal?.nombre || ''
    },
    {
      field: 'localidad',
      headerName: 'Localidad',
      width: 160,
      valueGetter: (_, row) =>
        row.localidad?.nombre || ''
    },
    {
      field: 'principal',
      headerName: 'Principal',
      width: 110,
      renderCell: (params) => (
        <Chip
          label={params.value ? 'Si' : 'No'}
          color={params.value ? 'primary' : 'default'}
          size="small"
        />
      )
    },
    {
      field: 'habilitado',
      headerName: 'Estado',
      width: 110,
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
              onClick={() => editarRazon(params.row)}
            >
              <EditIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Eliminar">
            <IconButton
              color="error"
              onClick={() => eliminarRazon(params.row.id)}
            >
              <DeleteIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Historial">
            <IconButton
              color="secondary"
              onClick={() => verHistoricoRazon(params.row.id)}
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
      valueGetter: (_, row) =>
        row.usuario?.nombre || ''
    },
    {
      field: 'nombreComercial',
      headerName: 'Proveedor',
      flex: 1,
      valueGetter: (_, row) =>
        row.nombreComercial || row.razonSocial || ''
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
          Proveedores
        </Typography>

        <Button
          variant="contained"
          onClick={() => setOpenProveedor(true)}
        >
          Nuevo Proveedor
        </Button>
      </Box>

      <Paper sx={{ height: 520, width: '100%' }}>
        <DataGrid
          rows={proveedores}
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
                fileName: 'proveedores'
              }
            }
          }}
        />
      </Paper>

      <Dialog
        open={openProveedor}
        onClose={cerrarProveedor}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>
          {editandoProveedor ? 'Editar Proveedor' : 'Nuevo Proveedor'}
        </DialogTitle>
        <DialogContent>
          <TextField
            label="Nombre comercial"
            name="nombreComercial"
            fullWidth
            margin="normal"
            value={formProveedor.nombreComercial}
            onChange={handleProveedorChange}
          />

          <FormControl fullWidth margin="normal">
            <InputLabel>
              Cuenta corriente
            </InputLabel>
            <Select
              name="modoCuentaCorriente"
              label="Cuenta corriente"
              value={formProveedor.modoCuentaCorriente}
              onChange={handleProveedorChange}
            >
              <MenuItem value="AGRUPADA">
                Agrupada
              </MenuItem>
              <MenuItem value="POR_RAZON_SOCIAL">
                Por razon social
              </MenuItem>
            </Select>
          </FormControl>

          <TextField
            label="Observaciones"
            name="observaciones"
            fullWidth
            multiline
            minRows={3}
            margin="normal"
            value={formProveedor.observaciones}
            onChange={handleProveedorChange}
          />

          <FormControlLabel
            control={
              <Switch
                checked={formProveedor.habilitado}
                onChange={(e) =>
                  setFormProveedor({
                    ...formProveedor,
                    habilitado: e.target.checked
                  })
                }
              />
            }
            label="Habilitado"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={cerrarProveedor}>
            Cancelar
          </Button>
          <Button
            variant="contained"
            onClick={guardarProveedor}
          >
            {editandoProveedor ? 'Actualizar' : 'Guardar'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={openRazones}
        onClose={() => setOpenRazones(false)}
        fullWidth
        maxWidth="lg"
      >
        <DialogTitle>
          Razones sociales - {proveedorSeleccionado?.nombreComercial}
        </DialogTitle>
        <DialogContent>
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'flex-end',
              mb: 2
            }}
          >
            <Button
              variant="contained"
              onClick={nuevaRazon}
            >
              Nueva Razon Social
            </Button>
          </Box>

          <DataGrid
            rows={razonesSociales}
            columns={columnsRazones}
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
          <Button onClick={() => setOpenRazones(false)}>
            Cerrar
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={openRazonForm}
        onClose={cerrarRazon}
        fullWidth
        maxWidth="md"
      >
        <DialogTitle>
          {editandoRazon ? 'Editar Razon Social' : 'Nueva Razon Social'}
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
              label="Razon social"
              name="razonSocial"
              value={formRazon.razonSocial}
              onChange={handleRazonChange}
            />
            <TextField
              label="Nombre fantasia"
              name="nombreFantasia"
              value={formRazon.nombreFantasia}
              onChange={handleRazonChange}
            />
            <TextField
              label="CUIT"
              name="cuit"
              value={formatearCuit(formRazon.cuit)}
              onChange={handleRazonChange}
              inputProps={{
                maxLength: 13,
                inputMode: 'numeric'
              }}
            />
            <TextField
              select
              label="Tipo fiscal"
              name="tipoFiscalId"
              value={formRazon.tipoFiscalId}
              onChange={handleRazonChange}
            >
              <MenuItem value="">
                Sin tipo fiscal
              </MenuItem>
              {tiposFiscales.map((tipo) => (
                <MenuItem
                  key={tipo.id}
                  value={tipo.id}
                >
                  {tipo.nombre}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              label="Calle"
              name="calle"
              value={formRazon.calle}
              onChange={handleRazonChange}
            />
            <TextField
              label="Numero"
              name="numero"
              value={formRazon.numero}
              onChange={handleRazonChange}
            />
            <TextField
              label="Piso"
              name="piso"
              value={formRazon.piso}
              onChange={handleRazonChange}
            />
            <TextField
              label="Departamento"
              name="departamento"
              value={formRazon.departamento}
              onChange={handleRazonChange}
            />
            <TextField
              select
              label="Provincia"
              name="provinciaCodigo"
              value={formRazon.provinciaCodigo}
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
              value={formRazon.localidadCodigo}
              onChange={handleRazonChange}
              disabled={!formRazon.provinciaCodigo}
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
              value={formRazon.codigoPostal}
              onChange={handleRazonChange}
            />
            <TextField
              label="Telefono"
              name="telefono"
              value={formRazon.telefono}
              onChange={handleRazonChange}
            />
            <TextField
              label="Email"
              name="email"
              type="email"
              value={formRazon.email}
              onChange={handleRazonChange}
            />
            <TextField
              label="Contacto"
              name="contactoNombre"
              value={formRazon.contactoNombre}
              onChange={handleRazonChange}
            />
            <TextField
              label="Telefono contacto"
              name="contactoTelefono"
              value={formRazon.contactoTelefono}
              onChange={handleRazonChange}
            />
            <TextField
              label="Email contacto"
              name="contactoEmail"
              type="email"
              value={formRazon.contactoEmail}
              onChange={handleRazonChange}
            />
          </Box>

          <TextField
            label="Observaciones"
            name="observaciones"
            fullWidth
            multiline
            minRows={3}
            margin="normal"
            value={formRazon.observaciones}
            onChange={handleRazonChange}
          />

          <Box sx={{ display: 'flex', gap: 2 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={formRazon.principal}
                  onChange={(e) =>
                    setFormRazon({
                      ...formRazon,
                      principal: e.target.checked
                    })
                  }
                />
              }
              label="Principal"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={formRazon.habilitado}
                  onChange={(e) =>
                    setFormRazon({
                      ...formRazon,
                      habilitado: e.target.checked
                    })
                  }
                />
              }
              label="Habilitado"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={cerrarRazon}>
            Cancelar
          </Button>
          <Button
            variant="contained"
            onClick={guardarRazon}
          >
            {editandoRazon ? 'Actualizar' : 'Guardar'}
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
          {historicoTitulo}
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
          <Button onClick={() => setOpenHistorico(false)}>
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

export default ProveedoresPage;
