import {
  AppBar,
  Toolbar,
  Typography,
  Box,
  Drawer,
  List,
  ListItem,
  ListItemText,
  ListItemButton
} from '@mui/material';
import Button from '@mui/material/Button';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { useState } from 'react';
import MenuIcon from '@mui/icons-material/Menu';
import IconButton from '@mui/material/IconButton';
import HomeIcon from '@mui/icons-material/Home';
import PeopleIcon from '@mui/icons-material/People';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';

const drawerWidth = 240;
const drawerCollapsed = 70;

function DashboardLayout({ children }) {
  const navigate = useNavigate();
  const { logout, usuario } = useAuth();
  const [openMenu, setOpenMenu] = useState(true);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const toggleMenu = () => {
    setOpenMenu(!openMenu);
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
        <Toolbar>
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

            <Typography variant="h6">
              Proyecto Base
            </Typography>
            <Button
              color="inherit"
              onClick={handleLogout}
            >
              Logout
            </Button>
          </Box>
        </Toolbar>
      </AppBar>
      {/* SIDEBAR */}
{/*       <Drawer
        variant="permanent"
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: drawerWidth,
            boxSizing: 'border-box'
          }
        }}
      > */}
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
        <Toolbar />
        <Box sx={{ overflow: 'auto' }}>
          <List>
            <ListItemButton
              component={Link}
              to="/home"
            >
{/*               <ListItemText primary="Inicio" /> */}
              <>
                <HomeIcon />
                {
                  openMenu && (
                    <ListItemText
                      primary="Inicio"
                      sx={{ ml: 2 }}
                    />
                  )
                }
              </>
            </ListItemButton>
            {
              usuario?.rol === 'admin' && (
                <ListItemButton
                  component={Link}
                  to="/users"
                >
{/*                   <ListItemText
                    primary="Usuarios"
                  /> */}
                  <>
                    <PeopleIcon />
                    {
                      openMenu && (
                        <ListItemText
                          primary="Usuarios"
                          sx={{ ml: 2 }}
                        />
                      )
                    }
                  </>                  
                </ListItemButton>
              )
            }
            {
              usuario?.rol === 'admin' && (
                <ListItemButton
                  component={Link}
                  to="/roles"
                >
{/*                   <ListItemText
                    primary="Roles"
                  /> */}
                  <>
                    <AdminPanelSettingsIcon />
                    {
                      openMenu && (
                        <ListItemText
                          primary="Roles"
                          sx={{ ml: 2 }}
                        />
                      )
                    }
                  </>
                </ListItemButton>
              )
            }
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
        <Toolbar />
        {children}
      </Box>
    </Box>
  );
}

export default DashboardLayout;