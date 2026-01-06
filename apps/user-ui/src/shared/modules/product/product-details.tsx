"use client";
import {
  ChevronLeft,
  ChevronRight,
  Heart,
  MapPin,
  MessageSquareText,
  Package,
  WalletMinimal,
} from "lucide-react";
import Image from "next/image";
import React, { useEffect, useState } from "react";
import ReactImageMagnify from "react-image-magnify";
import Ratings from "../../components/ratings";
import Link from "next/link";
import { useStore } from "apps/user-ui/src/store";
import CartIcon from "apps/user-ui/src/assets/svgs/cart-icon";
import useUser from "apps/user-ui/src/hooks/useUser";
import useLocationTracking from "apps/user-ui/src/hooks/useLocationTracking";
import useDeviceTracking from "apps/user-ui/src/hooks/useDeviceTracking";
import ProductCard from "../../components/cards/product-card";
import axiosInstance from "apps/user-ui/src/utils/axiosInstance";
import { isProtected } from "apps/user-ui/src/utils/protected";
import { useRouter } from "next/navigation";

const ProductDetails = ({ productDetails }: { productDetails: any }) => {
  const { user, isLoading } = useUser();
  const location = useLocationTracking();
  const deviceInfo = useDeviceTracking();
  const router = useRouter();

  const [isChatLoading, setIsChatLoading] = useState(false);

  const [currentImage, setCurrentImage] = useState(
    productDetails?.images[0]?.url
  );
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isSelected, setIsSelected] = useState(
    productDetails?.colors?.[0] || ""
  );
  const [isSizeSelected, setIsSizeSelected] = useState(
    productDetails?.sizes?.[0] || ""
  );
  const [quantity, setQuantity] = useState(1);
  const [priceRange, setPriceRange] = useState([
    productDetails?.sale_price,
    1199,
  ]);
  const [recommendedProducts, setRecommendedProducts] = useState([]);

  const addToCart = useStore((state: any) => state.addToCart);
  const cart = useStore((state: any) => state.cart);
  const isInCart = cart.some((item: any) => item.id === productDetails.id);
  const addToWishlist = useStore((state: any) => state.addToWishlist);
  const removeFromWishlist = useStore((state: any) => state.removeFromWishlist);
  const wishlist = useStore((state: any) => state.wishlist);
  const isWishlisted = wishlist.some(
    (item: any) => item.id === productDetails.id
  );

  // Navigate to Previous Image
  const prevImage = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setCurrentImage(productDetails?.images[currentIndex - 1]?.url);
    }
  };

  // Navigate to Next Image
  const nextImage = () => {
    if (currentIndex < productDetails?.images.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setCurrentImage(productDetails?.images[currentIndex + 1]?.url);
    }
  };

  const discountPercentage = Math.round(
    ((productDetails.regular_price - productDetails.sale_price) /
      productDetails.regular_price) *
      100
  );

  const fetchFilteredProducts = async () => {
    try {
      const query = new URLSearchParams();

      query.set("priceRange", priceRange.join(","));
      query.set("page", "1");
      query.set("limit", "5");

      const res = await axiosInstance.get(
        `/product/api/get-filtered-products?${query.toString()}`
      );
      setRecommendedProducts(res.data.products);
    } catch (error) {
      console.error("Failed to fetch filtered products", error);
    }
  };

  useEffect(() => {
    fetchFilteredProducts();
  }, [priceRange]);

  const handleChat = async () => {
    if (!user) {
      router.push("/login");
      return;
    }

    if (isChatLoading) {
      return;
    }
    setIsChatLoading(true);

    console.log("Starting chat with sellerId:", productDetails?.Shop?.sellerId);

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
      setIsChatLoading(false);
    }
  };

  return (
    <div className="w-full bg-gradient-to-b from-gray-100 to-gray-50 py-6">
      <div className="w-[90%] bg-white lg:w-[80%] mx-auto pt-6 grid grid-cols-1 lg:grid-cols-[28%_44%_28%] gap-6 overflow-hidden">
        {/* left column - product images */}
        <div className="p-4">
          <div className="relative w-full">
            {/* Main Image with zoom */}
            <ReactImageMagnify
              {...{
                smallImage: {
                  alt: "product Image",
                  isFluidWidth: true,
                  src: currentImage,
                },
                largeImage: {
                  src: currentImage,
                  width: 1200,
                  height: 1200,
                },
                enlargedImageContainerDimensions: {
                  width: "150%",
                  height: "150%",
                },
                enlargedImageStyle: {
                  border: "none",
                  boxShadow: "none",
                },
                enlargedImagePosition: "right",
              }}
            />
          </div>
          {/* Thumbnail images array */}
          <div className="relative flex items-center gap-2 mt04 overflow-hidden">
            {productDetails?.images?.length > 4 && (
              <button
                className="absolute left-0 bg-white p-2 rounded-full shadow-md z-10"
                onClick={prevImage}
                disabled={currentIndex === 0}
              >
                <ChevronLeft size={24} />
              </button>
            )}
            <div className="flex gap-2 overflow-x-auto">
              {productDetails?.images?.map((img: any, index: number) => (
                <Image
                  key={index}
                  src={
                    img?.url ||
                    "https://ik.imagekit.io/fz0xzwtey/products/product-1741207782553-0_-RWfpGzfHt.jpg"
                  }
                  alt="Thumbnail"
                  width={60}
                  height={60}
                  className={`cursor-pointer border rounded-lg p-1 ${
                    currentImage === img.url
                      ? "border-blue-500"
                      : "border-gray-300"
                  }`}
                  onClick={() => {
                    setCurrentIndex(index);
                    setCurrentImage(img.url);
                  }}
                />
              ))}
            </div>
            {productDetails?.images.length > 4 && (
              <button
                className="absolute right-0 bg-white p-2 rounded-full shadow-md z-10"
                onClick={nextImage}
                disabled={currentIndex === productDetails?.images.length - 1}
              >
                <ChevronRight size={24} />
              </button>
            )}
          </div>
        </div>

        {/* Middle column - product details */}
        <div className="p-4">
          <h1 className="text-2xl font-semibold text-gray-800 leading-snug">
            {productDetails?.title}
          </h1>
          <div className="w-full flex items-center justify-between">
            <div className="flex gap-2 mt-2 text-yellow-500">
              <Ratings rating={productDetails?.rating} />
              <Link href={"#reviews"} className="text-blue-500 hover:underline">
                (0 Đánh giá)
              </Link>
            </div>

            <div>
              <Heart
                size={25}
                fill={isWishlisted ? "red" : "transparent"}
                className="cursor-pointer"
                color={isWishlisted ? "transparent" : "#777"}
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
              />
            </div>
          </div>

          <div className="py-2 border-b border-gray-200">
            <span className="text-gray-500">
              Thương hiệu:{" "}
              <span className="text-blue-500">
                {productDetails?.brand || "No Brand"}
              </span>
            </span>
          </div>

          <div className="mt-3">
            <span className="text-3xl font-bold text-orange-500">
              ${productDetails?.sale_price}
            </span>
            <div className="flex gap-2 pb-2 text-lg border-b border-b-slate-200">
              <span className="text-gray-400 line-through">
                ${productDetails?.regular_price}
              </span>
              <span className="text-gray-500">-{discountPercentage}%</span>
            </div>

            <div className="mt-2">
              <div className="flex flex-col md:flex-row items-start gap-5 mt-4">
                {/* Size Options */}
                {productDetails?.sizes?.length > 0 && (
                  <div>
                    <strong>Kích thước:</strong>
                    <div className="flex gap-2 mt-1">
                      {productDetails.sizes.map(
                        (size: string, index: number) => (
                          <button
                            key={index}
                            className={`px-4 py-1 cursor-pointer rounded-md transition ${
                              isSizeSelected === size
                                ? "bg-gray-800 text-white"
                                : "bg-gray-300 text-black"
                            }`}
                            onClick={() => setIsSizeSelected(size)}
                          >
                            {size}
                          </button>
                        )
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-6">
              <div className="flex items-center gap-3">
                <div className="flex items-center rounded-md">
                  <div className="flex items-center border border-orange-200 rounded-lg overflow-hidden bg-white">
                    <button
                      onClick={() =>
                        setQuantity((prev) => Math.max(1, prev - 1))
                      }
                      className="w-9 h-9 text-orange-500 hover:bg-orange-50 transition"
                    >
                      −
                    </button>

                    <span className="w-10 text-center text-sm font-semibold text-gray-800">
                      {quantity}
                    </span>

                    <button
                      onClick={() => setQuantity((prev) => prev + 1)}
                      className="w-9 h-9 text-orange-500 hover:bg-orange-50 transition"
                    >
                      +
                    </button>
                  </div>
                </div>
                {productDetails?.stock > 0 ? (
                  <span className="text-green-600 font-semibold">
                    Còn hàng{" "}
                    <span className="text-gray-500 font-medium">
                      (Hàng tồn kho {productDetails?.stock})
                    </span>
                  </span>
                ) : (
                  <span className="text-red-600 font-semibold">Hết hàng</span>
                )}
              </div>

              <button
                className={`mt-6 flex items-center justify-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold text-white bg-gradient-to-r from-orange-500 to-red-500 shadow-md hover:shadow-xl transition-all active:scale-[0.97] ${
                  isInCart ? "cursor-not-allowed" : "cursor-pointer"
                }`}
                disabled={isInCart || productDetails?.stock === 0}
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
              >
                <CartIcon size={18} />
                Thêm vào giỏ hàng
              </button>
            </div>
          </div>
        </div>

        {/* right column - seller information */}
        <div className="bg-[#fafafa] -mt-6">
          <div className="mb-1 p-3 border-b border-b-gray-100">
            <span className="text-sm font-medium text-gray-600">
              Tùy chọn giao hàng
            </span>
            <div className="flex items-center text-gray-600 gap-1">
              <MapPin size={18} className="text-orange-500 shrink-0" />
              <span className="text-lg font-normal">
                {location?.city + ", " + location?.country}
              </span>
            </div>
          </div>

          <div className="mb-1 px-3 pb-1 border-b border-b-gray-100">
            <span className="text-sm font-medium text-gray-600">
              An toàn Thực phẩm & Chính sách
            </span>
            <div className="flex items-center text-gray-600 gap-1">
              <Package size={18} className="text-green-500 shrink-0" />
              <span className="text-base font-normal">
                Chế biến mới • Giao hàng trong ngày
              </span>
            </div>
            <div className="flex items-center py-2 text-gray-600 gap-1">
              <WalletMinimal size={18} className="text-orange-500 shrink-0" />
              <span className="text-base font-normal">
                Hoàn tiền nếu thực phẩm bị hỏng hoặc sai
              </span>
            </div>
          </div>

          <div className="px-3 py-1">
            <div className="w-[85%] rounded-lg">
              {/* Sold by section */}
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-sm text-gray-600 font-light">
                    Người bán
                  </span>
                  <span className="block max-w-[150px] truncate font-medium text-lg">
                    {productDetails?.Shop?.name}
                  </span>
                </div>
                <Link
                  href={"#"}
                  onClick={() => handleChat()}
                  className="text-blue-500 text-sm flex items-center gap-1"
                >
                  <MessageSquareText />
                  Trò chuyện ngay
                </Link>
              </div>

              {/* Seller perfomance stats */}
              <div className="grid grid-cols-3 gap-2 border-t border-t-gray-200 mt-3 pt-3">
                <div>
                  <p className="text-[12px] text-gray-500">
                    Tỷ lệ Đánh giá Tích cực của Người bán
                  </p>
                  <p className="text-lg font-semibold">88%</p>
                </div>
                <div>
                  <p className="text-[12px] text-gray-500">
                    Giao hàng đúng giờ
                  </p>
                  <p className="text-lg font-semibold">100%</p>
                </div>
                <div>
                  <p className="text-[12px] text-gray-500">
                    Tỷ lệ Phản hồi Tin nhắn
                  </p>
                  <p className="text-lg font-semibold">100%</p>
                </div>
              </div>

              {/* Go to Store */}
              <div className="mt-5 pt-3 border-t border-gray-200">
                <Link
                  href={`/shop/${productDetails?.Shop.id}`}
                  className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-orange-600 transition-all hover:bg-orange-50 hover:text-orange-700 active:scale-95"
                >
                  Đi đến Cửa hàng →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="w-[92%] lg:w-[80%] mx-auto mt-6">
        <div className="rounded-2xl bg-gradient-to-br from-white to-gray-50 p-6 shadow-sm">
          {/* Header */}
          <div className="mb-5 border-b border-gray-200 pb-4">
            <h3 className="text-xl font-semibold text-gray-900">
              Chi tiết sản phẩm
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              {productDetails?.title}
            </p>
          </div>

          {/* Content */}
          <div
            className="prose prose-sm sm:prose-base prose-gray max-w-none prose-headings:text-gray-900 prose-p:text-gray-700 prose-li:text-gray-700 prose-strong:text-gray-900 prose-a:text-orange-600 hover:prose-a:text-orange-700 prose-img:rounded-xl prose-img:shadow-sm"
            dangerouslySetInnerHTML={{
              __html: productDetails?.detailed_description,
            }}
          />
        </div>
      </div>

      <div className="w-[92%] lg:w-[80%] mx-auto">
        <div className="mt-6 min-h-[50vh] rounded-2xl bg-gradient-to-br from-white to-gray-50 p-6 shadow-sm">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-gray-200 pb-4">
            <h3 className="text-xl font-semibold text-gray-900">
              Đánh giá & Nhận xét
            </h3>

            <span className="text-sm text-gray-500">
              {productDetails?.title}
            </span>
          </div>

          {/* Empty state */}
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-orange-50">
              ⭐
            </div>

            <h4 className="text-lg font-semibold text-gray-800">
              Chưa có đánh giá nào
            </h4>

            <p className="mt-2 max-w-md text-sm text-gray-500">
              Hãy là người đầu tiên đánh giá sản phẩm này và giúp khách hàng
              khác đưa ra lựa chọn tốt hơn.
            </p>

            <button className="mt-6 rounded-xl bg-orange-500 px-6 py-2.5 text-sm font-semibold text-white shadow-md transition-all hover:bg-orange-600 hover:shadow-lg active:scale-95">
              Viết đánh giá
            </button>
          </div>
        </div>
      </div>

      <div className="w-[90%] lg:w-[80%] mx-auto">
        <div className="w-full h-full my-5 p-5">
          <h3 className="text-xl font-semibold mb-2">Bạn cũng có thể thích</h3>
          <div className="m-auto grid grid-cols-1 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5">
            {recommendedProducts?.filter((p: any) => !p?.isDeleted).map((i: any) => (
              <ProductCard key={i.id} product={i} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetails;
