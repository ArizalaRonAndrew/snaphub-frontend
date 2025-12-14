// src/App.jsx - UPDATED VERSION WITH LOGOUT ROUTES
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

// 1. Auth & Entry Pages
import RoleSelection from "./pages/RoleSelection";
import UserAuth from "./pages/UserAuth";
import AdminLogin from "./pages/AdminLogin";

// 2. Client Side Pages
import UserLandingPage from "./pages/LandingPage";
import Services from "./components/Services";
import BookingPage from "./pages/BookingPage";
import StudentIdPage from "./pages/StudentIdPage";
import ServiceDetails from "./pages/ServiceDetails";

// 3. Logout Pages
import UserLogout from "./pages/UserLogout";
import AdminLogout from "./pages/admin/AdminLogout";

// 4. Admin Side Pages
import AdminLayout from "./layouts/AdminLayout";
import Dashboard from "./pages/admin/Dashboard";
import BookingList from "./pages/admin/BookingList";
import StudentIDList from "./pages/admin/StudentIDList";
import ManageServices from "./pages/admin/ManageServices";
import Reports from "./pages/admin/Reports";

// 5. Protection Wrapper
const ProtectedAdminRoute = ({ children }) => {
  const token = localStorage.getItem("authToken");
  return token ? children : <Navigate to="/admin-login" replace />;
};

function App() {
  return (
    <Router>
      <Routes>
        {/* --- MAIN ENTRY --- */}
        <Route path="/" element={<RoleSelection />} />

        {/* --- AUTH --- */}
        <Route path="/user-auth" element={<UserAuth />} />
        <Route path="/admin-login" element={<AdminLogin />} />

        {/* --- LOGOUT ROUTES --- */}
        <Route path="/user-logout" element={<UserLogout />} />
        <Route path="/admin-logout" element={<AdminLogout />} />

        {/* --- CLIENT FLOW --- */}
        <Route path="/home" element={<UserLandingPage />} />
        <Route path="/services" element={<Services />} />
        <Route path="/booking" element={<BookingPage />} />
        <Route path="/student-id" element={<StudentIdPage />} />
        <Route path="/service/:serviceId" element={<ServiceDetails />} />

        {/* --- ADMIN FLOW --- */}
        <Route
          path="/admin"
          element={
            <ProtectedAdminRoute>
              <AdminLayout />
            </ProtectedAdminRoute>
          }
        >
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="bookings" element={<BookingList />} />
          <Route path="students" element={<StudentIDList />} />
          <Route path="manage" element={<ManageServices />} />
          <Route path="reports" element={<Reports />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
