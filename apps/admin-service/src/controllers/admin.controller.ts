/**
 * =====================================================================
 * ADMIN CONTROLLER
 * =====================================================================
 * File này chứa các controller phục vụ cho:
 * - Admin dashboard
 * - Quản lý dữ liệu tổng hợp (products, users, sellers, notifications)
 *
 * Pattern: Route -> Controller -> Prisma -> Database
 *
 * Lưu ý:
 * - Không xử lý auth ở đây (đã có middleware)
 * - Không chứa business logic phức tạp
 * - Lỗi được forward sang Global Error Handler
 */

import { ValidationError } from "@packages/error-handler";
import prisma from "@packages/libs/prisma";
import { NextFunction, Request, Response } from "express";

/**
 * ===== GET ALL PRODUCT =====
 * Mục đích: Lấy danh sách sản phẩm thường (không phải event)
 * Điều kiện: starting_date === null -> product thường
 * Hỗ trợ:
 * + Pagination
 * + Sorting
 * + Select fields để tránh overfetch
 */
export const getAllProducts = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    //Pagination params
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    //Query song song: data + total count
    const [products, totalProducts] = await Promise.all([
      prisma.products.findMany({
        where: {
          //product thường (không phải event)
          starting_date: null,
        },
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          title: true,
          slug: true,
          sale_price: true,
          stock: true,
          createdAt: true,
          ratings: true,
          category: true,
          //Lấy 1 ảnh đại diện
          images: {
            select: { url: true },
            take: 1,
          },
          //Thông tin shop cơ bản
          Shop: {
            select: { name: true },
          },
        },
      }),
      prisma.products.count({
        where: {
          starting_date: null,
        },
      }),
    ]);

    const totalPages = Math.ceil(totalProducts / limit);

    res.status(200).json({
      success: true,
      data: products,
      meta: {
        totalProducts,
        currentPage: page,
        totalPages,
      },
    });
  } catch (error) {
    //Forward error sang Global Error Handler
    next(error);
  }
};

/**
 * ===== GET ALL EVENTS =====
 * Mục đích:
 * - Lấy danh sách product dạng event/flash sale
 * Điều kiện:
 * - starting_date !== null
 * Khác với product thường:
 * - có starting_date & ending_date
 */

export const getAllEvents = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    const [events, totalEvents] = await Promise.all([
      prisma.products.findMany({
        where: {
          //Event product
          starting_date: {
            not: null,
          },
        },
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          title: true,
          slug: true,
          sale_price: true,
          stock: true,
          createdAt: true,
          ratings: true,
          category: true,
          starting_date: true,
          ending_date: true,
          images: {
            select: { url: true },
            take: 1,
          },
          Shop: {
            select: { name: true },
          },
        },
      }),
      prisma.products.count({
        where: {
          starting_date: {
            not: null,
          },
        },
      }),
    ]);

    const totalPages = Math.ceil(totalEvents / limit);

    res.status(200).json({
      success: true,
      data: events,
      meta: {
        totalEvents,
        currentPage: page,
        totalPages,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * ===== GET ALL ADMINS =====
 * Mục đích:
 * - Lấy danh sách user có role = admin
 * Dùng cho:
 * - Admin management
 */
export const getAllAdmins = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const admins = await prisma.users.findMany({
      where: {
        role: "admin",
      },
    });

    res.status(200).json({
      success: true,
      admins,
    });
  } catch (error) {
    next(error);
  }
};

/**===== ADD NEW ADMIN =====
 * Mục đích:
 * - Nâng quyền user -> admin
 * Flow:
 * - Check user tồn tại
 * - Update Role
 */
export const addNewAdmin = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email, role } = req.body;

    //Kiểm tra user tồn tại
    const isUser = await prisma.users.findUnique({ where: { email } });
    if (!isUser) {
      //Custom validation error
      return next(new ValidationError("Something went wrong!"));
    }

    //Cập nhật vai trò
    const updateRole = await prisma.users.update({
      where: { email },
      data: {
        role,
      },
    });

    res.status(201).json({
      success: true,
      updateRole,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * ===== GET SITE CUSTOMIZATION =====
 * Mục đích:
 * - Lấy cấu hình giao diện website
 * Bao gồm:
 * - Categories
 * - SubCategories
 * - Logo
 * - Banner
 * Chỉ có 1 bản ghi global
 */
export const getAllCustomizations = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const config = await prisma.site_config.findFirst();

    return res.status(200).json({
      categories: config?.categories || [],
      subCategories: config?.subCategories || {},
      logo: config?.logo || null,
      banner: config?.banner || null,
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * ===== UPDATE SITE CONFIG =====
 * Mục đích:
 * - Cập nhật categories và subCategories
 */
export const updateSiteConfig = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { categories, subCategories } = req.body;

    if (!Array.isArray(categories)) {
      return next(new ValidationError("Categories must be an array"));
    }

    const config = await prisma.site_config.findFirst();
    if (!config) {
      // Create new config if not exists
      await prisma.site_config.create({
        data: {
          categories,
          subCategories: subCategories || {},
        },
      });
    } else {
      // Update existing
      await prisma.site_config.update({
        where: { id: config.id },
        data: {
          categories,
          subCategories: subCategories || {},
        },
      });
    }

    return res.status(200).json({
      success: true,
      message: "Site config updated successfully",
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * ===== GET ALL USERS =====
 * Mục đích:
 * - Lấy danh sách user (không bao gồm dữ liệu nhạy cảm)
 * Có:
 * - Pagination
 * - Sorting
 */
export const getAllUsers = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    const [users, totalUsers] = await Promise.all([
      prisma.users.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          createdAt: true,
        },
      }),
      prisma.users.count(),
    ]);

    const totalPages = Math.ceil(totalUsers / limit);

    res.status(200).json({
      success: true,
      data: users,
      meta: {
        totalUsers,
        currentPage: page,
        totalPages,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * ===== GET ALL SELLER =====
 * Mục đích:
 * - Lấy danh sách seller + thông tin shop
 */
export const getAllSellers = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    const [sellers, totalSellers] = await Promise.all([
      prisma.sellers.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          name: true,
          email: true,
          createdAt: true,
          shop: {
            select: {
              name: true,
              avatar: true,
              address: true,
            },
          },
        },
      }),
      prisma.sellers.count(),
    ]);

    const totalPages = Math.ceil(totalSellers / limit);

    res.status(200).json({
      success: true,
      data: sellers,
      meta: {
        totalSellers,
        currentPage: page,
        totalPages,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * ===== GET ALL ADMIN NOTIFICATIONS =====
 * Mục đích:
 * - Lấy notifications dành cho admin
 */
export const getAllNotifications = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const notifications = await prisma.notifications.findMany({
      where: {
        receiverId: "admin",
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    res.status(200).json({
      success: true,
      notifications,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * ===== DELETE CATEGORY =====
 */
export const deleteCategory = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { category } = req.body;

    if (!category) {
      return next(new ValidationError("Category name is required"));
    }

    const config = await prisma.site_config.findFirst();
    if (!config) {
      return next(new ValidationError("Site config not found"));
    }

    const updatedCategories = config.categories.filter((c: string) => c !== category);
    const updatedSubCategories = { ...config.subCategories };
    delete updatedSubCategories[category];

    await prisma.site_config.update({
      where: { id: config.id },
      data: {
        categories: updatedCategories,
        subCategories: updatedSubCategories,
      },
    });

    return res.status(200).json({
      success: true,
      message: "Category deleted successfully",
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * ===== UPDATE CATEGORY =====
 */
export const updateCategory = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { oldCategory, newCategory } = req.body;

    if (!oldCategory || !newCategory) {
      return next(new ValidationError("Old and new category names are required"));
    }

    const config = await prisma.site_config.findFirst();
    if (!config) {
      return next(new ValidationError("Site config not found"));
    }

    const updatedCategories = config.categories.map((c: string) =>
      c === oldCategory ? newCategory : c
    );

    const updatedSubCategories = { ...config.subCategories };
    if (updatedSubCategories[oldCategory]) {
      updatedSubCategories[newCategory] = updatedSubCategories[oldCategory];
      delete updatedSubCategories[oldCategory];
    }

    await prisma.site_config.update({
      where: { id: config.id },
      data: {
        categories: updatedCategories,
        subCategories: updatedSubCategories,
      },
    });

    return res.status(200).json({
      success: true,
      message: "Category updated successfully",
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * ===== DELETE SUBCATEGORY =====
 */
export const deleteSubCategory = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { category, subCategory } = req.body;

    if (!category || !subCategory) {
      return next(new ValidationError("Category and subcategory names are required"));
    }

    const config = await prisma.site_config.findFirst();
    if (!config) {
      return next(new ValidationError("Site config not found"));
    }

    const updatedSubCategories = { ...config.subCategories };
    if (updatedSubCategories[category]) {
      updatedSubCategories[category] = updatedSubCategories[category].filter(
        (s: string) => s !== subCategory
      );
    }

    await prisma.site_config.update({
      where: { id: config.id },
      data: {
        subCategories: updatedSubCategories,
      },
    });

    return res.status(200).json({
      success: true,
      message: "Subcategory deleted successfully",
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * ===== UPDATE SUBCATEGORY =====
 */
export const updateSubCategory = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { category, oldSubCategory, newSubCategory } = req.body;

    if (!category || !oldSubCategory || !newSubCategory) {
      return next(new ValidationError("Category, old and new subcategory names are required"));
    }

    const config = await prisma.site_config.findFirst();
    if (!config) {
      return next(new ValidationError("Site config not found"));
    }

    const updatedSubCategories = { ...config.subCategories };
    if (updatedSubCategories[category]) {
      updatedSubCategories[category] = updatedSubCategories[category].map(
        (s: string) => (s === oldSubCategory ? newSubCategory : s)
      );
    }

    await prisma.site_config.update({
      where: { id: config.id },
      data: {
        subCategories: updatedSubCategories,
      },
    });

    return res.status(200).json({
      success: true,
      message: "Subcategory updated successfully",
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * ===== GET USER NOTIFICATIONS =====
 * Mục đích:
 * - Lấy notifications của user hiện tại
 * Yêu cầu:
 * - Auth middleware phải gán req.user
 */
export const getUserNotifications = async (
  req: any,
  res: Response,
  next: NextFunction
) => {
  try {
    const notifications = await prisma.notifications.findMany({
      where: {
        receiverId: req.user.id,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    res.status(200).json({
      success: true,
      notifications,
    });
  } catch (error) {
    next(error);
  }
};
