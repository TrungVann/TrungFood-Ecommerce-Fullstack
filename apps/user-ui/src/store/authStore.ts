import { create } from "zustand";
import { persist } from "zustand/middleware";

type AuthState = {
  isLoggedIn: boolean;
  user: any;
  setLoggedIn: (value: boolean) => void;
  setUser: (user: any) => void;
  logout: () => void;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      isLoggedIn: false,
      user: null,
      setLoggedIn: (value: boolean) => set({ isLoggedIn: value }),
      setUser: (user: any) => set({ user, isLoggedIn: !!user }),
      logout: () => {
        set({ isLoggedIn: false, user: null });
        localStorage.removeItem("auth-storage");
      },
    }),
    {
      name: "auth-storage",
    }
  )
);
