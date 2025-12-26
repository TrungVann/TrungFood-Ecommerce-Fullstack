/**
 * ============================================================
 * AUTH CONTROLLER
 * ============================================================
 * File này chịu trách nhiệm xử lý toàn bộ logic liên quan đến:
 * 1. Authentication & Authorization
 * - User/ Admin/ Seller Login
 * - JWT Access Token & Refresh Token
 * - Cookie-based authentication (httpOnly)
 *
 * 2. Luồng hoạt động của OTP
 * - Đăng ký tài khoản (User & Seller)
 * - Quên mật khẩu
 * - Chống spam OTP (rate limit)
 *
 * 3. Account Management
 * - Update password
 * - Logout
 *
 * 4. Seller & Shop
 * - Register Seller
 * - Create Shop
 * - Stripe Connect onboarding
 *
 * 5. User Address
 * - CRUD địa chỉ giao hàng
 *
 * Techstack:
 * - Express + TypeScript
 * - Prisma ORM
 * - JWT (Access + Refresh)
 * - Bcryptjs
 * - Stripe Connect (Express Account)
 */
import { NextFunction, Request, Response } from "express";
import {
  checkOtpRestrictions,
  handleForgotPassword,
  sendOtp,
  trackOtpRequests,
  validateRegistrationData,
  verifyForgotPasswordOtp,
  verifyOtp,
} from "../utils/auth.helper";
import bcrypt from "bcryptjs";
import prisma from "@packages/libs/prisma";
import {
  AuthError,
  NotFoundError,
  ValidationError,
} from "@packages/error-handler";
import jwt, { JsonWebTokenError } from "jsonwebtoken";
import { setCookie } from "../utils/cookies/setCookie";
import Stripe from "stripe";
import { sendLog } from "@packages/utils/logs/send-logs";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2022-11-15",
});

/**
 * Register new user (Step 1 - Gửi OTP)
 * 1. Validate dữ liệu đầu vào (name, email, password,...)
 * 2. Kiểm tra user đã tồn tại chưa
 * 3. Kiểm tra giới hạn OTP (anti-spam)
 * 4. Track số lần request OTP
 * 5. Gửi OTP qua email
 */
export const userRegistration = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    //Validate input theo schema user
    validateRegistrationData(req.body, "user");

    const { name, email } = req.body;

    //Check user đã tồn tại chưa
    const existingUser = await prisma.users.findUnique({ where: { email } });
    if (existingUser) {
      return next(new ValidationError("User already exists with this email!"));
    }

    //Chống spam OTP (rate limit theo email)
    await checkOtpRestrictions(email, next);

    //Track số lần request OTP
    await trackOtpRequests(email, next);

    //Gửi OTP qua email
    await sendOtp(name, email, "user-activation-mail");

    //Ghi log phục vụ audit/debug
    sendLog({
      type: "info",
      message: `OTP requested for ${email}`,
      source: "auth-service",
    });

    res.status(200).json({
      message: "OTP sent to email. Please verify your account.",
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * VerifyOTP & hoàn tất đăng ký user
 * 1. Validate input (email, otp, password, name)
 * 2. Kiểm tra user đã tồn tại chưa (tránh verify lại)
 * 3. Verify OTP
 * 4. Hash password
 * 5. Nếu là user đầu tiên -> gán role = admin
 * 6. Tạo user trong DB
 */
export const verifyUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email, otp, password, name } = req.body;
    if (!email || !otp || !password || !name) {
      return next(new ValidationError("All fields are required!"));
    }

    const existingUser = await prisma.users.findUnique({ where: { email } });

    if (existingUser) {
      return next(new ValidationError("User already exists with this email!"));
    }

    //Verify OTP (throws error nếu sai/hết hạn)
    await verifyOtp(email, otp, next);

    //Hash password trước khi lưu vào DB
    const hashedPassword = await bcrypt.hash(password, 10);

    //Dùng để xác định user đầu tiên trong hệ thống
    const userCount = await prisma.users.count();

    //Gửi log
    sendLog({
      type: "success",
      message: `New user verified & registered: ${email}`,
      source: "auth-service",
    });

    await prisma.users.create({
      data: {
        name,
        email,
        password: hashedPassword,
        ...(userCount === 0 && { role: "admin" }), //Nếu là user đầu tiên -> admin
      },
    });

    res.status(201).json({
      success: true,
      message: "User registered successfully!",
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * Login user
 * 1. Validate email & password
 * 2. Check user tồn tại
 * 3. Compare password (bcrypt)
 * 4. Generate JWT access & refresh token
 * 5. Store token vào httpOnly cookie
 * Security:
 * - Access token: 15 phút
 * - Refresh token: 7 ngày
 */
export const loginUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return next(new ValidationError("Email and password are required!"));
    }

    const user = await prisma.users.findUnique({ where: { email } });

    if (!user) return next(new AuthError("User doesn't exists!"));

    //Verify password
    const isMatch = await bcrypt.compare(password, user.password!);
    if (!isMatch) {
      sendLog({
        type: "error",
        message: `Login failed: Invalid password for ${email}`,
        source: "auth-service",
      });
      return next(new AuthError("Invalid email or password"));
    }

    sendLog({
      type: "success",
      message: `User login successful: ${email}`,
      source: "auth-service",
    });

    //Clear seller token nếu user login
    res.clearCookie("seller-access-token");
    res.clearCookie("seller-refresh-token");

    // Generate access and refresh token
    const accessToken = jwt.sign(
      { id: user.id, role: "user" },
      process.env.ACCESS_TOKEN_SECRET as string,
      {
        expiresIn: "15m",
      }
    );

    const refreshToken = jwt.sign(
      { id: user.id, role: "user" },
      process.env.REFRESH_TOKEN_SECRET as string,
      {
        expiresIn: "7d",
      }
    );

    //Lưu token vào httpOnly cookie
    setCookie(res, "refresh_token", refreshToken);
    setCookie(res, "access_token", accessToken);

    res.status(200).json({
      message: "Login successful!",
      user: { id: user.id, email: user.email, name: user.name },
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * Log out user
 * Chỉ cần clear access_token và refresh_token
 */
export const logOutUser = async (req: any, res: Response) => {
  res.clearCookie("access_token");
  res.clearCookie("refresh_token");

  res.status(201).json({
    success: true,
  });
};

/**
 * UPDATE PASSWORD
 * Điều kiện:
 * - có mật khẩu hiện tại
 * - New password khác password cũ
 * - New password phải trùng với confirm password
 * Flow:
 * 1. Verify current password
 * 2. Hash password mới
 * 3. Update DB
 */
export const updateUserPassword = async (
  req: any,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user?.id;
    const { currentPassword, newPassword, confirmPassword } = req.body;

    if (!currentPassword || !newPassword || !confirmPassword) {
      return next(new ValidationError("all fields are required"));
    }

    if (newPassword !== confirmPassword) {
      return next(new ValidationError("new passwords do not match"));
    }

    if (currentPassword === newPassword) {
      return next(
        new ValidationError(
          "New password cannot be the same as the current password"
        )
      );
    }

    const user = await prisma.users.findUnique({
      where: { id: userId },
    });

    if (!user || !user.password) {
      return next(new AuthError("user not found or password not set"));
    }

    const isPasswordCorrect = await bcrypt.compare(
      currentPassword,
      user.password
    );
    if (!isPasswordCorrect) {
      return next(new AuthError("current password is incorrect"));
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);

    await prisma.users.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    res.status(200).json({ message: "password updated successfully" });
  } catch (error) {
    next(error);
  }
};

/**
 * LOGIN ADMIN
 * Khác loginUser:
 * - bắt buộc role là admin
 * - nếu không phải admin -> từ chối
 * Token:
 * - Role: admin
 * - Dùng chung cookie access_token/refresh_token
 */
export const loginAdmin = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return next(new ValidationError("Email and password are required!"));
    }

    const user = await prisma.users.findUnique({ where: { email } });

    if (!user) return next(new AuthError("User doesn't exists!"));

    // verify password
    const isMatch = await bcrypt.compare(password, user.password!);
    if (!isMatch) {
      return next(new AuthError("Invalid email or password"));
    }

    const isAdmin = user.role === "admin";

    if (!isAdmin) {
      sendLog({
        type: "error",
        message: `Admin login failed for ${email} — not an admin`,
        source: "auth-service",
      });
      return next(new AuthError("Invalid access!"));
    }

    sendLog({
      type: "success",
      message: `Admin login successful: ${email}`,
      source: "auth-service",
    });

    res.clearCookie("seller-access-token");
    res.clearCookie("seller-refresh-token");

    // Generate access and refresh token
    const accessToken = jwt.sign(
      { id: user.id, role: "admin" },
      process.env.ACCESS_TOKEN_SECRET as string,
      {
        expiresIn: "15m",
      }
    );

    const refreshToken = jwt.sign(
      { id: user.id, role: "admin" },
      process.env.REFRESH_TOKEN_SECRET as string,
      {
        expiresIn: "7d",
      }
    );

    // store the refresh and access token in an httpOnly secure cookie
    setCookie(res, "refresh_token", refreshToken);
    setCookie(res, "access_token", accessToken);

    res.status(200).json({
      message: "Login successful!",
      user: { id: user.id, email: user.email, name: user.name },
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * Refresh access token (quan trọng)
 * Áp dụng cho cả User, Admin & Seller
 * 1. Lấy refresh token từ cookie hoặc authorization header
 * 2. verify refresh token
 * 3. Kiểm tra account còn tồn tại không
 * 4. Generate access token mới
 * 5. Set cookie tương ứng theo role
 */
export const refreshToken = async (
  req: any,
  res: Response,
  next: NextFunction
) => {
  try {
    const refreshToken =
      req.cookies["refresh_token"] ||
      req.cookies["seller-refresh-token"] ||
      req.headers.authorization?.split(" ")[1];

    if (!refreshToken) {
      return next(new ValidationError("Unauthorized! No refresh token."));
    }

    const decoded = jwt.verify(
      refreshToken,
      process.env.REFRESH_TOKEN_SECRET as string
    ) as { id: string; role: string };

    if (!decoded || !decoded.id || !decoded.role) {
      return next(new JsonWebTokenError("Forbidden! Invalid refresh token."));
    }

    let account;
    if (decoded.role === "user" || decoded.role === "admin") {
      account = await prisma.users.findUnique({ where: { id: decoded.id } });
    } else if (decoded.role === "seller") {
      account = await prisma.sellers.findUnique({
        where: { id: decoded.id },
        include: { shop: true },
      });
    }

    if (!account) {
      return next(new AuthError("Forbidden! User/Seller not found"));
    }

    const newAccessToken = jwt.sign(
      { id: decoded.id, role: decoded.role },
      process.env.ACCESS_TOKEN_SECRET as string,
      { expiresIn: "15m" }
    );

    if (decoded.role === "user" || decoded.role === "admin") {
      setCookie(res, "access_token", newAccessToken);
    } else if (decoded.role === "seller") {
      setCookie(res, "seller-access-token", newAccessToken);
    }

    req.role = decoded.role;

    return res.status(201).json({ success: true });
  } catch (error) {
    next(error);
  }
};

// get logged in user
export const getUser = async (req: any, res: Response, next: NextFunction) => {
  try {
    const user = req.user;
    await sendLog({
      type: "success",
      message: `User data retrieved ${user?.email}`,
      source: "auth-service",
    });

    res.status(201).json({
      success: true,
      user,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET ADMIN
 * - trả data admin đang login
 */
export const getAdmin = async (req: any, res: Response, next: NextFunction) => {
  try {
    const user = req.user;

    await sendLog({
      type: "success",
      message: `Admin data retrieved ${user?.email}`,
      source: "auth-service",
    });

    res.status(201).json({
      success: true,
      user,
    });
  } catch (error) {
    next(error);
  }
};

// user forgot password
export const userForgotPassword = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  await handleForgotPassword(req, res, next, "user");
};

// Verify forgot password OTP
export const verifyUserForgotPassword = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  await verifyForgotPasswordOtp(req, res, next);
};

// Reset user password
export const resetUserPassword = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email, newPassword } = req.body;

    if (!email || !newPassword)
      return next(new ValidationError("Email and new password are required!"));

    const user = await prisma.users.findUnique({ where: { email } });
    if (!user) return next(new ValidationError("User not found!"));

    // compare new password with the exisiting one
    const isSamePassword = await bcrypt.compare(newPassword, user.password!);

    if (isSamePassword) {
      return next(
        new ValidationError(
          "New password cannot be the same as the old password!"
        )
      );
    }

    // hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.users.update({
      where: { email },
      data: { password: hashedPassword },
    });

    res.status(200).json({ message: "Password reset successfully!" });
  } catch (error) {
    next(error);
  }
};

// register a new seller
export const registerSeller = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    validateRegistrationData(req.body, "seller");
    const { name, email } = req.body;

    const existingSeller = await prisma.sellers.findUnique({
      where: { email },
    });

    if (existingSeller) {
      throw new ValidationError("Seller already exists with this email!");
    }

    await checkOtpRestrictions(email, next);
    await trackOtpRequests(email, next);
    await sendOtp(name, email, "seller-activation");

    res
      .status(200)
      .json({ message: "OTP sent to email. Please verify your account." });
  } catch (error) {
    next(error);
  }
};

// verify seller with OTP
export const verifySeller = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email, otp, password, name, phone_number, country } = req.body;

    if (!email || !otp || !password || !name || !phone_number || !country) {
      return next(new ValidationError("All fields are required!"));
    }

    const existingSeller = await prisma.sellers.findUnique({
      where: { email },
    });

    if (existingSeller)
      return next(
        new ValidationError("Seller already exists with this email!")
      );

    await verifyOtp(email, otp, next);
    const hashedPassword = await bcrypt.hash(password, 10);

    const seller = await prisma.sellers.create({
      data: {
        name,
        email,
        password: hashedPassword,
        country,
        phone_number,
      },
    });

    res
      .status(201)
      .json({ seller, message: "Seller registered successfully!" });
  } catch (error) {
    next(error);
  }
};

// create a new shop
export const createShop = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { name, bio, address, opening_hours, website, category, sellerId } =
      req.body;

    if (!name || !bio || !address || !sellerId || !opening_hours || !category) {
      return next(new ValidationError("All fields are required!"));
    }

    const shopData: any = {
      name,
      bio,
      address,
      opening_hours,
      category,
      sellerId,
    };

    if (website && website.trim() !== "") {
      shopData.website = website;
    }

    const shop = await prisma.shops.create({
      data: shopData,
    });

    res.status(201).json({
      success: true,
      shop,
    });
  } catch (error) {
    next(error);
  }
};

// create stripe connect account link
export const createStripeConnectLink = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { sellerId } = req.body;

    if (!sellerId) return next(new ValidationError("Seller ID is required!"));

    const seller = await prisma.sellers.findUnique({
      where: {
        id: sellerId,
      },
    });

    if (!seller) {
      return next(new ValidationError("Seller is not available with this id!"));
    }

    const account = await stripe.accounts.create({
      type: "express",
      email: seller?.email,
      country: "GB",
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
    });

    await prisma.sellers.update({
      where: {
        id: sellerId,
      },
      data: {
        stripeId: account.id,
      },
    });

    const accountLink = await stripe.accountLinks.create({
      account: account.id,
      refresh_url: `http://localhost:3000/success`,
      return_url: `http://localhost:3000/success`,
      type: "account_onboarding",
    });

    res.json({ url: accountLink.url });
  } catch (error) {
    return next(error);
  }
};

// login seller
export const loginSeller = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email, password } = req.body;

    if (!email || !password)
      return next(new ValidationError("Email and password are required!"));

    const seller = await prisma.sellers.findUnique({ where: { email } });
    if (!seller) return next(new ValidationError("Invalid email or password!"));

    // Verify password
    const isMatch = await bcrypt.compare(password, seller.password!);
    if (!isMatch)
      return next(new ValidationError("Invalid email or password!"));

    res.clearCookie("access_token");
    res.clearCookie("refresh_token");

    // Generate access and refresh tokens
    const accessToken = jwt.sign(
      { id: seller.id, role: "seller" },
      process.env.ACCESS_TOKEN_SECRET as string,
      { expiresIn: "15m" }
    );
    const refreshToken = jwt.sign(
      { id: seller.id, role: "seller" },
      process.env.REFRESH_TOKEN_SECRET as string,
      { expiresIn: "7d" }
    );

    // store refresh token and access token
    setCookie(res, "seller-refresh-token", refreshToken);
    setCookie(res, "seller-access-token", accessToken);

    res.status(200).json({
      message: "Login successful!",
      seller: { id: seller.id, email: seller.email, name: seller.name },
    });
  } catch (error) {
    next(error);
  }
};

// log out seller
export const logOutSeller = async (req: any, res: Response) => {
  res.clearCookie("seller-access-token");
  res.clearCookie("seller-refresh-token");

  res.status(201).json({
    success: true,
  });
};

// get logged in seller
export const getSeller = async (
  req: any,
  res: Response,
  next: NextFunction
) => {
  try {
    const seller = req.seller;

    res.status(201).json({
      success: true,
      seller,
    });
  } catch (error) {
    next(error);
  }
};

// log out admin
export const logOutAdmin = async (req: any, res: Response) => {
  res.clearCookie("access_token");
  res.clearCookie("refresh_token");

  res.status(201).json({
    success: true,
  });
};

// add new address
export const addUserAddress = async (
  req: any,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user?.id;
    const { label, name, street, city, zip, country, isDefault } = req.body;

    if (!label || !name || !street || !city || !zip || !country) {
      return next(new ValidationError("All fields are required"));
    }

    if (isDefault) {
      await prisma.address.updateMany({
        where: {
          userId,
          isDefault: true,
        },
        data: {
          isDefault: false,
        },
      });
    }

    const newAddress = await prisma.address.create({
      data: {
        userId,
        label,
        name,
        street,
        city,
        zip,
        country,
        isDefault,
      },
    });

    res.status(201).json({
      success: true,
      address: newAddress,
    });
  } catch (error) {
    return next(error);
  }
};

// delete user address
export const deleteUserAddress = async (
  req: any,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user?.id;
    const { addressId } = req.params;

    if (!addressId) {
      return next(new ValidationError("Address ID is required"));
    }

    const existingAddress = await prisma.address.findFirst({
      where: {
        id: addressId,
        userId,
      },
    });

    if (!existingAddress) {
      return next(new NotFoundError("Address not found or unauthorized"));
    }

    await prisma.address.delete({
      where: {
        id: addressId,
      },
    });

    res.status(200).json({
      success: true,
      message: "Address deleted successfully",
    });
  } catch (error) {
    return next(error);
  }
};

// get user addresses
export const getUserAddresses = async (
  req: any,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user?.id;

    const addresses = await prisma.address.findMany({
      where: {
        userId,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    res.status(200).json({
      success: true,
      addresses,
    });
  } catch (error) {
    next(error);
  }
};

// fetch layout data
export const getLayoutData = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const layout = await prisma.site_config.findFirst();

    res.status(200).json({
      success: true,
      layout,
    });
  } catch (error) {
    next(error);
  }
};
