import React, { useState } from "react";
import { authAxios } from "../api/axiosInstance";
import { useNavigate } from "react-router-dom";
import {
  UserPlus,
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  KeyRound,
  ArrowLeft,
} from "lucide-react";

function Register() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "subAdmin",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [step, setStep] = useState("register"); // 'register' or 'otp'
  const [otp, setOtp] = useState("");
  const [registeredEmail, setRegisteredEmail] = useState("");

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    setError("");
    setSuccess("");
  };

  // Register user
  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    const { username, email, password, confirmPassword, role } = formData;

    // Basic validation
    if (!username || !email || !password || !confirmPassword || !role) {
      setError("Please fill all fields.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Password and Confirm Password do not match.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    try {
      setLoading(true);

      const response = await authAxios.post(
        "/user/add",
        {
          username,
          email,
          password,
          role,
        }
      );

      console.log("Register Response:", response.data);

      setSuccess("Registration pending. OTP sent to your email.");
      setRegisteredEmail(email);
      setStep("otp");
    } catch (err) {
      console.error("Registration Error:", err);

      setError(
        err.response?.data?.message ||
          "Registration failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  // Verify OTP
  const handleVerifyOtp = async (e) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    if (!otp) {
      setError("Please enter the OTP code.");
      return;
    }

    try {
      setLoading(true);

      const response = await authAxios.post("/user/otp", {
        email: registeredEmail,
        otp: otp,
      });

      console.log("OTP Verification Response:", response.data);

      setSuccess("Sub-admin registered and verified successfully!");
      setOtp("");
      setRegisteredEmail("");
      
      // Clear form
      setFormData({
        username: "",
        email: "",
        password: "",
        confirmPassword: "",
        role: "subAdmin",
      });

      // Navigate back to register step after 2 seconds
      setTimeout(() => {
        setStep("register");
        setSuccess("");
      }, 2000);
    } catch (err) {
      console.error("OTP Verification Error:", err);

      setError(
        err.response?.data?.message ||
          "OTP verification failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-full bg-gray-100 p-6">
      <div className="max-w-2xl mx-auto">

        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">
            {step === "register" ? "Register Sub- Admin" : "Verify Account"}
          </h1>

          <p className="text-sm text-gray-500 mt-1">
            {step === "register" 
              ? "Create a new account with specified role" 
              : `Enter the OTP sent to ${registeredEmail}`}
          </p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">

          {/* Icon + Title */}
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-lg flex items-center justify-center">
              {step === "register" ? (
                <UserPlus className="w-5 h-5" />
              ) : (
                <KeyRound className="w-5 h-5" />
              )}
            </div>

            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                {step === "register" ? "Account Registration" : "OTP Verification"}
              </h2>

              <p className="text-xs text-gray-500">
                {step === "register" 
                  ? "Enter the account details below" 
                  : "Please verify the registration OTP code"}
              </p>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-5 p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-600">
              {error}
            </div>
          )}

          {/* Success */}
          {success && (
            <div className="mb-5 p-3 rounded-lg bg-green-50 border border-green-200 text-sm text-green-600">
              {success}
            </div>
          )}

          {step === "register" ? (
            <form onSubmit={handleSubmit} className="space-y-5">

              {/* Username */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Username
                </label>

                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />

                  <input
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleChange}
                    placeholder="Enter username"
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>

                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />

                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="Enter email address"
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Role dropdown */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Role
                </label>

                <select
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                >
                  <option value="subAdmin">Sub Admin</option>
                  <option value="admin">Admin</option>
                  <option value="user">User</option>
                </select>
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Password
                </label>

                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />

                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Enter password"
                    className="w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Confirm Password
                </label>

                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />

                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="Confirm password"
                    className="w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowConfirmPassword((prev) => !prev)
                    }
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-medium text-sm py-2.5 rounded-lg transition-colors"
              >
                <UserPlus className="w-4 h-4" />

                {loading ? "Creating Account..." : "Create Account"}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-5">
              {/* OTP Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 text-center">
                  One-Time Password (OTP)
                </label>

                <div className="relative max-w-xs mx-auto">
                  <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />

                  <input
                    type="text"
                    name="otp"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    placeholder="------"
                    maxLength={6}
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-center tracking-widest font-mono text-lg font-bold"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col gap-3 max-w-xs mx-auto">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-medium text-sm py-2.5 rounded-lg transition-colors"
                >
                  <KeyRound className="w-4 h-4" />
                  {loading ? "Verifying..." : "Verify OTP"}
                </button>

                <button
                  type="button"
                  onClick={() => setStep("register")}
                  className="w-full flex items-center justify-center gap-2 border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium text-sm py-2.5 rounded-lg transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

export default Register;