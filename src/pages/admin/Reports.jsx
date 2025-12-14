import React, { useState, useEffect } from "react";
import { Banknote, Briefcase, Users, Trash2, Eraser, Package, AlertTriangle, X, CheckCircle } from "lucide-react";
import { getAllBookings, deleteBooking } from "../../services/BookingService"; 
import { getAllStudents, deleteStudent } from "../../services/StudentIdService";

const Reports = () => {
  const [bookings, setBookings] = useState([]);
  const [students, setStudents] = useState([]);
  const [filterType, setFilterType] = useState("All");

  // --- MODAL STATE ---
  const [confirmation, setConfirmation] = useState({
    isOpen: false,
    title: "",
    message: "",
    type: "danger", // 'danger' or 'info'
    onConfirm: null,
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [bData, sData] = await Promise.all([
        getAllBookings(),
        getAllStudents(),
      ]);

      // De-duplicate bookings using the unique bookingID
      const uniqueBookingsMap = new Map();
      if (Array.isArray(bData)) {
        bData.forEach(booking => {
          // Assuming the unique primary key is 'bookingID'
          if (booking.bookingID && !uniqueBookingsMap.has(booking.bookingID)) {
            uniqueBookingsMap.set(booking.bookingID, booking);
          }
        });
      }
      
      setBookings(Array.from(uniqueBookingsMap.values()));
      setStudents(Array.isArray(sData) ? sData : []);
    } catch (error) {
      console.error("Error fetching report data:", error);
    }
  };

  // --- MODAL CONTROLS ---
  const closeConfirmation = () => {
    setConfirmation({ ...confirmation, isOpen: false });
  };

  const executeAction = async () => {
    if (confirmation.onConfirm) {
        await confirmation.onConfirm();
    }
    closeConfirmation();
  };

  // --- DELETE LOGIC (Wrapped) ---
  // NOTE: This delete is PERMANENT and removes from Reports as well. 
  // Use this only for necessary clean-up on the Reports page.
  const handleDeleteBooking = (id) => {
    setConfirmation({
        isOpen: true,
        title: "PERMANENTLY Delete Booking Record",
        message: "You are about to permanently delete this booking from ALL records, including revenue reports. This action cannot be undone.",
        type: "danger",
        onConfirm: async () => {
            try {
                await deleteBooking(id); 
                await fetchData();
            } catch (err) {
                console.error("Error deleting booking:", err);
            }
        }
    });
  };

  const handleDeleteStudent = (id) => {
    setConfirmation({
        isOpen: true,
        title: "PERMANENTLY Delete Student Record",
        message: "Are you sure you want to permanently delete this approved ID record?",
        type: "danger",
        onConfirm: async () => {
            try {
                await deleteStudent(id);
                await fetchData();
            } catch (err) {
                console.error("Error deleting student:", err);
            }
        }
    });
  };

  // --- BULK CLEAR LOGIC (Wrapped) ---
  const handleClearBookings = () => {
      setConfirmation({
        isOpen: true,
        title: "PERMANENTLY Clear All Completed Bookings",
        message: `You are about to delete ALL ${completedBookings.length} completed bookings. This is irreversible and will affect revenue reports.`,
        type: "danger",
        onConfirm: async () => {
              try {
                // Use b.bookingID for deletion
                await Promise.all(completedBookings.map(b => deleteBooking(b.bookingID))); 
                await fetchData();
              } catch (err) {
                console.error("Error clearing bookings:", err);
              }
        }
      });
  };

  const handleClearStudents = () => {
    setConfirmation({
        isOpen: true,
        title: "PERMANENTLY Clear All Approved IDs",
        message: `You are about to delete ALL ${approvedIDs.length} approved ID records. This is irreversible.`,
        type: "danger",
        onConfirm: async () => {
            try {
               await Promise.all(approvedIDs.map(s => deleteStudent(s.id)));
               await fetchData();
            } catch (err) {
               console.error("Error clearing students:", err);
            }
        }
    });
 };

  // --- DATE FILTER LOGIC ---
  const isDateInCurrentPeriod = (dateString) => {
    if (filterType === "All") return true;
    if (!dateString) return false;

    const targetDate = new Date(dateString);
    const now = new Date();

    if (isNaN(targetDate.getTime())) return false;

    if (filterType === "Daily") {
      return targetDate.toDateString() === now.toDateString();
    }

    if (filterType === "Weekly") {
      const dayOfWeek = now.getDay(); 
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - dayOfWeek);
      startOfWeek.setHours(0, 0, 0, 0);

      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      endOfWeek.setHours(23, 59, 59, 999);

      return targetDate >= startOfWeek && targetDate <= endOfWeek;
    }

    if (filterType === "Monthly") {
      return (
        targetDate.getMonth() === now.getMonth() &&
        targetDate.getFullYear() === now.getFullYear()
      );
    }

    if (filterType === "Yearly") {
      return targetDate.getFullYear() === now.getFullYear();
    }

    return true;
  };

  // --- FILTERING DATA ---
  // FIXED LOGIC: Include both "Completed" (newly finished) and "Archived" (moved from live list) 
  // to ensure all revenue is counted, regardless of the BookingList status.
  const completedBookings = bookings.filter(
    (b) => (b.status === "Completed" || b.status === "Archived") && isDateInCurrentPeriod(b.date)
  );

  const approvedIDs = students.filter((s) => {
    const isValidStatus = s.status === "Approved" || s.status === "ReportOnly";
    if (!isValidStatus) return false;
    const approvalDate = s.approved_at || s.updated_at;
    return isDateInCurrentPeriod(approvalDate);
  });

  // --- REVENUE CALCULATION ---
  const totalRevenue = completedBookings.reduce((total, booking) => {
    const priceString = booking.packagePrice || "0"; 
    const cleanPrice = parseFloat(priceString.toString().replace(/[^0-9.]/g, ''));
    return total + (isNaN(cleanPrice) ? 0 : cleanPrice);
  }, 0);

  const filters = ["All", "Daily", "Weekly", "Monthly", "Yearly"];

  return (
    <div className="flex flex-col h-full overflow-hidden p-4 lg:p-8 gap-6 relative">
      
      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

      {/* Top Section: Header & Revenue */}
      <div className="shrink-0 space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <h2 className="text-2xl font-bold text-slate-800">System Reports</h2>
          <div className="bg-white p-1 rounded-lg border border-slate-200 flex gap-1 mt-4 md:mt-0">
            {filters.map((f) => (
              <button
                key={f}
                onClick={() => setFilterType(f)}
                className={`px-4 py-1.5 text-sm rounded-md font-medium transition ${
                  filterType === f
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "text-slate-500 hover:bg-slate-100 hover:text-slate-800"
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* Revenue Card */}
        <div className="bg-emerald-600 p-6 rounded-xl shadow-lg text-white flex justify-between items-center">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <p className="text-emerald-100 text-sm font-medium uppercase tracking-wide">
                Total Realized Revenue
              </p>
              <span className="bg-emerald-700 px-2 py-0.5 rounded text-[10px] font-bold border border-emerald-500/50 uppercase">
                {filterType}
              </span>
            </div>
            <h3 className="text-4xl font-bold">
              ₱{totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </h3>
            <p className="text-emerald-200 text-xs mt-2">
              Calculated from {completedBookings.length} completed bookings (including archived)
            </p>
          </div>
          <div className="bg-white/20 p-4 rounded-full">
            <Banknote className="w-8 h-8 text-white" />
          </div>
        </div>
      </div>

      {/* Grid Section: Tables */}
      <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* TABLE 1: Completed Bookings */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-full">
          <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between shrink-0">
            <h3 className="font-bold text-slate-700 flex items-center">
              <Briefcase className="w-5 h-5 mr-2 text-sky-600" /> Completed Bookings
            </h3>
            <div className="flex items-center gap-2">
                <span className="bg-emerald-100 text-emerald-700 px-2 py-1 rounded text-xs font-bold">
                {completedBookings.length} Done
                </span>
                {completedBookings.length > 0 && (
                    <button 
                        onClick={handleClearBookings}
                        className="text-slate-400 hover:text-red-600 transition p-1"
                        title="Clear Data (Permanent, affects revenue report)"
                    >
                        <Eraser className="w-4 h-4" />
                    </button>
                )}
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto no-scrollbar">
            <table className="w-full text-left relative">
              <thead className="bg-white text-slate-500 text-xs uppercase font-semibold border-b border-slate-100 sticky top-0 z-10 shadow-sm">
                <tr>
                  <th className="px-4 py-3 bg-slate-50">Client</th>
                  <th className="px-4 py-3 bg-slate-50">Service & Package</th>
                  <th className="px-4 py-3 bg-slate-50">Price</th>
                  <th className="px-4 py-3 bg-slate-50 text-right">Del</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {completedBookings.length > 0 ? (
                  completedBookings.map((b) => (
                    <tr key={b.bookingID} className="hover:bg-slate-50 group">
                      <td className="px-4 py-3">
                        <div className="text-sm font-bold text-slate-700">
                          {b.fullname}
                        </div>
                        <div className="text-xs text-slate-500">
                          {new Date(b.date).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5 text-sm font-semibold text-indigo-700">
                            <Package className="w-3 h-3" />
                            {b.category}
                        </div>
                        <div className="text-xs text-slate-500 ml-4.5">
                            {b.Package_type}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs font-bold text-emerald-600">
                        {b.packagePrice ? (b.packagePrice.toString().includes('₱') ? b.packagePrice : `₱${b.packagePrice}`) : "—"}
                      </td>
                      <td className="px-4 py-3 text-right">
                          <button 
                            onClick={() => handleDeleteBooking(b.bookingID)}
                            className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition"
                            title="Delete Permanently (Removes from Reports)"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" className="text-center py-8 text-slate-400 text-sm italic">
                      No bookings found for <span className="font-bold">{filterType}</span>.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* TABLE 2: Approved ID Submissions */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-full">
          <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between shrink-0">
            <h3 className="font-bold text-slate-700 flex items-center">
              <Users className="w-5 h-5 mr-2 text-purple-600" /> Approved ID Submissions
            </h3>
            <div className="flex items-center gap-2">
                <span className="bg-emerald-100 text-emerald-700 px-2 py-1 rounded text-xs font-bold">
                {approvedIDs.length} Approved
                </span>
                {approvedIDs.length > 0 && (
                    <button 
                        onClick={handleClearStudents}
                        className="text-slate-400 hover:text-red-600 transition p-1"
                        title="Clear Data (Permanent)"
                    >
                        <Eraser className="w-4 h-4" />
                    </button>
                )}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto no-scrollbar">
            <table className="w-full text-left relative">
              <thead className="bg-white text-slate-500 text-xs uppercase font-semibold border-b border-slate-100 sticky top-0 z-10 shadow-sm">
                <tr>
                  <th className="px-4 py-3 bg-slate-50">Student</th>
                  <th className="px-4 py-3 bg-slate-50">Section</th>
                  <th className="px-4 py-3 bg-slate-50">Date Approved</th>
                  <th className="px-4 py-3 bg-slate-50 text-right">Del</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {approvedIDs.length > 0 ? (
                  approvedIDs.map((s) => {
                    const displayDate = s.approved_at || s.updated_at;
                    
                    return (
                      <tr key={s.id} className="hover:bg-slate-50 group">
                        <td className="px-4 py-3">
                          <div className="text-sm font-bold text-slate-700">
                            {s.last_name}, {s.first_name}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-500">
                          {s.grade} - {s.section}
                        </td>
                        <td className="px-4 py-3 text-xs text-emerald-600 font-medium">
                           {displayDate ? new Date(displayDate).toLocaleDateString("en-US", {
                             month: 'short',
                             day: 'numeric',
                             year: 'numeric'
                           }) : "N/A"}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button 
                            onClick={() => handleDeleteStudent(s.id)}
                            className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition"
                            title="Delete Permanently"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                      </td>
                    </tr>
                  );
                  })
                ) : (
                  <tr>
                    <td colSpan="4" className="text-center py-8 text-slate-400 text-sm italic">
                      No approved IDs found for <span className="font-bold">{filterType}</span>.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* --- CUSTOM MODAL --- */}
      {confirmation.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div 
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" 
                onClick={closeConfirmation}
            ></div>
            
            {/* Modal Content */}
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm relative z-10 overflow-hidden transform transition-all scale-100">
                <div className="p-6 text-center">
                    <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
                        <AlertTriangle className="w-6 h-6 text-red-600" />
                    </div>
                    
                    <h3 className="text-lg font-bold text-slate-800 mb-2">
                        {confirmation.title}
                    </h3>
                    
                    <p className="text-slate-500 text-sm mb-6">
                        {confirmation.message}
                    </p>

                    <div className="flex gap-3">
                        <button
                            onClick={closeConfirmation}
                            className="flex-1 px-4 py-2 bg-white border border-slate-300 rounded-lg text-slate-700 font-medium hover:bg-slate-50 transition"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={executeAction}
                            className="flex-1 px-4 py-2 bg-red-600 rounded-lg text-white font-medium hover:bg-red-700 shadow-md shadow-red-200 transition"
                        >
                            Yes, Delete
                        </button>
                    </div>
                </div>
            </div>
        </div>
      )}

    </div>
  );
};

export default Reports;