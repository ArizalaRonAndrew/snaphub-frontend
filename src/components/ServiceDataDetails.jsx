// src/components/ServiceDataDetails.jsx
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { 
  ArrowLeft, 
  CheckCircle, 
  X, 
  ChevronLeft, 
  ChevronRight, 
  Image as ImageIcon 
} from "lucide-react";

export default function ServiceDataDetails() {
  const { serviceId } = useParams(); 
  const navigate = useNavigate();
  
  const [service, setService] = useState(null);
  const [loading, setLoading] = useState(true);

  // Gallery States
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    window.scrollTo(0, 0);

    const fetchServiceDetails = async () => {
        try {
            const response = await fetch("http://localhost:5000/api/services");
            const data = await response.json();
            
            const decodedName = decodeURIComponent(serviceId);
            const foundService = data.find(s => s.name === decodedName);
            
            setService(foundService);
            setLoading(false);
        } catch (error) {
            console.error("Error fetching details:", error);
            setLoading(false);
        }
    };

    fetchServiceDetails();
  }, [serviceId]);

  // --- HANDLERS ---

  const handleBookNow = (pkgName, pkgPrice) => {
    const url = `/booking?service=${encodeURIComponent(service.name)}&package=${encodeURIComponent(pkgName)}&price=${encodeURIComponent(pkgPrice)}`;
    navigate(url);
  };

  const handleGoBack = () => {
    // FIX: Navigate to the correct path /home#services
    navigate("/home#services");
    
    // Keep the setTimeout and manual scroll for reliable scrolling to the section
    // after the route change in a Single Page Application.
    setTimeout(() => {
      const section = document.getElementById("services");
      if (section) {
        section.scrollIntoView({ behavior: "smooth" });
      }
    }, 100);
  };

  // --- GALLERY LOGIC ---

  const openLightbox = (index) => {
    setCurrentImageIndex(index);
    setIsLightboxOpen(true);
  };

  const nextImage = (e) => {
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev + 1) % service.album.length);
  };

  const prevImage = (e) => {
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev - 1 + service.album.length) % service.album.length);
  };

  if (loading) return <div className="text-center py-20">Loading details...</div>;

  if (!service) {
    return (
      <div className="text-center py-20">
        <h2 className="text-3xl font-bold">Service Not Found</h2>
        <button onClick={handleGoBack} className="mt-6 px-6 py-2 bg-slate-800 text-white rounded">
            Back to Services
        </button>
      </div>
    );
  }

  const coverImage = service.image || "https://placehold.co/1200x600?text=No+Cover+Image";

  return (
    <div className="bg-slate-50 min-h-screen pb-20">
      
      <div className="max-w-6xl mx-auto px-4 py-8">
        
        {/* --- BACK BUTTON --- */}
        <button
          onClick={handleGoBack}
          className="text-slate-600 hover:text-slate-900 transition flex items-center text-sm font-bold mb-6"
        >
          <ArrowLeft className="w-5 h-5 mr-2" /> Back to Services
        </button>

        {/* --- ADMIN STYLE HEADER (Card Layout) --- */}
        <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100 mb-16">
            {/* Image Container */}
            <div className="relative w-full h-64 md:h-[400px] bg-gray-100">
                <img 
                    src={coverImage} 
                    alt={service.name} 
                    className="w-full h-full object-cover"
                />
            </div>
            
            {/* Text Content (Below Image) */}
            <div className="p-8 md:p-12 text-center">
                <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-6">
                    {service.name}
                </h1>
                <p className="text-lg text-gray-600 max-w-4xl mx-auto leading-relaxed">
                    {service.description}
                </p>
            </div>
        </div>

        {/* --- PACKAGES SECTION --- */}
        <div className="mb-20">
          <div className="flex items-center justify-between mb-8 pb-4 border-b border-gray-200">
             <h2 className="text-3xl font-bold text-slate-800">Available Packages</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {service.packages && service.packages.length > 0 ? (
                service.packages.map((pkg, index) => (
                <div
                    key={pkg.id || index}
                    className="bg-white rounded-2xl shadow-lg border-t-4 border-slate-800 p-8 flex flex-col justify-between h-full hover:shadow-2xl transition-all duration-300"
                >
                    <div>
                        <h3 className="text-2xl font-bold text-slate-900 mb-2">{pkg.name}</h3>
                        <p className="text-4xl font-extrabold text-green-800 mb-6">
                            {/* Auto Peso Sign Logic */}
                            {pkg.price.toString().includes('₱') ? pkg.price : `₱${parseFloat(pkg.price).toLocaleString()}`}
                        </p>

                        <ul className="space-y-4 mb-8">
                            {pkg.features && pkg.features.map((feature, i) => (
                            <li key={i} className="flex items-start text-gray-600">
                                <CheckCircle className="w-5 h-5 mr-3 text-green-500 shrink-0 mt-0.5" />
                                <span className="font-medium">{feature}</span>
                            </li>
                            ))}
                        </ul>
                    </div>

                    <button
                        onClick={() => handleBookNow(pkg.name, pkg.price)}
                        className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white text-lg font-bold rounded-xl transition-all shadow-md active:scale-95"
                    >
                        Book This Package
                    </button>
                </div>
                ))
            ) : (
                <p className="text-gray-500 col-span-full text-center py-10 bg-white rounded-xl shadow-sm">
                    No packages available for this service yet.
                </p>
            )}
          </div>
        </div>

        {/* --- ALBUM / GALLERY SECTION --- */}
        {service.album && service.album.length > 0 && (
          <div>
            <div className="flex items-center mb-8 pb-4 border-b border-gray-200">
                <ImageIcon className="w-8 h-8 text-indigo-600 mr-3" />
                <h2 className="text-3xl font-bold text-slate-900">Sample Gallery</h2>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {service.album.slice(0, 4).map((photo, idx) => (
                <div
                    key={photo.id || idx}
                    className="relative aspect-square overflow-hidden rounded-xl shadow-md group cursor-pointer"
                    onClick={() => openLightbox(idx)}
                >
                    <img
                        src={photo.image}
                        alt={`${service.name} Sample ${idx + 1}`}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                    
                    {/* Hover Overlay Effect */}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300" />

                    {/* +More Overlay Logic (Only on the 4th image if there are more) */}
                    {idx === 3 && service.album.length > 4 && (
                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center backdrop-blur-[2px] group-hover:bg-black/70 transition">
                            <span className="text-white text-3xl font-bold">
                                +{service.album.length - 4}
                            </span>
                        </div>
                    )}
                </div>
                ))}
            </div>
          </div>
        )}
      </div>

      {/* --- LIGHTBOX MODAL (Full Screen) --- */}
      {isLightboxOpen && service.album && (
        <div 
          className="fixed inset-0 z-[9999] bg-black/95 flex items-center justify-center backdrop-blur-md cursor-default animate-fadeIn"
          onClick={() => setIsLightboxOpen(false)}
        >
          {/* Close Button */}
          <button 
            onClick={(e) => {
              e.stopPropagation();
              setIsLightboxOpen(false);
            }}
            className="absolute top-6 right-6 text-white/70 hover:text-white transition p-2 bg-white/10 rounded-full z-[10000]"
          >
            <X className="w-10 h-10" />
          </button>

          {/* Main Image Container */}
          <div 
            className="relative w-full h-full flex items-center justify-center p-4 md:p-10"
            onClick={(e) => e.stopPropagation()} 
          >
            <img 
              src={service.album[currentImageIndex]?.image} 
              alt="Full view" 
              className="max-h-[85vh] max-w-[90vw] object-contain rounded-lg shadow-2xl"
            />
            
            {/* Navigation Buttons */}
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
            
            {/* Counter */}
            <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 text-white/80 font-medium bg-black/50 px-4 py-1 rounded-full text-sm">
               {currentImageIndex + 1} / {service.album.length}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}