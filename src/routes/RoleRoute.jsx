import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function RoleRoute({
  children,
  rolesPermitidos
}) {
  const { usuario } = useAuth();
  // no login
  if (!usuario) {
    return <Navigate to="/" />;
  }
  // verificar rol
  if (
    !rolesPermitidos.includes(usuario.rol)
  ) {
    return <Navigate to="/home" />;
  }
  return children;
}

export default RoleRoute;