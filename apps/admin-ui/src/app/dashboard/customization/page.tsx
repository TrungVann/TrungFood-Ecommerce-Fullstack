"use client";

import React, { useEffect, useState } from "react";
import BreadCrumbs from "apps/admin-ui/src/shared/components/breadcrumbs";
import axiosInstance from "apps/admin-ui/src/utils/axiosInstance";

const tabs = ["Categories", "Logo", "Banner"];

const Customization = () => {
  const [activeTab, setActiveTab] = useState("Categories");

  const [categories, setCategories] = useState<string[]>([]);
  const [subCategories, setSubCategories] = useState<Record<string, string[]>>(
    {}
  );
  const [logo, setLogo] = useState<string | null>(null);
  const [banner, setBanner] = useState<string | null>(null);

  const [newCategory, setNewCategory] = useState("");
  const [newSubCategory, setNewSubCategory] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");

  // Edit states
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [editingSubCategory, setEditingSubCategory] = useState<{
    category: string;
    sub: string;
  } | null>(null);
  const [editCategoryValue, setEditCategoryValue] = useState("");
  const [editSubCategoryValue, setEditSubCategoryValue] = useState("");

  // Delete confirmation
  const [deleteConfirm, setDeleteConfirm] = useState<{
    type: "category" | "subcategory";
    category: string;
    sub?: string;
  } | null>(null);

  useEffect(() => {
    const fetchCustomization = async () => {
      try {
        const res = await axiosInstance.get("/admin/api/get-all");
        const data = res.data;

        setCategories(data.categories || []);
        setSubCategories(data.subCategories || {});
        setLogo(data.logo || null);
        setBanner(data.banner || null);
      } catch (err) {
        console.error("Failed to fetch customization data", err);
      }
    };

    fetchCustomization();
  }, []);

  const handleAddCategory = async () => {
    if (!newCategory.trim()) return;
    try {
      await axiosInstance.post("/admin/api/add-category", {
        category: newCategory,
      });
      setCategories((prev) => [...prev, newCategory]);
      setNewCategory("");
    } catch (error) {
      console.error("Error adding category", error);
    }
  };

  const handleAddSubCategory = async () => {
    if (!newSubCategory.trim() || !selectedCategory) return;
    try {
      await axiosInstance.post("/admin/api/add-subcategory", {
        category: selectedCategory,
        subCategory: newSubCategory,
      });
      setSubCategories((prev) => ({
        ...prev,
        [selectedCategory]: [...(prev[selectedCategory] || []), newSubCategory],
      }));
      setNewSubCategory("");
    } catch (error) {
      console.error("Error adding subcategory", error);
    }
  };

  const handleEditCategory = async () => {
    if (!editingCategory || !editCategoryValue.trim()) return;
    try {
      await axiosInstance.put("/admin/api/update-category", {
        oldCategory: editingCategory,
        newCategory: editCategoryValue,
      });
      setCategories((prev) =>
        prev.map((cat) => (cat === editingCategory ? editCategoryValue : cat))
      );
      if (subCategories[editingCategory]) {
        setSubCategories((prev) => {
          const updated = { ...prev };
          updated[editCategoryValue] = updated[editingCategory];
          delete updated[editingCategory];
          return updated;
        });
      }
      setEditingCategory(null);
      setEditCategoryValue("");
    } catch (error) {
      console.error("Error updating category", error);
    }
  };

  const handleDeleteCategory = async () => {
    if (!deleteConfirm || deleteConfirm.type !== "category") return;
    try {
      await axiosInstance.delete("/admin/api/delete-category", {
        data: { category: deleteConfirm.category },
      });
      setCategories((prev) =>
        prev.filter((cat) => cat !== deleteConfirm.category)
      );
      setSubCategories((prev) => {
        const updated = { ...prev };
        delete updated[deleteConfirm.category];
        return updated;
      });
      setDeleteConfirm(null);
    } catch (error) {
      console.error("Error deleting category", error);
    }
  };

  const handleEditSubCategory = async () => {
    if (!editingSubCategory || !editSubCategoryValue.trim()) return;
    try {
      await axiosInstance.put("/admin/api/update-subcategory", {
        category: editingSubCategory.category,
        oldSubCategory: editingSubCategory.sub,
        newSubCategory: editSubCategoryValue,
      });
      setSubCategories((prev) => ({
        ...prev,
        [editingSubCategory.category]: prev[editingSubCategory.category].map(
          (sub) => (sub === editingSubCategory.sub ? editSubCategoryValue : sub)
        ),
      }));
      setEditingSubCategory(null);
      setEditSubCategoryValue("");
    } catch (error) {
      console.error("Error updating subcategory", error);
    }
  };

  const handleDeleteSubCategory = async () => {
    if (!deleteConfirm || deleteConfirm.type !== "subcategory") return;
    try {
      await axiosInstance.delete("/admin/api/delete-subcategory", {
        data: {
          category: deleteConfirm.category,
          subCategory: deleteConfirm.sub,
        },
      });
      setSubCategories((prev) => ({
        ...prev,
        [deleteConfirm.category]: prev[deleteConfirm.category].filter(
          (sub) => sub !== deleteConfirm.sub
        ),
      }));
      setDeleteConfirm(null);
    } catch (error) {
      console.error("Error deleting subcategory", error);
    }
  };

  return (
    <div className="w-full min-h-screen p-8">
      <h2 className="text-2xl text-white font-semibold mb-2">Customization</h2>

      <BreadCrumbs title="Customization" />

      {/* Tabs */}
      <div className="flex items-center gap-6 mt-6 border-b border-gray-700">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`relative text-sm font-medium pb-2 transition text-gray-400 hover:text-white ${
              activeTab === tab
                ? "text-white after:absolute after:left-0 after:-bottom-[1px] after:h-[2px] after:w-full after:bg-white"
                : ""
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="mt-8 text-white">
        {activeTab === "Categories" && (
          <div className="space-y-4">
            {categories.length === 0 ? (
              <p className="text-gray-400">No categories found.</p>
            ) : (
              categories.map((cat, idx) => (
                <div
                  key={idx}
                  className="border border-gray-600 rounded-md p-4 mb-4"
                >
                  <div className="flex items-center justify-between mb-2">
                    {editingCategory === cat ? (
                      <div className="flex items-center gap-2 flex-1">
                        <input
                          type="text"
                          value={editCategoryValue}
                          onChange={(e) => setEditCategoryValue(e.target.value)}
                          className="px-3 py-1 rounded-md outline-none text-sm bg-gray-700 text-white border border-gray-500 flex-1"
                          autoFocus
                        />
                        <button
                          onClick={handleEditCategory}
                          className="text-xs bg-green-600 hover:bg-green-700 px-2 py-1 rounded-md"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => {
                            setEditingCategory(null);
                            setEditCategoryValue("");
                          }}
                          className="text-xs bg-gray-600 hover:bg-gray-700 px-2 py-1 rounded-md"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <>
                        <p className="font-semibold">{cat}</p>
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              setEditingCategory(cat);
                              setEditCategoryValue(cat);
                            }}
                            className="text-xs bg-blue-600 hover:bg-blue-700 px-2 py-1 rounded-md"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() =>
                              setDeleteConfirm({
                                type: "category",
                                category: cat,
                              })
                            }
                            className="text-xs bg-red-600 hover:bg-red-700 px-2 py-1 rounded-md"
                          >
                            Delete
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                  {subCategories?.[cat]?.length > 0 ? (
                    <ul className="ml-4 text-sm text-gray-400 list-disc space-y-1">
                      {subCategories[cat].map((sub, i) => (
                        <li
                          key={i}
                          className="flex items-center justify-between"
                        >
                          {editingSubCategory?.category === cat &&
                          editingSubCategory?.sub === sub ? (
                            <div className="flex items-center gap-2 flex-1">
                              <input
                                type="text"
                                value={editSubCategoryValue}
                                onChange={(e) =>
                                  setEditSubCategoryValue(e.target.value)
                                }
                                className="px-3 py-1 rounded-md outline-none text-sm bg-gray-700 text-white border border-gray-500 flex-1"
                                autoFocus
                              />
                              <div className="flex gap-1">
                                <button
                                  onClick={handleEditSubCategory}
                                  className="text-xs bg-green-600 hover:bg-green-700 px-2 py-1 rounded-md"
                                >
                                  Save
                                </button>
                                <button
                                  onClick={() => {
                                    setEditingSubCategory(null);
                                    setEditSubCategoryValue("");
                                  }}
                                  className="text-xs bg-gray-600 hover:bg-gray-700 px-2 py-1 rounded-md"
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          ) : (
                            <>
                              <span>{sub}</span>
                              <div className="flex gap-1">
                                <button
                                  onClick={() => {
                                    setEditingSubCategory({
                                      category: cat,
                                      sub,
                                    });
                                    setEditSubCategoryValue(sub);
                                  }}
                                  className="text-xs bg-blue-600 hover:bg-blue-700 px-2 py-1 rounded-md"
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={() =>
                                    setDeleteConfirm({
                                      type: "subcategory",
                                      category: cat,
                                      sub,
                                    })
                                  }
                                  className="text-xs bg-red-600 hover:bg-red-700 px-2 py-1 rounded-md"
                                >
                                  Delete
                                </button>
                              </div>
                            </>
                          )}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="ml-4 text-xs text-gray-500 italic">
                      No subcategories
                    </p>
                  )}
                </div>
              ))
            )}

            {/* Add New Category */}
            <div className="pt-4 space-x-2">
              <input
                type="text"
                placeholder="New category"
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                className="px-3 py-1 rounded-md outline-none text-sm bg-gray-800 text-white border border-gray-600"
              />
              <button
                onClick={handleAddCategory}
                className="text-sm bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded-md"
              >
                Add Category
              </button>
            </div>

            {/* Add Subcategory */}
            <div className="pt-4 flex items-center gap-2 flex-wrap">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="bg-gray-800 outline-none text-white border border-gray-600 px-3 py-1 rounded-md text-sm"
              >
                <option value="">Select category</option>
                {categories.map((cat, i) => (
                  <option key={i} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
              <input
                type="text"
                placeholder="New subcategory"
                value={newSubCategory}
                onChange={(e) => setNewSubCategory(e.target.value)}
                className="px-3 py-1 rounded-md outline-none text-sm bg-gray-800 text-white border border-gray-600"
              />
              <button
                onClick={handleAddSubCategory}
                className="text-sm bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded-md"
              >
                Add Subcategory
              </button>
            </div>
          </div>
        )}

        {activeTab === "Logo" && (
          <div className="space-y-4">
            {logo ? (
              <img
                src={logo}
                alt="Platform Logo"
                className="w-[120px] h-auto border border-gray-600 p-2 bg-white"
              />
            ) : (
              <p className="text-gray-400">No logo uploaded.</p>
            )}

            <div>
              <input
                type="file"
                accept="image/*"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;

                  const formData = new FormData();
                  formData.append("file", file);

                  try {
                    const res = await axiosInstance.post(
                      "/admin/api/upload-logo",
                      formData
                    );
                    setLogo(res.data.logo);
                  } catch (err) {
                    console.error("Logo upload failed", err);
                  }
                }}
                className="text-sm text-white"
              />
            </div>
          </div>
        )}

        {activeTab === "Banner" && (
          <div className="space-y-4">
            {banner ? (
              <img
                src={banner}
                alt="Platform Banner"
                className="w-full max-w-[600px] h-auto border border-gray-600 rounded-md"
              />
            ) : (
              <p className="text-gray-400">No banner uploaded.</p>
            )}

            <div>
              <input
                type="file"
                accept="image/*"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;

                  const formData = new FormData();
                  formData.append("file", file);

                  try {
                    const res = await axiosInstance.post(
                      "/admin/api/upload-banner",
                      formData
                    );
                    setBanner(res.data.banner);
                  } catch (err) {
                    console.error("Banner upload failed", err);
                  }
                }}
                className="text-sm text-white"
              />
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 p-6 rounded-lg max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-white mb-4">
              Confirm Delete
            </h3>
            <p className="text-gray-300 mb-6">
              Are you sure you want to delete{" "}
              <span className="font-semibold text-white">
                {deleteConfirm.type === "category"
                  ? `category "${deleteConfirm.category}"`
                  : `subcategory "${deleteConfirm.sub}" from "${deleteConfirm.category}"`}
              </span>
              ?{" "}
              {deleteConfirm.type === "category" &&
                "This will also delete all its subcategories."}
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-md transition"
              >
                Cancel
              </button>
              <button
                onClick={
                  deleteConfirm.type === "category"
                    ? handleDeleteCategory
                    : handleDeleteSubCategory
                }
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md transition"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Customization;
