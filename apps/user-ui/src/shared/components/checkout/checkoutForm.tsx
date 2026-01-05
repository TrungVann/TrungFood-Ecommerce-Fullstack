import {
  PaymentElement,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";
import { CheckCircle, Loader2, XCircle } from "lucide-react";
import React, { useState } from "react";

const CheckoutForm = ({
  clientSecret,
  cartItems,
  coupon,
  sessionId,
}: {
  clientSecret: string;
  cartItems: any[];
  coupon: any;
  sessionId: string | null;
}) => {
  const stripe = useStripe();
  const elements = useElements();

  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<"success" | "failed" | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    if (!stripe || !elements) {
      setLoading(false);
      return;
    }

    console.log("Confirming payment with sessionId:", sessionId);
    const result = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/payment-success?sessionId=${sessionId}`,
      },
    });

    console.log("Stripe confirm payment result:", result);
    if (result.error) {
      console.error("Payment error:", result.error);
      setStatus("failed");
      setErrorMsg(result.error.message || "Có lỗi xảy ra!.");
    } else {
      console.log("Payment success");
      setStatus("success");
    }

    setLoading(false);
  };

  const total = cartItems.reduce(
    (sum, item) => sum + item.sale_price * item.quantity,
    0
  );

  console.log(coupon);

  return (
    <div className="flex justify-center items-center min-h-[80vh] px-4 my-10">
      <form
        className="bg-white w-full max-w-lg p-8 rounded-md shadow space-y-6"
        onSubmit={handleSubmit}
      >
        <h2 className="text-3xl font-bold text-center mb-2">
          Thanh toán an toàn
        </h2>

        {/* Dynamic Order Summary */}
        <div className="bg-gray-100 p-4 rounded-md text-sm text-gray-700 space-y-2 max-h-52 overflow-y-auto">
          {cartItems.map((item, idx) => (
            <div key={idx} className="flex justify-between text-sm pb-1">
              <span>
                {item.quantity} × {item.title}
              </span>
              <span>${(item.quantity * item.sale_price).toFixed(2)}</span>
            </div>
          ))}

          <div className="flex justify-between font-semibold pt-2 border-t border-t-gray-300 mt-2">
            {!!coupon?.discountAmount && (
              <>
                <span>Giảm giá</span>
                <span className="text-green-600">
                  ${coupon?.discountAmount?.toFixed(2)}
                </span>
              </>
            )}
          </div>

          <div className="flex justify-between font-semibold mt-2">
            <span>Tổng</span>
            <span>${(total - (coupon?.discountAmount || 0)).toFixed(2)}</span>
          </div>
        </div>

        <PaymentElement />
        <button
          type="submit"
          disabled={!stripe || loading}
          className="w-full bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700 transition flex items-center justify-center gap-2 disabled:opacity-60"
        >
          {loading && <Loader2 className="animate-spin w-5 h-5" />}
          {loading ? "Đang xử lý..." : "Thanh toán ngay"}
        </button>

        {errorMsg && (
          <div className="flex items-center gap-2 text-red-600 text-sm justify-center">
            <XCircle className="w-5 h-5" />
            {errorMsg}
          </div>
        )}

        {status === "success" && (
          <div className="flex items-center gap-2 text-green-600 text-sm justify-center">
            <CheckCircle className="w-5 h-5" />
            Thanh toán thành công!
          </div>
        )}

        {status === "failed" && (
          <div className="flex items-center gap-2 text-red-600 text-sm justify-center">
            <XCircle className="w-5 h-5" />
            Thanh toán thất bại. Vui lòng thử lại!.
          </div>
        )}
      </form>
    </div>
  );
};

export default CheckoutForm;
