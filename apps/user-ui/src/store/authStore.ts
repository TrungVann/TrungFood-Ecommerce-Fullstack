import { create } from "zustand";

type AuthState = {
  isLoggedIn: boolean;
  setLoggedIn: (value: boolean) => void;
};

export const useAuthStore = create<AuthState>((set) => ({
  isLoggedIn: false, // Default to false - only set to true after successful login
  setLoggedIn: (value) => set({ isLoggedIn: value }),
}));
