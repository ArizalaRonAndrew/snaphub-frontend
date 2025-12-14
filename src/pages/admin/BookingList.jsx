import React, { useState, useEffect } from "react";
import { 
  Search, Eye, Calendar, CheckCircle, XCircle, Clock, Trash2, MapPin, Package, User, Phone, Mail, CheckSquare, AlertTriangle, Archive, Filter, FileText 
} from "lucide-react";
import Modal from "../../components/admin/Modal"; 
import { getAllBookings, updateBookingStatus, deleteBooking } from "../../services/BookingService";

const BookingList = () => {
  const [bookings, setBookings] = useState([]);
  const [selectedBooking, setSelectedBooking] = useState(null);
  
  // Confirmation Modal State
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    action: null, 
    id: null, // This will now store the unique bookingID
    payload: null, 
    title: "",
    message: "",
    isDanger: false,
  });

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [sortOption, setSortOption] = useState("by_id");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const data = await getAllBookings();
      // console.log("Fetched booking data (full):", JSON.stringify(data, null, 2));
      
      if (Array.isArray(data)) {
        // Remove duplicates based on bookingID to prevent React key errors
        const uniqueBookings = [];
        const seenIds = new Set();
        
        data.forEach(booking => {
          const id = booking.bookingID;
          if (id && !seenIds.has(id)) {
            seenIds.add(id);
            uniqueBookings.push(booking);
          } 
        });
        
        // console.log(`Deduplication: ${data.length} → ${uniqueBookings.length} records`);
        
        setBookings(uniqueBookings);
      } else {
        console.error("❌ API did not return an array:", data);
        setBookings([]);
      }
    } catch (error) {
      console.error("Error fetching bookings:", error);
      setBookings([]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "Confirmed": return "bg-emerald-100 text-emerald-700 border-emerald-200";
      case "Completed": return "bg-blue-100 text-blue-700 border-blue-200";
      case "Cancelled": return "bg-red-100 text-red-700 border-red-200";
      case "Archived": return "bg-gray-100 text-gray-500 border-gray-200"; 
      default: return "bg-amber-100 text-amber-700 border-amber-200";
    }
  };

  // --- REQUEST HANDLERS ---
  const requestStatusUpdate = (id, newStatus) => {
    let isDanger = newStatus === 'Cancelled';
    let message = `Are you sure you want to change the status to ${newStatus}?`;
    
    if (newStatus === 'Confirmed') message = "Are you sure you want to confirm this booking?";
    if (newStatus === 'Completed') message = "Mark this booking as fully completed?";
    if (newStatus === 'Cancelled') message = "Are you sure you want to cancel this booking?";

    setConfirmModal({
      isOpen: true,
      action: 'update',
      id, // bookingID
      payload: newStatus,
      title: `Mark as ${newStatus}`,
      message,
      isDanger
    });
  };

  // MODIFIED: This archives the completed record, leaving it for the Reports page.
  const requestArchive = (id) => {
    setConfirmModal({
      isOpen: true,
      action: 'archive', 
      id, // bookingID
      title: "Archive Completed Record",
      message: "This will set the status to 'Archived', removing the booking from this list but KEEPING it in your Reports revenue. Proceed?",
      isDanger: false 
    });
  };

  // This permanently deletes the record from the database.
  const requestDelete = (id) => {
    setConfirmModal({
      isOpen: true,
      action: 'delete',
      id, // bookingID
      title: "Delete Permanently",
      message: "Are you sure? This will permanently remove this record from the database AND reports.",
      isDanger: true
    });
  };

  // MODIFIED: This archives all completed records, leaving them for the Reports page.
  const requestDeleteAllCompleted = () => {
    const completedCount = bookings.filter(b => b.status === 'Completed').length;
    if (completedCount === 0) return;

    setConfirmModal({
      isOpen: true,
      action: 'archiveAll',
      id: null,
      payload: 'Completed', 
      title: "Clear Completed History (Archive)",
      message: `Are you sure you want to clear all ${completedCount} completed bookings? They will be set to 'Archived' and hidden here, but saved in Reports.`,
      isDanger: false
    });
  };

  // This permanently deletes all cancelled records from the database.
  const requestDeleteAllCancelled = () => {
    const cancelledCount = bookings.filter(b => b.status === 'Cancelled').length;
    if (cancelledCount === 0) return;

    setConfirmModal({
      isOpen: true,
      action: 'deleteBatch', 
      id: null,
      payload: 'Cancelled',
      title: "Delete All Cancelled",
      message: `Are you sure you want to permanently delete all ${cancelledCount} cancelled bookings? This cannot be undone.`,
      isDanger: true
    });
  };

  // --- EXECUTE LOGIC ---
  const handleExecuteAction = async () => {
    const { action, id, payload } = confirmModal;

    if (action === 'update') {
      // id is now bookingID
      const result = await updateBookingStatus(id, payload);
      if (result && result.success) {
        fetchBookings();
        setSelectedBooking(null);
      }
    } 
    else if (action === 'archive') {
      // id is now bookingID - Archive the individual completed booking
       const result = await updateBookingStatus(id, 'Archived');
       if (result && result.success) {
         fetchBookings();
         setSelectedBooking(null);
       }
    }
    else if (action === 'delete') {
      // id is now bookingID - Permanently delete
      const result = await deleteBooking(id);
      if (result && result.success) {
        fetchBookings();
        setSelectedBooking(null);
      }
    }
    else if (action === 'archiveAll') {
        // Archive ALL completed bookings
        const bookingsToArchive = bookings.filter(b => b.status === 'Completed');
        await Promise.all(
            // Use bookingID for batch update
            bookingsToArchive.map(booking => updateBookingStatus(booking.bookingID, 'Archived'))
        );
        fetchBookings();
        setSelectedBooking(null);
    }
    else if (action === 'deleteBatch') {
        // Delete ALL cancelled bookings permanently
        const bookingsToDelete = bookings.filter(b => b.status === 'Cancelled');
        await Promise.all(
            // Use bookingID for batch delete
            bookingsToDelete.map(booking => deleteBooking(booking.bookingID))
        );
        fetchBookings();
        setSelectedBooking(null);
    }
    
    setConfirmModal({ ...confirmModal, isOpen: false });
  };

  // --- FILTERING & SORTING LOGIC ---
  const filteredBookings = bookings
    .filter((booking) => {
        const name = booking.fullname || "";
        const idStr = booking.bookingID ? booking.bookingID.toString() : ""; 
        const status = booking.status || "Pending";
        
        // KEY CHANGE: Exclude 'Archived' status from the main list.
        if (status === 'Archived') return false; 

        const matchesSearch = name.toLowerCase().includes(searchTerm.toLowerCase()) || idStr.includes(searchTerm);
        const matchesStatus = statusFilter === "All" || status === statusFilter;
        
        return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
        // Use bookingID for sorting by ID
        if (sortOption === "by_id") return b.bookingID - a.bookingID; 
        if (sortOption === "by_date") return new Date(a.date) - new Date(b.date);
        return 0;
    });

  const statusOptions = ["All", "Pending", "Confirmed", "Completed", "Cancelled"];

  return (
    <div className="space-y-6 h-full flex flex-col p-4 lg:p-8 overflow-hidden">
      <style>{`.no-scrollbar::-webkit-scrollbar { display: none; } .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }`}</style>

      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 shrink-0">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Booking Management</h2>
          <p className="text-slate-500 text-sm">Manage studio and event bookings.</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            {/* Sorting */}
            <div className="relative">
                <Filter className="w-4 h-4 absolute left-3 top-3 text-slate-500 pointer-events-none" />
                <select
                    value={sortOption}
                    onChange={(e) => setSortOption(e.target.value)}
                    className="pl-9 pr-8 py-2 w-full sm:w-auto border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-white text-slate-700 font-medium cursor-pointer appearance-none shadow-sm hover:border-indigo-300 transition"
                >
                    <option value="by_id">Sort by ID (Newest First)</option>
                    <option value="by_date">Sort by Date (Upcoming)</option>
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                    <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                </div>
            </div>

            {/* Search */}
            <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                <input
                    type="text"
                    placeholder="Search client or ID..."
                    className="pl-9 pr-4 py-2 w-full border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none shadow-sm"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
        </div>
      </div>

      {/* Filters & Bulk Actions */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-gray-200 shrink-0">
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
            {statusOptions.map((status) => (
            <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-4 py-2 rounded-full text-xs font-bold transition-all border whitespace-nowrap ${
                statusFilter === status
                    ? "bg-slate-800 text-white border-slate-800 shadow-md"
                    : "bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                }`}
            >
                {status}
            </button>
            ))}
        </div>

        {/* Clear History Buttons */}
        {statusFilter === 'Completed' && bookings.some(b => b.status === 'Completed') && (
            <button 
                onClick={requestDeleteAllCompleted} // This now Archives
                className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 border border-blue-200 rounded-lg text-xs font-bold hover:bg-blue-100 transition shadow-sm"
            >
                <Archive className="w-3 h-3" />
                Clear Completed (Archive)
            </button>
        )}

        {statusFilter === 'Cancelled' && bookings.some(b => b.status === 'Cancelled') && (
            <button 
                onClick={requestDeleteAllCancelled}
                className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 border border-red-200 rounded-lg text-xs font-bold hover:bg-red-100 transition shadow-sm"
            >
                <Trash2 className="w-3 h-3" />
                Delete All Cancelled
            </button>
        )}
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col grow min-h-0">
        <div className="overflow-auto no-scrollbar h-full">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 text-slate-600 text-xs uppercase font-bold tracking-wider sticky top-0 z-10 shadow-sm">
              <tr>
                <th className="px-6 py-4">Client</th>
                <th className="px-6 py-4">Service & Date</th> 
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-center">Quick Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan="4" className="p-8 text-center text-slate-400">Loading bookings...</td></tr>
              ) : filteredBookings.length > 0 ? (
                filteredBookings.map((booking, index) => (
                  <tr key={booking.bookingID} className="hover:bg-slate-50 transition group">
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-800">{booking.fullname}</div>
                      <div className="text-xs text-slate-500">Booking ID: #{booking.bookingID}</div> 
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-sm font-bold text-indigo-700">
                        <Package className="w-3 h-3" />
                        {booking.category} <span className="font-normal text-slate-600">• {booking.Package_type}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(booking.date).toLocaleDateString()} {booking.time}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${getStatusColor(booking.status || "Pending")}`}>
                        {booking.status || "Pending"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-center gap-2">
                        <button onClick={() => setSelectedBooking(booking)} className="p-2 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition"><Eye className="w-4 h-4" /></button>
                        
                        {(booking.status || "Pending") === 'Pending' && (
                          <>
                            <button onClick={() => requestStatusUpdate(booking.bookingID, 'Confirmed')} className="p-2 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition"><CheckCircle className="w-4 h-4" /></button>
                            <button onClick={() => requestStatusUpdate(booking.bookingID, 'Cancelled')} className="p-2 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition"><XCircle className="w-4 h-4" /></button>
                          </>
                        )}

                        {booking.status === 'Confirmed' && (
                          <button onClick={() => requestStatusUpdate(booking.bookingID, 'Completed')} className="p-2 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition" title="Mark as Completed"><CheckSquare className="w-4 h-4" /></button>
                        )}
                        
                        {/* CHANGED: Completed bookings now Archive, not Delete */}
                        {booking.status === 'Completed' && (
                          <button onClick={() => requestArchive(booking.bookingID)} className="p-2 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition" title="Hide from list (Archive)"><Archive className="w-4 h-4" /></button>
                        )}

                        {/* Cancelled bookings can still be permanently deleted */}
                        {booking.status === 'Cancelled' && (
                          <button onClick={() => requestDelete(booking.bookingID)} className="p-2 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition" title="Delete Permanently"><Trash2 className="w-4 h-4" /></button>
                        )}
                    </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan="4" className="px-6 py-12 text-center text-slate-400"><p>No bookings found.</p></td></tr>
              )}
            </tbody>
            </table>
        </div>
      </div>

      {/* Details Modal */}
      <Modal isOpen={!!selectedBooking} onClose={() => setSelectedBooking(null)} title="Booking Details">
        {selectedBooking && (
          <div className="space-y-6">
            <div className={`p-4 rounded-xl flex items-center justify-between shadow-sm ${getStatusColor(selectedBooking.status || "Pending")} bg-opacity-20`}>
              <span className="font-bold flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Status: <span className="uppercase">{selectedBooking.status || "Pending"}</span>
              </span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Client Info */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                <h4 className="text-xs font-bold text-slate-400 uppercase mb-3 flex items-center gap-2"><User className="w-3 h-3" /> Client Info</h4>
                <p className="font-bold text-slate-800 text-lg">{selectedBooking.fullname}</p>
                <div className="mt-2 space-y-1">
                    <p className="text-slate-500 text-sm flex items-center gap-2"><Mail className="w-3 h-3"/> {selectedBooking.email}</p>
                    <p className="text-slate-500 text-sm flex items-center gap-2"><Phone className="w-3 h-3"/> {selectedBooking.phonenumber}</p>
                </div>
              </div>

              {/* Service Details Container */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                 <h4 className="text-xs font-bold text-slate-400 uppercase mb-3 flex items-center gap-2"><Package className="w-3 h-3" /> Service Details</h4>
                 <div>
                    <p className="text-xs text-slate-500 uppercase font-bold">Service Type</p>
                    <p className="font-bold text-indigo-700 text-lg mb-2">{selectedBooking.category}</p>
                 </div>
                 <div>
                    <p className="text-xs text-slate-500 uppercase font-bold">Package Type</p>
                    <p className="font-medium text-slate-700">{selectedBooking.Package_type}</p>
                 </div>
              </div>
            </div>

            {/* Date/Venue & Notes Containers */}
            <div className="grid grid-cols-1 gap-4">
                {/* Date & Venue Container */}
                <div className="p-4 border border-slate-200 rounded-xl bg-white shadow-sm">
                    <div className="flex items-start gap-4 mb-3 border-b border-slate-100 pb-3">
                        <Calendar className="w-5 h-5 text-indigo-500 mt-0.5" />
                        <div>
                            <p className="text-xs font-bold text-slate-400 uppercase">Date & Time</p>
                            <p className="font-bold text-slate-700">{new Date(selectedBooking.date).toDateString()} at {selectedBooking.time}</p>
                        </div>
                    </div>
                    <div className="flex items-start gap-4">
                        <MapPin className="w-5 h-5 text-red-500 mt-0.5" />
                        <div>
                            <p className="text-xs font-bold text-slate-400 uppercase">Location/Venue</p>
                            <p className="font-medium text-slate-700">{selectedBooking.location}</p>
                        </div>
                    </div>
                </div>

                {/* NEW: Full Width Notes Container */}
                <div className="p-4 border border-slate-200 rounded-xl bg-amber-50/50">
                    <h4 className="text-xs font-bold text-amber-500 uppercase mb-2 flex items-center gap-2">
                        <FileText className="w-4 h-4" /> Client Notes / Requests
                    </h4>
                    <p className="text-slate-700 text-sm leading-relaxed whitespace-pre-wrap">
                        {selectedBooking.details || "No additional notes provided."}
                    </p>
                </div>
            </div>

            {/* ACTION BUTTONS IN MODAL */}
            <div className="flex gap-3 pt-2 border-t border-slate-100">
                {(selectedBooking.status || "Pending") === 'Pending' && (
                    <>
                        <button onClick={() => requestStatusUpdate(selectedBooking.bookingID, 'Cancelled')} className="flex-1 py-3 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 transition">Reject</button>
                        <button onClick={() => requestStatusUpdate(selectedBooking.bookingID, 'Confirmed')} className="flex-1 py-3 rounded-xl bg-emerald-600 text-white font-bold hover:bg-emerald-700 shadow-lg shadow-emerald-200 transition">Approve Booking</button>
                    </>
                )}
                 {selectedBooking.status === 'Confirmed' && (
                    <>
                        <button onClick={() => requestStatusUpdate(selectedBooking.bookingID, 'Cancelled')} className="flex-1 py-3 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 transition">Cancel Booking</button>
                        <button onClick={() => requestStatusUpdate(selectedBooking.bookingID, 'Completed')} className="flex-1 py-3 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700 shadow-lg shadow-blue-200 transition flex items-center justify-center gap-2"><CheckSquare className="w-4 h-4" /> Mark as Completed</button>
                    </>
                )}
                
                {/* CHANGED: Completed button archives */}
                {selectedBooking.status === 'Completed' && (
                  <button onClick={() => requestArchive(selectedBooking.bookingID)} className="flex-1 py-3 rounded-xl border border-blue-200 text-blue-600 font-bold hover:bg-blue-50 transition flex items-center justify-center gap-2"><Archive className="w-4 h-4" /> Archive Record</button>
                )}
                
                {/* Cancelled button deletes permanently */}
                {selectedBooking.status === 'Cancelled' && (
                  <button onClick={() => requestDelete(selectedBooking.bookingID)} className="flex-1 py-3 rounded-xl border border-red-200 text-red-600 font-bold hover:bg-red-50 transition flex items-center justify-center gap-2"><Trash2 className="w-4 h-4" /> Delete Record</button>
                )}
            </div>
          </div>
        )}
      </Modal>

      {/* Confirmation Modal */}
      <Modal isOpen={confirmModal.isOpen} onClose={() => setConfirmModal({...confirmModal, isOpen: false})} title={confirmModal.title}>
        <div className="space-y-4">
          <div className="flex items-start gap-4">
            <div className={`p-3 rounded-full shrink-0 ${confirmModal.isDanger ? 'bg-red-100' : 'bg-blue-100'}`}>
              {confirmModal.isDanger ? <AlertTriangle className="w-6 h-6 text-red-600" /> : <Archive className="w-6 h-6 text-blue-600" />}
            </div>
            <div>
              <p className="text-slate-600 leading-relaxed">{confirmModal.message}</p>
            </div>
            {confirmModal.action === 'delete' && (
                <p className="text-red-500 text-xs italic mt-2">Warning: This action is permanent and affects your reports.</p>
            )}
          </div>
          <div className="flex gap-3 justify-end pt-4">
            <button onClick={() => setConfirmModal({...confirmModal, isOpen: false})} className="px-4 py-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 font-semibold transition">Cancel</button>
            <button onClick={handleExecuteAction} className={`px-4 py-2 rounded-lg text-white font-bold shadow-md transition flex items-center gap-2 ${confirmModal.isDanger ? 'bg-red-600 hover:bg-red-700 shadow-red-200' : 'bg-blue-600 hover:bg-blue-700 shadow-blue-200'}`}>Yes, Proceed</button>
          </div>
        </div>
      </Modal>

    </div>
  );
};

export default BookingList;