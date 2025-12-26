import { create } from "zustand";
import { persist } from "zustand/middleware";

type AuthState = {
  isLoggedIn: boolean;
  setLoggedIn: (value: boolean) => void;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      isLoggedIn: false, // Default to false - only set to true after successful login
      setLoggedIn: (value: boolean) => set({ isLoggedIn: value }),
    }),
    {
      name: "auth-storage", // unique name for localStorage key
    }
  )
);
