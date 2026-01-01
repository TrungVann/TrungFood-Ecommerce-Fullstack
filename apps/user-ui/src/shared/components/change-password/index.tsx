import axiosInstance from "apps/user-ui/src/utils/axiosInstance";
import React, { useState } from "react";
import { useForm } from "react-hook-form";

const ChangePassword = () => {
  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm();
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const onSubmit = async (data: any) => {
    setError("");
    setMessage("");
    try {
      await axiosInstance.post("/api/change-password", {
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
        confirmPassword: data?.confirmPassword,
      });
      setMessage("Password updated successfully!");
      reset();
    } catch (error: any) {
      setError(error?.response?.data?.message);
    }
  };

  return (
    <div className="max-w-md mx-auto space-y-6">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block mb-1 text-sm font-medium text-gray-700">
            Current Password
          </label>
          <input
            type="password"
            {...register("currentPassword", {
              required: "Current password is required",
              minLength: {
                value: 6,
                message: "Minimum 6 characters required",
              },
            })}
            className="form-input"
            placeholder="Enter current password"
          />
          {errors.currentPassword?.message && (
            <p className="text-red-500 text-xs mt-1">
              {String(errors.currentPassword.message)}
            </p>
          )}
        </div>

        {/* New Password */}
        <div>
          <label className="block mb-1 text-sm font-medium text-gray-700">
            Mật khẩu mới
          </label>
          <input
            type="password"
            {...register("newPassword", {
              required: "Mật khẩu mới không được để trống",
              minLength: {
                value: 8,
                message: "Mật khẩu mới phải có ít nhất 8 ký tự",
              },
              validate: {
                hasLower: (value) =>
                  /[a-z]/.test(value) || "Phải bao gồm một chữ cái thường",
                hasUpper: (value) =>
                  /[A-Z]/.test(value) || "Phải bao gồm một chữ cái viết hoa",
                hasNumber: (value) =>
                  /\d/.test(value) || "Phải bao gồm một chữ số",
              },
            })}
            className="form-input"
            placeholder="Nhập mật khẩu mới"
          />
          {errors.newPassword?.message && (
            <p className="text-red-500 text-xs mt-1">
              {String(errors.newPassword.message)}
            </p>
          )}
        </div>

        {/* Confirm Password */}
        <div>
          <label className="block mb-1 text-sm font-medium text-gray-700">
            Xác nhận mật khẩu mới
          </label>
          <input
            type="password"
            {...register("confirmPassword", {
              required: "Xác nhận mật khẩu mới",
              validate: (value) =>
                value === watch("newPassword") ||
                "Mật khẩu mới không trùng khớp",
            })}
            className="form-input"
            placeholder="Nhập lại mật khẩu mới"
          />
          {errors.confirmPassword?.message && (
            <p className="text-red-500 text-xs mt-1">
              {String(errors.confirmPassword.message)}
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full mt-1 bg-orange-500 text-white py-2 rounded-md hover:bg-orange-600 transition text-sm"
        >
          {isSubmitting ? "Đang cập nhật..." : "Cập nhật mật khẩu"}
        </button>
      </form>

      {error && <p className="text-red-500 text-center text-sm">{error}</p>}
      {message && (
        <p className="text-green-500 text-center text-sm">{message}</p>
      )}
    </div>
  );
};

export default ChangePassword;
