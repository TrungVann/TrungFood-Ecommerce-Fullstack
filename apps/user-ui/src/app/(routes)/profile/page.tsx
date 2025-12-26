"use client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import useRequireAuth from "apps/user-ui/src/hooks/useRequiredAuth";
import QuickActionCard from "apps/user-ui/src/shared/components/cards/quick-action.card";
import StatCard from "apps/user-ui/src/shared/components/cards/stat.card";
import ChangePassword from "apps/user-ui/src/shared/components/change-password";
import ShippingAddressSection from "apps/user-ui/src/shared/components/shippingAddress";
import OrdersTable from "apps/user-ui/src/shared/components/tables/orders-table";
import axiosInstance from "apps/user-ui/src/utils/axiosInstance";
import { useAuthStore } from "apps/user-ui/src/store/authStore";
import {
  BadgeCheck,
  Bell,
  CheckCircle,
  Clock,
  Gift,
  Inbox,
  Loader2,
  Lock,
  LogOut,
  MapPin,
  Pencil,
  PhoneCall,
  Receipt,
  Settings,
  ShoppingBag,
  Truck,
  User,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";

const Page = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const queryClient = useQueryClient();

  const { user, isLoading } = useRequireAuth();
  const { data: orders = [] } = useQuery({
    queryKey: ["user-orders"],
    queryFn: async () => {
      const res = await axiosInstance.get(`/order/api/get-user-orders`);
      return res.data.orders;
    },
  });
  const totalOrders = orders.length;
  const processingOrders = orders.filter(
    (o: any) =>
      o?.deliveryStatus !== "Delivered" && o?.deliveryStatus !== "Cancelled"
  ).length;
  const completedOrders = orders.filter(
    (o: any) => o?.deliveryStatus === "Delivered"
  ).length;

  const queryTab = searchParams.get("active") || "Profile";
  const [activeTab, setActiveTab] = useState(queryTab);

  useEffect(() => {
    if (activeTab !== queryTab) {
      const newParams = new URLSearchParams(searchParams);
      newParams.set("active", activeTab);
      router.replace(`/profile?${newParams.toString()}`);
    }
  }, [activeTab]);

  const { setLoggedIn } = useAuthStore();

  const logOutHandler = async () => {
    try {
      await axiosInstance.get("/auth/api/logout-user");
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      // Set logged in to false first to prevent query from running
      setLoggedIn(false);
      // Remove the user query data instead of invalidating to avoid refetch
      // This prevents the query from trying to fetch again and returning undefined
      queryClient.removeQueries({ queryKey: ["user"] });
      // Clear all chat-related cache
      queryClient.removeQueries({ queryKey: ["conversations"] });
      queryClient.removeQueries({ queryKey: ["messages"] });
      // Use replace instead of push to avoid back button issues
      router.replace("/");
    }
  };

  const { data: notifications, isLoading: notificationsLoading } = useQuery({
    queryKey: ["notifications"],
    queryFn: async () => {
      const res = await axiosInstance.get("/admin/api/get-user-notifications");
      return res.data.notifications;
    },
  });

  const markAsRead = async (notificationId: string) => {
    await axiosInstance.post("/seller/api/mark-notification-as-read", {
      notificationId,
    });
  };

  return (
    <div className="bg-gray-50 p-6 pb-14">
      <div className="md:max-w-7xl mx-auto">
        {/* Profile Overview Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          <StatCard
            title="Total Orders"
            count={totalOrders}
            Icon={Clock}
            color="orange"
          />
          <StatCard
            title="Processing Orders"
            count={processingOrders}
            Icon={Truck}
            color="blue"
          />
          <StatCard
            title="Completed Orders"
            count={completedOrders}
            Icon={CheckCircle}
            color="green"
          />
        </div>

        {/* sidebar and content Layout */}
        <div className="mt-10 flex flex-col md:flex-row gap-6">
          {/* Left Navigation */}
          <div className="bg-white p-4 rounded-md shadow-sm border border-gray-100 w-full md:w-1/5">
            <nav className="space-y-2">
              <NavItem
                label="Profile"
                Icon={User}
                active={activeTab === "Profile"}
                onClick={() => setActiveTab("Profile")}
              />
              <NavItem
                label="My Orders"
                Icon={ShoppingBag}
                active={activeTab === "My Orders"}
                onClick={() => setActiveTab("My Orders")}
              />
              <NavItem
                label="Inbox"
                Icon={Inbox}
                active={activeTab === "Inbox"}
                onClick={() => router.push("/inbox")}
              />
              <NavItem
                label="Notifications"
                Icon={Bell}
                active={activeTab === "Notifications"}
                onClick={() => setActiveTab("Notifications")}
              />
              <NavItem
                label="Shipping Address"
                Icon={MapPin}
                active={activeTab === "Shipping Address"}
                onClick={() => setActiveTab("Shipping Address")}
              />
              <NavItem
                label="Change Password"
                Icon={Lock}
                active={activeTab === "Change Password"}
                onClick={() => setActiveTab("Change Password")}
              />
              <NavItem
                label="Logout"
                Icon={LogOut}
                danger
                onClick={() => logOutHandler()}
              />
            </nav>
          </div>

          {/* Main Content */}
          <div className="bg-white p-6 rounded-md shadow-sm border border-gray-100 w-full md:w-[55%]">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              {activeTab}
            </h2>
            {activeTab === "Profile" && !isLoading && user ? (
              <div className="space-y-4 text-sm text-gray-700">
                <div className="flex items-center gap-3">
                  <Image
                    src={
                      user?.avatar ||
                      "https://i.pinimg.com/736x/0b/97/6f/0b976f0a7aa1aa43870e1812eee5a55d.jpg"
                    }
                    alt="profile"
                    width={60}
                    height={60}
                    className="w-16 h-16 rounded-full border border-gray-200"
                  />
                  <button className="flex items-center gap-1 text-blue-500 text-xs font-medium">
                    <Pencil className="w-4 h-4" /> Change Photo
                  </button>
                </div>
                <p>
                  <span className="font-semibold">Name:</span> {user.name}
                </p>
                <p>
                  <span className="font-semibold">Email:</span> {user.email}
                </p>
                <p>
                  <span className="font-semibold">Joined:</span>{" "}
                  {new Date(user.createdAt).toLocaleDateString()}
                </p>
                <p>
                  <span className="font-semibold">Earned Points:</span>{" "}
                  {user.points || 0}
                </p>
              </div>
            ) : activeTab === "Shipping Address" ? (
              <ShippingAddressSection />
            ) : activeTab === "My Orders" ? (
              <OrdersTable />
            ) : activeTab === "Change Password" ? (
              <ChangePassword />
            ) : activeTab === "Notifications" ? (
              <div className="space-y-4 text-sm text-gray-700">
                {!notificationsLoading && notifications?.length === 0 && (
                  <p>No Notifications available yet!</p>
                )}

                {!notificationsLoading && notifications?.length > 0 && (
                  <div className="md:w-[80%] my-6 rounded-lg divide-y divide-gray-800 bg-black/40 backdrop-blur-lg shadow-sm">
                    {notifications.map((d: any) => (
                      <Link
                        key={d.id}
                        href={`${d.redirect_link}`}
                        className={`block px-5 py-4 transition ${
                          d.status !== "Unread"
                            ? "hover:bg-gray-800/40"
                            : "bg-gray-800/50 hover:bg-gray-800/70"
                        }`}
                        onClick={() => markAsRead(d.id)}
                      >
                        <div className="flex items-start gap-3">
                          <div className="flex flex-col">
                            <span className="text-white font-medium">
                              {d.title}
                            </span>
                            <span className="text-gray-300 text-sm">
                              {d.message}
                            </span>
                            <span className="text-gray-500 text-xs mt-1">
                              {new Date(d.cratedAt).toLocaleString("en-UK", {
                                dateStyle: "medium",
                                timeStyle: "short",
                              })}
                            </span>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <p>Not Found</p>
            )}
          </div>

          {/* Right Quick Panel */}
          <div className="w-full md:w-1/4 space-y-4">
            <QuickActionCard
              Icon={Gift}
              title="Referral Program"
              description="Invite friends and earn rewards."
            />
            <QuickActionCard
              Icon={BadgeCheck}
              title="Your Badges"
              description="View your earned achievements."
            />
            <QuickActionCard
              Icon={Settings}
              title="Account Settings"
              description="Manage preferences and security."
            />
            <QuickActionCard
              Icon={Receipt}
              title="Billing History"
              description="Check your recent payments."
            />
            <QuickActionCard
              Icon={PhoneCall}
              title="Support Center"
              description="Need help? Contact support."
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Page;

const NavItem = ({ label, Icon, active, danger, onClick }: any) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition ${
      active
        ? "bg-blue-100 text-blue-600"
        : danger
        ? "text-red-500 hover:bg-red-50"
        : "text-gray-700 hover:bg-gray-100"
    }`}
  >
    <Icon className="w-4 h-4" />
    {label}
  </button>
);
