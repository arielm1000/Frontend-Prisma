import {
  BrowserRouter,
  Routes,
  Route
} from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import HomePage from './pages/HomePage';
import DashboardLayout from './layouts/DashboardLayout';
import PrivateRoute from './routes/PrivateRoute';
import UsersPage from './pages/UsersPage';
import RoleRoute from './routes/RoleRoute';
import RolesPage from './pages/RolesPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* LOGIN */}
        <Route
          path="/"
          element={<LoginPage />}
        />
        {/* PRIVADA */}
        <Route
          path="/home"
          element={
            <PrivateRoute>
              <DashboardLayout>
                <HomePage />
              </DashboardLayout>
            </PrivateRoute>
          }
        />
        <Route
          path="/users"
          element={
            <PrivateRoute>
              <RoleRoute
                rolesPermitidos={['admin']}
              >
                <DashboardLayout>
                  <UsersPage />
                </DashboardLayout>
              </RoleRoute>
            </PrivateRoute>
          }
        />
        <Route
          path="/roles"
          element={
            <PrivateRoute>
              <DashboardLayout>
                <RolesPage />
              </DashboardLayout>
            </PrivateRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;