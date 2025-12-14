import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import StudentIdForm from "../components/StudentIdForm";

export default function StudentIdPage() {
  return (
    <>
      <Navbar />
      <section className="py-24 bg-linear-to-br from-indigo-50 via-white to-gray-50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-3">🎓 Student ID Application</h2>
            <p className="text-lg text-gray-500">Fill in the details below accurately to generate your official school ID.</p>
          </div>
          <StudentIdForm />
        </div>
      </section>
      <Footer />
    </>
  );
}
