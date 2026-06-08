import { useState } from 'react';
import { AuthContext } from './auth-context';


// =========================
// PROVIDER
// =========================

export function AuthProvider({ children }) {

  // obtener usuario guardado

  const [usuario, setUsuario] = useState(() => {

    const user = localStorage.getItem('usuario');

    return user
      ? JSON.parse(user)
      : null;

  });


  // =========================
  // LOGIN
  // =========================

  const login = (data) => {

    localStorage.setItem(
      'token',
      data.token
    );

    localStorage.setItem(
      'usuario',
      JSON.stringify(data.usuario)
    );

    setUsuario(data.usuario);

  };


  // =========================
  // LOGOUT
  // =========================

  const logout = () => {

    localStorage.removeItem('token');

    localStorage.removeItem('usuario');

    setUsuario(null);

  };


  return (

    <AuthContext.Provider
      value={{
        usuario,
        login,
        logout
      }}
    >

      {children}

    </AuthContext.Provider>

  );

}


