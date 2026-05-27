import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Box,
  Button,
  Container,
  Paper,
  TextField,
  Typography,
  Alert
} from '@mui/material';
import { loginRequest } from '../services/auth.service';

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
      navigate('/home');
    } catch (error) {
      setError(
        error.response?.data?.mensaje ||
        'Error login'
      );
    }
  };

  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          height: '100vh',
          display: 'flex',
          alignItems: 'center'
        }}
      >
        <Paper
          elevation={4}
          sx={{
            width: '100%',
            p: 4
          }}
        >
          <Typography
            variant="h4"
            mb={3}
          >
            Login
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
            />
            <Button
              type="submit"
              variant="contained"
              fullWidth
              sx={{ mt: 2 }}
            >
              Ingresar
            </Button>
          </form>
        </Paper>
      </Box>
    </Container>
  );
}
export default LoginPage;