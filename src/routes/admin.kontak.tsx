import { createFileRoute, redirect, Link } from "@tanstack/react-router";
import {
  getAllContactSubmissions,
  deleteContactSubmission,
  updateContactStatus,
} from "../server/contact";
import { Suspense, useState } from "react";
import { useAuth, SignInButton, SignUpButton } from "@clerk/tanstack-start";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "../components/ui/select";
import { Loader2 } from "lucide-react";
import { createBlobUrl, exportToCsv, formatDate } from "../lib/utils";
import { type LeadStatus } from "../db/schema";

// Status options for the dropdown
const STATUS_OPTIONS = [
  { value: "new", label: "Baru" },
  { value: "contacted", label: "Sudah Kontak" },
  { value: "follow_up", label: "Follow Up" },
  { value: "qualified", label: "Prospek" },
  { value: "closed_won", label: "Deal" },
  { value: "closed_lost", label: "Batal" },
];

export const Route = createFileRoute("/admin/kontak")({
  component: AdminContactPage,
  loader: async () => {
    try {
      const submissions = await getAllContactSubmissions();
      return { submissions };
    } catch (error) {
      console.error("Error fetching submissions:", error);
      return {
        submissions: [],
        error: "Failed to load submissions",
      };
    }
  },
});

function AdminContactPage() {
  const { submissions, error } = Route.useLoaderData();
  const { isSignedIn, userId } = useAuth();
  const [submissionList, setSubmissionList] = useState(submissions);
  const [isDeleting, setIsDeleting] = useState<number | null>(null);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [statusError, setStatusError] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  const handleDelete = async (id: number) => {
    if (confirm("Are you sure you want to delete this submission?")) {
      try {
        setIsDeleting(id);
        setDeleteError(null);
        const result = await deleteContactSubmission({ data: { id } });
        if (result.success) {
          setSubmissionList((prevSubmissions) =>
            prevSubmissions.filter((submission) => submission.id !== id)
          );
        }
      } catch (err) {
        setDeleteError("Failed to delete submission. Please try again.");
        console.error("Error deleting submission:", err);
      } finally {
        setIsDeleting(null);
      }
    }
  };

  const handleStatusChange = async (id: number, status: LeadStatus) => {
    setUpdatingId(id);
    setStatusError(null);
    try {
      const result = await updateContactStatus({ data: { id, status } });
      if (result.success) {
        setSubmissionList((prevSubmissions) =>
          prevSubmissions.map((submission) =>
            submission.id === id ? { ...submission, status } : submission
          )
        );
      }
    } catch (error) {
      console.error("Error updating status:", error);
      setStatusError("Failed to update status. Please try again.");
    } finally {
      setUpdatingId(null);
    }
  };

  const getStatusColorClasses = (status: string) => {
    switch (status) {
      case "new":
        return "bg-blue-100 text-blue-800";
      case "contacted":
        return "bg-yellow-100 text-yellow-800";
      case "follow_up":
        return "bg-purple-100 text-purple-800";
      case "qualified":
        return "bg-green-100 text-green-800";
      case "closed_won":
        return "bg-emerald-100 text-emerald-800";
      case "closed_lost":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "new":
        return "Baru";
      case "contacted":
        return "Sudah Kontak";
      case "follow_up":
        return "Follow Up";
      case "qualified":
        return "Prospek";
      case "closed_won":
        return "Deal";
      case "closed_lost":
        return "Batal";
      default:
        return "Unknown";
    }
  };

  const handleExportCSV = () => {
    try {
      setIsExporting(true);

      // Create CSV headers
      const headers = [
        "ID",
        "Full Name",
        "Email",
        "Phone Number",
        "Location",
        "Car Model Interest",
        "Status",
        "Date",
      ];

      // Create CSV rows from submission data
      const rows = submissionList.map((submission) => [
        submission.id,
        submission.fullName,
        submission.email,
        submission.phoneNumber,
        submission.location,
        submission.carModelInterest,
        getStatusLabel(submission.status),
        new Date(submission.createdAt).toLocaleDateString("id-ID"),
      ]);

      // Combine headers and rows
      const csvContent = [
        headers.join(","),
        ...rows.map((row) => row.join(",")),
      ].join("\n");

      // Create a Blob with the CSV content
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });

      // Create a download link
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);

      // Set link properties
      link.setAttribute("href", url);
      link.setAttribute(
        "download",
        `gwm-contact-submissions-${new Date().toISOString().split("T")[0]}.csv`
      );
      link.style.visibility = "hidden";

      // Add link to document, click it, and then remove it
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error("Error exporting CSV:", err);
    } finally {
      setIsExporting(false);
    }
  };

  // If not signed in, display authentication options instead of redirecting
  if (!isSignedIn) {
    return (
      <div className="min-h-screen bg-white pt-24 pb-16 px-4 md:px-8 max-w-7xl mx-auto flex flex-col items-center justify-center">
        <div className="text-center mb-10">
          <h1 className="text-3xl md:text-4xl font-medium text-primary mb-4">
            Admin Area
          </h1>
          <p className="text-lg text-gray-600 mb-8">
            You need to sign in to access the admin dashboard
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <SignInButton mode="modal">
              <button
                type="button"
                className="px-6 py-3 bg-primary text-white rounded-md hover:bg-primary/90 transition-colors"
              >
                Sign In
              </button>
            </SignInButton>

            <SignUpButton mode="modal">
              <button
                type="button"
                className="px-6 py-3 border border-primary text-primary rounded-md hover:bg-primary/5 transition-colors"
              >
                Sign Up
              </button>
            </SignUpButton>
          </div>

          <p className="mt-8 text-sm text-gray-500">
            This area is restricted to administrators only.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white  pb-16 px-4 md:px-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <h1 className="text-3xl md:text-4xl font-medium text-primary mb-4 md:mb-0">
          Dashboard Formulir Kontak
        </h1>

        <div className="flex items-center space-x-4">
          <button
            type="button"
            onClick={handleExportCSV}
            disabled={isExporting || submissionList.length === 0}
            className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors focus:outline-none focus:ring-2 focus:ring-green-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isExporting ? (
              <>
                <svg
                  className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  aria-labelledby="exportSpinnerTitle"
                >
                  <title id="exportSpinnerTitle">Loading spinner</title>
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Exporting...
              </>
            ) : (
              <>
                <svg
                  className="h-5 w-5 mr-2"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-labelledby="exportIconTitle"
                >
                  <title id="exportIconTitle">Export icon</title>
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                Export CSV
              </>
            )}
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {deleteError && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {deleteError}
        </div>
      )}

      {statusError && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {statusError}
        </div>
      )}

      <div className="bg-gray-50 p-6 rounded-lg shadow-sm overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-100">
            <tr>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Nama Lengkap
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Email
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Nomor Telepon
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Tempat Tinggal
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Minat Unit
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Status
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Tanggal
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {submissionList.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-6 py-4 text-center text-gray-500">
                  Belum ada data formulir kontak.
                </td>
              </tr>
            ) : (
              submissionList.map((submission) => (
                <tr key={submission.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {submission.fullName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {submission.email}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {submission.phoneNumber}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {submission.location}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {submission.carModelInterest}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="relative">
                      {updatingId === submission.id ? (
                        <div className="flex items-center">
                          <svg
                            className="animate-spin h-4 w-4 text-primary"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            aria-labelledby="statusSpinnerTitle"
                          >
                            <title id="statusSpinnerTitle">
                              Loading spinner
                            </title>
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
                            />
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            />
                          </svg>
                          <span className="ml-2">Updating...</span>
                        </div>
                      ) : (
                        <select
                          className={`text-xs font-semibold rounded-full px-2 py-1 ${getStatusColorClasses(
                            submission.status
                          )} border-0 cursor-pointer focus:ring-2 focus:ring-primary/30 focus:outline-none`}
                          value={submission.status}
                          onChange={(e) =>
                            handleStatusChange(
                              submission.id,
                              e.target.value as LeadStatus
                            )
                          }
                          disabled={updatingId === submission.id}
                          aria-label="Change lead status"
                        >
                          {STATUS_OPTIONS.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(submission.createdAt).toLocaleDateString("id-ID")}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <button
                      type="button"
                      onClick={() => handleDelete(submission.id)}
                      disabled={isDeleting === submission.id}
                      className="text-red-600 hover:text-red-900 focus:outline-none disabled:opacity-50 transition-colors"
                      aria-label="Delete submission"
                    >
                      {isDeleting === submission.id ? (
                        <span className="flex items-center">
                          <svg
                            className="animate-spin -ml-1 mr-2 h-4 w-4 text-red-600"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            aria-labelledby="loadingSpinnerTitle"
                          >
                            <title id="loadingSpinnerTitle">
                              Loading spinner
                            </title>
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
                            />
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            />
                          </svg>
                          Deleting...
                        </span>
                      ) : (
                        <span className="flex items-center">
                          <svg
                            className="h-5 w-5 mr-1"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            aria-labelledby="deleteIconTitle"
                          >
                            <title id="deleteIconTitle">Delete icon</title>
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
                          </svg>
                          Delete
                        </span>
                      )}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
