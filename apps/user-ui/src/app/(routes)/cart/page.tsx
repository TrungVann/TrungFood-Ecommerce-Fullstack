"use client";
import { useQuery } from "@tanstack/react-query";
import useDeviceTracking from "apps/user-ui/src/hooks/useDeviceTracking";
import useLocationTracking from "apps/user-ui/src/hooks/useLocationTracking";
import useUser from "apps/user-ui/src/hooks/useUser";
import { useStore } from "apps/user-ui/src/store";
import axiosInstance from "apps/user-ui/src/utils/axiosInstance";
import { Loader2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import { toast } from "sonner";

const CartPage = () => {
  const router = useRouter();
  const { user } = useUser();
  const location = useLocationTracking();
  const deviceInfo = useDeviceTracking();
  const cart = useStore((state: any) => state.cart);
  const [discountedProductId, setDiscountedProductId] = useState("");
  const [discountPercent, setDiscountPercent] = useState(0);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [couponCode, setCouponCode] = useState("");
  const [selectedAddressId, setSelectedAddressId] = useState("");
  const [error, setError] = useState("");
  const [storedCouponCode, setStoredCouponCode] = useState("");

  const USD_TO_VND_RATE = 26000; // 1 USD = 26000 VND

  const couponCodeApplyHandler = async () => {
    setError("");

    if (!couponCode.trim()) {
      setError("Nhập một mã giảm giá hợp lệ!");
      return;
    }

    try {
      const res = await axiosInstance.put("/order/api/verify-coupon", {
        couponCode: couponCode.trim(),
        cart,
      });

      if (res.data.valid) {
        setStoredCouponCode(couponCode.trim());
        setDiscountAmount(parseFloat(res.data.discountAmount));
        setDiscountPercent(res.data.discount);
        setDiscountedProductId(res.data.discountedProductId);
        setCouponCode("");
      } else {
        setDiscountAmount(0);
        setDiscountPercent(0);
        setDiscountedProductId("");
        setError(
          res.data.message ||
            "Mã giảm giá không hợp lệ cho bất kỳ mặt hàng nào trong giỏ hàng."
        );
      }
    } catch (error: any) {
      setDiscountAmount(0);
      setDiscountPercent(0);
      setDiscountedProductId("");
      setError(error?.response?.data?.message);
    }
  };

  const createPaymentSession = async () => {
    if (addresses?.length === 0) {
      toast.error("Hãy đặt địa chị giao hàng của bạn trước khi đặt hàng!");
      return;
    }
    console.log("Cart data before sending:", cart);
    console.log("Selected address ID:", selectedAddressId);
    console.log("Coupon data:", {
      code: storedCouponCode,
      discountAmount,
      discountPercent,
      discountedProductId,
    });
    setLoading(true);
    try {
      const res = await axiosInstance.post(
        "/order/api/create-payment-session",
        {
          cart,
          selectedAddressId,
          coupon: {
            code: storedCouponCode,
            discountAmount,
            discountPercent,
            discountedProductId,
          },
        }
      );
      const sessionId = res.data.sessionId;
      console.log("Session ID received:", sessionId);
      router.push(`/checkout?sessionId=${sessionId}`);
    } catch (error) {
      console.error("Error creating payment session:", error);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const removeFromCart = useStore((state: any) => state.removeFromCart);
  const [loading, setLoading] = useState(false);

  const increaseQuantity = (id: string) => {
    useStore.setState((state: any) => ({
      cart: state.cart.map((item: any) =>
        item.id === id ? { ...item, quantity: (item.quantity ?? 1) + 1 } : item
      ),
    }));
  };

  const decreaseQuantity = (id: string) => {
    useStore.setState((state: any) => ({
      cart: state.cart.map((item: any) =>
        item.id === id && item.quantity > 1
          ? { ...item, quantity: item.quantity - 1 }
          : item
      ),
    }));
  };

  const removeItem = (id: string) => {
    removeFromCart(id, user, location, deviceInfo);
  };

  const subtotal = cart.reduce(
    (total: number, item: any) => total + item.quantity * item.sale_price,
    0
  );

  // Get addresses
  const { data: addresses = [] } = useQuery<any[], Error>({
    queryKey: ["shipping-addresses"],
    queryFn: async () => {
      const res = await axiosInstance.get("/auth/api/shipping-addresses");
      return res.data.addresses;
    },
  });

  useEffect(() => {
    if (addresses.length > 0 && !selectedAddressId) {
      const defaultAddr = addresses.find((addr) => addr.isDefault);
      if (defaultAddr) {
        setSelectedAddressId(defaultAddr.id);
      }
    }
  }, [addresses, selectedAddressId]);

  return (
    <div className="w-full bg-white">
      <div className="md:w-[80%] w-[95%] mx-auto min-h-screen">
        <div className="pb-[50px]">
          <h1 className="md:pt-[50px] font-medium text-[44px] leading-[1] mb-[16px] font-jost">
            Giỏ hàng
          </h1>
          <Link href={"/"} className="text-[#55585b] hover:underline">
            Trang chủ
          </Link>
          <span className="inline-block p-[1.5px] mx-1 bg-[#a8acb0] rounded-full"></span>
          <span className="text-[#55585b]">Giỏ hàng</span>
        </div>

        {cart.length === 0 ? (
          <div className="w-full py-20 flex flex-col items-center justify-center">
            <Image
              src="/cart-empty.png"
              alt="No shops found"
              width={700}
              height={700}
              className="opacity-80"
            />
          </div>
        ) : (
          <div className="lg:flex items-start gap-10">
            <table className="w-full lg:w-[70%] border-collapse">
              <thead className="bg-[#f1f3f4] rounded">
                <tr>
                  <th className="py-3 text-left pl-6 align-middle">Sản phẩm</th>
                  <th className="py-3 text-center align-middle">Giá</th>
                  <th className="py-3 text-center align-middle">Số lượng</th>
                  <th className="py-3 text-center align-middle"></th>
                </tr>
              </thead>
              <tbody>
                {cart?.map((item: any) => (
                  <tr key={item.id} className="border-b border-b-[#0000000e]">
                    <td className="flex items-center gap-4 p-4">
                      <Image
                        src={item?.images[0]?.url}
                        alt={item.title}
                        width={80}
                        height={80}
                        className="rounded"
                      />
                      <div className="flex flex-col">
                        <span className="font-medium">{item.title}</span>
                        {item?.selectedOptions && (
                          <div className="text-sm text-gray-500">
                            {item?.selectedOptions.size && (
                              <span className="ml-2">
                                Kích thước: {item?.selectedOptions?.size}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 text-lg text-center">
                      {item?.id === discountedProductId ? (
                        <div className="flex flex-col items-center">
                          <span className="line-through text-gray-500 text-sm">
                            ${item.sale_price.toFixed(2)}
                          </span>{" "}
                          <span className="text-green-600 font-semibold">
                            $
                            {(
                              (item.sale_price * (100 - discountPercent)) /
                              100
                            ).toFixed(2)}
                          </span>
                          <span className="text-xs text-green-700 bg-green-100 px-2 py-[2px] rounded-full mt-1">
                            Đã áp dụng giảm giá
                          </span>
                        </div>
                      ) : (
                        <span>
                          {" "}
                          {Math.round(
                            item?.sale_price * USD_TO_VND_RATE
                          ).toLocaleString("vi-VN")}{" "}
                          ₫
                        </span>
                      )}
                    </td>
                    <td>
                      <div className="flex justify-center items-center border border-gray-200 rounded-[20px] w-[100px] mx-auto p-[6px]">
                        <button
                          className="text-[#000] cursor-pointer text-xl"
                          onClick={() => decreaseQuantity(item.id)}
                        >
                          -
                        </button>
                        <span className="px-4">{item.quantity}</span>
                        <button
                          className="text-[#000] cursor-pointer text-xl"
                          onClick={() => increaseQuantity(item.id)}
                        >
                          +
                        </button>
                      </div>
                    </td>
                    <td className="text-center">
                      <button
                        className="text-[#818487] cursor-pointer hover:text-[#ff1826] transition duration-200"
                        onClick={() => removeItem(item?.id)}
                      >
                        ✕ Xóa
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="p-6 shadow-md w-full lg:w-[30%] bg-[#f9f9ff9] rounded-lg">
              {discountAmount > 0 && (
                <div className="flex justify-between items-center text-[#010f1c] text-base font-medium pb-1">
                  <span className="font-jost">
                    Giảm giá ({discountPercent}%)
                  </span>
                  <span className="text-green-600">
                    -{" "}
                    {Math.round(
                      discountAmount * USD_TO_VND_RATE
                    ).toLocaleString("vi-VN")}{" "}
                    ₫
                  </span>
                </div>
              )}

              <div className="flex justify-between items-center text-[#010f1c] text-[20px] font-[550] pb-3">
                <span className="font-jost">Tổng tiền</span>
                <span>
                  {(
                    (subtotal - discountAmount) *
                    USD_TO_VND_RATE
                  ).toLocaleString("vi-VN")}{" "}
                  ₫
                </span>
              </div>
              <hr className="my-4 text-slate-200" />

              <div className="mb-4">
                <h4 className="mb-[7px] font-[500] text-[15px]">
                  Có mã giảm giá?
                </h4>
                <div className="flex">
                  <input
                    type="text"
                    value={couponCode}
                    onChange={(e: any) => setCouponCode(e.target.value)}
                    placeholder="Nhập mã giảm giá"
                    className="w-full p-2 border border-gray-200 rounded-l-md focus:outline-none focus:border-blue-500"
                  />
                  <button
                    className="bg-orange-500 cursor-pointer text-white px-4 rounded-r-md hover:bg-orange-600 transition-all"
                    onClick={() => couponCodeApplyHandler()}
                  >
                    Áp dụng
                  </button>
                </div>
                {error && <p className="text-sm pt-2 text-red-500">{error}</p>}
                <hr className="my-4 text-slate-200" />

                <div className="mb-4">
                  <h4 className="mb-[7px] font-medium text-[15px]">
                    Chọn địa chỉ giao hàng của bạn
                  </h4>
                  {addresses?.length !== 0 && (
                    <select
                      className="w-full p-2 border border-gray-200 rounded-md focus:outline-none focus:border-blue-500"
                      value={selectedAddressId}
                      onChange={(e: any) =>
                        setSelectedAddressId(e.target.value)
                      }
                    >
                      {addresses?.map((address: any) => (
                        <option key={address.id} value={address.id}>
                          {address.label} — {address.city}, {address.country}
                        </option>
                      ))}
                    </select>
                  )}
                  {addresses?.length === 0 && (
                    <p className="text-sm text-slate-800">
                      Hãy thêm địa chỉ giao hàng trong tài khoản của bạn trước
                      khi đặt hàng!
                    </p>
                  )}
                </div>
                <hr className="my-4 text-slate-200" />

                <div className="mb-4">
                  <h4 className="mb-[7px] font-[500] text-[15px]">
                    Chọn hình thức thanh toán
                  </h4>
                  <select className="w-full p-2 border border-gray-200 rounded-md focus:outline-none focus:border-blue-500">
                    <option value="credit_card">Thanh toán trực tuyến</option>
                    <option value="cash_on_delivery">
                      Thanh toán khi nhận hàng
                    </option>
                  </select>
                </div>
                <hr className="my-4 text-slate-200" />

                <div className="flex justify-between items-center text-[#010f1c] text-[20px] font-[550] pb-3">
                  <span className="font-jost">Tổng</span>
                  <span>
                    {(
                      (subtotal - discountAmount) *
                      USD_TO_VND_RATE
                    ).toLocaleString("vi-VN")}{" "}
                    ₫
                  </span>
                </div>

                <button
                  onClick={createPaymentSession}
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 cursor-pointer mt-4 py-3 bg-orange-500 text-white hover:bg-orange-600 transition-all rounded-lg"
                >
                  {loading && <Loader2 className="animate-spin w-5 h-5" />}
                  {loading ? "Đang chuyển hướng..." : "Tiến hành thanh toán"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CartPage;
