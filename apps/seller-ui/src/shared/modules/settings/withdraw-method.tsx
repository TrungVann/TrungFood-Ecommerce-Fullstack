"use client";

import React from "react";
import { Banknote, Link, CheckCircle, Globe } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import axiosInstance from "apps/seller-ui/src/utils/axiosInstance";

// Fetch Stripe account details
const fetchStripeAccount = async () => {
  const res = await axiosInstance.get("/product/api/get-stripe-account");
  return res?.data?.stripeAccount || null;
};

const WithdrawMethod = () => {
  // Fetch connected Stripe account
  const { data: stripeAccount, isLoading } = useQuery({
    queryKey: ["stripe-account"],
    queryFn: fetchStripeAccount,
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  });

  return (
    <div className="max-w-2xl space-y-6">
      {/* Withdraw Method Header */}
      <div className="px-4 rounded-lg">
        <div className="flex items-center gap-3">
          <Banknote size={22} className="text-blue-400" />
          <div>
            <h3 className="text-white font-semibold">Phương thức rút tiền</h3>
            <p className="text-gray-400 text-sm">
              Quản lý cài đặt rút tiền Stripe của bạn.
            </p>
          </div>
        </div>
      </div>

      {/* Connected Stripe Account */}
      <div className="px-4 rounded-lg">
        {isLoading ? (
          <p className="text-gray-400">Đang tải...</p>
        ) : stripeAccount ? (
          <div className="p-4 border border-gray-700 rounded-md space-y-4">
            {/* Stripe Status */}
            <div className="flex items-center gap-3">
              <CheckCircle size={22} className="text-green-400" />
              <div>
                <p className="text-white font-semibold">
                  Đã kết nối với Stripe
                </p>
                <p className="text-gray-400 text-sm">{stripeAccount.email}</p>
              </div>
            </div>

            {/* Stripe Account Details */}
            <div className="grid grid-cols-2 gap-4 text-gray-300 text-sm">
              <div>
                <p className="text-gray-400">Tên doanh nghiệp:</p>
                <p className="text-white">
                  {stripeAccount.business_name || "N/A"}
                </p>
              </div>
              <div>
                <p className="text-gray-400">Đất nước:</p>
                <p className="text-white">
                  {stripeAccount.country || "Unknown"}
                </p>
              </div>
              <div>
                <p className="text-gray-400">Đã bật thanh toán:</p>
                <p
                  className={
                    stripeAccount.payouts_enabled
                      ? "text-green-400"
                      : "text-red-400"
                  }
                >
                  {stripeAccount.payouts_enabled ? "Yes" : "No"}
                </p>
              </div>
              <div>
                <p className="text-gray-400">Đã bật tính phí:</p>
                <p
                  className={
                    stripeAccount.charges_enabled
                      ? "text-green-400"
                      : "text-red-400"
                  }
                >
                  {stripeAccount.charges_enabled ? "Yes" : "No"}
                </p>
              </div>
              <div>
                <p className="text-gray-400">Lần thanh toán gần nhất:</p>
                <p className="text-white">
                  {stripeAccount.last_payout || "No payouts yet"}
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-between items-center">
              <a
                href={stripeAccount.dashboard_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:text-blue-300 flex items-center gap-2"
              >
                <Globe size={18} /> Mở bảng điều khiển Stripe
              </a>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center space-y-4 border border-gray-700 p-4 rounded-md">
            <p className="text-gray-400">
              Không có tài khoản Stripe nào được kết nối.
            </p>
            <a
              href="/product/api/connect-stripe"
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md flex items-center gap-2"
            >
              <Link size={18} /> Kết nối Stripe
            </a>
          </div>
        )}
      </div>
    </div>
  );
};

export default WithdrawMethod;
