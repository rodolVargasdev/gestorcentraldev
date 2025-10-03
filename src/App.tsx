
import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './stores/authStore';
import { AuthService } from './services/authService';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';

import { EmployeesPage } from './pages/EmployeesPage';
import { NewEmployeePage } from './pages/NewEmployeePage';
import { EditEmployeePage } from './pages/EditEmployeePage';
import { ViewEmployeePage } from './pages/ViewEmployeePage';
import { EmployeeAvailabilityPage } from './pages/EmployeeAvailabilityPage';
import { NewLicensePage } from './pages/NewLicensePage';
import { LicenseHistoryPage } from './pages/LicenseHistoryPage';
import { ViewLicensePage } from './pages/ViewLicensePage';
import { EditLicensePage } from './pages/EditLicensePage';
import { ReportsPage } from './pages/ReportsPage';



function App() {
  const { setUser, setLoading } = useAuthStore();

  useEffect(() => {
    const unsubscribe = AuthService.onAuthStateChanged((user) => {
      setUser(user);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [setUser, setLoading]);

  return (
    <Router>
      <div className="App">

        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard"
            element={<Navigate to="/" replace />}
          />


          <Route
            path="/employees"
            element={
              <ProtectedRoute>
                <EmployeesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/employees/new"
            element={
              <ProtectedRoute>
                <NewEmployeePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/employees/edit/:id"
            element={
              <ProtectedRoute>
                <EditEmployeePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/employees/view/:id"
            element={
              <ProtectedRoute>
                <ViewEmployeePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/employees/:employeeId/availability"
            element={
              <ProtectedRoute>
                <EmployeeAvailabilityPage />
              </ProtectedRoute>
            }
          />
                 <Route
         path="/employees/:employeeId/new-license"
         element={
           <ProtectedRoute>
             <NewLicensePage />
           </ProtectedRoute>
         }
       />
                  <Route
          path="/employees/:employeeId/license-history"
          element={
            <ProtectedRoute>
              <LicenseHistoryPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/employees/:employeeId/view-license/:requestId"
          element={
            <ProtectedRoute>
              <ViewLicensePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/employees/:employeeId/edit-license/:requestId"
          element={
            <ProtectedRoute>
              <EditLicensePage />
            </ProtectedRoute>
          }
        />

          <Route
            path="/reports"
            element={
              <ProtectedRoute>
                <ReportsPage />
              </ProtectedRoute>
            }
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
