import { useEffect, useState } from 'react';
import { Alert, Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, MenuItem, TextField } from '@mui/material';
import { createProductoRequest, getProductosRequest } from '../../services/producto.service';

const ProductoNoPedidoDialog = ({ open, onClose, onAgregar }) => {
  const [modo, setModo] = useState('EXISTENTE');
  const [busqueda, setBusqueda] = useState('');
  const [productos, setProductos] = useState([]);
  const [productoId, setProductoId] = useState('');
  const [codigo, setCodigo] = useState('');
  const [nombre, setNombre] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const cerrar = () => {
    setModo('EXISTENTE');
    setBusqueda('');
    setProductos([]);
    setProductoId('');
    setCodigo('');
    setNombre('');
    setError('');
    onClose();
  };

  useEffect(() => {
    if (!open || modo !== 'EXISTENTE' || busqueda.trim().length < 2) {
      return undefined;
    }

    const timer = setTimeout(async () => {
      try {
        setLoading(true);
        setError('');
        const respuesta = await getProductosRequest({
          search: busqueda.trim(), page: 0, pageSize: 20, habilitado: true
        });
        setProductos(respuesta.data || []);
      } catch (err) {
        console.log(err);
        setError('No se pudieron buscar los productos');
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [busqueda, modo, open]);

  const agregar = async () => {
    try {
      setLoading(true);
      setError('');
      if (modo === 'EXISTENTE') {
        const producto = productos.find((item) => Number(item.id) === Number(productoId));
        if (!producto) {
          setError('Seleccione un producto');
          return;
        }
        if (onAgregar(producto) !== false) cerrar();
        return;
      }

      if (!codigo.trim() || !nombre.trim()) {
        setError('Ingrese codigo y descripcion');
        return;
      }
      const producto = await createProductoRequest({
        codigo: codigo.trim(),
        nombre: nombre.trim(),
        precioCosto: 0,
        precioCostoDescuento: 0,
        precioPublico: 0,
        preciosIncluyenIva: true,
        visibleWeb: false,
        habilitado: true
      });
      if (onAgregar(producto) !== false) cerrar();
    } catch (err) {
      console.log(err);
      setError(err.response?.data?.mensaje || 'No se pudo agregar el producto');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={cerrar} fullWidth maxWidth="sm">
      <DialogTitle>Agregar producto no pedido</DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'grid', gap: 2, pt: 1 }}>
          <TextField select label="Producto" value={modo}
            onChange={(event) => setModo(event.target.value)} size="small">
            <MenuItem value="EXISTENTE">Buscar existente</MenuItem>
            <MenuItem value="NUEVO">Crear producto nuevo</MenuItem>
          </TextField>
          {modo === 'EXISTENTE' ? (
            <>
              <TextField label="Buscar por codigo o descripcion" value={busqueda}
                onChange={(event) => setBusqueda(event.target.value)} size="small" autoFocus />
              <TextField select label="Resultado" value={productoId}
                onChange={(event) => setProductoId(event.target.value)} size="small"
                disabled={loading || productos.length === 0}>
                {productos.map((producto) => (
                  <MenuItem key={producto.id} value={producto.id}>
                    {producto.codigo} - {producto.nombre}
                  </MenuItem>
                ))}
              </TextField>
            </>
          ) : (
            <>
              <TextField label="Codigo" value={codigo}
                onChange={(event) => setCodigo(event.target.value)} size="small" autoFocus />
              <TextField label="Descripcion" value={nombre}
                onChange={(event) => setNombre(event.target.value)} size="small" />
            </>
          )}
          {error && <Alert severity="error">{error}</Alert>}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={cerrar}>Cancelar</Button>
        <Button variant="contained" onClick={agregar} disabled={loading}>Agregar</Button>
      </DialogActions>
    </Dialog>
  );
};

export default ProductoNoPedidoDialog;
