"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axiosInstance from "apps/user-ui/src/utils/axiosInstance";
import { countries } from "apps/user-ui/src/utils/countries";
import { MapPin, Plus, Trash2, X } from "lucide-react";
import React, { useState } from "react";
import { useForm } from "react-hook-form";

const ShippingAddressSection = () => {
  const [showModal, setShowModal] = useState(false);
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: {
      label: "Home",
      name: "",
      street: "",
      city: "",
      zip: "",
      country: "Vietnam",
      isDefault: "false",
    },
  });

  const { mutate: addAddress } = useMutation({
    mutationFn: async (payload: any) => {
      const res = await axiosInstance.post("/auth/api/add-address", payload);
      return res.data.address;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shipping-addresses"] });
      reset();
      setShowModal(false);
    },
  });

  // Get addresses
  const { data: addresses, isLoading } = useQuery({
    queryKey: ["shipping-addresses"],
    queryFn: async () => {
      const res = await axiosInstance.get("/auth/api/shipping-addresses");
      return res.data.addresses;
    },
  });

  const onSubmit = async (data: any) => {
    addAddress({
      ...data,
      isDefault: data?.isDefault === "true",
    });
  };

  const { mutate: deleteAddress } = useMutation({
    mutationFn: async (id: string) => {
      await axiosInstance.delete(`/auth/api/delete-address/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shipping-addresses"] });
    },
  });

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold text-gray-800">Saved Address</h2>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-1 text-sm text-blue-600 font-medium hover:underline"
        >
          <Plus className="w-4 h-4" /> Add New Address
        </button>
      </div>

      {/* Address List */}
      <div>
        {isLoading ? (
          <p className="text-sm text-gray-500">Loading Addresses...</p>
        ) : !addresses || addresses.length === 0 ? (
          <p className="text-sm text-gray-600">No saved addresses found.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {addresses.map((address: any) => (
              <div
                key={address.id}
                className="border border-gray-200 rounded-md p-4 relative"
              >
                {address.isDefault && (
                  <span className="absolute top-2 right-2 bg-blue-100 text-blue-600 text-xs px-2 py-0.5 rounded-full">
                    Default
                  </span>
                )}
                <div className="flex items-start gap-2 text-sm text-gray-700">
                  <MapPin className="w-5 h-5 mt-0.5 text-gray-500" />
                  <div>
                    <p className="font-medium">
                      {address.label} - {address.name}
                    </p>
                    <p>
                      {address.street}, {address.city}, {address.zip},{" "}
                      {address.country}
                    </p>
                  </div>
                </div>
                <div className="flex gap-3 mt-4">
                  <button
                    className="flex items-center gap-1 !cursor-pointer text-xs text-red-500 hover:underline"
                    onClick={() => deleteAddress(address.id)}
                  >
                    <Trash2 className="w-4 h-4" /> Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Overlay */}
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setShowModal(false)}
          />

          {/* Modal */}
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-xl p-6 animate-fadeIn">
            {/* Close */}
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 transition"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Title */}
            <h3 className="text-xl font-semibold text-gray-800 mb-1">
              Add New Address
            </h3>
            <p className="text-sm text-gray-500 mb-5">
              Please fill in the information below
            </p>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {/* Label */}
              <div>
                <select {...register("label")} className="input">
                  <option value="Home">🏠 Home</option>
                  <option value="Work">🏢 Work</option>
                  <option value="Other">📍 Other</option>
                </select>
              </div>

              {/* Name */}
              <div>
                <input
                  placeholder="Full name"
                  {...register("name", { required: "Name is required" })}
                  className="input w-full p-2"
                />
                {errors.name && (
                  <p className="error-text">{errors.name.message}</p>
                )}
              </div>

              {/* Street */}
              <div>
                <input
                  placeholder="Street address"
                  {...register("street", { required: "Street is required" })}
                  className="input w-full p-2"
                />
                {errors.street && (
                  <p className="error-text">{errors.street.message}</p>
                )}
              </div>

              {/* City + Zip */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <input
                    placeholder="City"
                    {...register("city", { required: "City is required" })}
                    className="input w-full p-2"
                  />
                  {errors.city && (
                    <p className="error-text">{errors.city.message}</p>
                  )}
                </div>

                <div>
                  <input
                    placeholder="ZIP Code"
                    {...register("zip", { required: "ZIP code is required" })}
                    className="input w-full p-2"
                  />
                </div>
              </div>

              {/* Country */}
              <select {...register("country")} className="input p-2 w-[55%]">
                {countries.map((country) => (
                  <option key={country} value={country}>
                    {country}
                  </option>
                ))}
              </select>

              {/* Default */}
              <select {...register("isDefault")} className="input p-2">
                <option value="true">⭐ Set as default</option>
                <option value="false">Not default</option>
              </select>

              {/* Submit */}
              <button
                type="submit"
                className="w-full py-2.5 rounded-xl font-medium text-white bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 transition active:scale-[0.98]"
              >
                Save Address
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ShippingAddressSection;
