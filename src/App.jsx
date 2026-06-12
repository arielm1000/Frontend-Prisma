import {
  BrowserRouter,
  Routes,
  Route,
  Navigate
} from 'react-router-dom';
import LoginPage from './auth/pages/LoginPage';
import HomePage from './admin/pages/HomePage';
import DashboardLayout from './admin/layouts/DashboardLayout';
import CuentaCorrienteProveedoresPage from './admin/pages/CuentaCorrienteProveedoresPage';
import CuentaCorrienteTransportesPage from './admin/pages/CuentaCorrienteTransportesPage';
import PrivateRoute from './admin/routes/PrivateRoute';
import UsersPage from './admin/pages/UsersPage';
import RoleRoute from './admin/routes/RoleRoute';
import RolesPage from './admin/pages/RolesPage';
import EmpresasPage from './admin/pages/EmpresasPage';
import EnviosLocalesPage from './admin/pages/EnviosLocalesPage';
import LocalPage from './admin/pages/LocalPage';
import MarcasPage from './admin/pages/MarcasPage';
import PedidosProveedorPage from './admin/pages/PedidosProveedorPage';
import ProductosPage from './admin/pages/ProductosPage';
import ProveedoresPage from './admin/pages/ProveedoresPage';
import RubrosPage from './admin/pages/RubrosPage';
import SegmentosPage from './admin/pages/SegmentosPage';
import ShopHomePage from './public-shop/pages/ShopHomePage';
import TransportesPage from './admin/pages/TransportesPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* PUBLICA */}
        <Route
          path="/"
          element={<ShopHomePage />}
        />
        {/* LOGIN */}
        <Route
          path="/login"
          element={<LoginPage />}
        />
        {/* PRIVADA */}
        <Route
          path="/admin/home"
          element={
            <PrivateRoute>
              <DashboardLayout>
                <HomePage />
              </DashboardLayout>
            </PrivateRoute>
          }
        />
        <Route
          path="/admin/users"
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
          path="/admin/roles"
          element={
            <PrivateRoute>
              <DashboardLayout>
                <RolesPage />
              </DashboardLayout>
            </PrivateRoute>
          }
        />
        <Route
          path="/admin/empresas"
          element={
            <PrivateRoute>
              <DashboardLayout>
                <EmpresasPage />
              </DashboardLayout>
            </PrivateRoute>
          }
        />
        <Route
          path="/admin/locales"
          element={
            <PrivateRoute>
              <DashboardLayout>
                <LocalPage />
              </DashboardLayout>
            </PrivateRoute>
          }
        />
        <Route
          path="/admin/rubros"
          element={
            <PrivateRoute>
              <RoleRoute
                rolesPermitidos={['admin']}
              >
                <DashboardLayout>
                  <RubrosPage />
                </DashboardLayout>
              </RoleRoute>
            </PrivateRoute>
          }
        />
        <Route
          path="/admin/proveedores"
          element={
            <PrivateRoute>
              <RoleRoute
                rolesPermitidos={['admin']}
              >
                <DashboardLayout>
                  <ProveedoresPage />
                </DashboardLayout>
              </RoleRoute>
            </PrivateRoute>
          }
        />
        <Route
          path="/admin/segmentos"
          element={
            <PrivateRoute>
              <RoleRoute
                rolesPermitidos={['admin']}
              >
                <DashboardLayout>
                  <SegmentosPage />
                </DashboardLayout>
              </RoleRoute>
            </PrivateRoute>
          }
        />
        <Route
          path="/admin/marcas"
          element={
            <PrivateRoute>
              <RoleRoute
                rolesPermitidos={['admin']}
              >
                <DashboardLayout>
                  <MarcasPage />
                </DashboardLayout>
              </RoleRoute>
            </PrivateRoute>
          }
        />
        <Route
          path="/admin/productos"
          element={
            <PrivateRoute>
              <RoleRoute
                rolesPermitidos={['admin']}
              >
                <DashboardLayout>
                  <ProductosPage />
                </DashboardLayout>
              </RoleRoute>
            </PrivateRoute>
          }
        />
        <Route
          path="/admin/transportes"
          element={
            <PrivateRoute>
              <RoleRoute
                rolesPermitidos={['admin']}
              >
                <DashboardLayout>
                  <TransportesPage />
                </DashboardLayout>
              </RoleRoute>
            </PrivateRoute>
          }
        />
        <Route
          path="/admin/pedidos-proveedor"
          element={
            <PrivateRoute>
              <RoleRoute
                rolesPermitidos={['admin']}
              >
                <DashboardLayout>
                  <PedidosProveedorPage />
                </DashboardLayout>
              </RoleRoute>
            </PrivateRoute>
          }
        />
        <Route
          path="/admin/envios-locales"
          element={
            <PrivateRoute>
              <RoleRoute
                rolesPermitidos={['admin']}
              >
                <DashboardLayout>
                  <EnviosLocalesPage />
                </DashboardLayout>
              </RoleRoute>
            </PrivateRoute>
          }
        />
        <Route
          path="/admin/cuenta-corriente-proveedores"
          element={
            <PrivateRoute>
              <RoleRoute
                rolesPermitidos={['admin']}
              >
                <DashboardLayout>
                  <CuentaCorrienteProveedoresPage />
                </DashboardLayout>
              </RoleRoute>
            </PrivateRoute>
          }
        />
        <Route
          path="/admin/cuenta-corriente-transportes"
          element={
            <PrivateRoute>
              <RoleRoute
                rolesPermitidos={['admin']}
              >
                <DashboardLayout>
                  <CuentaCorrienteTransportesPage />
                </DashboardLayout>
              </RoleRoute>
            </PrivateRoute>
          }
        />
        <Route
          path="/home"
          element={<Navigate to="/admin/home" replace />}
        />
        <Route
          path="/users"
          element={<Navigate to="/admin/users" replace />}
        />
        <Route
          path="/roles"
          element={<Navigate to="/admin/roles" replace />}
        />
        <Route
          path="/empresas"
          element={<Navigate to="/admin/empresas" replace />}
        />
        <Route
          path="/locales"
          element={<Navigate to="/admin/locales" replace />}
        />
        <Route
          path="/rubros"
          element={<Navigate to="/admin/rubros" replace />}
        />
        <Route
          path="/proveedores"
          element={<Navigate to="/admin/proveedores" replace />}
        />
        <Route
          path="/segmentos"
          element={<Navigate to="/admin/segmentos" replace />}
        />
        <Route
          path="/marcas"
          element={<Navigate to="/admin/marcas" replace />}
        />
        <Route
          path="/productos"
          element={<Navigate to="/admin/productos" replace />}
        />
        <Route
          path="/transportes"
          element={<Navigate to="/admin/transportes" replace />}
        />
        <Route
          path="/pedidos-productos"
          element={<Navigate to="/admin/pedidos-proveedor" replace />}
        />
        <Route
          path="/envio-locales"
          element={<Navigate to="/admin/envios-locales" replace />}
        />
        <Route
          path="/cuenta-corriente-proveedores"
          element={
            <Navigate to="/admin/cuenta-corriente-proveedores" replace />
          }
        />
        <Route
          path="/cuenta-corriente-transportes"
          element={
            <Navigate to="/admin/cuenta-corriente-transportes" replace />
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
