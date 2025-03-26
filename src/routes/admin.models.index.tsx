import { createFileRoute, Link } from "@tanstack/react-router";
import { useAuth } from "@clerk/tanstack-start";
import { useState, useEffect } from "react";
import { Pencil, Trash2, Plus, Search, Eye, EyeOff } from "lucide-react";
import { getAllCarModels, deleteCarModel } from "../server/car-models";
import type { CarModel } from "../server/car-models";

// Modified interface to handle the type compatibility issue
interface DisplayCarModel extends Omit<CarModel, "subImage"> {
  subImage: string | null | undefined;
}

// Route definition
export const Route = createFileRoute("/admin/models/")({
  component: AdminModelsPage,
  loader: async () => {
    console.log("Starting admin models page loader");
    try {
      console.log("Calling getAllCarModels from loader");
      const models = await getAllCarModels();
      console.log(`Successfully loaded ${models.length} models in the loader`);
      return { models, error: null };
    } catch (error) {
      console.error("Error fetching car models in loader:", error);
      if (error instanceof Error) {
        console.error("Error details:", error.message);
      }
      return {
        models: [],
        error: "Failed to load car models. Please try again.",
      };
    }
  },
});

function AdminModelsPage() {
  const { models, error } = Route.useLoaderData();
  const { isSignedIn } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleteSuccess, setDeleteSuccess] = useState<string | null>(null);
  const [localModels, setLocalModels] = useState<DisplayCarModel[]>([]);

  // Update local models when loader data changes
  useEffect(() => {
    if (models) {
      setLocalModels(models as DisplayCarModel[]);
    }
  }, [models]);

  // Filter models based on search query
  const filteredModels = localModels.filter(
    (model) =>
      model.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      model.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Handle model deletion
  const handleDelete = async (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete the model "${name}"?`)) {
      try {
        setIsDeleting(id);
        setDeleteError(null);
        setDeleteSuccess(null);

        const result = await deleteCarModel({ data: { id } });

        if (result.success) {
          setLocalModels((prev) => prev.filter((model) => model.id !== id));
          setDeleteSuccess(`Model "${name}" deleted successfully.`);

          // Clear success message after 3 seconds
          setTimeout(() => {
            setDeleteSuccess(null);
          }, 3000);
        }
      } catch (error) {
        setDeleteError(`Failed to delete model "${name}". Please try again.`);
        console.error("Error deleting model:", error);
      } finally {
        setIsDeleting(null);
      }
    }
  };

  // If not signed in, show auth options in parent route

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
          <h1 className="text-3xl font-bold text-primary mb-4 md:mb-0">
            Car Models
          </h1>

          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search models..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              />
            </div>

            <Link
              to="/admin/models/$id"
              params={{ id: "new" }}
              className="bg-primary text-white py-2 px-4 rounded-md hover:bg-primary/90 transition-colors flex items-center justify-center"
            >
              <Plus className="h-5 w-5 mr-2" />
              Add New Model
            </Link>
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

        {deleteSuccess && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
            {deleteSuccess}
          </div>
        )}

        {filteredModels.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-6 text-center">
            {searchQuery ? (
              <p className="text-gray-500">
                No models found matching "{searchQuery}"
              </p>
            ) : (
              <div>
                <p className="text-gray-500 mb-4">
                  No car models have been added yet.
                </p>
                <Link
                  to="/admin/models/$id"
                  params={{ id: "new" }}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Your First Model
                </Link>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Image
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Model
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Price
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Category
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Status
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredModels.map((model) => (
                    <tr key={model.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="h-12 w-16 relative">
                          <img
                            src={model.mainProductImage}
                            alt={model.name}
                            className="h-full object-cover rounded"
                          />
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {model.name}
                        </div>
                        <div className="text-xs text-gray-500">{model.id}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {model.price}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                          {model.categoryDisplay}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {model.published ? (
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                            Published
                          </span>
                        ) : (
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                            Draft
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-3">
                          {/* View on website */}
                          <a
                            href={`/tipe-mobil/${model.id}`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-gray-500 hover:text-primary transition-colors"
                            title="View on website"
                          >
                            <Eye className="h-5 w-5" />
                          </a>

                          {/* Edit button */}
                          <Link
                            to="/admin/models/$id"
                            params={{ id: model.id }}
                            className="text-indigo-600 hover:text-indigo-900 transition-colors"
                            title="Edit model"
                          >
                            <Pencil className="h-5 w-5" />
                          </Link>

                          {/* Delete button */}
                          <button
                            type="button"
                            onClick={() => handleDelete(model.id, model.name)}
                            disabled={isDeleting === model.id}
                            className="text-red-600 hover:text-red-900 transition-colors disabled:opacity-50"
                            title="Delete model"
                          >
                            {isDeleting === model.id ? (
                              <div className="h-5 w-5 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <Trash2 className="h-5 w-5" />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
