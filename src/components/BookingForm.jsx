import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom"; 
import { submitBooking } from "../services/BookingService"; 

const DetailItem = ({ label, value, isPrimary = false }) => (
  <div className="flex justify-between items-start py-2 border-b border-gray-100 last:border-b-0">
    <span className={`font-medium text-gray-500 ${isPrimary ? "text-lg text-indigo-700" : "text-base"}`}>
      {label}
    </span>
    <span className={`font-semibold text-right ${isPrimary ? "text-indigo-900 text-lg" : "text-gray-900 text-base"}`}>
      {value || <span className="text-gray-400 italic">N/A</span>}
    </span>
  </div>
);

// --- MODIFIED: General Status Modal (Success & Error) ---
const StatusModal = ({ type, title, message, onClose }) => {
    const isSuccess = type === "success";
    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-fadeIn">
        <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-sm text-center transform transition-all scale-100">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${
                isSuccess ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"
            }`}>
            <span className="text-3xl">{isSuccess ? "✔" : "⚠️"}</span>
            </div>
            <h3 className={`text-xl font-bold mb-2 ${isSuccess ? "text-green-800" : "text-gray-900"}`}>
                {title || (isSuccess ? "Success" : "Notice")}
            </h3>
            <p className="text-gray-600 mb-6">{message}</p>
            <button 
            onClick={onClose}
            className={`w-full py-2.5 font-bold rounded-lg transition ${
                isSuccess 
                ? "bg-green-600 hover:bg-green-700 text-white" 
                : "bg-red-600 hover:bg-red-700 text-white"
            }`}
            >
            {isSuccess ? "Great!" : "Okay, I understand"}
            </button>
        </div>
        </div>
    );
};

export default function BookingForm() {
  const location = useLocation(); 

  const initialFormData = {
    fullname: "",
    email: "",
    phonenumber: "",
    location: "", // This needs to be required
    category: "", 
    Package_type: "", 
    date: "",
    time: "",
    details: "", // This can be null/empty
  };

  const [formData, setFormData] = useState(initialFormData);
  const [allServices, setAllServices] = useState([]); 
  const [packageOptions, setPackageOptions] = useState([]); 
  const [loading, setLoading] = useState(false);
  
  // Modal States
  const [showReviewModal, setShowReviewModal] = useState(false);
  
  // --- UNIFIED MODAL STATE (Replaces ErrorModal and Alerts) ---
  const [statusModal, setStatusModal] = useState({ 
    show: false, 
    type: "error", // 'error' or 'success'
    title: "", 
    message: "" 
  });

  // API Check
  const checkDateAvailability = async (selectedDate) => {
    try {
        const response = await fetch(`http://localhost:5000/api/bookings/check-availability?date=${selectedDate}`);
        const data = await response.json();
        return data.available; 
    } catch (error) {
        console.error("Error checking availability:", error);
        return true; 
    }
  };

  useEffect(() => {
    const initBooking = async () => {
        try {
            const response = await fetch("http://localhost:5000/api/services");
            const servicesData = await response.json();
            setAllServices(servicesData);

            const params = new URLSearchParams(location.search);
            const serviceParam = params.get("service");
            const packageParam = params.get("package");

            if (serviceParam) {
                const decodedService = decodeURIComponent(serviceParam);
                const decodedPackage = packageParam ? decodeURIComponent(packageParam) : "";
                const matchedService = servicesData.find(s => s.name === decodedService);

                if (matchedService) {
                    setFormData(prev => ({
                        ...prev,
                        category: matchedService.name,
                        Package_type: decodedPackage
                    }));
                    setPackageOptions(matchedService.packages || []);
                }
            }
        } catch (error) {
            console.error("Error initializing booking form:", error);
        }
    };
    initBooking();
  }, [location]);

  const handleChange = async (e) => {
    const { name, value } = e.target;

    if (name === "phonenumber") {
      let numericValue = value.replace(/\D/g, "");
      if (numericValue.length > 11) numericValue = numericValue.slice(0, 11);
      setFormData((prev) => ({ ...prev, [name]: numericValue }));
      return;
    }

    if (name === "date") {
        setFormData((prev) => ({ ...prev, [name]: value })); 

        const isAvailable = await checkDateAvailability(value);

        if (!isAvailable) {
            setFormData((prev) => ({ ...prev, date: "" })); 
            // --- USE STATUS MODAL FOR DATE ERROR ---
            setStatusModal({ 
                show: true, 
                type: "error",
                title: "Date Unavailable",
                message: "This date is already booked (Pending or Confirmed). Please choose another date." 
            });
            return; 
        }
    } else {
        setFormData((prev) => ({ ...prev, [name]: value }));
    }

    if (name === "category") {
      const selectedServiceObj = allServices.find(s => s.name === value);
      if (selectedServiceObj) {
          setPackageOptions(selectedServiceObj.packages || []);
      } else {
          setPackageOptions([]);
      }
      setFormData((prev) => ({ ...prev, Package_type: "" }));
    }
  };

  const handleReset = () => {
    setPackageOptions([]);
    setFormData(initialFormData);
  };

  // --- MODIFIED: Added checks for all required fields (except 'details') ---
  const openReviewModal = (e) => {
    e.preventDefault();
    
    const requiredFields = [
      { key: 'fullname', name: 'Full Name' },
      { key: 'email', name: 'Email' },
      { key: 'location', name: 'Event Location' },
      { key: 'category', name: 'Service Type' },
      { key: 'Package_type', name: 'Package Type' },
      { key: 'date', name: 'Preferred Date' },
      { key: 'time', name: 'Preferred Time' },
    ];

    for (const field of requiredFields) {
      if (!formData[field.key] || String(formData[field.key]).trim() === "") {
        setStatusModal({
          show: true,
          type: "error",
          title: "Missing Information",
          message: `Please fill out the required field: ${field.name}.`
        });
        // Optionally locate to the field by focusing the input or scrolling to its container
        const inputElement = document.getElementsByName(field.key)[0];
        if (inputElement) inputElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
      }
    }

    // Phone number validation
    if (formData.phonenumber.length !== 11) {
      // --- USE STATUS MODAL FOR PHONE ERROR ---
      setStatusModal({
        show: true,
        type: "error",
        title: "Invalid Phone Number",
        message: "Please enter a valid 11-digit phone number."
      });
      const phoneElement = document.getElementsByName('phonenumber')[0];
      if (phoneElement) phoneElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    // If all checks pass
    setShowReviewModal(true);
  };

  const handleSubmit = async () => {
    setLoading(true);

    const isAvailable = await checkDateAvailability(formData.date);
    if (!isAvailable) {
        setLoading(false);
        setShowReviewModal(false);
        setFormData((prev) => ({ ...prev, date: "" }));
        // --- USE STATUS MODAL FOR DATE ERROR (SUBMIT) ---
        setStatusModal({ 
            show: true, 
            type: "error",
            title: "Date Taken",
            message: "Someone just booked this date! Please select another one." 
        });
        return;
    }

    const result = await submitBooking(formData);

    if (result.success) {
      // --- USE STATUS MODAL FOR SUCCESS ---
      handleReset();
      setShowReviewModal(false);
      setStatusModal({ 
        show: true, 
        type: "success",
        title: "Booking Confirmed!",
        message: "Your session has been successfully booked. We'll contact you shortly." 
      });
    } else {
      // --- USE STATUS MODAL FOR FAILURE ---
      setStatusModal({
        show: true,
        type: "error",
        title: "Booking Failed",
        message: "Failed to submit booking. Please try again."
      });
    }

    setLoading(false);
  };

  return (
    <>
      <section className="py-24 bg-linear-to-br from-indigo-50 via-white to-gray-50">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-14">
            <h2 className="text-5xl font-extrabold text-gray-900 mb-3">
              📸 Book Your Session
            </h2>
            <p className="text-gray-600 text-lg">
              Fill out the form and we’ll confirm within 24 hours.
            </p>
          </div>

          <form
            onSubmit={openReviewModal}
            className="bg-white shadow-2xl rounded-3xl p-12 space-y-10 border border-gray-200"
          >
            {/* PERSONAL DETAILS */}
            <div className="space-y-6">
              <h3 className="text-2xl font-bold text-indigo-700 border-b-2 border-indigo-200 pb-2 mb-4">
                Personal Details
              </h3>

              <div>
                <label className="block text-md font-semibold text-gray-700 mb-2">
                  Full Name *
                </label>
                <input
                  name="fullname"
                  value={formData.fullname}
                  onChange={handleChange}
                  type="text"
                  required
                  placeholder="John Doe"
                  className="w-full px-5 py-4 rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-200 focus:border-indigo-500 shadow-sm transition"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-md font-semibold text-gray-700 mb-2">
                    Email *
                  </label>
                  <input
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    type="email"
                    required
                    placeholder="john@example.com"
                    className="w-full px-5 py-4 rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-200 focus:border-indigo-500 shadow-sm transition"
                  />
                </div>

                <div>
                  <label className="block text-md font-semibold text-gray-700 mb-2">
                    Phone *
                  </label>
                  <input
                    name="phonenumber"
                    value={formData.phonenumber}
                    onChange={handleChange}
                    type="tel"
                    placeholder="09123456789"
                    required
                    className="w-full px-5 py-4 rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-200 focus:border-indigo-500 shadow-sm transition"
                  />
                  {formData.phonenumber.length > 0 &&
                    formData.phonenumber.length < 11 && (
                      <p className="text-red-500 text-sm mt-1">
                        Phone number must be 11 digits
                      </p>
                    )}
                </div>
              </div>

              <div>
                <label className="block text-md font-semibold text-gray-700 mb-2">
                  Event Location * {/* Added required indicator for clarity */}
                </label>
                <input
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  type="text"
                  placeholder="Venue or Address"
                  required // ADDED: Enforce Location requirement in HTML
                  className="w-full px-5 py-4 rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-200 focus:border-indigo-500 shadow-sm transition"
                />
              </div>
            </div>

            {/* SERVICE INFO */}
            <div className="space-y-6">
              <h3 className="text-2xl font-bold text-indigo-700 border-b-2 border-indigo-200 pb-2 mb-4">
                Service Info
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-md font-semibold text-gray-700 mb-2">
                    Service Type *
                  </label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    required
                    className="w-full px-5 py-4 rounded-xl border border-gray-300 bg-white shadow-sm transition"
                  >
                    <option value="">Select a service</option>
                    {allServices.map((service) => (
                        <option key={service.id} value={service.name}>
                            {service.name}
                        </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-md font-semibold text-gray-700 mb-2">
                    Package Type *
                  </label>
                  <select
                    name="Package_type"
                    value={formData.Package_type}
                    onChange={handleChange}
                    required={!!formData.category}
                    disabled={!formData.category}
                    className={`w-full px-5 py-4 rounded-xl border focus:ring-2 focus:ring-indigo-200 focus:border-indigo-500 shadow-sm transition ${
                      formData.category
                        ? "bg-white text-gray-900 border-gray-300"
                        : "bg-gray-100 text-gray-400 border-gray-200"
                    }`}
                  >
                    <option value="">
                      {formData.category
                        ? "Select a package"
                        : "Select service first"}
                    </option>
                    {packageOptions.map((pkg) => (
                      <option key={pkg.id} value={pkg.name}>
                        {pkg.name} - {pkg.price.toString().includes('₱') ? pkg.price : `₱${pkg.price}`}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* SCHEDULE */}
            <div className="space-y-6">
              <h3 className="text-2xl font-bold text-indigo-700 border-b-2 border-indigo-200 pb-2 mb-4">
                Schedule
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-md font-semibold text-gray-700 mb-2">
                    Preferred Date *
                  </label>
                  <input
                    name="date"
                    value={formData.date}
                    onChange={handleChange}
                    type="date"
                    required
                    className="w-full px-5 py-4 rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-200 focus:border-indigo-500 shadow-sm transition"
                  />
                </div>

                <div>
                  <label className="block text-md font-semibold text-gray-700 mb-2">
                    Preferred Time *
                  </label>
                  <input
                    name="time"
                    value={formData.time}
                    onChange={handleChange}
                    type="time"
                    required
                    className="w-full px-5 py-4 rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-200 focus:border-indigo-500 shadow-sm transition"
                  />
                </div>
              </div>
            </div>

            {/* NOTES */}
            <div className="space-y-4">
              <h3 className="text-2xl font-bold text-indigo-700 border-b-2 border-indigo-200 pb-2 mb-4">
                Additional Notes
              </h3>

              <textarea
                name="details"
                value={formData.details}
                onChange={handleChange}
                rows="5"
                placeholder="Additional notes or requests..."
                // REMOVED required attribute as per user request
                className="w-full px-5 py-4 rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-200 focus:border-indigo-500 shadow-sm transition"
              />
            </div>

            {/* BUTTONS */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <button
                type="submit"
                className="w-full py-4 bg-linear-to-r from-indigo-600 to-indigo-800 text-white font-bold text-lg rounded-xl shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all"
              >
                🚀 Review & Submit
              </button>

              <button
                type="button"
                onClick={handleReset}
                className="w-full py-4 bg-gray-100 text-gray-700 font-semibold rounded-xl shadow hover:bg-gray-200 transition-all"
              >
                ❌ Reset Form
              </button>
            </div>
          </form>
        </div>
      </section>

      {/* UNIFIED STATUS MODAL (For Error, Success, Date Check, Phone Check) */}
      {statusModal.show && (
        <StatusModal 
            type={statusModal.type}
            title={statusModal.title}
            message={statusModal.message}
            onClose={() => setStatusModal(prev => ({ ...prev, show: false }))}
        />
      )}

      {/* CONFIRMATION MODAL */}
      {showReviewModal && (
        <div className="fixed inset-0 bg-black/60 flex justify-center items-center z-50 p-4">
          <div className="bg-white max-w-4xl w-full rounded-2xl shadow-2xl p-6 md:p-8 lg:p-10 transition-all max-h-[90vh] overflow-y-auto">
            <h2 className="text-4xl font-extrabold text-center text-indigo-800 mb-8 border-b-4 border-indigo-100 pb-3">
              Review & Confirm Your Booking
            </h2>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-12 gap-y-6">
              <div className="space-y-4 p-4 border border-gray-100 rounded-xl bg-gray-50/50 shadow-sm">
                <h3 className="text-2xl font-bold text-indigo-700 mb-3 border-b pb-1">
                  Client Details 👤
                </h3>
                <DetailItem label="Full Name" value={formData.fullname} />
                <DetailItem label="Email" value={formData.email} />
                <DetailItem label="Phone Number" value={formData.phonenumber} />
                <DetailItem label="Location" value={formData.location} />
              </div>

              <div className="space-y-4 p-4 border border-gray-100 rounded-xl bg-gray-50/50 shadow-sm">
                <h3 className="text-2xl font-bold text-indigo-700 mb-3 border-b pb-1">
                  Booking Info 📅
                </h3>
                <DetailItem
                  label="Service Type"
                  value={formData.category}
                  isPrimary={true}
                />
                <DetailItem
                  label="Package Type"
                  value={formData.Package_type}
                  isPrimary={true}
                />
                <DetailItem label="Preferred Date" value={formData.date} />
                <DetailItem label="Preferred Time" value={formData.time} />
              </div>
            </div>

            <div className="mt-8 p-4 border border-gray-200 rounded-xl bg-white shadow-md">
              <h3 className="text-2xl font-bold text-gray-700 mb-3 border-b pb-1">
                Additional Notes 📝
              </h3>
              <p className="whitespace-pre-line text-gray-700 px-2 py-2 min-h-[60px] italic">
                {formData.details ||
                  "No additional notes were provided for this booking."}
              </p>
            </div>

            <div className="flex justify-end gap-4 mt-8 pt-4 border-t border-gray-200">
              <button
                onClick={() => setShowReviewModal(false)}
                className="px-6 py-3 bg-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-300 transition shadow"
              >
                ✏️ Go Back & Edit
              </button>

              <button
                onClick={handleSubmit}
                className="px-8 py-3 bg-indigo-700 text-white font-bold rounded-xl shadow-lg hover:bg-indigo-800 transition transform hover:scale-[1.01]"
                disabled={loading}
              >
                {loading ? "Submitting..." : "✔ Confirm & Submit"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// src/components/BookingForm.jsx

src/components/StudentIdForm.jsx