"use client";

export const dynamic = 'force-dynamic';

import React from "react";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
} from "@tanstack/react-table";
import dynamic from "next/dynamic";

const SalesChart = dynamic(
  () =>
    import("../../shared/components/charts/sale-chart").then(
      (mod) => mod.SalesChart
    ),
  {
    ssr: false,
    loading: () => <p className="text-white">Loading SalesChart...</p>,
  }
);

const GeographicalMap = dynamic(
  () => import("../../shared/components/charts/geographicalMap"),
  { ssr: false, loading: () => <p className="text-white">Loading Map...</p> }
);

const PieChartComponent = dynamic(
  () => import("../../shared/components/charts/pie-chart").then(
    (mod) => mod.PieChartComponent
  ),
  {
    ssr: false,
    loading: () => <p className="text-white">Loading PieChart...</p>,
  }
);

// Device data
const deviceData = [
  { name: "Phone", value: 55 },
  { name: "Tablet", value: 20 },
  { name: "Computer", value: 25 },
];
const COLORS = ["#4ade80", "#facc15", "#60a5fa"];

// Orders data
const orders = [
  { id: "ORD-001", customer: "John Doe", amount: "$250", status: "Paid" },
  { id: "ORD-002", customer: "Jane Smith", amount: "$180", status: "Pending" },
  { id: "ORD-003", customer: "Alice Johnson", amount: "$340", status: "Paid" },
  { id: "ORD-004", customer: "Bob Lee", amount: "$90", status: "Failed" },
  { id: "ORD-005", customer: "Bob Lee", amount: "$90", status: "Failed" },
  { id: "ORD-006", customer: "Bob Lee", amount: "$90", status: "Failed" },
];

// Orders table columns
const columns = [
  {
    accessorKey: "id",
    header: "ID Đơn hàng",
  },
  {
    accessorKey: "customer",
    header: "Khách hàng",
  },
  {
    accessorKey: "amount",
    header: "Tổng",
  },
  {
    accessorKey: "status",
    header: "Trạng thái",
    cell: ({ getValue }: any) => {
      const value = getValue();
      const color =
        value === "Paid"
          ? "text-green-400"
          : value === "Pending"
          ? "text-yellow-400"
          : "text-red-400";
      return <span className={`font-medium ${color}`}>{value}</span>;
    },
  },
];

const OrdersTable = () => {
  const table = useReactTable({
    data: orders,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="mt-6">
      <h2 className="text-white text-xl font-semibold mb-4">
        Đơn hàng hiện tại
        <span className="block text-sm text-slate-400 font-normal">
          A quick snapshot of your latest transactions.
        </span>
      </h2>
      <div className="!rounded shadow-xl overflow-hidden border border-slate-700">
        <table className="min-w-full text-sm text-white">
          <thead className="bg-slate-900 text-slate-300">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th key={header.id} className="p-3 text-left">
                    {flexRender(
                      header.column.columnDef.header,
                      header.getContext()
                    )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="bg-transparent">
            {table.getRowModel().rows.map((row) => (
              <tr
                key={row.id}
                className="border-t border-slate-600 hover:bg-slate-800 transition"
              >
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="p-3">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// Dashboard Layout
const DashboardPage = () => {
  return (
    <div className="p-8">
      {/* Top Charts */}
      <div className="w-full flex gap-8">
        {/* Revenue Chart */}
        <div className="w-[65%]">
          <div className="rounded-2xl shadow-xl">
            <h2 className="text-white text-xl font-semibold">
              Revenue
              <span className="block text-sm text-slate-400 font-normal">
                Last 6 months performance
              </span>
            </h2>
            <SalesChart />
          </div>
        </div>

        {/* Device Usage */}
        <div className="w-[35%] rounded-2xl shadow-xl">
          <h2 className="text-white text-xl font-semibold mb-2">
            Device Usage
            <span className="block text-sm text-slate-400 font-normal">
              How users access your platform
            </span>
          </h2>
          <div className="mt-14">
            <PieChartComponent data={deviceData} colors={COLORS} />
          </div>
        </div>
      </div>

      {/* Geo Map + Orders */}
      <div className="w-full flex gap-8">
        {/* Map */}
        <div className="w-[60%]">
          <h2 className="text-white text-xl font-semibold mt-6">
            User & Seller Distribution
            <span className="block text-sm text-slate-400 font-normal">
              Visual breakdown of global user & seller activity.
            </span>
          </h2>
          <GeographicalMap />
        </div>

        {/* Orders Table */}
        <div className="w-[40%]">
          <OrdersTable />
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
