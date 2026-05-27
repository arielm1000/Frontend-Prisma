import {
  AppBar,
  Toolbar,
  Typography,
  Box,
  Drawer,
  List,
  ListItem,
  ListItemText
} from '@mui/material';
import Button from '@mui/material/Button';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
const drawerWidth = 240;

function DashboardLayout({ children }) {
  const navigate = useNavigate();
  const { logout, usuario } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/');
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
      <Drawer
        variant="permanent"
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: drawerWidth,
            boxSizing: 'border-box'
          }
        }}
      >
        <Toolbar />
        <Box sx={{ overflow: 'auto' }}>
          <List>
            <ListItem
              button
              component={Link}
              to="/home"
            >
              <ListItemText primary="Inicio" />
            </ListItem>
            {
              usuario?.rol === 'admin' && (
                <ListItem
                  button
                  component={Link}
                  to="/users"
                >
                  <ListItemText
                    primary="Usuarios"
                  />
                </ListItem>
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