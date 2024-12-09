import Sidebar from "./Sidebar";
import { RiFileExcel2Fill } from "react-icons/ri";
import { useState, useEffect } from "react";
import { saveAs } from "file-saver";
import * as XLSX from "xlsx";
import supabase from "../supabaseClient";

const Archive = () => {
  const [scholars, setScholars] = useState([]);
  const [scholarshipType, setScholarshipType] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedScholar, setSelectedScholar] = useState(null); 
  const [isModalOpen, setIsModalOpen] = useState(false); 

  useEffect(() => {
    fetch_scholars();
  }, []);

  const fetch_scholars = async () => {
    try {
      const { data, error } = await supabase.from("scholars").select("*");
      if (error) throw error;
      setScholars(data);
    } catch (error) {
      alert("An unexpected error occurred.");
      console.error("Error during fetching scholars:", error.message);
    }
  };

  const toggleAllowedRenewal = async (applicantId, currentStatus) => {
    const newStatus = currentStatus === "Yes" ? "No" : "Yes";
    try {
      const { error } = await supabase
        .from("scholars")
        .update({ allowed_renewal: newStatus })
        .eq("id", applicantId);
      if (error) throw error;

      setScholars((prevScholars) =>
        prevScholars.map((applicant) =>
          applicant.id === applicantId
            ? { ...applicant, allowed_renewal: newStatus }
            : applicant
        )
      );
    } catch (error) {
      alert("Error updating renewal status.");
      console.error("Error updating renewal status:", error.message);
    }
  };

  const exportToExcel = () => {
    const filteredData = scholars.filter((scholar) =>
      scholarshipType ? scholar.scholarship_type === scholarshipType : true
    );
    const worksheet = XLSX.utils.json_to_sheet(filteredData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Scholars");

    const fileBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
    });
    const fileBlob = new Blob([fileBuffer], {
      type: "application/octet-stream",
    });
    saveAs(fileBlob, "scholars.xlsx");
  };

  const filteredScholars = scholars.filter(
    (scholar) =>
      (!scholarshipType || scholar.scholarship_type === scholarshipType) &&
      (scholar.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
      scholar.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        scholar.course.toLowerCase().includes(searchQuery.toLowerCase()) ||
        scholar.contact_no.toLowerCase().includes(searchQuery.toLowerCase()) ||
        scholar.sex?.toLowerCase().trim() === searchQuery.toLowerCase().trim() ||
        scholar.scholarship_type?.toLowerCase().trim() === searchQuery.toLowerCase().trim() ||
        scholar.status.toLowerCase().includes(searchQuery.toLowerCase()) ||
        scholar.school.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleViewClick = async (scholar) => {
    setSelectedScholar(scholar);
  
    try {
      // Fetch the application data associated with the scholar
      const { data, error } = await supabase
        .from("application")
        .select("*")
        .eq("full_name", scholar.full_name); // assuming scholar_id is the link between the scholar and their application
  
      if (error) throw error;
  
      // Assuming only one application per scholar, if there are multiple applications you may need to adjust this
      const applicationData = data && data[0];
  
      // Merge the application data with the scholar data
      setSelectedScholar((prevScholar) => ({
        ...prevScholar,
        ...applicationData, // Adds the application data to the scholar's data
      }));
  
      setIsModalOpen(true); // Open modal after data is fetched
    } catch (error) {
      alert("An unexpected error occurred.");
      console.error("Error during fetching application data:", error.message);
    }
  };
  
  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-gray-100 font-mono">
      <Sidebar />
      <main className="flex-1 p-4 lg:p-8 ml-0 lg:ml-64 transition-all duration-300">
        <div className="lg:flex lg:justify-end mb-5">
          <div className="flex gap-2">
            <input
              type="text"
              className="input input-bordered w-100"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <button
              className="btn btn-success text-white"
              onClick={exportToExcel}
            >
              <RiFileExcel2Fill size={20} /> Export as Excel
            </button>
          </div>
        </div>
        <div className="card rounded shadow-xl bordered p-5 bg-white">
          <div className="overflow-x-auto">
            <table className="table table-zebra">
              <thead>
                <tr>
                  <th>Name of Scholar</th>
                  <th>Address</th>
                  <th>Contact No.</th>
                  <th>Name of School</th>
                  <th>Course</th>
                  <th>Sex</th>
                  <th>Status</th>
                  <th>Scholarship Type</th>
                  <th>Allow Renewal?</th>
                  <th>Attachments</th>
                </tr>
              </thead>
              <tbody>
                {filteredScholars.map((applicant) => (
                  <tr key={applicant.id}>
                    <td>{applicant.full_name}</td>
                    <td>{applicant.address}</td>
                    <td>{applicant.contact_no}</td>
                    <td>{applicant.school}</td>
                    <td>{applicant.course}</td>
                    <td>{applicant.sex}</td>
                    <td>{applicant.status}</td>
                    <td>{applicant.scholarship_type}</td>
                    <td>
                      <button
                        className={`btn btn-sm text-white ${
                          applicant.allowed_renewal === "Yes"
                            ? "btn-success"
                            : "btn-error"
                        }`}
                        onClick={() =>
                          toggleAllowedRenewal(
                            applicant.id,
                            applicant.allowed_renewal
                          )
                        }
                      >
                        {applicant.allowed_renewal === "Yes" ? "Yes" : "No"}
                      </button>
                    </td>
                    <td>
                      <button
                        className={`btn btn-sm text-white btn-info`}
                        onClick={() => handleViewClick(applicant)} // Open modal with selected scholar
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal */}
        {isModalOpen && selectedScholar && (
          <div className="fixed inset-0 bg-gray-500 bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded shadow-lg w-96">
              <h2 className="text-xl font-bold">Scholar Details</h2>
              <div>
                <p><strong>Name:</strong> {selectedScholar.full_name}</p>
                <p><strong>Address:</strong> {selectedScholar.address}</p>
                <p><strong>School:</strong> {selectedScholar.school}</p>
                <p><strong>Course:</strong> {selectedScholar.course}</p>
                <p><strong>Status:</strong> {selectedScholar.status}</p>
                <p><strong>Scholarship Type:</strong> {selectedScholar.scholarship_type}</p>
              </div>
              <div className="card shadow-lg border p-4">
        <h3 className="font-semibold text-lg">Uploaded Documents</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 mt-2">
          {selectedScholar?.application_letter && (
            <img
              src={selectedScholar.application_letter}
              alt="Application Letter"
              className="w-full h-32 object-cover rounded-lg cursor-pointer"
            />
          )}
          {selectedScholar?.recommendation_letter && (
            <img
              src={selectedScholar.recommendation_letter}
              alt="Recommendation Letter"
              className="w-full h-32 object-cover rounded-lg cursor-pointer"
      
            />
          )}
          {selectedScholar?.copy_itr && (
            <img
              src={selectedScholar.copy_itr}
              alt="Copy of ITR"
              className="w-full h-32 object-cover rounded-lg cursor-pointer"

            />
          )}
          {selectedScholar?.cedula && (
            <img
              src={selectedScholar.cedula}
              alt="Cedula"
              className="w-full h-32 object-cover rounded-lg cursor-pointer"

            />
          )}
          {selectedScholar?.voters && (
            <img
              src={selectedScholar.voters}
              alt="Voter's ID"
              className="w-full h-32 object-cover rounded-lg cursor-pointer"

            />
          )}
          {selectedScholar?.recent_card && (
            <img
              src={selectedScholar.recent_card}
              alt="Recent Card"
              className="w-full h-32 object-cover rounded-lg cursor-pointer"

            />
          )}
          {!selectedScholar?.application_letter &&
          !selectedScholar?.recommendation_letter &&
          !selectedScholar?.itr &&
          !selectedScholar?.copy_itr &&
          !selectedScholar?.cedula &&
          !selectedScholar?.voters &&
          !selectedScholar?.recent_card && <p>No images submitted.</p>}
        </div>
      </div>
              <button
                className="btn btn-sm btn-error mt-4"
                onClick={() => setIsModalOpen(false)} 
              >
                Close
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Archive;
