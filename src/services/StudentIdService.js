import axios from "axios";
import { AuthService } from "./AuthService"; // <<< ADDED IMPORT

// Ensure port matches your backend (5000 based on your previous files)
const BASE_URL = "http://localhost:5000/api/student-id";

// --- USER FUNCTIONS (Keep existing) ---
function dataURLtoFile(dataurl, filename) {
  const arr = dataurl.split(",");
  const mime = arr[0].match(/:(.*?);/)[1];
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new Blob([u8arr], { type: mime });
}

export async function submitStudentApplication(
  formData,
  photoDataURL,
  signatureDataURL
) {
  // NEW: Retrieve the authentication token
  const token = AuthService.getToken(); 

  if (!token) {
    // Handle case where token is missing (user might be logged out)
    console.error("Authentication token missing for submission.");
    return { success: false, message: "Authentication required. Please log in again." };
  }

  const form = new FormData();
  form.append("lrn", formData.lrn);
  form.append("firstname", formData.firstname);
  form.append("middlename", formData.middlename);
  form.append("lastname", formData.lastname);
  form.append("phone", formData.phone);
  form.append("grade", formData.grade);
  form.append("section", formData.section);
  form.append("emName", formData.emName);
  form.append("emPhone", formData.emPhone);
  form.append("emAddress", formData.emAddress);

  if (photoDataURL) {
    const photoBlob = dataURLtoFile(photoDataURL, "photo.png");
    form.append("photo", photoBlob, "photo.png");
  }
  if (signatureDataURL) {
    const signatureBlob = dataURLtoFile(signatureDataURL, "signature.png");
    form.append("signature", signatureBlob, "signature.png");
  }

  try {
    const response = await axios.post(BASE_URL, form, {
      headers: { 
        "Content-Type": "multipart/form-data",
        // ADDED: Include the Authorization header with the Bearer token
        "Authorization": `Bearer ${token}` 
      },
    });
    return response.data;
  } catch (error) {
    console.error("Submission error:", error.response?.data?.message || error.message);
    return { success: false, message: "Application failed." };
  }
}

// NEW: Function to get applications for the current user
export async function getUserStudentApplications() {
  // Get the current user ID (assuming this returns the student's LRN/ID)
  const userId = AuthService.getCurrentUserID(); 
  const token = AuthService.getToken(); 

  if (!userId || !token) {
    console.error("Cannot fetch user applications: User or token missing.");
    return [];
  }
  
  try {
    const config = {
        headers: { Authorization: `Bearer ${token}` },
    };
    
    // Calls the new backend route /api/student-id/user/:id
    const response = await axios.get(`${BASE_URL}/user/${userId}`, config); 
    
    // Backend returns: { success: true, applications: [...] }
    if (response.data && Array.isArray(response.data.applications)) {
        return response.data.applications;
    }
    return [];
  } catch (error) {
    console.error("Error fetching user applications:", error.response?.data?.message || error.message);
    return [];
  }
}


/* --------------------------
   ADMIN-SIDE FUNCTIONS
--------------------------- */

export async function getAllStudents() {
  try {
    const response = await axios.get(BASE_URL);
    // Backend returns: { success: true, students: [...] }
    if (response.data && Array.isArray(response.data.students)) {
      return response.data.students;
    }
    return [];
  } catch (error) {
    console.error("Error fetching students:", error);
    return [];
  }
}

export async function updateStudentStatus(id, status) {
  try {
    // Send a PUT request to update the student's status
    const response = await axios.put(`${BASE_URL}/${id}`, { status });
    return response.data;
  } catch (error) {
    console.error("Error updating student status:", error);
    return { success: false, message: "Update failed" };
  }
}

export async function deleteStudent(id) {
  try {
    const response = await axios.delete(`${BASE_URL}/${id}`);
    return response.data;
  } catch (error) {
    console.error("Error deleting student:", error);
    return null;
  }
}