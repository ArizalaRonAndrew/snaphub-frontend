import { useState, useEffect } from "react";

export default function PhotoUpload({ photoData, setPhotoData, resetTrigger }) {
  const [preview, setPreview] = useState("");

  // Reset photo when resetTrigger changes
  useEffect(() => {
    setPreview("");
    setPhotoData(null);
  }, [resetTrigger, setPhotoData]);

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setPreview(ev.target.result);
        // FIX: Pass the Data URL (base64 string) to the parent state, NOT the File object.
        setPhotoData(ev.target.result); 
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-2">2x2 ID Photo</label>
      <div className="flex flex-col items-center p-4 border border-gray-300 rounded-xl bg-gray-50">
        <div className="photo-preview mb-4 w-52 h-52 border-4 border-dashed border-indigo-300 rounded-xl bg-white flex items-center justify-center overflow-hidden shadow-inner">
          {preview ? (
            <img src={preview} alt="Preview" className="w-full h-full object-cover rounded-xl" />
          ) : (
            <div className="text-center text-indigo-400 p-4">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="mx-auto w-14 h-14">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.218A2 2 0 0110.5 4h3a2 2 0 011.664.89l.812 1.218A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <p className="text-sm mt-1 font-medium">Upload 2x2 Photo</p>
            </div>
          )}
        </div>
        <input type="file" accept="image/*" onChange={handlePhotoChange} className="hidden" id="photoUpload" />
        <button
          type="button"
          onClick={() => document.getElementById("photoUpload").click()}
          className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg"
        >
          Select Photo
        </button>
      </div>
    </div>
  );
}