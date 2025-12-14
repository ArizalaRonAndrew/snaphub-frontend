import { useState, useEffect, useRef } from "react";
import { Bell, CheckCheck, Trash2 } from "lucide-react"; // ADDED Trash2 for delete

export default function NotificationDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const dropdownRef = useRef(null);

  // NEW: Function to handle deletion from the database
  const handleDeleteNotification = async (id, e) => {
    if (e) e.stopPropagation(); // Prevent the parent div click event
    
    if (!window.confirm("Are you sure you want to delete this notification?")) {
        return;
    }

    try {
      // Assuming the admin has auth middleware applied automatically, 
      // otherwise, a token would be needed here too.
      const res = await fetch(`http://localhost:5000/api/notifications/${id}`, { 
        method: "DELETE" 
      });

      if (!res.ok) {
        throw new Error(`Failed to delete notification: ${res.status}`);
      }

      // Optimistic update: Remove from local state immediately
      setNotifications(prev => prev.filter(n => n.id !== id));
      console.log(`Notification ${id} deleted successfully.`);

    } catch (error) {
      console.error("Failed to delete notification:", error);
      alert("Failed to delete notification. Check console for details.");
    }
  };

  // 1. Fetch Notifications
  const fetchNotifications = async () => {
    try {
        // NOTE: If this route is protected by auth middleware, 
        // the fetch call should include Authorization headers, 
        // which are currently missing. Assuming it's an unprotected admin route for simplicity.
        const res = await fetch("http://localhost:5000/api/notifications");
        
        if (!res.ok) {
            throw new Error(`HTTP error! status: ${res.status}`);
        }

        const data = await res.json();
        
        // --- DEBUGGING: Tignan mo ito sa Console (F12) ---
        console.log("Raw Notification Data:", data); 

        // Siguraduhing array ang data bago i-set
        if (Array.isArray(data)) {
            setNotifications(data);
        } else {
            console.error("Data is not an array:", data);
            setNotifications([]);
        }

    } catch (error) {
        console.error("Failed to fetch notifications:", error);
    }
  };

  useEffect(() => {
    fetchNotifications(); // Initial fetch
    const interval = setInterval(fetchNotifications, 5000); // Poll every 5s for testing
    return () => clearInterval(interval);
  }, []);

  // 2. Mark Single as Read
  const handleMarkAsRead = async (id) => {
    try {
        await fetch(`http://localhost:5000/api/notifications/${id}/read`, { method: "PUT" });
        // Optimistic Update
        setNotifications(prev => prev.map(n => n.id === id ? {...n, is_read: 1} : n));
    } catch (error) {
        console.error(error);
    }
  };

  // 3. Mark ALL as Read
  const handleMarkAllRead = async () => {
      try {
        await fetch(`http://localhost:5000/api/notifications/read-all`, { method: "PUT" });
        setNotifications(prev => prev.map(n => ({...n, is_read: 1})));
      } catch (error) {
          console.error(error);
      }
  };

  // --- FIXED FILTER LOGIC (Handles 0, "0", false) ---
  // Convert to Number() para sure na match sa logic kahit string ang ibato ng API
  const unreadList = notifications.filter(n => Number(n.is_read) === 0);
  const readList = notifications.filter(n => Number(n.is_read) === 1);
  const unreadCount = unreadList.length;

  // Toggle UI
  const toggleDropdown = () => setIsOpen(!isOpen);

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

  const formatTime = (dateString) => {
      try {
          const date = new Date(dateString);
          return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      } catch (e) {
          return "";
      }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Icon */}
      <button
        onClick={toggleDropdown}
        className="p-2 text-slate-500 hover:bg-slate-100 rounded-full transition relative"
      >
        <Bell className={`w-6 h-6 ${unreadCount > 0 ? 'text-indigo-600 animate-pulse' : ''}`} />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex h-4 w-4">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500 text-[10px] text-white justify-center items-center border border-white">
                {unreadCount}
            </span>
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 bg-white rounded-xl shadow-2xl border border-slate-100 z-50 overflow-hidden animate-fadeIn">
          
          <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
            <h3 className="font-bold text-slate-800">Notifications</h3>
            {unreadCount > 0 && (
              <button 
                  onClick={handleMarkAllRead}
                  className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1"
              >
                  <CheckCheck className="w-3 h-3" /> Mark all read
              </button>
            )}
          </div>

          <div className="max-h-[400px] overflow-y-auto">
            {notifications.length === 0 ? (
                <div className="p-8 text-center text-slate-400 flex flex-col items-center">
                    <Bell className="w-8 h-8 mb-2 opacity-20" />
                    <p className="text-sm">No new notifications</p>
                </div>
            ) : (
                <>
                    {/* SECTION: NEW (Unread) */}
                    {unreadList.length > 0 && (
                        <div>
                            <p className="px-4 py-2 text-xs font-bold text-slate-400 uppercase tracking-wider bg-slate-50/50">
                                New ({unreadList.length})
                            </p>
                            {unreadList.map((notif) => (
                                <div key={notif.id} 
                                      onClick={() => handleMarkAsRead(notif.id)}
                                      className="p-4 border-b border-slate-50 bg-indigo-50/40 hover:bg-indigo-50 transition cursor-pointer flex gap-3 relative group">
                                    <div className="mt-1">
                                        {notif.type === 'booking' ? '📅' : '🆔'}
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-sm font-semibold text-slate-800 leading-snug">
                                            {notif.message}
                                        </p>
                                        <p className="text-xs text-indigo-500 mt-1 font-medium">
                                            {formatTime(notif.created_at)}
                                        </p>
                                    </div>
                                    {/* NEW: Delete Button */}
                                    <button
                                        onClick={(e) => handleDeleteNotification(notif.id, e)}
                                        className="absolute top-1 right-1 p-1 text-slate-400 hover:text-red-500 hover:bg-red-100 rounded-full transition opacity-0 group-hover:opacity-100"
                                        title="Delete notification"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                    <div className="w-2 h-2 bg-indigo-500 rounded-full self-center"></div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* SECTION: EARLIER (Read) */}
                    {readList.length > 0 && (
                        <div>
                            <p className="px-4 py-2 text-xs font-bold text-slate-400 uppercase tracking-wider bg-slate-50/50">
                                Earlier
                            </p>
                            {readList.map((notif) => (
                                <div key={notif.id} className="p-4 border-b border-slate-50 hover:bg-slate-50 transition flex gap-3 opacity-70 relative group">
                                    <div className="mt-1 grayscale">
                                        {notif.type === 'booking' ? '📅' : '🆔'}
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-sm text-slate-600 leading-snug">
                                            {notif.message}
                                        </p>
                                        <p className="text-xs text-slate-400 mt-1">
                                            {formatTime(notif.created_at)}
                                        </p>
                                    </div>
                                    {/* NEW: Delete Button */}
                                    <button
                                        onClick={(e) => handleDeleteNotification(notif.id, e)}
                                        className="absolute top-1 right-1 p-1 text-slate-400 hover:text-red-500 hover:bg-red-100 rounded-full transition opacity-0 group-hover:opacity-100"
                                        title="Delete notification"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}