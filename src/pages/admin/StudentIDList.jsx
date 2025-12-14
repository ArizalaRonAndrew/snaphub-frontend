import React, { useState, useEffect } from "react";
import {
  Search,
  Eye,
  Users,
  CheckCircle,
  Clock,
  Phone,
  Download,
  Trash2,
  AlertTriangle,
} from "lucide-react";
import Modal from "../../components/admin/Modal";
import {
  getAllStudents,
  updateStudentStatus,
  deleteStudent,
} from "../../services/StudentIdService";

const StudentIDList = () => {
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);

  // Modal State
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    type: null, // 'approve', 'delete', 'hide', 'deleteAll'
    id: null,
    title: "",
    message: "",
  });

  const [selectedGrade, setSelectedGrade] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      const data = await getAllStudents();
      setStudents(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching students:", error);
    }
  };

  // --- REQUEST HANDLERS ---
  const requestApprove = (id) => {
    setConfirmModal({
      isOpen: true,
      type: "approve",
      id: id,
      title: "Confirm Approval",
      message:
        "Are you sure you want to approve this application? It will move to the Approved section.",
    });
  };

  const requestDelete = (student) => {
    // LOGIC: If it's already approved, we only 'Hide' it so it stays in reports.
    // If it's pending, we permanently delete it.
    if (student.status === "Approved") {
      setConfirmModal({
        isOpen: true,
        type: "hide", // New type for Soft Delete
        id: student.id,
        title: "Remove from List",
        message:
          "This will remove the student from this list, but keep the data in the Reports. Continue?",
      });
    } else {
      setConfirmModal({
        isOpen: true,
        type: "delete",
        id: student.id,
        title: "Delete Application",
        message:
          "Are you sure you want to permanently delete this pending application? This action cannot be undone.",
      });
    }
  };

  const requestDeleteAllApproved = () => {
    setConfirmModal({
      isOpen: true,
      type: "hideAll", // Changed from deleteAll to hideAll
      id: null,
      title: "Clear Approved List",
      message:
        "This will remove all students from this view, but they will remain in your Reports history. Are you sure?",
    });
  };

  // --- EXECUTE LOGIC ---
  const handleExecuteAction = async () => {
    const { type, id } = confirmModal;

    try {
      if (type === "approve") {
        await updateStudentStatus(id, "Approved");
        await fetchStudents();
        if (selectedStudent?.id === id) setSelectedStudent(null);
      } 
      else if (type === "delete") {
        // PERMANENT DELETE (For Pending items)
        await deleteStudent(id);
        await fetchStudents();
        if (selectedStudent?.id === id) setSelectedStudent(null);
      } 
      else if (type === "hide") {
        // SOFT DELETE (For Approved items - keeps them in reports)
        await updateStudentStatus(id, "ReportOnly");
        await fetchStudents();
        if (selectedStudent?.id === id) setSelectedStudent(null);
      }
      else if (type === "hideAll") {
        // SOFT DELETE ALL (Approved items)
        const approvedToHide = students.filter((s) => s.status === "Approved");
        await Promise.all(approvedToHide.map((s) => updateStudentStatus(s.id, "ReportOnly")));
        await fetchStudents();
      }
    } catch (error) {
      console.error("Action error:", error);
    }

    setConfirmModal({ ...confirmModal, isOpen: false });
  };

  const downloadImage = (base64String, name) => {
    const link = document.createElement("a");
    link.href = `data:image/png;base64,${base64String}`;
    link.download = name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const gradeLevels = ["All", "7", "8", "9", "10", "Approved"];

  // --- FILTERING LOGIC ---
  const filteredStudents = students.filter((student) => {
    const firstName = student.first_name || "";
    const lastName = student.last_name || "";
    const studentId = student.student_id || "";

    const matchesSearch =
      firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      studentId.includes(searchTerm);

    // LOGIC FOR APPROVED TAB
    if (selectedGrade === "Approved") {
      // Only show "Approved". Do NOT show "ReportOnly"
      return student.status === "Approved" && matchesSearch;
    }

    // LOGIC FOR PENDING TABS
    const matchesGrade =
      selectedGrade === "All" ||
      student.grade === `Grade ${selectedGrade}` ||
      student.grade === selectedGrade;

    // Show pending students. Ensure we don't show Hidden/ReportOnly ones here either.
    return matchesGrade && matchesSearch && student.status !== "Approved" && student.status !== "ReportOnly";
  });

  return (
    <div className="space-y-6 h-full flex flex-col p-4 lg:p-8 overflow-hidden">
        {/* CSS for scrollbar hiding */}
      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 shrink-0">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">
            Student ID Applications
          </h2>
          <p className="text-slate-500 text-sm">
            Manage pending submissions and view approved history.
          </p>
        </div>
        <div className="relative w-full md:w-64">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search name or LRN..."
            className="pl-9 pr-4 py-2 w-full border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Filter Tabs & Actions */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-gray-200 shrink-0">
        <div className="flex flex-wrap gap-2">
          {gradeLevels.map((grade) => (
            <button
              key={grade}
              onClick={() => setSelectedGrade(grade)}
              className={`px-5 py-2 rounded-full text-sm font-bold transition-all border ${
                selectedGrade === grade
                  ? grade === "Approved"
                    ? "bg-emerald-600 text-white border-emerald-600 shadow-md transform scale-105"
                    : "bg-indigo-600 text-white border-indigo-600 shadow-md transform scale-105"
                  : "bg-white text-slate-600 border-gray-200 hover:border-indigo-300 hover:text-indigo-600"
              }`}
            >
              {grade === "All"
                ? "Pending (All)"
                : grade === "Approved"
                ? "Approved History"
                : `Grade ${grade}`}
            </button>
          ))}
        </div>

        {/* Delete All Button - Only visible in Approved Tab if items exist */}
        {selectedGrade === "Approved" && filteredStudents.length > 0 && (
          <button
            onClick={requestDeleteAllApproved}
            className="flex items-center gap-2 px-4 py-2 bg-slate-50 text-slate-600 border border-slate-200 rounded-lg text-xs font-bold hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition"
          >
            <Trash2 className="w-3 h-3" />
            Clear List (Keep in Reports)
          </button>
        )}
      </div>

      {/* Table Container */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col grow min-h-0">
        <div className="overflow-auto no-scrollbar h-full">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 text-slate-600 text-xs uppercase font-bold tracking-wider sticky top-0 z-10 shadow-sm">
              <tr>
                <th className="px-6 py-4 bg-slate-50">Student Name</th>
                <th className="px-6 py-4 bg-slate-50">LRN</th>
                <th className="px-6 py-4 bg-slate-50">Grade & Section</th>
                <th className="px-6 py-4 bg-slate-50">Status</th>
                <th className="px-6 py-4 text-center bg-slate-50">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredStudents.length > 0 ? (
                filteredStudents.map((student) => (
                  <tr
                    key={student.id}
                    onClick={() => setSelectedStudent(student)}
                    className="hover:bg-indigo-50 transition cursor-pointer group"
                  >
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-800">
                        {student.last_name}, {student.first_name}{" "}
                        {student.middle_name ? student.middle_name[0] + "." : ""}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-600 font-mono text-sm">
                      {student.student_id}
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 rounded text-xs font-bold mr-2 bg-slate-100 text-slate-700">
                        {student.grade}
                      </span>
                      <span className="text-slate-600 text-sm font-medium">
                        {student.section}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2 py-1 text-xs font-bold rounded-full border ${
                          student.status === "Approved"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : "bg-amber-50 text-amber-700 border-amber-200"
                        }`}
                      >
                        {student.status || "Pending"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button className="text-slate-400 group-hover:text-indigo-600 transition p-1">
                          <Eye className="w-5 h-5" />
                        </button>
                        
                        {/* Specific Delete button for Approved rows */}
                        {selectedGrade === "Approved" && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              requestDelete(student);
                            }}
                            className="text-slate-300 hover:text-red-600 transition p-1"
                            title="Remove from list (Keep in Reports)"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center justify-center text-slate-400">
                      <Users className="w-12 h-12 mb-3 opacity-20" />
                      <p className="text-lg font-semibold">
                        {selectedGrade === "Approved" 
                            ? "No approved history in list" 
                            : "No pending students found"}
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* --- DETAILS MODAL --- */}
      <Modal
        isOpen={!!selectedStudent}
        onClose={() => setSelectedStudent(null)}
        title="Application Details"
      >
        {selectedStudent && (
          <div className="space-y-6">
            <div
              className={`p-4 rounded-xl flex items-center justify-between shadow-sm ${
                selectedStudent.status === "Approved"
                  ? "bg-emerald-100 text-emerald-800"
                  : "bg-amber-100 text-amber-800"
              }`}
            >
              <span className="font-bold flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Status:{" "}
                <span className="uppercase tracking-wide">
                  {selectedStudent.status || "PENDING"}
                </span>
              </span>
            </div>

            {/* Profile Info */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold text-xl">
                  {selectedStudent.first_name
                    ? selectedStudent.first_name[0]
                    : "?"}
                </div>
                <div>
                  <h4 className="text-lg font-bold text-slate-800">
                    {selectedStudent.last_name}, {selectedStudent.first_name}{" "}
                    {selectedStudent.middle_name}.
                  </h4>
                  <p className="text-sm text-slate-500 font-mono">
                    LRN: {selectedStudent.student_id}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-100">
                <div>
                  <p className="text-xs text-slate-400 uppercase font-bold">
                    Grade Level
                  </p>
                  <p className="font-semibold text-slate-700">
                    {selectedStudent.grade}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-400 uppercase font-bold">
                    Section
                  </p>
                  <p className="font-semibold text-slate-700">
                    {selectedStudent.section}
                  </p>
                </div>
              </div>
            </div>

            {/* Emergency Contact */}
            <div className="bg-slate-100 p-4 rounded-xl border border-slate-200">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3 flex items-center gap-2">
                <Phone className="w-3 h-3" /> Emergency Contact
              </p>
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-bold text-slate-700">
                    {selectedStudent.emergencyname}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    {selectedStudent.address}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-mono font-bold text-slate-800">
                    {selectedStudent.emergencycontact}
                  </p>
                </div>
              </div>
            </div>

            {/* Images */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-col items-center shadow-sm hover:shadow-md transition">
                <span className="text-xs font-bold text-slate-400 mb-3 uppercase tracking-wider">
                  ID Photo
                </span>
                <div className="p-1 border border-slate-100 rounded-lg bg-slate-50 mb-3 w-full h-32 flex items-center justify-center overflow-hidden">
                  {selectedStudent.photo_path ? (
                    <img
                      src={`data:image/png;base64,${selectedStudent.photo_path}`}
                      alt="ID"
                      className="h-full object-contain rounded-md"
                    />
                  ) : (
                    <span className="text-xs text-gray-400">No Photo</span>
                  )}
                </div>
                <button
                  onClick={() =>
                    selectedStudent.photo_path &&
                    downloadImage(
                      selectedStudent.photo_path,
                      "student-photo.png"
                    )
                  }
                  disabled={!selectedStudent.photo_path}
                  className="w-full py-2 bg-slate-50 hover:bg-slate-100 text-slate-600 text-xs font-bold rounded-lg transition flex justify-center items-center disabled:opacity-50"
                >
                  <Download className="w-3 h-3 mr-1" /> Download
                </button>
              </div>

              <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-col items-center shadow-sm hover:shadow-md transition">
                <span className="text-xs font-bold text-slate-400 mb-3 uppercase tracking-wider">
                  Signature
                </span>
                <div className="w-full h-32 bg-white border border-slate-100 rounded-lg flex items-center justify-center mb-3 p-2 overflow-hidden">
                  {selectedStudent.signature_path ? (
                    <img
                      src={`data:image/png;base64,${selectedStudent.signature_path}`}
                      alt="Sig"
                      className="max-h-full max-w-full object-contain"
                    />
                  ) : (
                    <span className="text-xs text-gray-400">No Signature</span>
                  )}
                </div>
                <button
                  onClick={() =>
                    selectedStudent.signature_path &&
                    downloadImage(
                      selectedStudent.signature_path,
                      "student-sig.png"
                    )
                  }
                  disabled={!selectedStudent.signature_path}
                  className="w-full py-2 bg-slate-50 hover:bg-slate-100 text-slate-600 text-xs font-bold rounded-lg transition flex justify-center items-center disabled:opacity-50"
                >
                  <Download className="w-3 h-3 mr-1" /> Download
                </button>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4 border-t border-slate-200">
              <button
                onClick={() => requestDelete(selectedStudent)}
                className="flex-1 py-3 rounded-xl border border-red-200 text-red-600 font-bold hover:bg-red-50 flex items-center justify-center transition"
              >
                <Trash2 className="w-4 h-4 mr-2" /> 
                {selectedStudent.status === "Approved" ? "Remove from List" : "Delete"}
              </button>
              
              {selectedStudent.status !== "Approved" && (
                <button
                  onClick={() => requestApprove(selectedStudent.id)}
                  className="flex-1 py-3 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 flex items-center justify-center shadow-lg shadow-indigo-200 transition"
                >
                  <CheckCircle className="w-4 h-4 mr-2" /> Approve Application
                </button>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* --- CONFIRMATION MODAL --- */}
      <Modal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
        title={confirmModal.title}
      >
        <div className="space-y-4">
          <div className="flex items-start gap-4">
            <div
              className={`p-3 rounded-full shrink-0 ${
                confirmModal.type === "delete" 
                  ? "bg-red-100"
                  : confirmModal.type === "hide" || confirmModal.type === "hideAll"
                  ? "bg-slate-100"
                  : "bg-emerald-100"
              }`}
            >
              {confirmModal.type === "delete" ? (
                <AlertTriangle className="w-6 h-6 text-red-600" />
              ) : confirmModal.type === "hide" || confirmModal.type === "hideAll" ? (
                 <Trash2 className="w-6 h-6 text-slate-600" />
              ) : (
                <CheckCircle className="w-6 h-6 text-emerald-600" />
              )}
            </div>
            <div>
              <p className="text-slate-600 leading-relaxed">
                {confirmModal.message}
              </p>
            </div>
          </div>

          <div className="flex gap-3 justify-end pt-4">
            <button
              onClick={() => setConfirmModal({ ...confirmModal, isOpen: false })}
              className="px-4 py-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 font-semibold transition"
            >
              Cancel
            </button>
            <button
              onClick={handleExecuteAction}
              className={`px-4 py-2 rounded-lg text-white font-bold shadow-md transition flex items-center gap-2 ${
                confirmModal.type === "delete"
                  ? "bg-red-600 hover:bg-red-700 shadow-red-200"
                  : confirmModal.type === "hide" || confirmModal.type === "hideAll"
                  ? "bg-slate-600 hover:bg-slate-700 shadow-slate-200"
                  : "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200"
              }`}
            >
              {confirmModal.type === "delete"
                ? "Yes, Delete Permanently"
                : confirmModal.type === "hide"
                ? "Yes, Remove from List"
                : confirmModal.type === "hideAll"
                ? "Yes, Clear List"
                : "Yes, Approve"}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default StudentIDList;