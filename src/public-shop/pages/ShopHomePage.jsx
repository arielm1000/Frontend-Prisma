import {
  Box,
  Button,
  Container,
  IconButton,
  Paper,
  Typography
} from '@mui/material';
import LoginIcon from '@mui/icons-material/Login';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import KeyboardArrowLeftIcon from '@mui/icons-material/KeyboardArrowLeft';
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight';
import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';

const productosCarrusel = [
  {
    id: 1,
    nombre: 'Avengers Hulk',
    precio: 'Figura destacada',
    imagen: '/avengers hulk.png'
  },
  {
    id: 2,
    nombre: 'Avengers Iron Man',
    precio: 'Heroes y accion',
    imagen: '/avengers iron man.png'
  },
  {
    id: 3,
    nombre: 'Spiderman',
    precio: 'Superheroes',
    imagen: '/avengers spiderman.png'
  },
  {
    id: 4,
    nombre: 'Barbie',
    precio: 'Munecas y accesorios',
    imagen: '/Barbie.png'
  },
  {
    id: 5,
    nombre: 'Hot Wheels',
    precio: 'Autos y pistas',
    imagen: '/hot wheels.png'
  }
];

function ShopHomePage() {
  const [productoActivo, setProductoActivo] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setProductoActivo((actual) => (actual + 1) % productosCarrusel.length);
    }, 4000);

    return () => clearInterval(timer);
  }, []);

  const anterior = () => {
    setProductoActivo((actual) =>
      actual === 0 ? productosCarrusel.length - 1 : actual - 1
    );
  };

  const siguiente = () => {
    setProductoActivo((actual) => (actual + 1) % productosCarrusel.length);
  };

  const producto = productosCarrusel[productoActivo];

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f6f7fb' }}>
      <Box
        component="header"
        sx={{
          position: 'relative',
          minHeight: { xs: 340, md: 380 },
          overflow: 'hidden',
          bgcolor: 'common.white'
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            display: 'grid',
            gridTemplateColumns: {
              xs: '1fr',
              md: '1fr 1fr'
            }
          }}
        >
          <Box
            sx={{
              minHeight: { xs: 280, md: '100%' },
              backgroundImage:
                'linear-gradient(90deg, rgba(228,0,124,0.12), rgba(228,0,124,0.38)), url("/Barbie01.png")',
              backgroundSize: 'cover',
              backgroundPosition: 'center'
            }}
          />
          <Box
            sx={{
              minHeight: { xs: 280, md: '100%' },
              backgroundImage:
                'linear-gradient(90deg, rgba(0,86,179,0.18), rgba(255,132,0,0.24)), url("/hot wheels1.png")',
              backgroundSize: 'cover',
              backgroundPosition: 'center'
            }}
          />
        </Box>

        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            bgcolor: 'rgba(0,0,0,0.08)'
          }}
        />

        <Box
          sx={{
            position: 'relative',
            zIndex: 1,
            minHeight: { xs: 340, md: 380 },
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'flex-end',
              alignItems: 'center',
              gap: 1.5,
              px: { xs: 2, md: 4 },
              py: 2
            }}
          >
            <Button
              variant="contained"
              startIcon={<ShoppingCartIcon />}
              sx={{ bgcolor: '#111827' }}
            >
              Carrito
            </Button>
            <Button
              component={Link}
              to="/login"
              variant="contained"
              startIcon={<LoginIcon />}
              sx={{ bgcolor: '#e91e63' }}
            >
              Sistema
            </Button>
          </Box>

          <Box
            sx={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              px: 2
            }}
          >
            <Paper
              elevation={8}
              sx={{
                width: { xs: 150, md: 190 },
                height: { xs: 150, md: 190 },
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                p: 2,
                bgcolor: 'rgba(255,255,255,0.94)',
                border: '8px solid rgba(255,255,255,0.62)'
              }}
            >
              <Box
                component="img"
                src="/Logo.png"
                alt="Guindi Shopping Toys"
                sx={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  borderRadius: '50%'
                }}
              />
            </Paper>
          </Box>

          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              px: 2,
              pb: { xs: 2, md: 3 }
            }}
          >
            <Paper
              elevation={0}
              sx={{
                maxWidth: 760,
                p: { xs: 1.5, md: 2 },
                textAlign: 'center',
                bgcolor: 'rgba(255,255,255,0.9)',
                borderRadius: 2,
                border: '1px solid',
                borderColor: 'rgba(255,255,255,0.75)'
              }}
            >
              <Typography variant="h5" sx={{ fontWeight: 900 }}>
                Guindi Shopping Toys
              </Typography>
              <Typography color="text.secondary" sx={{ mt: 0.5, fontSize: 15 }}>
                Primer vistazo de la tienda online: juguetes, productos
                destacados y ventas web conectadas al sistema.
              </Typography>
            </Paper>
          </Box>
        </Box>
      </Box>

      <Container maxWidth="lg" sx={{ py: 3 }}>
        <Paper
          elevation={0}
          sx={{
            mb: 3,
            p: { xs: 2, md: 3 },
            borderRadius: 2,
            border: '1px solid',
            borderColor: 'divider',
            bgcolor: 'common.white',
            display: 'grid',
            gridTemplateColumns: {
              xs: '1fr',
              md: '80px 1fr 80px'
            },
            gap: 2,
            alignItems: 'center'
          }}
        >
          <IconButton
            onClick={anterior}
            sx={{
              justifySelf: 'center',
              width: 48,
              height: 48,
              bgcolor: '#f3f4f6'
            }}
          >
            <KeyboardArrowLeftIcon />
          </IconButton>

          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: {
                xs: '1fr',
                md: '260px 1fr'
              },
              gap: 3,
              alignItems: 'center',
              justifyItems: { xs: 'center', md: 'start' }
            }}
          >
            <Box
              component="img"
              src={producto.imagen}
              alt={producto.nombre}
              sx={{
                width: { xs: 220, md: 260 },
                height: 190,
                objectFit: 'contain'
              }}
            />
            <Box sx={{ textAlign: { xs: 'center', md: 'left' } }}>
              <Typography variant="overline" color="text.secondary">
                Productos destacados
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 900 }}>
                {producto.nombre}
              </Typography>
              <Typography color="text.secondary" sx={{ mt: 1 }}>
                {producto.precio}
              </Typography>
              <Button
                variant="contained"
                startIcon={<ShoppingCartIcon />}
                sx={{ mt: 2 }}
              >
                Agregar
              </Button>
            </Box>
          </Box>

          <IconButton
            onClick={siguiente}
            sx={{
              justifySelf: 'center',
              width: 48,
              height: 48,
              bgcolor: '#f3f4f6'
            }}
          >
            <KeyboardArrowRightIcon />
          </IconButton>
        </Paper>

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: '1fr',
              md: 'repeat(3, 1fr)'
            },
            gap: 2
          }}
        >
          {[
            {
              title: 'Munecas y accesorios',
              text: 'Seccion preparada para destacar lineas de Barbie y juguetes de fantasia.'
            },
            {
              title: 'Autos y pistas',
              text: 'Hot Wheels, vehiculos, pistas y productos de coleccion.'
            },
            {
              title: 'Heroes y figuras',
              text: 'Espacio para Avengers, superheroes y figuras de accion.'
            }
          ].map((item) => (
            <Paper
              key={item.title}
              elevation={0}
              sx={{
                p: 2.5,
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 2,
                bgcolor: 'common.white'
              }}
            >
              <Typography variant="h6" sx={{ fontWeight: 800 }}>
                {item.title}
              </Typography>
              <Typography color="text.secondary" sx={{ mt: 1 }}>
                {item.text}
              </Typography>
            </Paper>
          ))}
        </Box>
      </Container>
    </Box>
  );
}

export default ShopHomePage;
