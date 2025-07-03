import React, { useState } from "react";
import { authApi } from "@/api/axios";
import { useAuth } from "@/context/AuthContext";
import { RegisterPayload } from "@/types/api";
import Button from "@/components/common/Button";
import { useNavigate } from "react-router-dom";

const RegisterForm: React.FC = () => {
  const [name, setName] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [passwordConfirmation, setPasswordConfirmation] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const payload: RegisterPayload = {
        name,
        email,
        password,
        password_confirmation: passwordConfirmation,
      };
      const response = await authApi.register(payload); // Use authApi.register
      login(response.data.token, response.data.user);
    } catch (err: any) {
      if (err.response && err.response.data && err.response.data.message) {
        setError(err.response.data.message);
      } else if (
        err.response &&
        err.response.data &&
        err.response.data.errors
      ) {
        const errors = err.response.data.errors;
        const errorMessages = Object.values(errors).flat().join(" ");
        setError(errorMessages);
      } else {
        setError("An unexpected error occurred. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-xl border border-gray-200">
      <h2 className="text-3xl font-bold text-center text-gray-800">Register</h2>
      {error && (
        <div className="p-3 text-red-700 bg-red-100 rounded-md border border-red-200 text-sm">
          {error}
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="name"
            className="block text-sm font-medium text-gray-700"
          >
            Name
          </label>
          <input
            type="text"
            id="name"
            className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition duration-150 ease-in-out"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            disabled={loading}
          />
        </div>
        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium text-gray-700"
          >
            Email
          </label>
          <input
            type="email"
            id="email"
            className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition duration-150 ease-in-out"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={loading}
          />
        </div>
        <div>
          <label
            htmlFor="password"
            className="block text-sm font-medium text-gray-700"
          >
            Password
          </label>
          <input
            type="password"
            id="password"
            className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition duration-150 ease-in-out"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={loading}
          />
        </div>
        <div>
          <label
            htmlFor="password_confirmation"
            className="block text-sm font-medium text-gray-700"
          >
            Confirm Password
          </label>
          <input
            type="password"
            id="password_confirmation"
            className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition duration-150 ease-in-out"
            value={passwordConfirmation}
            onChange={(e) => setPasswordConfirmation(e.target.value)}
            required
            disabled={loading}
          />
        </div>
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Registering..." : "Register"}
        </Button>
      </form>
      <p className="text-center text-sm text-gray-600">
        Already have an account?{" "}
        <button
          onClick={() => navigate("/login")}
          className="font-medium text-blue-600 hover:text-blue-500 focus:outline-none focus:underline transition duration-150 ease-in-out"
          disabled={loading}
        >
          Login
        </button>
      </p>
    </div>
  );
};

export default RegisterForm;
