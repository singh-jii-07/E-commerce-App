import React from "react";
import { useAuth } from "../context/AuthContext";

const Header = ({ title }) => {
  const { user } = useAuth();

  return (
    <header className="bg-white border-b border-gray-200 px-6 h-16 sticky top-0 z-20 flex items-center justify-between">
      <div>
        <h2 className="text-lg font-bold text-gray-900 tracking-tight">{title}</h2>
      </div>

      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-indigo-50 text-indigo-700 font-semibold text-xs flex items-center justify-center border border-indigo-200">
          {user?.username ? user.username.charAt(0).toUpperCase() : "A"}
        </div>
        <div className="text-left hidden sm:block">
          <p className="text-xs font-medium text-gray-900">{user?.username || "Administrator"}</p>
          <p className="text-[11px] text-gray-500">{user?.email}</p>
        </div>
      </div>
    </header>
  );
};

export default Header;
