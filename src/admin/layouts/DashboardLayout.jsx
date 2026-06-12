import {
  AppBar,
  Toolbar,
  Typography,
  Box,
  Drawer,
  List,
  ListItemText,
  ListItemButton
} from '@mui/material';
import Button from '@mui/material/Button';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { Link } from 'react-router-dom';
import { useState } from 'react';
import MenuIcon from '@mui/icons-material/Menu';
import IconButton from '@mui/material/IconButton';
import HomeIcon from '@mui/icons-material/Home';
import PeopleIcon from '@mui/icons-material/People';
import StoreIcon from '@mui/icons-material/Store';
import BusinessIcon from '@mui/icons-material/Business';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import InventoryIcon from '@mui/icons-material/Inventory';
import CategoryIcon from '@mui/icons-material/Category';
import SellIcon from '@mui/icons-material/Sell';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import PaymentsIcon from '@mui/icons-material/Payments';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import PointOfSaleIcon from '@mui/icons-material/PointOfSale';
import AssignmentIcon from '@mui/icons-material/Assignment';
import MoveToInboxIcon from '@mui/icons-material/MoveToInbox';
import UndoIcon from '@mui/icons-material/Undo';
import AssessmentIcon from '@mui/icons-material/Assessment';

const drawerWidth = 240;
const drawerCollapsed = 70;

const menuSections = [
  {
    title: 'Administración',
    roles: ['admin'],
    items: [
      {
        label: 'Usuarios',
        path: '/admin/users',
        icon: <PeopleIcon />
      },
      {
        label: 'Roles',
        path: '/admin/roles',
        icon: <AdminPanelSettingsIcon />
      },
      {
        label: 'Empresas',
        path: '/admin/empresas',
        icon: <BusinessIcon />
      },
      {
        label: 'Locales',
        path: '/admin/locales',
        icon: <StoreIcon />
      }
    ]
  },
  {
    title: 'Bases',
    roles: ['admin', 'supervisor'],
    items: [
      {
        label: 'Productos',
        path: '/admin/productos',
        icon: <InventoryIcon />
      },
      {
        label: 'Rubros',
        path: '/admin/rubros',
        icon: <CategoryIcon />
      },
      {
        label: 'Segmentos',
        path: '/admin/segmentos',
        icon: <SellIcon />
      },
      {
        label: 'Marcas',
        path: '/admin/marcas',
        icon: <SellIcon />
      },
      {
        label: 'Tarjetas',
        path: '/tarjetas',
        icon: <CreditCardIcon />,
        disabled: true
      },
      {
        label: 'Formas de Pago',
        path: '/formas-pago',
        icon: <PaymentsIcon />,
        disabled: true
      },
      {
        label: 'Proveedores',
        path: '/admin/proveedores',
        icon: <LocalShippingIcon />
      },
      {
        label: 'Transportes',
        path: '/admin/transportes',
        icon: <LocalShippingIcon />
      }
    ]
  },
  {
    title: 'Movimientos',
    roles: ['admin', 'supervisor', 'cajero', 'ventas'],
    items: [
      {
        label: 'Ventas',
        path: '/ventas',
        icon: <PointOfSaleIcon />,
        disabled: true
      },
      {
        label: 'Pedido de Productos',
        path: '/admin/pedidos-proveedor',
        icon: <AssignmentIcon />
      },
      {
        label: 'Cta Cte Proveedores',
        path: '/admin/cuenta-corriente-proveedores',
        icon: <PaymentsIcon />
      },
      {
        label: 'Cta Cte Transportes',
        path: '/admin/cuenta-corriente-transportes',
        icon: <LocalShippingIcon />
      },
      {
        label: 'Ingreso de Productos',
        path: '/ingreso-productos',
        icon: <MoveToInboxIcon />,
        disabled: true
      },
      {
        label: 'Envío a Locales',
        path: '/admin/envios-locales',
        icon: <LocalShippingIcon />
      },
      {
        label: 'Devoluciones',
        path: '/devoluciones',
        icon: <UndoIcon />,
        disabled: true
      }
    ]
  },
  {
    title: 'Informes',
    roles: ['admin', 'supervisor'],
    items: [
      {
        label: 'Ventas',
        path: '/informes/ventas',
        icon: <AssessmentIcon />,
        disabled: true
      }
    ]
  }
];

function DashboardLayout({ children }) {
  const navigate = useNavigate();
  const { logout, usuario } = useAuth();
  const [openMenu, setOpenMenu] = useState(true);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const toggleMenu = () => {
    setOpenMenu(!openMenu);
  };

  const puedeVer = (rolesPermitidos) => {
    return rolesPermitidos.includes(usuario?.rol);
  };

  return (
    <Box sx={{ display: 'flex' }}>
      {/* NAVBAR */}
      <AppBar
        position="fixed"
        sx={{
          zIndex: 1201
        }}
      >
        <Toolbar sx={{ minHeight: 72 }}>
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              width: '100%',
              alignItems: 'center'
            }}
          >
            <IconButton
              color="inherit"
              edge="start"
              onClick={toggleMenu}
            >
              <MenuIcon />
            </IconButton>

            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1
              }}
            >
              <Box
                component="img"
                src="/Logo.png"
                alt="Guindi Shopping Toys"
                sx={{
                  width: 64,
                  height: 64,
                  objectFit: 'cover',
                  borderRadius: 2,
                  bgcolor: 'common.white'
                }}
              />

              <Typography
                variant="h6"
                sx={{
                  fontWeight: 700,
                  lineHeight: 1.1
                }}
              >
                Guindi Shopping Toys
              </Typography>
            </Box>

            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 2
              }}
            >
              <Typography
                variant="body2"
                sx={{
                  color: 'inherit',
                  fontWeight: 500
                }}
              >
                {usuario?.nombre} | {usuario?.rol}
                {usuario?.local?.nombre
                  ? ` | ${usuario.local.nombre}`
                  : ''}
              </Typography>

              <Button
                color="inherit"
                onClick={handleLogout}
              >
                Logout
              </Button>
            </Box>
          </Box>
        </Toolbar>
      </AppBar>
        <Drawer
          variant="permanent"
          sx={{
            width: openMenu
              ? drawerWidth
              : drawerCollapsed,
            flexShrink: 0,
            '& .MuiDrawer-paper': {
              width: openMenu
                ? drawerWidth
                : drawerCollapsed,
              overflowX: 'hidden',
              boxSizing: 'border-box',
              transition: 'width 0.3s ease'
            }
          }}
        >
        <Toolbar sx={{ minHeight: 72 }} />
        <Box sx={{ overflow: 'auto' }}>
          <List>
            <ListItemButton
              component={Link}
              to="/admin/home"
            >
              <>
                <HomeIcon />
                {
                  openMenu && (
                    <ListItemText
                      primary="Dashboard"
                      sx={{ ml: 2 }}
                    />
                  )
                }
              </>
            </ListItemButton>
            {menuSections
              .filter((section) => puedeVer(section.roles))
              .map((section) => (
                <Box key={section.title}>
                  {openMenu && (
                    <Typography
                      variant="caption"
                      sx={{
                        display: 'block',
                        px: 2,
                        pt: 2,
                        pb: 0.5,
                        color: 'text.secondary',
                        fontWeight: 700,
                        textTransform: 'uppercase'
                      }}
                    >
                      {section.title}
                    </Typography>
                  )}

                  {section.items.map((item) => (
                    <ListItemButton
                      key={item.path}
                      component={item.disabled ? 'button' : Link}
                      to={item.disabled ? undefined : item.path}
                      disabled={item.disabled}
                      sx={{
                        minHeight: 44,
                        justifyContent: openMenu ? 'initial' : 'center',
                        px: 2.5
                      }}
                    >
                      {item.icon}

                      {openMenu && (
                        <ListItemText
                          primary={item.label}
                          sx={{ ml: 2 }}
                        />
                      )}
                    </ListItemButton>
                  ))}
                </Box>
              ))}
          </List>
        </Box>
      </Drawer>
      {/* CONTENIDO */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3
        }}
      >
        <Toolbar sx={{ minHeight: 72 }} />
        {children}
      </Box>
    </Box>
  );
}

export default DashboardLayout;
