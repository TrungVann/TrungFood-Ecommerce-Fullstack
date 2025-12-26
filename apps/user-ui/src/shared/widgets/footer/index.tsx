"use client";

import React from "react";
import Link from "next/link";
import {
  Facebook,
  Twitter,
  Linkedin,
  Mail,
  MapPin,
  ArrowUp,
} from "lucide-react";
import { usePathname } from "next/navigation";

const Footer = () => {
  const pathname = usePathname();
  if (pathname === "/inbox") return null;

  return (
    <footer className="bg-[#F9FAFB] border-t border-gray-200 text-gray-700">
      {/* MAIN */}
      <div className="w-[90%] lg:w-[80%] mx-auto py-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
        {/* ABOUT */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            Trung<span className="text-orange-500">Food</span>
          </h2>

          <p className="text-sm text-gray-500 mt-3 leading-relaxed">
            Perfect ecommerce platform to start your business from scratch.
            Discover fresh food, fast delivery and great deals every day.
          </p>

          {/* SOCIAL */}
          <div className="flex gap-3 mt-5">
            {[Facebook, Twitter, Linkedin].map((Icon, i) => (
              <Link
                key={i}
                href="#"
                className="w-9 h-9 flex items-center justify-center rounded-full bg-white border border-gray-200 text-gray-600 hover:bg-orange-500 hover:text-white hover:border-orange-500 transition"
              >
                <Icon size={18} />
              </Link>
            ))}
          </div>
        </div>

        {/* MY ACCOUNT */}
        <div>
          <h4 className="text-sm font-semibold uppercase tracking-wide text-gray-900">
            My Account
          </h4>
          <ul className="mt-4 space-y-3 text-sm">
            {[
              ["Track Orders", "/#"],
              ["Shipping", "/#"],
              ["Wishlist", "/wishlist"],
              ["My Account", "/#"],
              ["Order History", "/#"],
              ["Returns", "/#"],
            ].map(([label, link]) => (
              <li key={label}>
                <Link
                  href={link}
                  className="text-gray-500 hover:text-orange-500 transition"
                >
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* INFORMATION */}
        <div>
          <h4 className="text-sm font-semibold uppercase tracking-wide text-gray-900">
            Information
          </h4>
          <ul className="mt-4 space-y-3 text-sm">
            {[
              ["Our Story", "/#"],
              ["Careers", "/#"],
              ["Privacy Policy", "/#"],
              ["Terms & Conditions", "/#"],
              ["Latest News", "/#"],
              ["Contact Us", "/#"],
            ].map(([label, link]) => (
              <li key={label}>
                <Link
                  href={link}
                  className="text-gray-500 hover:text-orange-500 transition"
                >
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* CONTACT */}
        <div>
          <h4 className="text-sm font-semibold uppercase tracking-wide text-gray-900">
            Talk To Us
          </h4>

          <p className="text-sm text-gray-500 mt-4">Got questions? Call us</p>
          <p className="text-xl font-bold text-gray-900 mt-1">
            +84 0368 701 680
          </p>

          <div className="mt-4 space-y-3 text-sm">
            <div className="flex items-center gap-2 text-gray-500">
              <Mail size={16} />
              support@trungfood.com
            </div>
            <div className="flex items-start gap-2 text-gray-500">
              <MapPin size={16} className="mt-0.5" />
              <span>
                123 Hoàng Cầu
                <br />
                Đống Đa, Hà Nội
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* BOTTOM */}
      <div className="border-t border-gray-200">
        <div className="w-[90%] lg:w-[80%] mx-auto py-4 flex flex-col lg:flex-row items-center justify-between gap-4">
          <p className="text-sm text-gray-500">
            © 2025 TrungFood. All Rights Reserved.
          </p>

          <button
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-orange-500 text-white hover:bg-orange-600 transition shadow-md"
          >
            <ArrowUp size={18} />
          </button>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
