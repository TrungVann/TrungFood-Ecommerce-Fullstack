"use client";
import { useQuery } from "@tanstack/react-query";
import BreadCrumbs from "apps/seller-ui/src/shared/components/breadcrumbs";
import ImagePlaceHolder from "apps/seller-ui/src/shared/components/image-placeholder";
import axiosInstance from "apps/seller-ui/src/utils/axiosInstance";
import { isProtected } from "apps/seller-ui/src/utils/protected";
import { Wand2 } from "lucide-react";
import { useRouter } from "next/navigation";
import CustomProperties from "packages/components/custom-properties";
import CustomSpecifications from "packages/components/custom-specifications";
import Input from "packages/components/input";
import RichTextEditor from "packages/components/rich-text-editor";
import SizeSelector from "packages/components/size-selector";
import React, { useEffect, useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";

interface UploadedImage {
  fileId: string;
  file_url: string;
}

const Page = () => {
  const {
    register,
    control,
    watch,
    setValue,
    getValues,
    handleSubmit,
    formState: { errors },
  } = useForm();
  const [images, setImages] = useState<(UploadedImage | null)[]>([null]);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const [slugValue, setSlugValue] = useState("");
  const [isSlugChecking, setIsSlugChecking] = useState(false);

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      if (slugValue) {
        setIsSlugChecking(true);
        axiosInstance
          .post("/product/api/slug-validator", { slug: slugValue }, isProtected)
          .then((res) => {
            if (res.data.available) {
              toast.success("Đường dẫn phụ đã có sẵn và đã được áp dụng!");
            } else {
              setValue("slug", res.data.slug);
              toast.info(
                "Đường dẫn phụ đã có người dùng. Một đường dẫn mới được đề xuất đã được áp dụng."
              );
            }
          })
          .catch(() => {
            toast.error("Lỗi khi kiểm tra Đường dẫn phụ!");
          })
          .finally(() => {
            setIsSlugChecking(false);
          });
      }
    }, 3000);

    return () => clearTimeout(delayDebounce);
  }, [slugValue]);

  const { onChange: formOnChange, ...restSlugProps } = register("slug", {
    required: "Đường dẫn phụ không được để trống!",
    pattern: {
      value: /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      message:
        "Định dạng đường dẫn phụ không hợp lệ! Chỉ sử dụng chữ thường, số và dấu gạch ngang.",
    },
    minLength: {
      value: 3,
      message: "Đường dẫn phụ phải dài ít nhất 3 ký tự.",
    },
    maxLength: {
      value: 50,
      message: "Đường dẫn phụ không được dài quá 50 ký tự.",
    },
  });

  const { data, isLoading, isError } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      try {
        const res = await axiosInstance.get("/product/api/get-categories");
        return res.data;
      } catch (error) {
        console.log(error);
      }
    },
    staleTime: 1000 * 60 * 5,
    retry: 2,
  });

  const { data: discountCodes = [], isLoading: discountLoading } = useQuery({
    queryKey: ["shop-discounts"],
    queryFn: async () => {
      const res = await axiosInstance.get("/product/api/get-discount-codes");
      return res?.data?.discount_codes || [];
    },
  });

  const categories = data?.categories || [];
  const subCategoriesData = data?.subCategories || {};

  const selectedCategory = watch("category");
  const regularPrice = watch("regular_price");

  const subcategories = useMemo(() => {
    return selectedCategory ? subCategoriesData[selectedCategory] || [] : [];
  }, [selectedCategory, subCategoriesData]);

  const onSubmit = async (data: any) => {
    try {
      setLoading(true);
      await axiosInstance.post("/product/api/create-product", data);
      router.push("/dashboard/all-products");
    } catch (error: any) {
      toast.error(error?.data?.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      className="w-full mx-auto p-8 shadow-md rounded-lg text-white"
      onSubmit={handleSubmit(onSubmit)}
    >
      {/* Heading & Breadcrumbs */}
      <h2 className="text-2xl py-2 font-semibold font-Poppins text-white">
        Tạo sự kiện
      </h2>
      <BreadCrumbs title="Tạo sự kiện" />

      {/* Content Layout */}
      <div className="py-4 w-full flex gap-6">
        {/* Left side - Image upload section */}
        <div className="md:w-[35%]">
          {images?.length > 0 && (
            <ImagePlaceHolder
              size="765 x 850"
              small={false}
              images={images}
              setImages={setImages}
              setValue={setValue}
              index={0}
            />
          )}

          <div className="grid grid-cols-2 gap-3 mt-4">
            {images.slice(1).map((_, index) => (
              <ImagePlaceHolder
                size="765 x 850"
                images={images}
                setImages={setImages}
                key={index}
                small
                setValue={setValue}
                index={index + 1}
              />
            ))}
          </div>
        </div>

        {/* Right side - form inputs */}
        <div className="md:w-[65%]">
          <div className="w-full flex gap-6">
            {/* Product Title Input */}
            <div className="w-2/4">
              <Input
                label="Tiêu đề sản phẩm *"
                placeholder="Nhập tiêu đề sản phẩm"
                {...register("title", {
                  required: "Tiêu đề không được để trống",
                })}
              />
              {errors.title && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.title.message as string}
                </p>
              )}

              <div className="mt-2">
                <Input
                  type="textarea"
                  rows={7}
                  cols={10}
                  label="Mô tả ngắn * (Tối đa 150 từ)"
                  placeholder="Nhập mô tả ngắn cho sản phẩm"
                  {...register("short_description", {
                    required: "Mô tả không được để trống",
                    validate: (value) => {
                      const wordCount = value.trim().split(/\s+/).length;
                      return (
                        wordCount <= 150 ||
                        `Mô tả không được vượt quá 150 từ (Hiện tại: ${wordCount})`
                      );
                    },
                  })}
                />
                {errors.description && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.description.message as string}
                  </p>
                )}
              </div>

              <div className="mt-2">
                <Input
                  label="Tags *"
                  placeholder="food,chicken,..."
                  {...register("tags", {
                    required:
                      "Phân tách các thẻ sản phẩm liên quan bằng dấu phẩy,",
                  })}
                />
                {errors.tags && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.tags.message as string}
                  </p>
                )}
              </div>

              <div className="mt-2">
                <label className="block font-semibold text-gray-300 mb-1">
                  Ngày bắt đầu *
                </label>
                <input
                  type="date"
                  className={`w-full border outline-none border-gray-700 bg-transparent p-2 rounded-md text-white`}
                  {...register("starting_date", {
                    required: "Ngày bắt đầu không được để trống!",
                  })}
                  min={new Date().toISOString().split("T")[0]}
                />
              </div>

              <div className="mt-2">
                <Input
                  label="Đảm bảo chất lượng *"
                  placeholder="Đổi món mới nếu không hài lòng"
                  {...register("quality_guarantee", {
                    required: "Đảm bảo chất lượng không được để trống!",
                  })}
                />
                {errors.quality_guarantee && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.quality_guarantee.message as string}
                  </p>
                )}
              </div>

              <div className="mt-2">
                <div className="relative">
                  <Input
                    label="Đường dẫn phụ *"
                    placeholder="product_slug"
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                      setSlugValue(e.target.value);
                      setValue("slug", e.target.value);
                      formOnChange(e);
                    }}
                    value={watch("slug")}
                    className="pr-10"
                    {...restSlugProps}
                  />

                  <div className="absolute w-7 h-7 flex items-center justify-center bg-blue-600 !rounded shadow top-[70%] right-3 transform -translate-y-1/2 text-white cursor-pointer hover:bg-blue-700">
                    <Wand2
                      size={16}
                      onClick={async () => {
                        const title = getValues("title");
                        if (!title) {
                          toast.error(
                            "Vui lòng nhập tiêu đề sự kiện để tạo đường dẫn phụ!"
                          );
                          return;
                        }

                        // Generate slug from title
                        const rawSlug = title
                          .toLowerCase()
                          .trim()
                          .replace(/[^a-z0-9\s-]/g, "")
                          .replace(/\s+/g, "-")
                          .replace(/-+/g, "-");

                        try {
                          // Check slug validity via API
                          const res = await axiosInstance.post(
                            "/product/api/slug-validator",
                            { slug: rawSlug }
                          );
                          const { available, suggestedSlug } = res.data;

                          if (available) {
                            setValue("slug", rawSlug);
                            toast.success("Đường dẫn phụ khả dụng!");
                          } else if (suggestedSlug) {
                            setValue("slug", suggestedSlug);
                            toast.info(
                              "Slug không khả dụng, đề xuất đường dẫn mới!"
                            );
                          } else {
                            toast.error("Slug đã tồn tại, vui lòng chỉnh sửa.");
                          }
                        } catch (err) {
                          toast.error("Failed to validate slug. Try again.");
                        }
                      }}
                    />
                  </div>
                </div>

                {errors.slug && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.slug.message as string}
                  </p>
                )}
              </div>

              <div className="mt-2">
                <Input
                  label="Thương hiệu"
                  placeholder="KFC, Lotteria,..."
                  {...register("brand")}
                />
                {errors.tags && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.tags.message as string}
                  </p>
                )}
              </div>

              <div className="mt-2">
                <CustomSpecifications control={control} errors={errors} />
              </div>

              <div className="mt-2">
                <CustomProperties control={control} errors={errors} />
              </div>

              <div className="mt-2">
                <label className="block font-semibold text-gray-300 mb-1">
                  Thanh toán khi nhận hàng *
                </label>
                <select
                  {...register("cash_on_delivery", {
                    required: "Thanh toán khi nhận hàng là bắt buộc",
                  })}
                  defaultValue="yes"
                  className="w-full border outline-none border-gray-700 bg-transparent p-2 rounded-md text-white"
                >
                  <option value="yes" className="bg-black">
                    Có
                  </option>
                  <option value="no" className="bg-black">
                    Không
                  </option>
                </select>
                {errors.cash_on_delivery && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.cash_on_delivery.message as string}
                  </p>
                )}
              </div>
            </div>
            <div className="w-2/4">
              <label className="block font-semibold text-gray-300 mb-1">
                Danh mục *
              </label>
              {isLoading ? (
                <p className="text-gray-400">Đang tải danh mục...</p>
              ) : isError ? (
                <p className="text-red-500">Tải danh mục thất bại</p>
              ) : (
                <Controller
                  name="category"
                  control={control}
                  rules={{ required: "Danh mục là bắt buộc" }}
                  render={({ field }) => (
                    <select
                      {...field}
                      className="w-full border outline-none border-gray-700 bg-transparent p-2 rounded-md text-white"
                    >
                      <option value="" className="bg-black">
                        Chọn Danh mục
                      </option>
                      {categories?.map((category: string) => (
                        <option
                          value={category}
                          key={category}
                          className="bg-black"
                        >
                          {category}
                        </option>
                      ))}
                    </select>
                  )}
                />
              )}
              {errors.category && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.category.message as string}
                </p>
              )}

              <div className="mt-2">
                <label className="block font-semibold text-gray-300 mb-1">
                  Danh mục con *
                </label>
                <Controller
                  name="subCategory"
                  control={control}
                  rules={{ required: "Danh mục con là bắt buộc" }}
                  render={({ field }) => (
                    <select
                      {...field}
                      className="w-full border outline-none border-gray-700 bg-transparent p-2 rounded-md text-white"
                    >
                      <option value="" className="bg-black">
                        Lựa chọn danh mục con
                      </option>
                      {subcategories?.map((subcategory: string) => (
                        <option
                          key={subcategory}
                          value={subcategory}
                          className="bg-black"
                        >
                          {subcategory}
                        </option>
                      ))}
                    </select>
                  )}
                />
                {errors.subcategory && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.subcategory.message as string}
                  </p>
                )}
              </div>

              <div className="mt-2">
                <label className="block font-semibold text-gray-300 mb-1">
                  Mô tả chi tiết * (Min 100 words)
                </label>
                <Controller
                  name="detailed_description"
                  control={control}
                  rules={{
                    required: "Mô tả chi tiết là bắt buộc!",
                    validate: (value) => {
                      const wordCount = value
                        ?.split(/\s+/)
                        .filter((word: string) => word).length;
                      return (
                        wordCount >= 100 || "Mô tả phải có ít nhất 100 từ!"
                      );
                    },
                  }}
                  render={({ field }) => (
                    <RichTextEditor
                      value={field.value}
                      onChange={field.onChange}
                    />
                  )}
                />
                {errors.detailed_description && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.detailed_description.message as string}
                  </p>
                )}
              </div>

              <div className="mt-2">
                <label className="block font-semibold text-gray-300 mb-1">
                  Ngày kết thúc *
                </label>
                <input
                  type="date"
                  className={`w-full border outline-none border-gray-700 bg-transparent p-2 rounded-md text-white`}
                  {...register("ending_date", {
                    required: "Ngày kết thúc là bắt buộc!",
                  })}
                  min={new Date().toISOString().split("T")[0]}
                />
              </div>

              <div className="mt-2">
                <Input
                  label="Đường dẫn video nhúng"
                  placeholder="https://www.youtube.com/embed/xyz123"
                  {...register("video_url", {
                    pattern: {
                      value:
                        /^https:\/\/(www\.)?youtube\.com\/embed\/[a-zA-Z0-9_-]+$/,
                      message:
                        "URL nhúng YouTube không hợp lệ! Vui lòng sử dụng định dạng: https://www.youtube.com/embed/xyz123",
                    },
                  })}
                />
                {errors.video_url && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.video_url.message as string}
                  </p>
                )}
              </div>

              <div className="mt-2">
                <Input
                  label="Giá gốc"
                  placeholder="10$"
                  {...register("regular_price", {
                    valueAsNumber: true,
                    min: { value: 1, message: "Giá gốc tối thiểu là 1$" },
                    validate: (value) =>
                      !isNaN(value) || "Chỉ cho phép sử nhập số",
                  })}
                />
                {errors.regular_price && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.regular_price.message as string}
                  </p>
                )}
              </div>

              <div className="mt-2">
                <Input
                  label="Gía khuyến mãi *"
                  placeholder="15$"
                  {...register("sale_price", {
                    required: "Giá khuyến mãi không được để trống",
                    valueAsNumber: true,
                    min: {
                      value: 1,
                      message: "Giá khuyến mãi tối thiểu là 1$",
                    },
                    validate: (value) => {
                      if (isNaN(value)) return "Chỉ cho phép sử nhập số";
                      if (regularPrice && value >= regularPrice) {
                        return "Giá khuyến mãi phải nhỏ hơn giá gốc";
                      }
                      return true;
                    },
                  })}
                />
                {errors.sale_price && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.sale_price.message as string}
                  </p>
                )}
              </div>

              <div className="mt-2">
                <Input
                  label="Hàng tồn *"
                  placeholder="100"
                  {...register("stock", {
                    required: "Hàng tồn không được để trống!",
                    valueAsNumber: true,
                    min: { value: 1, message: "Hàng tồn tối thiểu là 1" },
                    max: {
                      value: 1000,
                      message:
                        "Số lượng hàng tồn kho không được vượt quá 1,000",
                    },
                    validate: (value) => {
                      if (isNaN(value)) return "Chỉ cho phép sử nhập số!";
                      if (!Number.isInteger(value))
                        return "Hàng tồn phải là một số nguyên!";
                      return true;
                    },
                  })}
                />
                {errors.stock && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.stock.message as string}
                  </p>
                )}
              </div>

              <div className="mt-2">
                <SizeSelector control={control} errors={errors} />
              </div>

              <div className="mt-3">
                <label className="block font-semibold text-gray-300 mb-1">
                  Chọn mã giảm giá (tùy chọn)
                </label>

                {discountLoading ? (
                  <p className="text-gray-400">Đang tải mã giảm giá...</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {discountCodes?.map((code: any) => (
                      <button
                        key={code.id}
                        type="button"
                        className={`px-3 py-1 rounded-md text-sm font-semibold border ${
                          watch("discountCodes")?.includes(code.id)
                            ? "bg-blue-600 text-white border-blue-600"
                            : "bg-gray-800 text-gray-300 border-gray-600 hover:bg-gray-700"
                        }`}
                        onClick={() => {
                          const currentSelection = watch("discountCodes") || [];
                          const updatedSelection = currentSelection?.includes(
                            code.id
                          )
                            ? currentSelection.filter(
                                (id: string) => id !== code.id
                              )
                            : [...currentSelection, code.id];
                          setValue("discountCodes", updatedSelection);
                        }}
                      >
                        {code?.public_name} ({code.discountValue}
                        {code.discountType === "percentage" ? "%" : "$"})
                      </button>
                    ))}
                  </div>
                )}

                {discountCodes?.length === 0 && (
                  <p className="text-gray-400">
                    Không có mã giảm giá nào khả dụng!
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 flex justify-end gap-3">
        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 text-white rounded-md"
          disabled={loading}
        >
          {loading ? "Đang tạo..." : "Tạo"}
        </button>
      </div>
    </form>
  );
};

export default Page;
