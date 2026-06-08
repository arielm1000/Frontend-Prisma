import { Navigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

function RoleRoute({
  children,
  rolesPermitidos
}) {
  const { usuario } = useAuth();
  // no login
  if (!usuario) {
    return <Navigate to="/login" />;
  }
  // verificar rol
  if (
    !rolesPermitidos.includes(usuario.rol)
  ) {
    return <Navigate to="/admin/home" />;
  }
  return children;
}

export default RoleRoute;
