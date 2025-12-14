import axios from "axios";
import { AuthService } from "./AuthService"; // <<< ADDED IMPORT

// Adjust this URL if your backend runs on a different port or address
const BASE_URL = "http://localhost:5000/api/bookings";

/* --------------------------
   USER-SIDE FUNCTIONS
--------------------------- */

export const SERVICE_PACKAGES = {
  wedding: ["Silver Package", "Gold Package"],
  debut: ["Basic Debut", "Premium Debut"],
  portrait: ["Standard Session", "Premium Session"],
  events: ["Basic Event", "Extended Event"],
  birthday: ["Kids Package", "Teen Package", "Family Birthday Package"],
  corporate: ["Corporate Basic", "Corporate Plus", "Corporate Premium"],
  other: ["General Package A", "General Package B"],
};

export function getPackages(service) {
  return SERVICE_PACKAGES[service] || [];
}

export async function submitBooking(formData) {
  try {
    // 1. Get the authentication token
    const token = AuthService.getToken(); //

    // Optional: Check if token exists
    if (!token) {
      // Return a clear error message if the user is not logged in
      return {
        success: false,
        error: { message: "Authentication token missing. Please log in." },
      };
    }

    // 2. Prepare the Authorization header
    const config = {
      headers: {
        Authorization: `Bearer ${token}`, // Use Bearer scheme
      },
    };

    // 3. Send the POST request with the authentication headers
    const res = await axios.post(BASE_URL, formData, config); // <<< MODIFIED
    return res.data;
  } catch (error) {
    // Improved error handling to show specific backend message
    return {
      success: false,
      error:
        error.response?.data?.message ||
        "Failed to submit booking. Please try again.",
    };
  }
}

export function readQueryParams() {
  const params = new URLSearchParams(window.location.search);
  return {
    service: params.get("service"),
    package: params.get("package"),
  };
}

/* --------------------------
   ADMIN-SIDE FUNCTIONS
--------------------------- */

export async function getAllBookings() {
  try {
    const res = await axios.get(BASE_URL);
    const data = res.data;

    // Smart Extraction: Handle [ ... ] or { data: [...] } or { bookings: [...] }
    if (Array.isArray(data)) return data;
    if (data && Array.isArray(data.data)) return data.data;
    if (data && Array.isArray(data.bookings)) return data.bookings;

    console.warn("Unexpected Booking API format:", data);
    return [];
  } catch (error) {
    console.error("Error fetching bookings:", error);
    return [];
  }
}

export async function updateBookingStatus(id, status) {
  try {
    const res = await axios.put(`${BASE_URL}/${id}`, { status });
    return res.data;
  } catch (error) {
    console.error("Error updating booking:", error);
    return null;
  }
}

export async function deleteBooking(id) {
  try {
    const res = await axios.delete(`${BASE_URL}/${id}`);
    return res.data;
  } catch (error) {
    console.error("Error deleting booking:", error);
    return null;
  }
}