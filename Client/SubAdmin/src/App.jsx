import React from "react";
import { BrowserRouter as Router } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import Login from "./Pages/Login";

function App() {
  return (
    <AuthProvider>
      <Router>
        <Login />
      </Router>
    </AuthProvider>
  );
}

export default App;
