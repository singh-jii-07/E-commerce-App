import React from "react";
import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "./Sidebar";
import Header from "./Header";

const getPageTitle = (pathname) => {
  switch (pathname) {
    case "/":
      return "Dashboard Overview";
    case "/products":
      return "Products";
    case "/categories":
      return "Categories";
    case "/orders":
      return "Orders";
    case "/users":
      return "Users";
    default:
      return "Admin Portal";
  }
};

const Layout = () => {
  const location = useLocation();
  const title = getPageTitle(location.pathname);

  return (
    <div className="flex min-h-screen bg-gray-50 font-sans text-gray-900 antialiased">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Header title={title} />
        <main className="flex-1 p-6 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;
