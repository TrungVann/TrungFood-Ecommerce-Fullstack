import Image from "next/image";
import Link from "next/link";
import React, { useState } from "react";
import Ratings from "../ratings";
import { Heart, MapPin, X, MessageCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import CartIcon from "apps/user-ui/src/assets/svgs/cart-icon";
import { useStore } from "apps/user-ui/src/store";
import useUser from "apps/user-ui/src/hooks/useUser";
import useLocationTracking from "apps/user-ui/src/hooks/useLocationTracking";
import useDeviceTracking from "apps/user-ui/src/hooks/useDeviceTracking";
import axiosInstance from "apps/user-ui/src/utils/axiosInstance";
import { isProtected } from "apps/user-ui/src/utils/protected";

const ProductDetailsCard = ({
  productDetails,
  setOpen,
}: {
  productDetails: any;
  setOpen: (open: boolean) => void;
}) => {
  const [activeImage, setActiveImage] = useState(0);
  const [isSizeSelected, setIsSizeSelected] = useState(
    productDetails?.sizes?.[0] || ""
  );
  const [quantity, setQuantity] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  const addToCart = useStore((state: any) => state.addToCart);
  const cart = useStore((state: any) => state.cart);
  const isInCart = cart.some((item: any) => item.id === productDetails.id);
  const addToWishlist = useStore((state: any) => state.addToWishlist);
  const removeFromWishlist = useStore((state: any) => state.removeFromWishlist);
  const wishlist = useStore((state: any) => state.wishlist);
  const isWishlisted = wishlist.some(
    (item: any) => item.id === productDetails.id
  );

  const USD_TO_VND_RATE = 26000; // 1 USD = 26000 VND

  const { user } = useUser();
  const location = useLocationTracking();
  const deviceInfo = useDeviceTracking();

  const estimatedDelivery = new Date();
  estimatedDelivery.setDate(estimatedDelivery.getDate() + 5);

  const router = useRouter();

  const handleChat = async () => {
    if (!user) {
      router.push("/login");
      return;
    }

    if (isLoading) {
      return;
    }
    setIsLoading(true);

    try {
      const res = await axiosInstance.post(
        "/chatting/api/create-user-conversationGroup",
        { sellerId: productDetails?.Shop?.sellerId },
        isProtected
      );
      console.log("Conversation created:", res.data);
      router.push(`/inbox?conversationId=${res.data.conversation.id}`);
    } catch (error) {
      console.error("Error creating conversation:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="fixed flex items-center justify-center top-0 left-0 h-screen w-full bg-black/40 z-50 p-4"
      onClick={() => setOpen(false)}
    >
      <div
        className="w-full max-w-4xl max-h-[80vh] overflow-y-auto bg-white shadow-2xl rounded-xl relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          className="absolute top-3 right-3 z-10 cursor-pointer bg-gray-100 hover:bg-gray-200 rounded-full p-1.5 transition-colors"
          onClick={() => setOpen(false)}
        >
          <X size={18} />
        </button>

        <div className="flex flex-col lg:flex-row">
          {/* Left Side - Images */}
          <div className="w-full lg:w-[45%] p-6 bg-gray-50">
            <div className="sticky top-6">
              <Image
                src={productDetails?.images?.[activeImage]?.url}
                alt={productDetails?.images?.[activeImage].url}
                width={400}
                height={400}
                className="w-full h-80 rounded-lg object-contain bg-white"
              />
              {/* Thumbnails */}
              <div className="flex gap-2 mt-3 overflow-x-auto pb-2">
                {productDetails?.images?.map((img: any, index: number) => (
                  <div
                    key={index}
                    className={`cursor-pointer border-2 rounded-md flex-shrink-0 transition-all ${
                      activeImage === index
                        ? "border-orange-500"
                        : "border-transparent hover:border-gray-300"
                    }`}
                    onClick={() => setActiveImage(index)}
                  >
                    <Image
                      src={img?.url}
                      alt={`Thumbnail ${index}`}
                      width={60}
                      height={60}
                      className="rounded-md object-cover w-[60px] h-[60px]"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Side - Details */}
          <div className="w-full lg:w-[55%] p-6">
            {/* Product Title */}
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {productDetails?.title}
            </h3>

            {/* Price Section */}
            <div className="flex items-center gap-3 mb-3">
              <span className="text-2xl font-bold text-orange-600">
                {(productDetails?.sale_price * USD_TO_VND_RATE)?.toLocaleString(
                  "vi-VN"
                )}
                ₫
              </span>
              {productDetails?.regular_price && (
                <span className="text-base text-gray-400 line-through">
                  {(
                    productDetails.regular_price * USD_TO_VND_RATE
                  )?.toLocaleString("vi-VN")}
                  ₫
                </span>
              )}
              {productDetails?.regular_price && (
                <span className="text-xs bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full font-medium">
                  -
                  {Math.round(
                    ((productDetails.regular_price -
                      productDetails.sale_price) /
                      productDetails.regular_price) *
                      100
                  )}
                  %
                </span>
              )}
            </div>

            {/* Stock Status */}
            <div className="mb-3">
              {productDetails?.stock > 0 ? (
                <span className="text-sm text-green-600 font-medium">
                  ✓ Còn hàng
                </span>
              ) : (
                <span className="text-sm text-red-600 font-medium">
                  ✗ Hết hàng
                </span>
              )}
            </div>

            {/* Description */}
            <p className="text-sm text-gray-600 mb-4 line-clamp-3">
              {productDetails?.short_description}
            </p>

            {/* Brand */}
            {productDetails?.brand && (
              <p className="text-sm mb-3">
                <span className="text-gray-500">Thương hiệu:</span>{" "}
                <span className="font-medium">{productDetails.brand}</span>
              </p>
            )}

            {/* Size Selection */}
            {productDetails?.sizes?.length > 0 && (
              <div className="mb-4">
                <p className="text-sm font-medium text-gray-700 mb-2">
                  Kích thước:
                </p>
                <div className="flex gap-2 flex-wrap">
                  {productDetails.sizes.map((size: string, index: number) => (
                    <button
                      key={index}
                      className={`px-3 py-1.5 text-sm cursor-pointer rounded-md transition-all ${
                        isSizeSelected === size
                          ? "bg-orange-500 text-white shadow-sm"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                      onClick={() => setIsSizeSelected(size)}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quantity & Actions */}
            <div className="flex items-center gap-3 mb-4">
              <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden">
                <button
                  className="px-3 py-1.5 cursor-pointer bg-gray-50 hover:bg-gray-100 text-gray-700 font-medium transition-colors"
                  onClick={() => setQuantity((prev) => Math.max(1, prev - 1))}
                >
                  -
                </button>
                <span className="px-4 py-1.5 bg-white text-sm font-medium min-w-[50px] text-center">
                  {quantity}
                </span>
                <button
                  className="px-3 py-1.5 cursor-pointer bg-gray-50 hover:bg-gray-100 text-gray-700 font-medium transition-colors"
                  onClick={() => setQuantity((prev) => prev + 1)}
                >
                  +
                </button>
              </div>

              <button
                disabled={isInCart}
                onClick={() => {
                  if (!user) {
                    router.push("/login");
                    return;
                  }
                  addToCart(
                    {
                      ...productDetails,
                      quantity,
                      selectedOptions: {
                        size: isSizeSelected,
                      },
                    },
                    user,
                    location,
                    deviceInfo
                  );
                }}
                className={`flex items-center gap-2 px-4 py-2 text-sm bg-orange-500 hover:bg-orange-600 text-white font-medium rounded-lg transition-all flex-1 justify-center ${
                  isInCart ? "cursor-not-allowed opacity-50" : "cursor-pointer"
                }`}
              >
                <CartIcon size={16} />
                {isInCart ? "Đã thêm" : "Thêm vào giỏ"}
              </button>

              <button
                className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                onClick={() => {
                  if (!user) {
                    router.push("/login");
                    return;
                  }
                  isWishlisted
                    ? removeFromWishlist(
                        productDetails.id,
                        user,
                        location,
                        deviceInfo
                      )
                    : addToWishlist(
                        {
                          ...productDetails,
                          quantity,
                          selectedOptions: {
                            size: isSizeSelected,
                          },
                        },
                        user,
                        location,
                        deviceInfo
                      );
                }}
              >
                <Heart
                  size={20}
                  fill={isWishlisted ? "#ef4444" : "transparent"}
                  color={isWishlisted ? "#ef4444" : "#6b7280"}
                />
              </button>
            </div>

            {/* Delivery Info */}
            <div className="mb-4 p-3 bg-orange-50 rounded-lg">
              <p className="text-xs text-gray-600">
                🚚 Dự kiến giao hàng:{" "}
                <span className="font-medium text-gray-900">
                  {estimatedDelivery.toLocaleDateString("vi-VN")}
                </span>
              </p>
            </div>

            {/* Seller Info */}
            <div className="border-t pt-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Image
                    src={productDetails?.Shop?.avatar}
                    alt="Shop Logo"
                    width={45}
                    height={45}
                    className="rounded-full w-[45px] h-[45px] object-cover"
                  />
                  <div>
                    <Link
                      href={`/shop/${productDetails?.Shop?.id}`}
                      className="text-sm font-medium hover:text-orange-600 transition-colors"
                    >
                      {productDetails?.Shop?.name}
                    </Link>
                    <div className="flex items-center gap-2 mt-0.5">
                      <Ratings rating={productDetails?.Shop?.ratings} />
                    </div>
                    {productDetails?.Shop?.address && (
                      <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                        <MapPin size={12} />
                        {productDetails.Shop.address}
                      </p>
                    )}
                  </div>
                </div>

                <button
                  className="flex cursor-pointer items-center gap-1.5 px-3 py-1.5 text-sm bg-orange-500 hover:bg-orange-600 text-white font-medium rounded-lg transition-all"
                  onClick={handleChat}
                  disabled={isLoading}
                >
                  <MessageCircle size={16} />
                  Nhắn tin
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetailsCard;
