import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import {
  Box,
  Button,
  Container,
  Paper,
  TextField,
  Typography,
  Alert
} from '@mui/material';
import { loginRequest } from '../../services/auth.service';

function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const data = await loginRequest({
        email,
        password
      });
      // guardar token
/*       localStorage.setItem(
        'token',
        data.token
      );
      // guardar usuario
      localStorage.setItem(
        'usuario',
        JSON.stringify(data.usuario)
      ); */
      login(data);
      // redireccionar
      navigate('/admin/home');
    } catch (error) {
      setError(
        error.response?.data?.mensaje ||
        'Error login'
      );
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f6f7fb' }}>
      <Container maxWidth="sm">
      <Box
        sx={{
          height: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <Box
          sx={{
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center'
          }}
        >
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              mb: -4,
              zIndex: 2
            }}
          >
            <Paper
              elevation={8}
              sx={{
                width: 150,
                height: 150,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                p: 1.5,
                bgcolor: 'rgba(255,255,255,0.96)',
                border: '6px solid rgba(233,30,99,0.18)'
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

          <Paper
            elevation={0}
            sx={{
              width: '100%',
              p: { xs: 3, md: 4 },
              pt: { xs: 8, md: 9 },
              borderRadius: 4,
              border: '1px solid',
              borderColor: 'divider',
              boxShadow: '0 24px 70px rgba(15, 23, 42, 0.14)',
              bgcolor: 'rgba(255,255,255,0.96)'
            }}
          >
            <Typography
              variant="h4"
              textAlign="center"
              fontWeight={900}
              mb={0.5}
            >
              Guindi Shopping Toys
            </Typography>
            <Typography
              color="text.secondary"
              textAlign="center"
              mb={3}
            >
              Ingreso al sistema
            </Typography>
            {error && (
              <Alert
                severity="error"
                sx={{ mb: 2 }}
              >
                {error}
              </Alert>
            )}
            <form onSubmit={handleSubmit}>
              <TextField
                label="Email"
                type="email"
                fullWidth
                margin="normal"
                value={email}
                onChange={(e) =>
                  setEmail(e.target.value)
                }
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2
                  }
                }}
              />
              <TextField
                label="Password"
                type="password"
                fullWidth
                margin="normal"
                value={password}
                onChange={(e) =>
                  setPassword(e.target.value)
                }
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2
                  }
                }}
              />
              <Button
                type="submit"
                variant="contained"
                fullWidth
                sx={{
                  mt: 2.5,
                  minHeight: 48,
                  borderRadius: 2,
                  fontWeight: 800
                }}
              >
                Ingresar
              </Button>
            </form>
          </Paper>
        </Box>
      </Box>
      </Container>
    </Box>
  );
}
export default LoginPage;
