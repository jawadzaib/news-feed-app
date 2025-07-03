import React from "react";
import RegisterForm from "@/components/auth/RegisterForm";

const RegisterPage: React.FC = () => {
  return (
    <div className="min-h-screen w-full bg-gray-100 flex items-center justify-center p-4">
      <RegisterForm />
    </div>
  );
};

export default RegisterPage;
