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
  Divider,
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
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import HistoryIcon from '@mui/icons-material/History';
import InventoryIcon from '@mui/icons-material/Inventory';
import {
  createProductoRequest,
  deleteProductoRequest,
  getHistoricoProductoRequest,
  getProductosRequest,
  updateProductoRequest,
  updateStockProductoRequest
} from '../../services/producto.service';
import { getRubrosRequest } from '../../services/rubro.service';
import { getSegmentosRequest } from '../../services/segmento.service';
import { getMarcasRequest } from '../../services/marca.service';
import { getLocalesRequest } from '../../services/local.service';

const formInicial = {
  codigo: '',
  codigoBarra: '',
  nombre: '',
  descripcion: '',
  rubroId: '',
  segmentoId: '',
  marcaId: '',
  precioCosto: 0,
  precioCostoDescuento: 0,
  precioPublico: 0,
  preciosIncluyenIva: true,
  visibleWeb: false,
  habilitado: true
};

const formatoMoneda = (valor) =>
  Number(valor || 0).toLocaleString('es-AR', {
    style: 'currency',
    currency: 'ARS'
  });

const calcularStockTotal = (stocks = []) =>
  stocks.reduce(
    (total, stock) => total + Number(stock.cantidad || 0),
    0
  );

const obtenerStockWeb = (stocks = []) => {
  const stockWeb = stocks.find((stock) =>
    stock.local?.nombre
      ?.toLowerCase()
      .includes('ventas web')
  );

  return Number(stockWeb?.cantidad || 0);
};

function ProductosPage() {
  const [productos, setProductos] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [paginationModel, setPaginationModel] = useState({
    page: 0,
    pageSize: 20
  });
  const [filtros, setFiltros] = useState({
    search: '',
    rubroId: '',
    segmentoId: '',
    marcaId: '',
    visibleWeb: '',
    habilitado: ''
  });
  const [rubros, setRubros] = useState([]);
  const [segmentos, setSegmentos] = useState([]);
  const [marcas, setMarcas] = useState([]);
  const [locales, setLocales] = useState([]);
  const [open, setOpen] = useState(false);
  const [editando, setEditando] = useState(false);
  const [productoId, setProductoId] = useState(null);
  const [form, setForm] = useState(formInicial);
  const [openStock, setOpenStock] = useState(false);
  const [productoStock, setProductoStock] = useState(null);
  const [stockForm, setStockForm] = useState([]);
  const [openHistorico, setOpenHistorico] = useState(false);
  const [historico, setHistorico] = useState([]);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  const cargarProductos = async () => {
    try {
      const respuesta = await getProductosRequest({
        page: paginationModel.page,
        pageSize: paginationModel.pageSize,
        ...filtros
      });

      setProductos(respuesta.data || []);
      setTotal(respuesta.total || 0);
    } catch (error) {
      console.log(error);
      setSnackbar({
        open: true,
        message: 'Error cargando productos',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOpen = () => {
    setEditando(false);
    setProductoId(null);
    setForm(formInicial);
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setEditando(false);
    setProductoId(null);
    setForm(formInicial);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm({
      ...form,
      [name]: value
    });
  };

  const handleSwitch = (e) => {
    const { name, checked } = e.target;

    setForm({
      ...form,
      [name]: checked
    });
  };

  const handleFiltro = (e) => {
    const { name, value } = e.target;

    setLoading(true);
    setPaginationModel({
      ...paginationModel,
      page: 0
    });
    setFiltros({
      ...filtros,
      [name]: value
    });
  };

  const limpiarFiltros = () => {
    setLoading(true);
    setPaginationModel({
      page: 0,
      pageSize: paginationModel.pageSize
    });
    setFiltros({
      search: '',
      rubroId: '',
      segmentoId: '',
      marcaId: '',
      visibleWeb: '',
      habilitado: ''
    });
  };

  const handleSave = async () => {
    if (!form.codigo.trim()) {
      setSnackbar({
        open: true,
        message: 'Debe ingresar el codigo',
        severity: 'warning'
      });
      return;
    }

    if (!form.nombre.trim()) {
      setSnackbar({
        open: true,
        message: 'Debe ingresar el nombre',
        severity: 'warning'
      });
      return;
    }

    try {
      if (editando) {
        await updateProductoRequest(productoId, form);
        setSnackbar({
          open: true,
          message: 'Producto actualizado correctamente',
          severity: 'success'
        });
      } else {
        await createProductoRequest(form);
        setSnackbar({
          open: true,
          message: 'Producto creado correctamente',
          severity: 'success'
        });
      }

      handleClose();
      setLoading(true);
      await cargarProductos();
    } catch (error) {
      console.log(error);
      setSnackbar({
        open: true,
        message:
          error.response?.data?.mensaje ||
          'Error guardando producto',
        severity: 'error'
      });
    }
  };

  const handleEdit = (producto) => {
    setEditando(true);
    setProductoId(producto.id);
    setForm({
      codigo: producto.codigo || '',
      codigoBarra: producto.codigoBarra || '',
      nombre: producto.nombre || '',
      descripcion: producto.descripcion || '',
      rubroId: producto.rubro?.id || producto.rubroId || '',
      segmentoId:
        producto.segmento?.id || producto.segmentoId || '',
      marcaId: producto.marca?.id || producto.marcaId || '',
      precioCosto: Number(producto.precioCosto || 0),
      precioCostoDescuento: Number(
        producto.precioCostoDescuento || 0
      ),
      precioPublico: Number(producto.precioPublico || 0),
      preciosIncluyenIva: producto.preciosIncluyenIva,
      visibleWeb: producto.visibleWeb,
      habilitado: producto.habilitado
    });
    setOpen(true);
  };

  const handleDelete = async (id) => {
    const confirmar = window.confirm(
      'Eliminar producto?'
    );

    if (!confirmar) return;

    try {
      await deleteProductoRequest(id);
      setLoading(true);
      await cargarProductos();
      setSnackbar({
        open: true,
        message: 'Producto eliminado',
        severity: 'success'
      });
    } catch (error) {
      console.log(error);
      setSnackbar({
        open: true,
        message:
          error.response?.data?.mensaje ||
          'Error eliminando producto',
        severity: 'error'
      });
    }
  };

  const handleStock = (producto) => {
    const stocksActuales = producto.stocks || [];
    const stockPorLocal = locales.map((local) => {
      const stock = stocksActuales.find(
        (item) => item.localId === local.id
      );

      return {
        localId: local.id,
        localNombre: local.nombre,
        cantidad: Number(stock?.cantidad || 0),
        stockMinimo: Number(stock?.stockMinimo || 0)
      };
    });

    setProductoStock(producto);
    setStockForm(stockPorLocal);
    setOpenStock(true);
  };

  const handleStockChange = (localId, field, value) => {
    setStockForm(
      stockForm.map((stock) =>
        stock.localId === localId
          ? {
              ...stock,
              [field]: value
            }
          : stock
      )
    );
  };

  const handleSaveStock = async () => {
    try {
      await Promise.all(
        stockForm.map((stock) =>
          updateStockProductoRequest(productoStock.id, {
            localId: stock.localId,
            stockMinimo: Number(stock.stockMinimo || 0)
          })
        )
      );

      setOpenStock(false);
      setProductoStock(null);
      setLoading(true);
      await cargarProductos();
      setSnackbar({
        open: true,
        message: 'Stock minimo actualizado correctamente',
        severity: 'success'
      });
    } catch (error) {
      console.log(error);
      setSnackbar({
        open: true,
        message: 'Error actualizando stock minimo',
        severity: 'error'
      });
    }
  };

  const handleHistorico = async (id) => {
    try {
      const data = await getHistoricoProductoRequest(id);
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

    const cargarCatalogos = async () => {
      try {
        const [
          rubrosData,
          segmentosData,
          marcasData,
          localesData
        ] = await Promise.all([
          getRubrosRequest(),
          getSegmentosRequest(),
          getMarcasRequest(),
          getLocalesRequest()
        ]);

        if (!activo) return;

        setRubros(rubrosData);
        setSegmentos(segmentosData);
        setMarcas(marcasData);
        setLocales(localesData);
      } catch (error) {
        console.log(error);
      }
    };

    cargarCatalogos();

    return () => {
      activo = false;
    };
  }, []);

  useEffect(() => {
    let activo = true;

    const timer = setTimeout(async () => {
      try {
        const respuesta = await getProductosRequest({
          page: paginationModel.page,
          pageSize: paginationModel.pageSize,
          ...filtros
        });

        if (!activo) return;

        setProductos(respuesta.data || []);
        setTotal(respuesta.total || 0);
      } catch (error) {
        console.log(error);

        if (!activo) return;

        setSnackbar({
          open: true,
          message: 'Error cargando productos',
          severity: 'error'
        });
      } finally {
        if (activo) {
          setLoading(false);
        }
      }
    }, 300);

    return () => {
      activo = false;
      clearTimeout(timer);
    };
  }, [paginationModel, filtros]);

  const columns = [
    {
      field: 'codigo',
      headerName: 'Codigo',
      width: 150
    },
    {
      field: 'nombre',
      headerName: 'Producto',
      flex: 1,
      minWidth: 260
    },
    {
      field: 'rubro',
      headerName: 'Rubro',
      width: 150,
      valueGetter: (_, row) => row.rubro?.nombre || ''
    },
    {
      field: 'segmento',
      headerName: 'Segmento',
      width: 150,
      valueGetter: (_, row) => row.segmento?.nombre || ''
    },
    {
      field: 'marca',
      headerName: 'Marca',
      width: 150,
      valueGetter: (_, row) => row.marca?.nombre || ''
    },
    {
      field: 'precioPublico',
      headerName: 'Precio Publico',
      width: 150,
      valueGetter: (_, row) => formatoMoneda(row.precioPublico)
    },
    {
      field: 'stockTotal',
      headerName: 'Stock Total',
      width: 120,
      valueGetter: (_, row) => calcularStockTotal(row.stocks)
    },
    {
      field: 'stockWeb',
      headerName: 'Stock Web',
      width: 120,
      valueGetter: (_, row) => obtenerStockWeb(row.stocks)
    },
    {
      field: 'visibleWeb',
      headerName: 'Web',
      width: 100,
      renderCell: (params) => (
        <Chip
          label={params.value ? 'Si' : 'No'}
          color={params.value ? 'success' : 'default'}
          size="small"
        />
      )
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
      width: 190,
      sortable: false,
      filterable: false,
      renderCell: (params) => (
        <Box display="flex" gap={0.5}>
          <Tooltip title="Editar">
            <IconButton
              color="primary"
              onClick={() => handleEdit(params.row)}
            >
              <EditIcon />
            </IconButton>
          </Tooltip>

          <Tooltip title="Stock">
            <IconButton
              color="success"
              onClick={() => handleStock(params.row)}
            >
              <InventoryIcon />
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

          <Tooltip title="Eliminar">
            <IconButton
              color="error"
              onClick={() => handleDelete(params.row.id)}
            >
              <DeleteIcon />
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
      width: 130,
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
      field: 'codigo',
      headerName: 'Codigo',
      width: 140
    },
    {
      field: 'nombre',
      headerName: 'Producto',
      flex: 1,
      minWidth: 220
    },
    {
      field: 'precioPublico',
      headerName: 'Precio Publico',
      width: 150,
      valueGetter: (_, row) => formatoMoneda(row.precioPublico)
    },
    {
      field: 'visibleWeb',
      headerName: 'Web',
      width: 100,
      renderCell: (params) => (
        <Chip
          label={params.value ? 'Si' : 'No'}
          color={params.value ? 'success' : 'default'}
          size="small"
        />
      )
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
        <Box>
          <Typography variant="h4">
            Productos
          </Typography>
          <Typography
            variant="body2"
            color="text.secondary"
          >
            Catalogo, precios, stock por local y venta web
          </Typography>
        </Box>

        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleOpen}
        >
          Nuevo Producto
        </Button>
      </Box>

      <Paper sx={{ p: 2, mb: 2 }}>
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: '1fr',
              md: '2fr repeat(5, 1fr) auto'
            },
            gap: 2,
            alignItems: 'center'
          }}
        >
          <TextField
            label="Buscar"
            name="search"
            size="small"
            value={filtros.search}
            onChange={handleFiltro}
          />

          <FormControl size="small">
            <InputLabel>Rubro</InputLabel>
            <Select
              label="Rubro"
              name="rubroId"
              value={filtros.rubroId}
              onChange={handleFiltro}
            >
              <MenuItem value="">Todos</MenuItem>
              {rubros.map((rubro) => (
                <MenuItem
                  key={rubro.id}
                  value={rubro.id}
                >
                  {rubro.nombre}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl size="small">
            <InputLabel>Segmento</InputLabel>
            <Select
              label="Segmento"
              name="segmentoId"
              value={filtros.segmentoId}
              onChange={handleFiltro}
            >
              <MenuItem value="">Todos</MenuItem>
              {segmentos.map((segmento) => (
                <MenuItem
                  key={segmento.id}
                  value={segmento.id}
                >
                  {segmento.nombre}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl size="small">
            <InputLabel>Marca</InputLabel>
            <Select
              label="Marca"
              name="marcaId"
              value={filtros.marcaId}
              onChange={handleFiltro}
            >
              <MenuItem value="">Todas</MenuItem>
              {marcas.map((marca) => (
                <MenuItem
                  key={marca.id}
                  value={marca.id}
                >
                  {marca.nombre}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl size="small">
            <InputLabel>Web</InputLabel>
            <Select
              label="Web"
              name="visibleWeb"
              value={filtros.visibleWeb}
              onChange={handleFiltro}
            >
              <MenuItem value="">Todos</MenuItem>
              <MenuItem value="true">Visible</MenuItem>
              <MenuItem value="false">No visible</MenuItem>
            </Select>
          </FormControl>

          <FormControl size="small">
            <InputLabel>Estado</InputLabel>
            <Select
              label="Estado"
              name="habilitado"
              value={filtros.habilitado}
              onChange={handleFiltro}
            >
              <MenuItem value="">Todos</MenuItem>
              <MenuItem value="true">Activos</MenuItem>
              <MenuItem value="false">Inactivos</MenuItem>
            </Select>
          </FormControl>

          <Button onClick={limpiarFiltros}>
            Limpiar
          </Button>
        </Box>
      </Paper>

      <Paper
        sx={{
          height: 620,
          width: '100%'
        }}
      >
        <DataGrid
          rows={productos}
          columns={columns}
          getRowId={(row) => row.id}
          loading={loading}
          rowCount={total}
          paginationMode="server"
          paginationModel={paginationModel}
          onPaginationModelChange={(model) => {
            setLoading(true);
            setPaginationModel(model);
          }}
          pageSizeOptions={[10, 20, 50, 100]}
          showToolbar
          slots={{
            toolbar: GridToolbar
          }}
          slotProps={{
            toolbar: {
              csvOptions: {
                delimiter: ';',
                utf8WithBom: true,
                fileName: 'productos'
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
          {editando ? 'Editar Producto' : 'Nuevo Producto'}
        </DialogTitle>

        <DialogContent>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: {
                xs: '1fr',
                md: '1fr 1fr'
              },
              gap: 2,
              pt: 1
            }}
          >
            <TextField
              label="Codigo"
              name="codigo"
              value={form.codigo}
              onChange={handleChange}
              fullWidth
            />

            <TextField
              label="Codigo de barra"
              name="codigoBarra"
              value={form.codigoBarra}
              onChange={handleChange}
              fullWidth
            />

            <TextField
              label="Nombre"
              name="nombre"
              value={form.nombre}
              onChange={handleChange}
              fullWidth
              sx={{ gridColumn: { md: '1 / 3' } }}
            />

            <TextField
              label="Descripcion"
              name="descripcion"
              value={form.descripcion}
              onChange={handleChange}
              fullWidth
              multiline
              minRows={2}
              sx={{ gridColumn: { md: '1 / 3' } }}
            />

            <FormControl fullWidth>
              <InputLabel>Rubro</InputLabel>
              <Select
                label="Rubro"
                name="rubroId"
                value={form.rubroId}
                onChange={handleChange}
              >
                <MenuItem value="">Sin rubro</MenuItem>
                {rubros.map((rubro) => (
                  <MenuItem
                    key={rubro.id}
                    value={rubro.id}
                  >
                    {rubro.nombre}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth>
              <InputLabel>Segmento</InputLabel>
              <Select
                label="Segmento"
                name="segmentoId"
                value={form.segmentoId}
                onChange={handleChange}
              >
                <MenuItem value="">Sin segmento</MenuItem>
                {segmentos.map((segmento) => (
                  <MenuItem
                    key={segmento.id}
                    value={segmento.id}
                  >
                    {segmento.nombre}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth>
              <InputLabel>Marca</InputLabel>
              <Select
                label="Marca"
                name="marcaId"
                value={form.marcaId}
                onChange={handleChange}
              >
                <MenuItem value="">Sin marca</MenuItem>
                {marcas.map((marca) => (
                  <MenuItem
                    key={marca.id}
                    value={marca.id}
                  >
                    {marca.nombre}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <Box />

            <TextField
              label="Precio costo"
              name="precioCosto"
              type="number"
              value={form.precioCosto}
              onChange={handleChange}
              fullWidth
            />

            <TextField
              label="Precio costo con descuento"
              name="precioCostoDescuento"
              type="number"
              value={form.precioCostoDescuento}
              onChange={handleChange}
              fullWidth
            />

            <TextField
              label="Precio publico"
              name="precioPublico"
              type="number"
              value={form.precioPublico}
              onChange={handleChange}
              fullWidth
            />
          </Box>

          <Divider sx={{ my: 2 }} />

          <Box
            sx={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 2
            }}
          >
            <FormControlLabel
              control={
                <Switch
                  name="preciosIncluyenIva"
                  checked={form.preciosIncluyenIva}
                  onChange={handleSwitch}
                />
              }
              label="Precios con IVA incluido"
            />

            <FormControlLabel
              control={
                <Switch
                  name="visibleWeb"
                  checked={form.visibleWeb}
                  onChange={handleSwitch}
                />
              }
              label="Visible web"
            />

            <FormControlLabel
              control={
                <Switch
                  name="habilitado"
                  checked={form.habilitado}
                  onChange={handleSwitch}
                />
              }
              label="Habilitado"
            />
          </Box>
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
        open={openStock}
        onClose={() => setOpenStock(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>
          Stock por local
        </DialogTitle>

        <DialogContent>
          <Typography
            variant="subtitle1"
            sx={{ mb: 2 }}
          >
            {productoStock?.nombre}
          </Typography>

          <Box
            sx={{
              display: 'grid',
              gap: 2
            }}
          >
            {stockForm.map((stock) => (
              <Box
                key={stock.localId}
                sx={{
                  display: 'grid',
                  gridTemplateColumns: {
                    xs: '1fr',
                    sm: '1.4fr 1fr 1fr'
                  },
                  gap: 2,
                  alignItems: 'center'
                }}
              >
                <Typography>
                  {stock.localNombre}
                </Typography>

                <TextField
                  label="Stock actual"
                  type="number"
                  size="small"
                  value={stock.cantidad}
                  InputProps={{
                    readOnly: true
                  }}
                />

                <TextField
                  label="Stock minimo"
                  type="number"
                  size="small"
                  value={stock.stockMinimo}
                  onChange={(e) =>
                    handleStockChange(
                      stock.localId,
                      'stockMinimo',
                      e.target.value
                    )
                  }
                />
              </Box>
            ))}
          </Box>
        </DialogContent>

        <DialogActions>
          <Button onClick={() => setOpenStock(false)}>
            Cancelar
          </Button>

          <Button
            variant="contained"
            onClick={handleSaveStock}
          >
            Guardar Minimos
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
          Historial Producto
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

export default ProductosPage;
