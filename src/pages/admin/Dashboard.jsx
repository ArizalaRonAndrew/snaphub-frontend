import React, { useEffect, useState } from 'react';
import { 
  CalendarCheck, 
  Clock, 
  IdCard, 
  Banknote, 
  ChevronLeft, 
  ChevronRight,
  AlertTriangle, 
  AlertCircle,   
  MapPin,
  User,       
  Mail,       
  Phone,      
  Package,    
  CheckSquare, 
  XCircle,     
  Calendar,
  CheckCircle,
  FileText 
} from "lucide-react";
import StatCard from '../../components/admin/StatCard';
import Modal from "../../components/admin/Modal"; 
import { getAllBookings, updateBookingStatus } from '../../services/BookingService'; 
import { getAllStudents } from '../../services/StudentIdService';

const Dashboard = () => {
  const [bookings, setBookings] = useState([]);
  const [students, setStudents] = useState([]);
  
  // State for Booking Details Modal
  const [selectedBooking, setSelectedBooking] = useState(null);

  // --- NEW: State for Confirmation Modal ---
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    id: null,
    newStatus: null, 
    title: "",
    message: "",
    isDanger: false,
  });

  // Calendar Navigation State
  const [currentDate, setCurrentDate] = useState(new Date());

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
        const [bookingsData, studentsData] = await Promise.all([
            getAllBookings(),
            getAllStudents()
        ]);
        
        // Deduplication to prevent key errors, especially if data sources are flaky
        const uniqueBookingsMap = new Map();
        if (Array.isArray(bookingsData)) {
            bookingsData.forEach(booking => {
                if (booking.bookingID && !uniqueBookingsMap.has(booking.bookingID)) {
                    uniqueBookingsMap.set(booking.bookingID, booking);
                }
            });
        }
        
        setBookings(Array.from(uniqueBookingsMap.values()));
        setStudents(Array.isArray(studentsData) ? studentsData : []);
        
    } catch (error) {
        console.error("Failed to load dashboard data", error);
    }
  };

  // --- NEW: REQUEST UPDATE (Opens Confirmation Modal) ---
  const requestStatusUpdate = (id, newStatus) => {
    let isDanger = newStatus === 'Cancelled';
    let message = `Are you sure you want to change the status to ${newStatus}?`;
    let title = "Update Status";

    if (newStatus === 'Completed') {
        title = "Complete Event";
        message = "Are you sure you want to mark this event as finished? This will update the revenue.";
    }
    if (newStatus === 'Cancelled') {
        title = "Cancel Event";
        message = "Are you sure you want to cancel this event? This action cannot be undone easily.";
    }

    setConfirmModal({
      isOpen: true,
      id, // This is the bookingID
      newStatus,
      title,
      message,
      isDanger
    });
  };

  // --- NEW: EXECUTE ACTION (Calls Backend) ---
  const handleExecuteAction = async () => {
    const { id, newStatus } = confirmModal;

    const result = await updateBookingStatus(id, newStatus);
    
    if (result && result.success) {
        await fetchData(); // Refresh data
        setConfirmModal({ ...confirmModal, isOpen: false }); // Close Confirm Modal
        
        // Only close Details Modal if the status was changed, and the booking 
        // is no longer visible (e.g., set to Completed and thus irrelevant for Reminders)
        if (selectedBooking && selectedBooking.bookingID === id) {
            setSelectedBooking(null); 
        }
        
    } else {
        alert("Failed to update status. Please try again.");
        setConfirmModal({ ...confirmModal, isOpen: false });
    }
  };

  // --- KPI CALCULATIONS ---
  const totalBookings = bookings.length;
  const totalStudents = students.length; 
  const pendingBookings = bookings.filter((b) => b.status === "Pending").length;
  const completedBookingsCount = bookings.filter((b) => b.status === "Completed").length;
  
  // Calculate Revenue based on packagePrice from DB (includes Archived for historical report)
  const revenue = bookings
    .filter(b => b.status === "Completed" || b.status === "Archived")
    .reduce((total, b) => {
        const priceString = b.packagePrice || "0";
        const cleanPrice = parseFloat(priceString.toString().replace(/[^0-9.]/g, ''));
        return total + (isNaN(cleanPrice) ? 0 : cleanPrice);
    }, 0);

  // --- DATE LOGIC FOR REMINDERS ---
  const normalizeDate = (dateInput) => {
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return "";
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  const todayObj = new Date();
  const tomorrowObj = new Date(todayObj);
  tomorrowObj.setDate(todayObj.getDate() + 1);

  const todayKey = normalizeDate(todayObj);
  const tomorrowKey = normalizeDate(tomorrowObj);

  // Filter for Reminders (Only Confirmed bookings)
  const bookingsToday = bookings.filter(b => b.status === "Confirmed" && normalizeDate(b.date) === todayKey);
  const bookingsTomorrow = bookings.filter(b => b.status === "Confirmed" && normalizeDate(b.date) === tomorrowKey);

  // --- CALENDAR DISPLAY LOGIC ---
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay(); 
  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  const nextMonth = () => setCurrentDate(new Date(currentYear, currentMonth + 1, 1));
  const prevMonth = () => setCurrentDate(new Date(currentYear, currentMonth - 1, 1));
  const goToToday = () => setCurrentDate(new Date());
  
  const formatDateKey = normalizeDate; 

  const getDayStatus = (day) => {
      const cellDate = new Date(currentYear, currentMonth, day);
      const cellDateKey = formatDateKey(cellDate);
      const isToday = cellDateKey === todayKey;
      let isOccupied = false;

      if (bookings.length > 0) {
          isOccupied = bookings.some(b => {
               const bookingDateKey = formatDateKey(b.date);
               return bookingDateKey === cellDateKey && b.status === 'Confirmed';
          });
      }
      return { isOccupied, isToday };
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "Confirmed": return "bg-emerald-100 text-emerald-700 border-emerald-200";
      case "Completed": return "bg-blue-100 text-blue-700 border-blue-200";
      case "Cancelled": return "bg-red-100 text-red-700 border-red-200";
      default: return "bg-amber-100 text-amber-700 border-amber-200";
    }
  };

  return (
    <div className="space-y-6 h-full overflow-y-auto p-4 lg:p-8">
      
      <h2 className="text-2xl font-bold text-slate-800">Dashboard Overview</h2>
      
      {/* --- STAT CARDS --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Bookings" value={totalBookings} icon={CalendarCheck} color="text-orange-600" />
        <StatCard title="Pending Bookings" value={pendingBookings} icon={Clock} color="text-amber-500" />
        <StatCard title="Student Applications" value={totalStudents} icon={IdCard} color="text-violet-600" />
        <StatCard title="Total Revenue" value={`₱${revenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}`} icon={Banknote} color="text-green-700" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* --- EVENT REMINDERS --- */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col h-full">
          <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
            Event Reminders
            {(bookingsToday.length > 0 || bookingsTomorrow.length > 0) && (
                 <span className="bg-red-100 text-red-600 text-xs px-2 py-1 rounded-full animate-pulse">Action Needed</span>
            )}
          </h3>
          
          <div className="space-y-4 overflow-y-auto pr-2 custom-scrollbar flex-1">
            
            {bookingsToday.length === 0 && bookingsTomorrow.length === 0 && (
                 <div className="h-full flex flex-col items-center justify-center text-slate-400 py-8">
                    <CalendarCheck className="w-12 h-12 mb-2 opacity-20" />
                    <p>No events scheduled for Today or Tomorrow.</p>
                 </div>
            )}

            {/* Today's Events */}
            {bookingsToday.map((booking) => (
                <div 
                    key={booking.bookingID} // Use bookingID as key
                    onClick={() => setSelectedBooking(booking)}
                    className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-lg shadow-sm group hover:bg-red-100 transition cursor-pointer"
                >
                    <div className="flex items-start">
                    <AlertTriangle className="w-5 h-5 text-red-600 mr-3 mt-0.5 animate-pulse shrink-0" />
                    <div className="flex-1 overflow-hidden">
                        <div className="flex justify-between items-start">
                            <h4 className="font-bold text-red-800 group-hover:underline">HAPPENING TODAY</h4>
                            <span className="text-xs font-bold bg-white text-red-600 px-2 py-1 rounded border border-red-200">{booking.time}</span>
                        </div>
                        <p className="text-sm text-red-700 mt-1 font-medium">{booking.fullname}</p>
                        
                        {/* UPDATED: Service & Package */}
                        <div className="text-xs text-red-600 mt-1 flex flex-col">
                            <span className="font-semibold">{booking.category}</span>
                            <span>{booking.Package_type}</span>
                        </div>

                        {booking.location && (
                             <p className="text-xs text-red-500 mt-2 flex items-center gap-1">
                                <MapPin className="w-3 h-3"/> {booking.location}
                             </p>
                        )}
                    </div>
                    </div>
                </div>
            ))}

            {/* Tomorrow's Events */}
            {bookingsTomorrow.map((booking) => (
                <div 
                    key={booking.bookingID} // Use bookingID as key
                    onClick={() => setSelectedBooking(booking)}
                    className="bg-orange-50 border-l-4 border-orange-500 p-4 rounded-r-lg shadow-sm group hover:bg-orange-100 transition cursor-pointer"
                >
                    <div className="flex items-start">
                    <AlertCircle className="w-5 h-5 text-orange-600 mr-3 mt-0.5 shrink-0" />
                    <div className="flex-1 overflow-hidden">
                        <div className="flex justify-between items-start">
                            <h4 className="font-bold text-orange-800 group-hover:underline">Upcoming Tomorrow</h4>
                            <span className="text-xs font-bold bg-white text-orange-600 px-2 py-1 rounded border border-orange-200">{booking.time}</span>
                        </div>
                        <p className="text-sm text-orange-700 mt-1 font-medium">{booking.fullname}</p>
                        
                        {/* UPDATED: Service & Package */}
                        <div className="text-xs text-orange-600 mt-1 flex flex-col">
                            <span className="font-semibold">{booking.category}</span>
                            <span>{booking.Package_type}</span>
                        </div>

                        {booking.location && (
                             <p className="text-xs text-orange-500 mt-2 flex items-center gap-1">
                                <MapPin className="w-3 h-3"/> {booking.location}
                             </p>
                        )}
                    </div>
                    </div>
                </div>
            ))}

          </div>
        </div>
        
        {/* --- CALENDAR --- */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col h-full">
          {/* Calendar Header */}
          <div className="flex justify-between items-center mb-6">
             <h3 className="text-lg font-bold text-slate-800">Studio Schedule</h3>
             <div className="flex items-center gap-2">
                <button onClick={prevMonth} className="p-1 hover:bg-slate-100 rounded-full text-slate-600 transition-colors"><ChevronLeft size={20} /></button>
                <span className="text-sm font-semibold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full min-w-[140px] text-center select-none">
                  {monthNames[currentMonth]} {currentYear}
                </span>
                <button onClick={nextMonth} className="p-1 hover:bg-slate-100 rounded-full text-slate-600 transition-colors"><ChevronRight size={20} /></button>
             </div>
          </div>
          
          <div className="w-full flex-1">
              <div className="grid grid-cols-7 mb-2">
                  {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => (
                      <div key={d} className="text-center text-xs font-bold text-slate-400 uppercase tracking-wide py-1">{d}</div>
                  ))}
              </div>
              
              <div className="grid grid-cols-7 gap-y-2 gap-x-1">
                  {Array.from({ length: firstDayOfMonth }).map((_, i) => <div key={`empty-${i}`} className="h-8 w-8"></div>)}
                  {Array.from({ length: daysInMonth }).map((_, i) => {
                      const day = i + 1;
                      const { isOccupied, isToday } = getDayStatus(day);
                      let cellClass = "h-9 w-9 flex items-center justify-center rounded-full text-sm transition-all cursor-default ";
                      
                      if (isOccupied) cellClass += "bg-indigo-600 text-white font-bold shadow-sm hover:bg-indigo-700";
                      else if (isToday) cellClass += "border-2 border-indigo-600 font-bold text-indigo-700 hover:bg-indigo-50";
                      else cellClass += "text-slate-600 hover:bg-slate-100";

                      return (
                          <div key={`day-${day}`} className="flex justify-center">
                              <div className={cellClass}><span className="leading-none">{day}</span></div>
                          </div>
                      );
                  })}
              </div>
              
              <div className="mt-6 flex items-center justify-between text-xs text-slate-500">
                  <button onClick={goToToday} className="text-indigo-600 hover:text-indigo-800 font-medium hover:underline">Return to Today</button>
                  <div className="flex gap-4">
                    <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-indigo-600"></div> Booked</div>
                    <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-full border-2 border-indigo-600"></div> Today</div>
                  </div>
              </div>
          </div>
        </div>
      </div>

      {/* --- MODAL 1: BOOKING DETAILS (UPDATED) --- */}
      <Modal isOpen={!!selectedBooking} onClose={() => setSelectedBooking(null)} title="Event Details">
        {selectedBooking && (
          <div className="space-y-6">
            <div className={`p-4 rounded-xl flex items-center justify-between shadow-sm ${getStatusColor(selectedBooking.status || "Pending")} bg-opacity-20`}>
              <span className="font-bold flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Status: <span className="uppercase">{selectedBooking.status || "Pending"}</span>
              </span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                <h4 className="text-xs font-bold text-slate-400 uppercase mb-3 flex items-center gap-2"><User className="w-3 h-3" /> Client Info</h4>
                <p className="font-bold text-slate-800 text-lg">{selectedBooking.fullname}</p>
                <div className="mt-2 space-y-1">
                    <p className="text-slate-500 text-sm flex items-center gap-2"><Mail className="w-3 h-3"/> {selectedBooking.email}</p>
                    <p className="text-slate-500 text-sm flex items-center gap-2"><Phone className="w-3 h-3"/> {selectedBooking.phonenumber}</p>
                </div>
              </div>

              {/* UPDATED: Service Details */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                 <h4 className="text-xs font-bold text-slate-400 uppercase mb-3 flex items-center gap-2"><Package className="w-3 h-3" /> Service Details</h4>
                 <div>
                    <p className="text-xs font-bold text-slate-500 uppercase">Service Type</p>
                    <p className="font-bold text-indigo-700 text-lg mb-2">{selectedBooking.category}</p>
                 </div>
                 <div>
                    <p className="text-xs font-bold text-slate-500 uppercase">Package Type</p>
                    <p className="font-medium text-slate-700">{selectedBooking.Package_type}</p>
                 </div>
              </div>
            </div>

            {/* UPDATED: Date/Venue & Notes Containers */}
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

            {/* Quick Actions inside Dashboard Modal */}
            <div className="flex gap-3 pt-2 border-t border-slate-100">
                 {selectedBooking.status === 'Confirmed' && (
                    <>
                        <button 
                            // FIXED: Use bookingID
                            onClick={() => requestStatusUpdate(selectedBooking.bookingID, 'Cancelled')} 
                            className="flex-1 py-3 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 transition flex items-center justify-center gap-2"
                        >
                            <XCircle className="w-4 h-4" /> Cancel
                        </button>
                        <button 
                            // FIXED: Use bookingID
                            onClick={() => requestStatusUpdate(selectedBooking.bookingID, 'Completed')} 
                            className="flex-1 py-3 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700 shadow-lg shadow-blue-200 transition flex items-center justify-center gap-2"
                        >
                            <CheckSquare className="w-4 h-4" /> Mark as Done
                        </button>
                    </>
                )}
                {selectedBooking.status !== 'Confirmed' && (
                    <button onClick={() => setSelectedBooking(null)} className="w-full py-3 rounded-xl bg-slate-800 text-white font-bold hover:bg-slate-900 transition">
                        Close Details
                    </button>
                )}
            </div>
          </div>
        )}
      </Modal>

      {/* --- MODAL 2: CONFIRMATION (MATCHING BOOKING LIST DESIGN) --- */}
      <Modal isOpen={confirmModal.isOpen} onClose={() => setConfirmModal({...confirmModal, isOpen: false})} title={confirmModal.title}>
        <div className="space-y-4">
          <div className="flex items-start gap-4">
            <div className={`p-3 rounded-full shrink-0 ${confirmModal.isDanger ? 'bg-red-100' : 'bg-emerald-100'}`}>
              {confirmModal.isDanger ? <AlertTriangle className="w-6 h-6 text-red-600" /> : <CheckCircle className="w-6 h-6 text-emerald-600" />}
            </div>
            <div>
              <p className="text-slate-600 leading-relaxed">{confirmModal.message}</p>
            </div>
          </div>
          <div className="flex gap-3 justify-end pt-4">
            <button onClick={() => setConfirmModal({...confirmModal, isOpen: false})} className="px-4 py-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 font-semibold transition">Cancel</button>
            <button 
                onClick={handleExecuteAction} 
                className={`px-4 py-2 rounded-lg text-white font-bold shadow-md transition flex items-center gap-2 ${confirmModal.isDanger ? 'bg-red-600 hover:bg-red-700 shadow-red-200' : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200'}`}
            >
                Yes, Proceed
            </button>
          </div>
        </div>
      </Modal>

    </div>
  );
};

export default Dashboard;