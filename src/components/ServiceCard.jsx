import { Link } from "react-router-dom";

// Now accepting the full data object directly via props
export default function ServiceCard({ serviceData }) {
    
    if (!serviceData) return null; 

    // Logic: Kung may uploaded image galing DB, gamitin yun. 
    // Kung wala, fallback sa placeholder.
    // Note: Ang backend controller natin ay nagbibigay na ng full URL (http://localhost:5000/uploads/...)
    const imageUrl = serviceData.image || "https://placehold.co/600x400?text=No+Image";

    return (
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden flex flex-col transition-transform hover:scale-105">
            <div className="h-48 w-full overflow-hidden">
                <img
                    src={imageUrl} 
                    alt={serviceData.name}
                    className="w-full h-full object-cover hover:scale-110 transition-transform duration-500"
                />
            </div>
            <div className="p-6 flex flex-col grow">
                <h3 className="text-2xl font-bold mb-2">{serviceData.name}</h3>
                <p className="text-gray-600 mb-4 grow line-clamp-3">
                    {serviceData.description}
                </p>

                <div className="flex justify-center">
                    <Link
                        // Using encodeURIComponent to handle spaces in names (e.g. "Wedding Photography" -> "Wedding%20Photography")
                        to={`/service/${encodeURIComponent(serviceData.name)}`}
                        className="mt-4 w-full block py-2 bg-slate-800 hover:bg-slate-900 text-white text-center font-medium rounded-lg transition-all shadow-md"
                    >
                        View Packages
                    </Link>
                </div>
            </div>
        </div>
    );
}