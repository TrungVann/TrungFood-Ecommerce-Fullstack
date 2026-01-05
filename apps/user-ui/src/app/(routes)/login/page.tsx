"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import GoogleButton from "apps/user-ui/src/shared/components/google-button";
import { useAuthStore } from "apps/user-ui/src/store/authStore";
import axiosInstance from "apps/user-ui/src/utils/axiosInstance";
import axios, { AxiosError } from "axios";
import { Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useState } from "react";
import { useForm } from "react-hook-form";

type FormData = {
  email: string;
  password: string;
};

const Login = () => {
  const queryClient = useQueryClient();
  const { setLoggedIn } = useAuthStore();
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [rememberMe, setRememberMe] = useState(false);
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>();

  const loginMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const response = await axiosInstance.post(`/auth/api/login-user`, data, {
        withCredentials: true,
      });
      return response.data;
    },
    onSuccess: (data) => {
      setServerError(null);
      setLoggedIn(true);
      // Clear user data
      queryClient.invalidateQueries({ queryKey: ["user"] });
      // Clear all chat-related cache
      queryClient.removeQueries({ queryKey: ["conversations"] });
      queryClient.removeQueries({ queryKey: ["messages"] });
      router.push("/");
    },
    onError: (error: AxiosError) => {
      const errorMessage =
        (error.response?.data as { message?: string })?.message ||
        "Thông tin đăng nhập không hợp lệ!";
      setServerError(errorMessage);
    },
  });

  const onSubmit = (data: FormData) => {
    loginMutation.mutate(data);
  };

  return (
    <div className="w-full py-10 min-h-[85vh] bg-[#f1f1f1]">
      <h1 className="text-4xl font-Poppins font-semibold text-black text-center">
        Đăng nhập
      </h1>
      <p className="text-center text-lg font-medium py-3 text-[#00000099]">
        Trang chủ . Đăng nhập
      </p>

      <div className="w-full flex justify-center">
        <div className="md:w-[480px] p-8 bg-white shadow rounded-lg">
          <h3 className="text-3xl font-semibold text-center mb-2">Đăng nhập</h3>
          <p className="text-center text-gray-500 mb-4">
            Chưa có tài khoản?{" "}
            <Link href={"/signup"} className="text-[#FF541B]">
              Đăng ký
            </Link>
          </p>

          <form onSubmit={handleSubmit(onSubmit)}>
            <label className="block text-gray-700 mb-1">Email</label>
            <input
              type="email"
              placeholder="abcxyz@gmail.com"
              className="w-full p-2 border border-gray-300 outline-0 !rounded mb-1"
              {...register("email", {
                required: "Email không được để trống",
                pattern: {
                  value: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/,
                  message: "Email không hợp lệ",
                },
              })}
            />
            {errors.email && (
              <p className="text-red-500 text-sm">
                {String(errors.email.message)}
              </p>
            )}

            <label className="block text-gray-700 mb-1">Mật khẩu</label>
            <div className="relative">
              <input
                type={passwordVisible ? "text" : "password"}
                placeholder="Tối thiểu 6 ký tự"
                className="w-full p-2 border border-gray-300 outline-0 !rounded mb-1"
                {...register("password", {
                  required: "Mật khẩu không được để trống",
                  minLength: {
                    value: 6,
                    message: "Mật khẩu phải có ít nhất 6 ký tự",
                  },
                })}
              />

              <button
                type="button"
                onClick={() => setPasswordVisible(!passwordVisible)}
                className="absolute inset-y-0 right-3 flex items-center text-gray-400"
              >
                {passwordVisible ? <Eye /> : <EyeOff />}
              </button>
              {errors.password && (
                <p className="text-red-500 text-sm">
                  {String(errors.password.message)}
                </p>
              )}
            </div>
            <div className="flex justify-between items-center my-4">
              <label className="flex items-center text-gray-600">
                <input
                  type="checkbox"
                  className="mr-2"
                  checked={rememberMe}
                  onChange={() => setRememberMe(!rememberMe)}
                />
                Ghi nhớ
              </label>
              <Link
                href={"/forgot-password"}
                className="text-[#FF541B] text-sm"
              >
                Quên mật khẩu?
              </Link>
            </div>

            <button
              type="submit"
              disabled={loginMutation.isPending}
              className="w-full text-lg cursor-pointer bg-[#FF541B] text-white py-2 rounded-lg"
            >
              {loginMutation?.isPending ? "Đang đăng nhập..." : "Đăng nhập"}
            </button>

            {serverError && (
              <p className="text-red-500 text-sm mt-2">{serverError}</p>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
