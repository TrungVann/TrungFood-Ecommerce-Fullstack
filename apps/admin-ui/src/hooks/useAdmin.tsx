/**
 * =========================================================
 * useAdmin Hook
 * =========================================================
 * Custom hook để:
 * - Fetch thông tin admin đang đăng nhập từ backend
 * - Tự động redirect về trang chủ "/" nếu không tồn tại admin
 * - Tái sử dụng logic kiểm tra admin cho nhiều page/component
 *
 * Công nghệ sử dụng:
 * - React Query (@tanstack/react-query) để quản lý state async
 * - Axios instance có sẵn (đã config interceptor)
 * - Next.js App Router (useRouter)
 *
 * Luồng hoạt động:
 * 1. Gọi API GET /auth/api/logged-in-admin
 * 2. Backend trả về thông tin admin (nếu đã đăng nhập)
 * 3. Nếu không có admin và query đã load xong -> redirect về "/"
 * 4. Trả về admin state cho component sử dụng
 *
 * Giá trị trả về:
 * - admin: object|undefined -> thông tin admin
 * - isLoading: boolean -> trạng thái loading
 * - isError: boolean -> lỗi khi Fetch
 * - refetch: function -> gọi lại API khi cần
 *
 * Lưu ý:
 * - staleTime set 5p để tránh gọi API liên tục
 * - retry = 1 để tránh spam request khi backend lỗi
 * - Hook này chỉ nên dùng cho các page yêu cầu quyền admin
 */
import { useQuery } from "@tanstack/react-query";
import axiosInstance from "../utils/axiosInstance";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

// fetch admin data from API
const fetchAdmin = async () => {
  const response = await axiosInstance.get("/auth/api/logged-in-admin");
  return response.data.user;
};

const useAdmin = () => {
  const {
    data: admin,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["admin"],
    queryFn: fetchAdmin,
    staleTime: 1000 * 60 * 5,
    retry: 1,
  });

  const history = useRouter();

  useEffect(() => {
    if (!isLoading && !admin) {
      history.push("/");
    }
  }, [admin, isLoading, history]);

  return { admin, isLoading, isError, refetch };
};

export default useAdmin;
