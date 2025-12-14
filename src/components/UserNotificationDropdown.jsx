// src/components/UserNotificationDropdown.jsx
import { useState, useEffect, useRef } from "react";
// ADDED Trash2 for delete functionality
import { Bell, CheckCheck, Calendar, IdCard, Trash2 } from "lucide-react"; 
import { AuthService } from "../services/AuthService"; 

const LOCAL_STORAGE_KEY = "snaphub_read_notifications";
// NEW KEY: Used to track the last known status of each item to detect changes
const STATUS_TRACKING_KEY = "snaphub_last_seen_status"; 


// Helper to get read IDs from local storage (Existing)
const getReadNotificationIds = (userID) => {
  if (!userID) return new Set();
  try {
    const data = localStorage.getItem(LOCAL_STORAGE_KEY);
    const parsed = data ? JSON.parse(data) : {};
    // Retrieve the set of read IDs for the current user
    return new Set(parsed[userID] || []);
  } catch (e) {
    console.error("Error reading from localStorage", e);
    return new Set();
  }
};

// Helper to save read IDs to local storage (Existing)
const setReadNotificationIds = (userID, readIds) => {
  if (!userID) return;
  try {
    const data = localStorage.getItem(LOCAL_STORAGE_KEY);
    const parsed = data ? JSON.parse(data) : {};
    parsed[userID] = Array.from(readIds);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(parsed));
  } catch (e) {
    console.error("Error writing to localStorage", e);
  }
};

// NEW HELPER: Get last seen status map from local storage
const getLastSeenStatusMap = (userID) => {
  if (!userID) return {};
  try {
    const data = localStorage.getItem(STATUS_TRACKING_KEY);
    const parsed = data ? JSON.parse(data) : {};
    return parsed[userID] || {};
  } catch (e) {
    console.error("Error reading status from localStorage", e);
    return {};
  }
};

// NEW HELPER: Save last seen status map to local storage
const setLastSeenStatusMap = (userID, statusMap) => {
  if (!userID) return;
  try {
    const data = localStorage.getItem(STATUS_TRACKING_KEY);
    const parsed = data ? JSON.parse(data) : {};
    parsed[userID] = statusMap;
    localStorage.setItem(STATUS_TRACKING_KEY, JSON.stringify(parsed));
  } catch (e) {
    console.error("Error writing status to localStorage", e);
  }
};


export default function UserNotificationDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const dropdownRef = useRef(null);

  // FIX 1: Use AuthService helper for fetching User ID
  const currentUserID = AuthService.getCurrentUserID();

  // MODIFIED FUNCTION: Database-functional delete
  const deleteNotification = async (id) => {
    
    // Parse the actual record ID and type from the synthetic notification ID (e.g., 'booking-123' -> 'booking', '123')
    const parts = id.split('-'); 
    if (parts.length !== 2) {
        console.error("Invalid notification ID format for deletion:", id);
        return;
    }
    const recordType = parts[0]; // 'booking' or 'student'
    const recordId = parts[1]; // The bookingID or student ID primary key

    // Attempt to delete the source record from the database
    const result = await AuthService.deleteRecord(recordType, recordId);
    
    if (result.success) {
      console.log(`Successfully deleted ${recordType} record ${recordId} from DB.`);
    } else {
      console.warn(`Deletion failed for ${recordType} record ${recordId}: ${result.message}`);
      // Log error but proceed to remove notification from view anyway to clean up the user's view.
    }

    // Always remove the notification from the local state
    setNotifications((prevNotifications) =>
      prevNotifications.filter((notif) => notif.id !== id)
    );
  };

  // MODIFIED FUNCTION: Update read status AND last seen status
  const markAsRead = (id) => {
    if (!currentUserID) return;

    // Get existing read IDs and add the specific ID
    const currentReadIds = getReadNotificationIds(currentUserID);
    currentReadIds.add(id);

    // Persist the updated set of read IDs
    setReadNotificationIds(currentUserID, currentReadIds);
    
    // NEW: Update status map so the bell doesn't immediately show unread again
    const notifToMark = notifications.find(n => n.id === id);
    if (notifToMark) {
        const currentStatusMap = getLastSeenStatusMap(currentUserID);
        currentStatusMap[id] = notifToMark.status;
        setLastSeenStatusMap(currentUserID, currentStatusMap);
    }


    // Update local state
    setNotifications((prevNotifications) =>
      prevNotifications.map((notif) =>
        notif.id === id ? { ...notif, isRead: true } : notif
      )
    );
  };
  
  // MODIFIED FUNCTION: Update read status AND last seen status for all
  const markAllAsRead = () => {
    if (!currentUserID) return;
    
    // Get all current notification IDs
    const allIds = notifications.map(n => n.id);
    
    // Get existing read IDs and add all current IDs
    const currentReadIds = getReadNotificationIds(currentUserID);
    allIds.forEach(id => currentReadIds.add(id));

    // Persist the updated set of read IDs
    setReadNotificationIds(currentUserID, currentReadIds);

    // NEW: Update status map for all notifications
    const currentStatusMap = getLastSeenStatusMap(currentUserID);
    notifications.forEach(notif => {
        currentStatusMap[notif.id] = notif.status;
    });
    setLastSeenStatusMap(currentUserID, currentStatusMap);
    
    // Update local state
    setNotifications((prevNotifications) =>
      prevNotifications.map((notif) => ({ ...notif, isRead: true }))
    );
  };

  // Fetch notifications for current user
  const fetchNotifications = async () => {
    // FIX 2: Check if User ID exists
    if (!currentUserID) {
        setNotifications([]); // Clear notifications if no user
        return; 
    } 

    try {
      // NEW: Retrieve the authentication token
      const token = AuthService.getToken();
      if (!token) {
        console.error("Authentication token not found.");
        setNotifications([]);
        return;
      }
      
      const authHeaders = {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      };

      // Get the persistently stored read IDs (for general read/unread state)
      const readIds = getReadNotificationIds(currentUserID);
      
      // NEW: Get the last seen status map
      const lastSeenStatusMap = getLastSeenStatusMap(currentUserID);
      const newSeenStatusMap = {}; // To store the statuses found in this fetch


      // Fetch user's bookings
      // FIX 3: Use currentUserID in the URL AND ADD AUTH HEADERS
      const bookingRes = await fetch(
        `http://localhost:5000/api/bookings/user/${currentUserID}`,
        authHeaders // <--- ADDED AUTH HEADERS
      );
      
      if (!bookingRes.ok) throw new Error(`Booking fetch failed: ${bookingRes.statusText}`);

      const bookingData = await bookingRes.json();

      // Fetch user's student ID applications
      // FIX 4: Use currentUserID in the URL AND ADD AUTH HEADERS
      const studentRes = await fetch(
        `http://localhost:5000/api/student-id/user/${currentUserID}`,
        authHeaders // <--- ADDED AUTH HEADERS
      );
      
      if (!studentRes.ok) throw new Error(`Student ID fetch failed: ${studentRes.statusText}`);

      const studentData = await studentRes.json();

      // Combine and format notifications
      const allNotifications = [];

      // Add booking notifications
      if (Array.isArray(bookingData.bookings)) {
        bookingData.bookings.forEach((booking) => {
          const notificationId = `booking-${booking.bookingID}`; 
          const currentStatus = booking.status || "Pending";
          const lastSeenStatus = lastSeenStatusMap[notificationId];
          
          // NEW LOGIC: isRead is true IF the user has explicitly read it AND the status has NOT changed.
          let isRead = readIds.has(notificationId) && (currentStatus === lastSeenStatus);
          
          // Store the current status for the next fetch comparison
          newSeenStatusMap[notificationId] = currentStatus; 
          
          allNotifications.push({
            id: notificationId, 
            type: "booking",
            status: currentStatus,
            message: `Your ${booking.category} booking is ${currentStatus}`,
            detail: `${booking.Package_type} on ${new Date(
              booking.date
            ).toLocaleDateString()}`,
            date: booking.date,
            isRead: isRead, // MODIFIED logic here
          });
        });
      }

      // Add student ID notifications
      // FIX: Change studentData.students to studentData.applications
      if (Array.isArray(studentData.applications)) {
        studentData.applications.forEach((student) => {
          const notificationId = `student-${student.id}`; 
          const currentStatus = student.status || "Pending";
          const lastSeenStatus = lastSeenStatusMap[notificationId];
          
          // NEW LOGIC: isRead is true IF the user has explicitly read it AND the status has NOT changed.
          let isRead = readIds.has(notificationId) && (currentStatus === lastSeenStatus);
          
          // Store the current status for the next fetch comparison
          newSeenStatusMap[notificationId] = currentStatus;

          // FIXED DATE LOGIC: Use a fallback empty string if all date fields are missing/null
          const notifDate = student.submitted_at || student.created_at || '';
          
          allNotifications.push({
            id: notificationId,
            type: "student",
            status: currentStatus,
            message: `Your Student ID application is ${currentStatus}`,
            detail: `${student.grade} - ${student.section}`,
            date: notifDate,
            isRead: isRead, // MODIFIED logic here
          });
        });
      }

      // NEW: Save the latest statuses to local storage for the next comparison
      setLastSeenStatusMap(currentUserID, newSeenStatusMap);

      // Sort by date (newest first)
      allNotifications.sort((a, b) => new Date(b.date) - new Date(a.date));

      setNotifications(allNotifications);
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
      // Clear notifications on failure to prevent stale data
      setNotifications([]);
    }
  };

  useEffect(() => {
    // FIX 5: Rerun fetch when currentUserID changes (i.e., on login/logout)
    if (currentUserID) {
        fetchNotifications();
        const interval = setInterval(fetchNotifications, 30000); // Refresh every 30 seconds
        return () => clearInterval(interval);
    }
  }, [currentUserID]);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleDropdown = () => setIsOpen(!isOpen);

  const getStatusColor = (status) => {
    switch (status) {
      case "Confirmed":
      case "Approved":
        return "text-emerald-600 bg-emerald-50";
      case "Completed":
        return "text-blue-600 bg-blue-50";
      case "Cancelled":
      case "Rejected":
        return "text-red-600 bg-red-50";
      default:
        return "text-amber-600 bg-amber-50";
    }
  };

  const getStatusIcon = (type, status) => {
    if (type === "booking") {
      return <Calendar className="w-4 h-4" />;
    }
    return <IdCard className="w-4 h-4" />;
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Icon */}
      <button
        onClick={toggleDropdown}
        className="p-2 text-slate-600 hover:bg-slate-100 rounded-full transition relative"
      >
        <Bell
          className={`w-6 h-6 ${
            unreadCount > 0 ? "text-indigo-600 animate-pulse" : ""
          }`}
        />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex h-4 w-4">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500 text-[10px] text-white justify-center items-center border border-white font-bold">
              {unreadCount}
            </span>
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 bg-white rounded-xl shadow-2xl border border-slate-100 z-50 overflow-hidden animate-fadeIn">
          <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
            <h3 className="font-bold text-slate-800">Your Updates</h3>
            <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded-full font-bold">
              {notifications.length} Total
            </span>
          </div>

          <div className="max-h-[400px] overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-slate-400 flex flex-col items-center">
                <Bell className="w-8 h-8 mb-2 opacity-20" />
                <p className="text-sm">No notifications yet</p>
                <p className="text-xs mt-1">
                  We'll notify you when there are updates
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-50">
                {notifications.map((notif) => (
                  <div
                    key={notif.id}
                    // Clicking the item marks as read, but clicking the delete button stops this event.
                    onClick={() => markAsRead(notif.id)} 
                    className={`p-4 transition cursor-pointer group ${notif.isRead ? 'bg-white' : 'bg-indigo-50 hover:bg-indigo-100'}`} 
                  >
                    <div className="flex gap-3">
                      <div
                        className={`mt-1 p-2 rounded-full ${getStatusColor(
                          notif.status
                        )}`}
                      >
                        {getStatusIcon(notif.type, notif.status)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-800 leading-snug">
                          {notif.message}
                        </p>
                        <p className="text-xs text-slate-500 mt-1">
                          {notif.detail}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <span
                            className={`text-xs font-bold px-2 py-0.5 rounded-full ${getStatusColor(
                              notif.status
                            )}`}
                          >
                            {notif.status}
                          </span>
                          {/* FIXED: Only render the date span if notif.date exists */}
                          {notif.date && (
                              <span className="text-xs text-slate-400">
                                  {new Date(notif.date).toLocaleDateString()}
                              </span>
                          )}
                        </div>
                      </div>
                      
                      {/* NEW: Delete Button */}
                      <button
                        className="ml-auto self-start p-1 rounded-full text-slate-400 hover:text-red-500 hover:bg-red-50 transition opacity-0 group-hover:opacity-100"
                        onClick={(e) => {
                          e.stopPropagation(); // Prevent parent markAsRead from firing
                          deleteNotification(notif.id); // MODIFIED: Call the DB-linked delete function
                        }}
                        title="Delete notification and source record"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* MODIFIED: Mark all as read function now uses localStorage */}
          <div className="p-3 bg-slate-50 border-t border-slate-100 text-center">
            <button
              onClick={() => {
                markAllAsRead();
                setIsOpen(false);
              }}
              className={`text-xs font-semibold flex items-center justify-center w-full gap-1 
                ${unreadCount === 0 ? 'text-slate-400 cursor-not-allowed' : 'text-indigo-600 hover:text-indigo-800'}`}
              disabled={unreadCount === 0}
            >
              <CheckCheck className="w-3.5 h-3.5" />
              Mark all as read
            </button>
          </div>
        </div>
      )}
    </div>
  );
}