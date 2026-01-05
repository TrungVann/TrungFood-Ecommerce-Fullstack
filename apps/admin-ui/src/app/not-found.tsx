"use client";

import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-white mb-4">404 - Page Not Found</h1>
        <p className="text-gray-400 mb-8">The page you are looking for does not exist.</p>
        <Link href="/dashboard" className="bg-blue-600 text-white px-4 py-2 rounded">
          Go to Dashboard
        </Link>
      </div>
    </div>
  );
}