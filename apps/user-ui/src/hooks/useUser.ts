import { useQuery } from "@tanstack/react-query";
import axiosInstance from "../utils/axiosInstance";
import { useAuthStore } from "../store/authStore";
import { isProtected } from "../utils/protected";
import React from "react";

// fetch user data from API
const fetchUser = async () => {
  try {
    const response = await axiosInstance.get(
      "/auth/api/logged-in-user",
      isProtected
    );
    // Return null instead of undefined if user data is missing
    return response.data?.user || null;
  } catch (error) {
    // Return null on error instead of throwing or returning undefined
    return null;
  }
};

const useUser = () => {
  const {
    setLoggedIn,
    setUser,
    user: storedUser,
    logout,
    isLoggedIn,
  } = useAuthStore();

  const {
    data: user,
    isPending,
    isError,
  } = useQuery({
    queryKey: ["user"],
    queryFn: fetchUser,
    staleTime: 1000 * 60 * 5,
    retry: false,
    enabled: isLoggedIn, // Only run query if user should be logged in
  });

  // Update auth state based on query results
  React.useEffect(() => {
    const currentPath =
      typeof window !== "undefined" ? window.location.pathname : "";

    if (user) {
      setUser(user);
    } else if (isError && currentPath !== "/payment-success") {
      // Only logout if not on payment-success page
      logout();
    }
  }, [user, isError, setUser, logout]);

  // If logged in but no stored user, fetch and store
  React.useEffect(() => {
    if (isLoggedIn && !storedUser && !isPending && !user) {
      // Trigger fetch by enabling query
    }
  }, [isLoggedIn, storedUser, isPending, user]);

  // Return stored user if available, otherwise fetched user
  return {
    user: storedUser || user,
    isLoading: isPending,
    isError,
  };
};

export default useUser;
