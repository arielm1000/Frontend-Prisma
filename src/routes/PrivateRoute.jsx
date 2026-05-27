import { Navigate } from 'react-router-dom';


function PrivateRoute({ children }) {

  // verificar token

  const token = localStorage.getItem('token');

  // si no existe token

  if (!token) {

    return <Navigate to="/" />;

  }

  // si existe token

  return children;

}

export default PrivateRoute;