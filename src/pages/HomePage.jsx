import { useAuth } from '../context/AuthContext';


function HomePage() {

  const { usuario } = useAuth();

  return (

    <div>

      <h1>Bienvenido</h1>

      <h2>{usuario?.nombre}</h2>

      <p>{usuario?.email}</p>

      <p>Rol: {usuario?.rol}</p>

    </div>

  );

}

export default HomePage;