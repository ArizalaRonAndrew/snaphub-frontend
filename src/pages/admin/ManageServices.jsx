import React, { useState, useEffect } from "react";
import {
  Plus,
  Trash2,
  Edit,
  Save,
  UploadCloud,
  ArrowLeft,
  CheckCircle,
  X,
  ChevronLeft,
  ChevronRight,
  Image as ImageIcon,
  AlertTriangle,
  CheckCircle2
} from "lucide-react";
import Modal from "../../components/admin/Modal";

const ManageServices = () => {
  const [viewMode, setViewMode] = useState("list");
  const [selectedService, setSelectedService] = useState(null);
  const [services, setServices] = useState([]); 
  
  // Modals States
  const [isServiceModalOpen, setServiceModalOpen] = useState(false);
  const [isPackageModalOpen, setPackageModalOpen] = useState(false);
  
  // Custom Confirmation & Alert Modals States
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: null,
    isDelete: false
  });

  const [alertModal, setAlertModal] = useState({
    isOpen: false,
    type: "success", // success or error
    message: ""
  });
  
  // Edit/Add States
  const [editingPackageId, setEditingPackageId] = useState(null);
  const [isEditingService, setIsEditingService] = useState(false);
  const [tempServiceData, setTempServiceData] = useState({});
  
  // Lightbox / Album States
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Form Data
  const [newService, setNewService] = useState({
    name: "",
    description: "",
    imageFile: null, 
    imagePreview: "" 
  });
  
  const [newPackage, setNewPackage] = useState({
    name: "",
    price: "",
    features: "",
    imageFile: null
  });

  // --- HELPER FUNCTIONS FOR MODALS ---
  
  const showAlert = (message, type = "success") => {
    setAlertModal({ isOpen: true, message, type });
  };

  const closeAlert = () => {
    setAlertModal({ ...alertModal, isOpen: false });
  };

  const showConfirm = (title, message, onConfirm, isDelete = false) => {
    setConfirmModal({
      isOpen: true,
      title,
      message,
      onConfirm,
      isDelete
    });
  };

  const closeConfirm = () => {
    setConfirmModal({ ...confirmModal, isOpen: false });
  };

  const handleConfirmAction = () => {
    if (confirmModal.onConfirm) {
      confirmModal.onConfirm();
    }
    closeConfirm();
  };

  // --- API FUNCTIONS ---

  const fetchServices = async () => {
    try {
      const response = await fetch("http://localhost:5000/api/services");
      const data = await response.json();
      setServices(data);
      
      if (selectedService) {
        const updated = data.find(s => s.id === selectedService.id);
        if(updated) setSelectedService(updated);
      }
    } catch (error) {
      console.error("Error fetching services:", error);
    }
  };

  useEffect(() => {
    fetchServices();
  }, []);

  const handleFileUpload = (event, setter, field = null) => {
    const file = event.target.files[0];
    if (file) {
      const objectUrl = URL.createObjectURL(file);
      if (field === 'service') {
        setter((prev) => ({ ...prev, imageFile: file, imagePreview: objectUrl }));
      } else if (field === 'editService') {
         setter((prev) => ({ ...prev, imageFile: file, image: objectUrl }));
      } else {
        setter(objectUrl);
      }
    }
  };

  const handleViewService = (service) => {
    setSelectedService(service);
    setTempServiceData({ ...service, imageFile: null }); 
    setIsEditingService(false);
    setViewMode("detail");
  };

  const handleBack = () => {
    setSelectedService(null);
    setIsEditingService(false);
    setViewMode("list");
  };

  // 2. ADD SERVICE
  const handleAddService = async () => {
    // FIX: Client-side validation to prevent empty name/description 
    // from causing a database error (e.g., NOT NULL constraint).
    if (!newService.name.trim() || !newService.description.trim()) {
        showAlert("Service Name and Description are required.", "error");
        return;
    }

    const formData = new FormData();
    formData.append('name', newService.name);
    formData.append('description', newService.description);
    if (newService.imageFile) {
      formData.append('image', newService.imageFile);
    }

    try {
      const response = await fetch("http://localhost:5000/api/services", {
        method: "POST",
        body: formData,
      });

      // FIX: Check if the response was successful (status 200-299)
      if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }
      // If successful:
      fetchServices();
      setServiceModalOpen(false);
      setNewService({ name: "", description: "", imageFile: null, imagePreview: "" });
      showAlert("Service added successfully!");
    } catch (error) {
      console.error("Error adding service:", error);
      showAlert(`Error adding service: ${error.message}`, "error");
    }
  };

  // 3. DELETE SERVICE
  const handleDeleteService = (id) => {
    showConfirm(
      "Delete Service",
      "Are you sure you want to delete this service? This action cannot be undone.",
      async () => {
        try {
          await fetch(`http://localhost:5000/api/services/${id}`, { method: "DELETE" });
          fetchServices();
          showAlert("Service deleted successfully.");
        } catch (error) {
          console.error("Error deleting", error);
          showAlert("Failed to delete service.", "error");
        }
      },
      true 
    );
  };

  // 4. UPDATE SERVICE
  const handleSaveServiceDetails = async () => {
    // FIX: Client-side validation for update
    if (!tempServiceData.name.trim() || !tempServiceData.description.trim()) {
        showAlert("Service Name and Description cannot be empty.", "error");
        return;
    }

    const formData = new FormData();
    formData.append('name', tempServiceData.name);
    formData.append('description', tempServiceData.description);
    if (tempServiceData.imageFile) {
      formData.append('image', tempServiceData.imageFile);
    }

    try {
      const response = await fetch(`http://localhost:5000/api/services/${selectedService.id}`, {
        method: "PUT",
        body: formData,
      });
      
      // FIX: Check for unsuccessful update response
      if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      fetchServices();
      setIsEditingService(false);
      showAlert("Service details updated!");
    } catch (error) {
      console.error("Error updating service:", error);
      showAlert(`Error updating service: ${error.message}`, "error");
    }
  };

  // PACKAGE HANDLERS
  const openAddPackageModal = () => {
    setEditingPackageId(null);
    setNewPackage({ name: "", price: "", features: "", imageFile: null });
    setPackageModalOpen(true);
  };

  const handleEditPackage = (pkg) => {
    setEditingPackageId(pkg.id);
    // Ensure we handle numeric price correctly
    setNewPackage({
      name: pkg.name,
      price: pkg.price,
      features: pkg.features.join(", "),
      imageFile: null
    });
    setPackageModalOpen(true);
  };

  const handleSavePackage = async () => {
    // FIX: Add basic validation for package
    if (!newPackage.name.trim() || !newPackage.price || !newPackage.features.trim()) {
        showAlert("Package Name, Price, and Features are required.", "error");
        return;
    }
    
    const formData = new FormData();
    
    // FIX: Clean the price to be numbers only before saving to DB
    // This prevents sending "₱10000" to a DECIMAL column which turns it to 0.00
    const rawPrice = newPackage.price.toString().replace(/[^0-9.]/g, '');

    formData.append('name', newPackage.name);
    formData.append('price', rawPrice); 
    formData.append('features', newPackage.features); 
    
    if(newPackage.imageFile){
       formData.append('image', newPackage.imageFile);
    }

    try {
      if (editingPackageId) {
         const response = await fetch(`http://localhost:5000/api/services/packages/${editingPackageId}`, {
          method: "PUT",
          headers: { 'Content-Type': 'application/json' }, 
          body: JSON.stringify({
              name: newPackage.name,
              price: rawPrice, // Send raw number
              features: newPackage.features
          })
        });
        if (!response.ok) {
             const errorData = await response.json();
             throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
        }
        showAlert("Package updated successfully!");
      } else {
        formData.append('serviceID', selectedService.id);
        const response = await fetch("http://localhost:5000/api/services/packages", {
          method: "POST",
          body: formData,
        });
        
        if (!response.ok) {
             const errorData = await response.json();
             throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
        }

        showAlert("Package added successfully!");
      }
      fetchServices();
      setPackageModalOpen(false);
      setNewPackage({ name: "", price: "", features: "" });
      setEditingPackageId(null);
    } catch (error) {
      console.error("Error saving package", error);
      showAlert(`Failed to save package: ${error.message}`, "error");
    }
  };

  const handleDeletePackage = (pkgId) => {
    showConfirm(
      "Delete Package",
      "Are you sure you want to remove this package?",
      async () => {
        try {
          await fetch(`http://localhost:5000/api/services/packages/${pkgId}`, { method: "DELETE" });
          fetchServices();
          showAlert("Package deleted.");
        } catch (error) {
           console.error("Error deleting package", error);
           showAlert("Failed to delete package.", "error");
        }
      },
      true
    );
  };

  // --- ALBUM LOGIC ---
  
  const handleUploadAlbumPhoto = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('image', file);
    formData.append('serviceID', selectedService.id);

    try {
      const response = await fetch('http://localhost:5000/api/services/album', {
        method: 'POST',
        body: formData
      });

      if (response.ok) {
        fetchServices();
        showAlert("Photo added to album.");
      } else {
          const errorData = await response.json();
          showAlert(errorData.error || "Failed to upload photo", "error");
      }
    } catch (error) {
      console.error("Error uploading album photo:", error);
      showAlert("System error uploading photo", "error");
    }
  };

  const handleDeleteAlbumPhoto = (photoID) => {
    showConfirm(
      "Delete Photo",
      "Do you want to remove this photo from the album?",
      async () => {
        try {
          await fetch(`http://localhost:5000/api/services/album/${photoID}`, {
            method: 'DELETE'
          });
          fetchServices();
          showAlert("Photo removed.");
        } catch (error) {
          console.error("Error deleting album photo:", error);
          showAlert("Failed to remove photo.", "error");
        }
      },
      true
    );
  };

  const openLightbox = (index) => {
    setCurrentImageIndex(index);
    setIsLightboxOpen(true);
  };

  const nextImage = (e) => {
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev + 1) % selectedService.album.length);
  };

  const prevImage = (e) => {
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev - 1 + selectedService.album.length) % selectedService.album.length);
  };

  // --- STYLE FOR HIDING SCROLLBAR ---
  const ScrollbarStyle = () => (
    <style>{`
      .no-scrollbar::-webkit-scrollbar {
        display: none;
      }
      .no-scrollbar {
        -ms-overflow-style: none;
        scrollbar-width: none;
      }
    `}</style>
  );

  // --- RENDER ---

  return (
    <>
      <ScrollbarStyle />
      
      {/* --- GLOBAL MODALS --- */}
      
      {confirmModal.isOpen && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/70 backdrop-blur-md p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 animate-fadeIn relative z-[2010]">
            <div className="flex flex-col items-center text-center">
              <div className={`p-3 rounded-full mb-4 ${confirmModal.isDelete ? "bg-red-100 text-red-600" : "bg-blue-100 text-blue-600"}`}>
                <AlertTriangle className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">{confirmModal.title}</h3>
              <p className="text-gray-500 mb-6">{confirmModal.message}</p>
              <div className="flex w-full gap-3">
                <button
                  onClick={closeConfirm}
                  className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmAction}
                  className={`flex-1 px-4 py-2 text-white rounded-xl font-semibold transition shadow-md ${confirmModal.isDelete ? "bg-red-600 hover:bg-red-700" : "bg-indigo-600 hover:bg-indigo-700"}`}
                >
                  Confirm
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {alertModal.isOpen && (
        <div className="fixed inset-0 z-[2100] flex items-center justify-center bg-black/70 backdrop-blur-md p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 animate-fadeIn relative z-[2110]">
            <div className="flex flex-col items-center text-center">
              <div className={`p-3 rounded-full mb-4 ${alertModal.type === "success" ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"}`}>
                {alertModal.type === "success" ? <CheckCircle2 className="w-8 h-8" /> : <AlertTriangle className="w-8 h-8" />}
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-6">{alertModal.message}</h3>
              <button
                onClick={closeAlert}
                className="w-full px-4 py-2 bg-gray-900 text-white rounded-xl font-semibold hover:bg-gray-800 transition shadow-md"
              >
                Okay
              </button>
            </div>
          </div>
        </div>
      )}

      {/* LIGHTBOX MODAL */}
      {isLightboxOpen && selectedService?.album && (
        <div 
          className="fixed inset-0 z-[1200] bg-black/95 flex items-center justify-center backdrop-blur-sm cursor-default"
          onClick={() => setIsLightboxOpen(false)}
        >
          <button 
            onClick={(e) => {
              e.stopPropagation();
              setIsLightboxOpen(false);
            }}
            className="absolute top-6 right-6 text-white/70 hover:text-white transition p-2 z-[1300] bg-white/10 rounded-full hover:bg-white/20"
          >
            <X className="w-10 h-10" />
          </button>

          <div 
            className="relative w-full h-full flex items-center justify-center p-4 md:p-10"
            onClick={(e) => e.stopPropagation()} 
          >
            <img 
              src={selectedService.album[currentImageIndex]?.image} 
              alt="Full view" 
              className="max-h-[85vh] max-w-[90vw] object-contain rounded-md shadow-2xl"
            />
            
            <button 
              onClick={prevImage}
              className="absolute left-4 md:left-10 bg-white/10 hover:bg-white/20 text-white p-3 rounded-full transition backdrop-blur-md z-50"
            >
              <ChevronLeft className="w-8 h-8" />
            </button>

            <button 
              onClick={nextImage}
              className="absolute right-4 md:right-10 bg-white/10 hover:bg-white/20 text-white p-3 rounded-full transition backdrop-blur-md z-50"
            >
              <ChevronRight className="w-8 h-8" />
            </button>
            
            <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 text-white/80 font-medium bg-black/50 px-4 py-1 rounded-full text-sm">
               {currentImageIndex + 1} / {selectedService.album.length}
            </div>
          </div>
        </div>
      )}

      {/* --- MAIN CONTENT AREA --- */}
      <div className="h-full overflow-y-auto p-4 lg:p-8 no-scrollbar">
        {viewMode === "list" ? (
          <div className="space-y-8">
            <div className="flex justify-between items-center px-2">
              <div>
                <h2 className="text-4xl font-extrabold text-slate-800">
                  Manage Services
                </h2>
                <p className="text-gray-600 mt-2">Customize your offerings.</p>
              </div>
              <button
                onClick={() => setServiceModalOpen(true)}
                className="flex items-center bg-indigo-700 text-white px-6 py-3 rounded-xl hover:bg-indigo-800 transition shadow-lg transform hover:scale-[1.02] font-bold"
              >
                <Plus className="w-5 h-5 mr-2" /> Add Service
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {services.map((service) => (
                <div
                  key={service.id}
                  className="bg-white rounded-2xl shadow-lg overflow-hidden flex flex-col transition-transform hover:scale-[1.02] duration-300"
                >
                  <div className="h-56 w-full overflow-hidden relative group">
                    <img
                      src={service.image || "https://placehold.co/600x400?text=No+Image"}
                      alt={service.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                    <div className="absolute top-4 right-4 flex gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteService(service.id);
                        }}
                        className="bg-white/90 text-red-600 p-2 rounded-full hover:bg-white shadow-sm transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <div className="p-6 flex flex-col grow">
                    <h3 className="text-2xl font-bold mb-2 text-slate-900">
                      {service.name}
                    </h3>
                    <p className="text-gray-600 mb-6 grow line-clamp-3">
                      {service.description}
                    </p>
                    <div className="flex justify-center mt-auto">
                      <button
                        onClick={() => handleViewService(service)}
                        className="w-full block py-3 bg-slate-800 hover:bg-slate-900 text-white text-center font-bold rounded-lg transition-all shadow-md"
                      >
                        Edit Details & Packages
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <Modal
              isOpen={isServiceModalOpen}
              onClose={() => setServiceModalOpen(false)}
              title="Add New Service"
            >
              <div className="space-y-6">
                <div>
                  <label className="block text-md font-semibold text-gray-700 mb-2">
                    Service Name
                  </label>
                  <input
                    type="text"
                    className="w-full px-5 py-4 rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-200 focus:border-indigo-500 shadow-sm transition"
                    value={newService.name}
                    onChange={(e) =>
                      setNewService({ ...newService, name: e.target.value })
                    }
                    placeholder="e.g. Wedding Photography"
                  />
                </div>
                <div>
                  <label className="block text-md font-semibold text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    className="w-full px-5 py-4 rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-200 focus:border-indigo-500 shadow-sm transition"
                    rows="4"
                    value={newService.description}
                    onChange={(e) =>
                      setNewService({ ...newService, description: e.target.value })
                    }
                    placeholder="Describe the service..."
                  />
                </div>
                <div>
                  <label className="block text-md font-semibold text-gray-700 mb-2">
                    Upload Cover Image
                  </label>
                  <div className="flex items-center space-x-2">
                    <label className="cursor-pointer w-full py-4 bg-gray-100 text-gray-700 font-semibold rounded-xl shadow hover:bg-gray-200 transition-all flex justify-center items-center border border-dashed border-gray-300">
                      <UploadCloud className="w-5 h-5 mr-2" /> 
                      {newService.imagePreview ? "Change File" : "Choose File"}
                      <input
                        type="file"
                        className="hidden"
                        accept="image/*"
                        onChange={(e) => handleFileUpload(e, setNewService, "service")}
                      />
                    </label>
                  </div>
                  {newService.imagePreview && (
                      <img src={newService.imagePreview} alt="Preview" className="mt-4 h-32 w-full object-cover rounded-lg" />
                  )}
                </div>
                <button
                  onClick={handleAddService}
                  className="w-full py-4 bg-linear-to-r from-indigo-600 to-indigo-800 text-white font-bold text-lg rounded-xl shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all"
                >
                  Save Service
                </button>
              </div>
            </Modal>
          </div>
        ) : (
          // --- DETAIL VIEW ---
          <div className="space-y-6">
            <button
              onClick={handleBack}
              className="text-slate-600 hover:text-slate-800 transition flex items-center text-sm font-medium"
            >
              <ArrowLeft className="w-4 h-4 mr-2" /> Back to All Services
            </button>
            <div className="bg-white p-10 rounded-2xl shadow-lg border border-gray-100 relative">
              <div className="absolute top-6 right-6 z-10">
                {!isEditingService ? (
                  <button
                    onClick={() => setIsEditingService(true)}
                    className="flex items-center text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-4 py-2 rounded-lg font-bold transition"
                  >
                    <Edit className="w-4 h-4 mr-2" /> Edit Info
                  </button>
                ) : (
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setIsEditingService(false);
                        setTempServiceData({ ...selectedService });
                      }}
                      className="text-gray-600 bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded-lg font-bold transition"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSaveServiceDetails}
                      className="text-white bg-indigo-600 hover:bg-indigo-700 px-4 py-2 rounded-lg font-bold transition flex items-center shadow-md"
                    >
                      <Save className="w-4 h-4 mr-2" /> Save Changes
                    </button>
                  </div>
                )}
              </div>
              
              <div className="relative w-full h-64 md:h-80 mb-8 rounded-xl overflow-hidden shadow-inner group bg-slate-100">
                <img
                  src={isEditingService ? (tempServiceData.image || "https://placehold.co/600x400") : (selectedService.image || "https://placehold.co/600x400")}
                  className="w-full h-full object-cover"
                  alt=""
                />
                {isEditingService && (
                  <label className="absolute inset-0 bg-black/50 cursor-pointer flex flex-col items-center justify-center text-white transition hover:bg-black/60">
                    <UploadCloud className="w-10 h-10 mb-2" />
                    <span className="font-bold text-lg">
                      Click to Change Cover Image
                    </span>
                    <input
                      type="file"
                      className="hidden"
                      accept="image/*"
                      onChange={(e) =>
                        handleFileUpload(e, setTempServiceData, "editService")
                      }
                    />
                  </label>
                )}
              </div>
              
              <div className="text-center">
                {isEditingService ? (
                  <div className="space-y-4 max-w-3xl mx-auto">
                    <div>
                      <label className="block text-sm font-bold text-gray-500 mb-1 text-left">
                        Service Name
                      </label>
                      <input
                        type="text"
                        className="w-full text-center text-3xl font-extrabold text-slate-900 border-b-2 border-indigo-200 focus:border-indigo-600 bg-transparent outline-none py-2 transition"
                        value={tempServiceData.name}
                        onChange={(e) =>
                          setTempServiceData({
                            ...tempServiceData,
                            name: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-500 mb-1 text-left">
                        Description
                      </label>
                      <textarea
                        className="w-full text-center text-lg text-gray-600 border rounded-xl p-4 border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition"
                        rows="3"
                        value={tempServiceData.description}
                        onChange={(e) =>
                          setTempServiceData({
                            ...tempServiceData,
                            description: e.target.value,
                          })
                        }
                      />
                    </div>
                  </div>
                ) : (
                  <>
                    <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-6">
                      {selectedService.name}
                    </h1>
                    <p className="text-lg text-gray-600 max-w-4xl mx-auto">
                      {selectedService.description}
                    </p>
                  </>
                )}
              </div>
            </div>

            {/* PACKAGES SECTION */}
            <div>
              <div className="flex justify-between items-end mb-8 px-2">
                <div>
                  <h2 className="text-3xl font-bold text-slate-900">
                    Packages & Pricing
                  </h2>
                  <p className="text-gray-500 mt-1">Manage specific offers.</p>
                </div>
                <button
                  onClick={openAddPackageModal}
                  className="flex items-center bg-slate-800 text-white px-5 py-2.5 rounded-lg hover:bg-slate-900 transition shadow-md font-bold"
                >
                  <Plus className="w-4 h-4 mr-2" /> Add Package
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
                {selectedService.packages && selectedService.packages.map((pkg) => (
                  <div
                    key={pkg.id}
                    className="bg-white rounded-2xl shadow-lg border-t-4 border-slate-800 p-8 flex flex-col justify-between h-full transition-all hover:shadow-2xl relative group"
                  >
                    <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleEditPackage(pkg)}
                        className="bg-slate-100 text-slate-600 p-2 rounded-full hover:bg-indigo-50 hover:text-indigo-600 transition"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeletePackage(pkg.id)}
                        className="bg-slate-100 text-slate-600 p-2 rounded-full hover:bg-red-50 hover:text-red-600 transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-slate-900 mb-2">
                        {pkg.name}
                      </h2>
                      {/* FIX: Force display of Peso Sign if missing from raw data */}
                      <p className="text-4xl font-extrabold text-slate-800 mb-6">
                        {pkg.price && pkg.price.toString().includes('₱') 
                          ? pkg.price 
                          : `₱${parseFloat(pkg.price).toLocaleString()}`}
                      </p>
                      <ul className="space-y-3 mb-6">
                        {pkg.features.map((feat, idx) => (
                          <li key={idx} className="flex items-start text-gray-700">
                            <CheckCircle className="w-5 h-5 mr-3 text-indigo-600 shrink-0 mt-0.5" />{" "}
                            <span>{feat}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* ALBUM SECTION */}
            <div>
              <div className="flex justify-between items-end mb-8 px-2 border-t pt-10 border-gray-200">
                <div>
                  <h2 className="text-3xl font-bold text-slate-900 flex items-center">
                    <ImageIcon className="w-8 h-8 mr-3 text-indigo-600" />
                    Service Album
                  </h2>
                  <p className="text-gray-500 mt-1">Upload sample photos for clients to see.</p>
                </div>
                
                <label className="flex items-center bg-white border border-gray-300 text-slate-700 px-5 py-2.5 rounded-lg hover:bg-slate-50 transition shadow-sm font-bold cursor-pointer">
                  <UploadCloud className="w-4 h-4 mr-2" /> Add Photos
                  <input 
                    type="file" 
                    accept="image/*" 
                    className="hidden" 
                    onChange={handleUploadAlbumPhoto}
                  />
                </label>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {selectedService.album && selectedService.album.slice(0, 4).map((photo, index) => (
                  <div 
                    key={photo.id} // Use ID now, not index
                    className="relative aspect-square rounded-xl overflow-hidden cursor-pointer group shadow-md"
                    onClick={() => openLightbox(index)}
                  >
                    <img src={photo.image} alt="Album" className="w-full h-full object-cover transition duration-500 group-hover:scale-110" />
                    
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteAlbumPhoto(photo.id);
                      }}
                      className="absolute top-2 right-2 bg-white/90 text-red-600 p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition shadow-sm z-10"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>

                    {index === 3 && selectedService.album.length > 4 && (
                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-white text-2xl font-bold">
                        +{selectedService.album.length - 4}
                      </div>
                    )}
                  </div>
                ))}

                {(!selectedService.album || selectedService.album.length === 0) && (
                  <div className="col-span-full py-12 text-center border-2 border-dashed border-gray-200 rounded-2xl bg-slate-50">
                      <ImageIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-500 font-medium">No photos in album yet.</p>
                  </div>
                )}
              </div>
            </div>

            <Modal
              isOpen={isPackageModalOpen}
              onClose={() => setPackageModalOpen(false)}
              title={editingPackageId ? "Edit Package" : "Add Package"}
            >
              <div className="space-y-6">
                <div>
                  <label className="block text-md font-semibold text-gray-700 mb-2">
                    Package Name
                  </label>
                  <input
                    type="text"
                    className="w-full px-5 py-4 rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-200 focus:border-indigo-500 shadow-sm transition"
                    value={newPackage.name}
                    onChange={(e) =>
                      setNewPackage({ ...newPackage, name: e.target.value })
                    }
                    placeholder="e.g. Silver Package"
                  />
                </div>
                <div>
                  <label className="block text-md font-semibold text-gray-700 mb-2">
                    Price
                  </label>
                  <div className="relative">
                    <span className="absolute left-5 top-1/2 transform -translate-y-1/2 text-gray-500 font-bold text-lg">
                      ₱
                    </span>
                    <input
                      type="number" // Changed to number to strictly accept amounts
                      className="w-full pl-12 pr-5 py-4 rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-200 focus:border-indigo-500 shadow-sm transition"
                      // FIX: Ensure value is raw number string, stripping any formatting
                      value={newPackage.price.toString().replace(/[^0-9.]/g, '')}
                      onChange={(e) =>
                        setNewPackage({ ...newPackage, price: e.target.value })
                      }
                      placeholder="15000"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-md font-semibold text-gray-700 mb-2">
                    Features (comma separated)
                  </label>
                  <textarea
                    className="w-full px-5 py-4 rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-200 focus:border-indigo-500 shadow-sm transition"
                    value={newPackage.features}
                    onChange={(e) =>
                      setNewPackage({ ...newPackage, features: e.target.value })
                    }
                    rows="4"
                    placeholder="6 Hours Coverage, 1 Photographer, Digital Album..."
                  />
                </div>
                <button
                  onClick={handleSavePackage}
                  className="w-full py-4 bg-linear-to-r from-indigo-600 to-indigo-800 text-white font-bold text-lg rounded-xl shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all"
                >
                  {editingPackageId ? "Update Package" : "Add Package"}
                </button>
              </div>
            </Modal>
          </div>
        )}
      </div>
    </>
  );
};

export default ManageServices;