import { useQuery } from "@tanstack/react-query";
import axiosInstance from "../utils/axiosInstance";
import { useAuthStore } from "../store/authStore";
import { isProtected } from "../utils/protected";
import React from "react";

// fetch user data from API
const fetchUser = async () => {
  try {
    const response = await axiosInstance.get("/auth/api/logged-in-user", isProtected);
    // Return null instead of undefined if user data is missing
    return response.data?.user || null;
  } catch (error) {
    // Return null on error instead of throwing or returning undefined
    return null;
  }
};

const useUser = () => {
  const { setLoggedIn, isLoggedIn } = useAuthStore();

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
    if (user) {
      setLoggedIn(true);
    } else if (isError || (!isLoggedIn && !isPending)) {
      // If not logged in and not pending, ensure state is false
      setLoggedIn(false);
    }
  }, [user, isError, isLoggedIn, isPending, setLoggedIn]);

  // When isLoggedIn is false, we're not loading (query is disabled)
  const isLoading = isLoggedIn ? isPending : false;

  return { user: user as any, isLoading, isError };
};

export default useUser;
