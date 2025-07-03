import React from "react";
import LoginForm from "@/components/auth/LoginForm";

const LoginPage: React.FC = () => {
  return (
    <div className="min-h-screen w-full bg-gray-100 flex items-center justify-center p-4">
      <LoginForm />
    </div>
  );
};

export default LoginPage;
