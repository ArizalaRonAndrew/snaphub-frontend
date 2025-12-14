import axios from "axios";

export const AuthService = {
  
  USER_BASE_URL: "http://localhost:5000/api/users",
  ADMIN_BASE_URL: "http://localhost:5000/api/v1/admin",

  // NEW UTILITY FUNCTION: Delete a record (Booking or Student ID)
  async deleteRecord(type, id) {
    const token = this.getToken();
    if (!token) return { success: false, message: "Authentication required." };
    
    let url;
    if (type === 'booking') {
        // Calls DELETE /api/bookings/:id
        url = `http://localhost:5000/api/bookings/${id}`;
    } else if (type === 'student') {
        // Calls DELETE /api/student-id/:id
        url = `http://localhost:5000/api/student-id/${id}`;
    } else {
        return { success: false, message: "Invalid record type." };
    }
    
    try {
        const response = await axios.delete(url, {
            headers: { Authorization: `Bearer ${token}` }
        });
        return response.data;
    } catch (error) {
        const errorMessage = error.response?.data?.message || error.message;
        console.error(`Error deleting ${type} ${id}:`, errorMessage);
        
        // If the server returns 404 (Not Found), we assume the record was already deleted
        if (error.response?.status === 404) {
            return { success: true, message: `${type} record already removed.` };
        }
        
        return { success: false, message: `Deletion failed for ${type}.` };
    }
  },

  // --- USER-SIDE AUTHENTICATION ---
  async userRegister(userName, userPassword) {
    try {
      const response = await axios.post(
        this.USER_BASE_URL,
        // Using keys expected by backend user.controller.js
        { userName, userPassword }
      );
      return response.data;
    } catch (err) {
      throw new Error(err.response?.data?.message || "Registration failed.");
    }
  },

  async userLogin(userName, userPassword) {
    try {
      const response = await axios.post(
        `${this.USER_BASE_URL}/login`,
        // Using keys expected by backend user.controller.js
        { userName, userPassword }
      );
      return response.data;
    } catch (err) {
      throw new Error(err.response?.data?.message || "Login failed.");
    }
  },

  // --- ADMIN-SIDE AUTHENTICATION ---
  async adminLogin(username, password) {
    try {
      const response = await axios.post(`${this.ADMIN_BASE_URL}/login`, {
        username,
        password,
      });
      return response.data;
    } catch (err) {
      throw new Error(err.response?.data?.message || "Admin Login failed.");
    }
  },

  // Retaining original methods for backward compatibility, pointing them to Admin logic
  async register(username, password) {
    return this.adminRegister(username, password);
  },
  async login(username, password) {
    return this.adminLogin(username, password);
  },
  async adminRegister(username, password) {
    try {
      const response = await axios.post(`${this.ADMIN_BASE_URL}/register`, {
        username,
        password,
      });
      return response.data;
    } catch (err) {
      throw new Error(err.response?.data?.message || "Registration failed.");
    }
  },

  // async getCurrentUser, async updateUser, async deleteUser (retained from original structure)
  // NOTE: These methods in the original file point to the ADMIN_BASE_URL.

  // --- SESSION MANAGEMENT ---
  logout() {
    // Only clear the keys. Components handle navigation.
    localStorage.removeItem("authToken");
    localStorage.removeItem("user");
    localStorage.removeItem("currentUser"); // Clear old/deprecated key for safety
  },

  setSession(token, user) {
    localStorage.setItem("authToken", token);
    localStorage.setItem("user", JSON.stringify(user));
    localStorage.setItem("currentUser", JSON.stringify(user)); // For backward compatibility
  },

  getToken() {
    return localStorage.getItem("authToken");
  },

  // FIX 2: ADD THE MISSING FUNCTION
  getCurrentUserObject() {
    const userStr = localStorage.getItem("user");
    if (userStr) {
      try {
        return JSON.parse(userStr);
      } catch (e) {
        console.error("Error parsing user data from localStorage:", e);
        return null;
      }
    }
    return null;
  },

  // Original helper function (retained)
  getCurrentUserID() {
    const userData = this.getCurrentUserObject();
    // Assuming ID is stored as 'id' or 'userID' in the user object
    return userData ? userData.id || userData.userID : null;
  },
};