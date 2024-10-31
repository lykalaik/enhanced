import Sidebar from "./Sidebar";
import { FaUserFriends } from "react-icons/fa";
import { FiMail, FiChevronLeft, FiChevronRight, FiX } from "react-icons/fi";
import { RiFileExcel2Fill } from "react-icons/ri";
import { useState, useEffect } from "react";
import supabase from "../supabaseClient";



const AdminDashboard = () => {
  const [scholars, setScholars] = useState([]);
  const [selectedScholar, setSelectedScholar] = useState([]);
  const [amount, setAmount] = useState('');

  useEffect(() => {
    fetch_scholars();
  }, []);

  const fetch_scholars = async () => {
    try {
      const { data, error } = await supabase
        .from('scholars')
        .select('*');
      if (error) throw error;
      setScholars(data);
    } catch (error) {
      alert("An unexpected error occurred.");
      console.error('Error during registration:', error.message);
    }
  };

  const toggleAllowedRenewal = async (applicantId, currentStatus) => {
    const newStatus = currentStatus === "Yes" ? "No" : "Yes";
    try {
      const { error } = await supabase
        .from('scholars')
        .update({ allowed_renewal: newStatus })
        .eq('id', applicantId);
      if (error) throw error;

      // Update state locally to reflect change immediately
      setScholars((prevScholars) =>
        prevScholars.map((applicant) =>
          applicant.id === applicantId ? { ...applicant, allowed_renewal: newStatus } : applicant
        )
      );
    } catch (error) {
      alert("Error updating renewal status.");
      console.error('Error updating renewal status:', error.message);
    }
  };


  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-gray-100 font-mono">
      <Sidebar />
      <main className="flex-1 p-4 lg:p-8 ml-0 lg:ml-64 transition-all duration-300">
        <div className="lg:flex lg:justify-between mb-5">
          <h1 className="text-2xl mt-2 font-bold flex gap-2">
            <FaUserFriends size={30} />
            Scholars Record
          </h1>
          <div className="flex gap-2">
            <select className="select select-bordered w-full max-w-xs">
              <option disabled selected>Scholarship Status:</option>
              <option>New</option>
              <option>Renewal</option>
            </select>
            <button className="btn btn-success text-white">
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
                  <th>Location</th>
                  <th>Contact No.</th>
                  <th>Name of School</th>
                  <th>Course</th>
                  <th>Sex</th>
                  <th>Status</th>
                  <th>Scholarship Type</th>
                  <th>Allow Renewal?</th>
                </tr>
              </thead>
              <tbody>
                {scholars.map((applicant) => (
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
                        className={`btn btn-sm ${applicant.allowed_renewal === "Yes" ? 'btn-success' : 'btn-error'}`}
                        onClick={() => toggleAllowedRenewal(applicant.id, applicant.allowed_renewal)}
                      >
                        {applicant.allowed_renewal === "Yes" ? "Yes" : "No"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;
