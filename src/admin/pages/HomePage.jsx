import {
  Box,
  Chip,
  LinearProgress,
  Paper,
  Typography
} from '@mui/material';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import PointOfSaleIcon from '@mui/icons-material/PointOfSale';
import StoreIcon from '@mui/icons-material/Store';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import { useAuth } from '../../hooks/useAuth';

const resumen = [
  {
    titulo: 'Ventas de hoy',
    valor: '$ 1.284.500',
    detalle: '+12% vs ayer',
    color: '#1976d2',
    icono: <AttachMoneyIcon />
  },
  {
    titulo: 'Tickets',
    valor: '148',
    detalle: 'Promedio $ 8.679',
    color: '#2e7d32',
    icono: <PointOfSaleIcon />
  },
  {
    titulo: 'Locales activos',
    valor: '4',
    detalle: 'Incluye ventasweb',
    color: '#ed6c02',
    icono: <StoreIcon />
  },
  {
    titulo: 'Pedidos web',
    valor: '23',
    detalle: '7 pendientes',
    color: '#9c27b0',
    icono: <ShoppingCartIcon />
  }
];

const ventasPorLocal = [
  {
    local: 'Local Centro',
    total: 485000,
    porcentaje: 86
  },
  {
    local: 'Local Shopping',
    total: 356200,
    porcentaje: 63
  },
  {
    local: 'Local Norte',
    total: 248900,
    porcentaje: 44
  },
  {
    local: 'ventasweb',
    total: 194400,
    porcentaje: 35
  }
];

const ventasSemana = [
  {
    dia: 'Lun',
    total: 48
  },
  {
    dia: 'Mar',
    total: 62
  },
  {
    dia: 'Mie',
    total: 54
  },
  {
    dia: 'Jue',
    total: 78
  },
  {
    dia: 'Vie',
    total: 91
  },
  {
    dia: 'Sab',
    total: 68
  },
  {
    dia: 'Dom',
    total: 41
  }
];

const productosDestacados = [
  'Munecas y accesorios',
  'Juegos didacticos',
  'Mochilas escolares',
  'Autos y pistas'
];

const formatearImporte = (valor) =>
  valor.toLocaleString('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0
  });

function HomePage() {
  const { usuario } = useAuth();

  return (
    <Box>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 2,
          mb: 3,
          flexWrap: 'wrap'
        }}
      >
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700 }}>
            Dashboard
          </Typography>
          <Typography color="text.secondary">
            Hola {usuario?.nombre}, este es el resumen operativo del dia.
          </Typography>
        </Box>

        <Chip
          label={usuario?.local?.nombre || 'Vista general'}
          color="primary"
          variant="outlined"
        />
      </Box>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: '1fr',
            sm: 'repeat(2, 1fr)',
            lg: 'repeat(4, 1fr)'
          },
          gap: 2,
          mb: 3
        }}
      >
        {resumen.map((item) => (
          <Paper
            key={item.titulo}
            elevation={0}
            sx={{
              p: 2.5,
              border: '1px solid',
              borderColor: 'divider'
            }}
          >
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                mb: 2
              }}
            >
              <Typography color="text.secondary">
                {item.titulo}
              </Typography>
              <Box
                sx={{
                  width: 40,
                  height: 40,
                  borderRadius: 2,
                  display: 'grid',
                  placeItems: 'center',
                  color: 'common.white',
                  bgcolor: item.color
                }}
              >
                {item.icono}
              </Box>
            </Box>

            <Typography variant="h5" sx={{ fontWeight: 700 }}>
              {item.valor}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {item.detalle}
            </Typography>
          </Paper>
        ))}
      </Box>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: '1fr',
            lg: '1.4fr 1fr'
          },
          gap: 2
        }}
      >
        <Paper
          elevation={0}
          sx={{
            p: 3,
            border: '1px solid',
            borderColor: 'divider'
          }}
        >
          <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
            Ventas por local
          </Typography>

          <Box sx={{ display: 'grid', gap: 2 }}>
            {ventasPorLocal.map((item) => (
              <Box key={item.local}>
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    mb: 0.75
                  }}
                >
                  <Typography>{item.local}</Typography>
                  <Typography sx={{ fontWeight: 700 }}>
                    {formatearImporte(item.total)}
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={item.porcentaje}
                  sx={{
                    height: 10,
                    borderRadius: 2
                  }}
                />
              </Box>
            ))}
          </Box>
        </Paper>

        <Paper
          elevation={0}
          sx={{
            p: 3,
            border: '1px solid',
            borderColor: 'divider'
          }}
        >
          <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
            Ventas de la semana
          </Typography>

          <Box
            sx={{
              height: 220,
              display: 'flex',
              alignItems: 'end',
              gap: 1.5
            }}
          >
            {ventasSemana.map((item) => (
              <Box
                key={item.dia}
                sx={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 1
                }}
              >
                <Box
                  sx={{
                    width: '100%',
                    height: `${item.total}%`,
                    minHeight: 24,
                    borderRadius: 1.5,
                    bgcolor: 'primary.main'
                  }}
                />
                <Typography variant="caption">
                  {item.dia}
                </Typography>
              </Box>
            ))}
          </Box>
        </Paper>

        <Paper
          elevation={0}
          sx={{
            p: 3,
            border: '1px solid',
            borderColor: 'divider'
          }}
        >
          <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
            Productos destacados
          </Typography>

          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {productosDestacados.map((producto) => (
              <Chip
                key={producto}
                label={producto}
                color="primary"
                variant="outlined"
              />
            ))}
          </Box>
        </Paper>

        <Paper
          elevation={0}
          sx={{
            p: 3,
            border: '1px solid',
            borderColor: 'divider'
          }}
        >
          <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
            Alertas
          </Typography>
          <Typography color="text.secondary">
            12 productos por debajo del stock minimo y 3 pedidos web pendientes
            de preparacion.
          </Typography>
        </Paper>
      </Box>
    </Box>
  );
}

export default HomePage;
