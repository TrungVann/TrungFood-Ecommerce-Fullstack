"use client";

import React, { useEffect, useState } from "react";
import { CheckCircle, Truck } from "lucide-react";
import { useSearchParams, useRouter } from "next/navigation";
import { useAuthStore } from "apps/user-ui/src/store/authStore";
import axios from "axios";
import { useStore } from "apps/user-ui/src/store";
import confetti from "canvas-confetti";

const PaymentSuccessPage = () => {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("sessionId");
  const router = useRouter();
  const [isRefreshing, setIsRefreshing] = useState(true);
  const { setLoggedIn } = useAuthStore();

  // Refresh token and clear cart
  useEffect(() => {
    const refreshAndSetup = async () => {
      try {
        // Refresh token to prevent logout
        await axios.post(
          `${process.env.NEXT_PUBLIC_SERVER_URI}/auth/api/refresh-token`,
          {},
          { withCredentials: true }
        );
        console.log("Token refreshed successfully");
        // Ensure user is marked as logged in
        setLoggedIn(true);
      } catch (error) {
        console.error("Failed to refresh token:", error);
        // If refresh fails, try to check if user is still logged in
        try {
          const response = await axios.get(
            `${process.env.NEXT_PUBLIC_SERVER_URI}/auth/api/logged-in-user`,
            { withCredentials: true }
          );
          if (response.data?.user) {
            setLoggedIn(true);
          }
        } catch (checkError) {
          console.error("User not logged in:", checkError);
        }
      }

      // Clear cart
      useStore.setState({ cart: [] });

      // Confetti burst
      confetti({
        particleCount: 120,
        spread: 90,
        origin: { y: 0.6 },
      });

      setIsRefreshing(false);
    };

    refreshAndSetup();
  }, [setLoggedIn]);

  if (isRefreshing) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-orange-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="bg-white shadow-sm border border-gray-200 rounded-lg max-w-md w-full text-center p-8 animate-fade-in">
        <div className="text-green-500 mb-4">
          <CheckCircle className="w-16 h-16 mx-auto" />
        </div>
        <h2 className="text-2xl font-semibold text-gray-800 mb-2">
          Payment Successful 🎉
        </h2>
        <p className="text-sm text-gray-600 mb-6">
          Thank you for your purchase. Your order has been placed successfully!
        </p>

        <button
          onClick={() => router.push(`/profile?active=My+Orders`)}
          className="inline-flex items-center gap-2 bg-orange-500 text-white px-5 py-2 rounded-md hover:bg-orange-600 transition text-sm font-medium"
        >
          <Truck className="w-4 h-4" />
          Track Order
        </button>

        <div className="mt-8 text-xs text-gray-400">
          Payment Session ID: <span className="font-mono">{sessionId}</span>
        </div>
      </div>
    </div>
  );
};

export default PaymentSuccessPage;
