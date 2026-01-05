import { isAdmin } from "@packages/middleware/authorizeRoles";
import isAuthenticated from "@packages/middleware/isAuthenticated";
import express, { Router } from "express";
import {
  addNewAdmin,
  deleteCategory,
  deleteSubCategory,
  getAllAdmins,
  getAllCustomizations,
  getAllEvents,
  getAllNotifications,
  getAllProducts,
  getAllSellers,
  getAllUsers,
  getUserNotifications,
  updateCategory,
  updateSiteConfig,
  updateSubCategory,
} from "../controllers/admin.controller";

const router: Router = express.Router();

router.get("/get-all-products", isAuthenticated, isAdmin, getAllProducts);
router.get("/get-all-events", isAuthenticated, isAdmin, getAllEvents);
router.get("/get-all-admins", isAuthenticated, isAdmin, getAllAdmins);
router.put("/add-new-admin", isAuthenticated, isAdmin, addNewAdmin);
router.get("/get-all-users", isAuthenticated, isAdmin, getAllUsers);
router.get("/get-all-sellers", isAuthenticated, isAdmin, getAllSellers);
router.get("/get-all", getAllCustomizations);
router.get(
  "/get-all-notifications",
  isAuthenticated,
  isAdmin,
  getAllNotifications
);
router.put("/update-site-config", isAuthenticated, isAdmin, updateSiteConfig);
router.delete("/delete-category", isAuthenticated, isAdmin, deleteCategory);
router.put("/update-category", isAuthenticated, isAdmin, updateCategory);
router.delete(
  "/delete-subcategory",
  isAuthenticated,
  isAdmin,
  deleteSubCategory
);
router.put("/update-subcategory", isAuthenticated, isAdmin, updateSubCategory);
router.get("/get-user-notifications", isAuthenticated, getUserNotifications);

export default router;
