import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  LayoutDashboard,
  Package,
  Tags,
  ShoppingBag,
  Users,
  LogOut,
  Store,
  HelpCircle,
  Mail,
} from "lucide-react";

const Sidebar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const navItems = [
    { name: "Dashboard", path: "/", icon: LayoutDashboard },
    { name: "Products", path: "/products", icon: Package },
    { name: "Categories", path: "/categories", icon: Tags },
    { name: "Orders", path: "/orders", icon: ShoppingBag },
    { name: "Users", path: "/users", icon: Users },
    { name: "FAQs", path: "/faqs", icon: HelpCircle },
    { name: "Contact Messages", path: "/contacts", icon: Mail },
  ];

  return (
    <aside className="w-60 bg-gray-900 text-gray-300 flex flex-col h-screen sticky top-0 border-r border-gray-800">
      {/* Brand Header */}
      <div className="h-16 px-6 border-b border-gray-800 flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold">
          <Store className="w-5 h-5" />
        </div>
        <div>
          <h1 className="font-semibold text-white text-base tracking-tight">Admin Portal</h1>
          <p className="text-[11px] text-gray-400">Grocery Store</p>
        </div>
      </div>

      {/* Nav Items */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "text-gray-400 hover:text-white hover:bg-gray-800"
                }`
              }
            >
              <Icon className="w-4 h-4" />
              <span>{item.name}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* User & Logout */}
      <div className="p-3 border-t border-gray-800 bg-gray-950/50">
        <div className="flex items-center justify-between p-2 rounded-lg">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-full bg-gray-700 text-white font-semibold text-xs flex items-center justify-center">
              {user?.username ? user.username.charAt(0).toUpperCase() : "A"}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-white truncate">{user?.username || "Admin"}</p>
              <p className="text-[10px] text-gray-400 truncate">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            title="Log Out"
            className="p-1.5 text-gray-400 hover:text-rose-400 hover:bg-gray-800 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
