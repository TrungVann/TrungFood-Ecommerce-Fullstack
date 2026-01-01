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
    return response.data?.user ?? null;
  } catch (error: any) {
    if (error.response?.status === 401) {
      throw error;
    }
    return null;
  }
};

const useUser = () => {
  const { setLoggedIn } = useAuthStore();

  const {
    data: user,
    isPending,
    isError,
  } = useQuery({
    queryKey: ["user"],
    queryFn: fetchUser,
    staleTime: 1000 * 60 * 5,
    retry: false,
    enabled: typeof window !== "undefined",
  });

  // Update auth state based on query results
  React.useEffect(() => {
    const currentPath =
      typeof window !== "undefined" ? window.location.pathname : "";

    if (user) {
      setLoggedIn(true);
    } else if (isError) {
      setLoggedIn(false);
    }
  }, [user, isError, setLoggedIn]);

  // Return stored user if available, otherwise fetched user
  return {
    user: user as any,
    isLoading: isPending,
    isError,
  };
};

export default useUser;
