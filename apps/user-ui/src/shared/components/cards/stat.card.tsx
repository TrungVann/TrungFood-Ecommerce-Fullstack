import React from "react";

const StatCard = ({ title, count, Icon, color = "orange" }: any) => {
  return (
    <div className="bg-white p-5 rounded-md shadow-sm border border-gray-100 flex items-center justify-between">
      <div>
        <h3 className="text-sm font-medium text-gray-500">{title}</h3>
        <p className="text-3xl font-bold text-gray-800 mt-1">{count}</p>
      </div>
      <Icon className="w-10 h-10 text-[#FF541B]" />
    </div>
  );
};

export default StatCard;
