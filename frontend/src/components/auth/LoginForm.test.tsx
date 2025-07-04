import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import LoginForm from "./LoginForm";

// Mock dependencies
vi.mock("@/api/axios", () => ({
  authApi: {
    login: vi.fn(),
  },
}));
const mockLogin = vi.fn();
vi.mock("@/context/AuthContext", () => ({
  useAuth: () => ({ login: mockLogin }),
}));
const mockNavigate = vi.fn();
vi.mock("react-router-dom", () => ({
  useNavigate: () => mockNavigate,
}));
import { authApi } from "@/api/axios";

describe("LoginForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders email and password fields", () => {
    render(<LoginForm />);
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /login/i })).toBeInTheDocument();
  });

  it("allows user to type in email and password", () => {
    render(<LoginForm />);
    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    fireEvent.change(emailInput, { target: { value: "test@example.com" } });
    fireEvent.change(passwordInput, { target: { value: "secret" } });
    expect(emailInput).toHaveValue("test@example.com");
    expect(passwordInput).toHaveValue("secret");
  });

  it("submits and logs in successfully", async () => {
    (authApi.login as any).mockResolvedValueOnce({
      data: {
        token: "token123",
        user: { id: 1, name: "Test", email: "test@example.com" },
      },
    });
    render(<LoginForm />);
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: "test@example.com" },
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: "secret" },
    });
    fireEvent.click(screen.getByRole("button", { name: /login/i }));
    await waitFor(() => {
      expect(authApi.login).toHaveBeenCalledWith({
        email: "test@example.com",
        password: "secret",
      });
      expect(mockLogin).toHaveBeenCalledWith("token123", {
        id: 1,
        name: "Test",
        email: "test@example.com",
      });
      expect(mockNavigate).toHaveBeenCalledWith("/");
    });
  });

  it("shows error message on API error", async () => {
    (authApi.login as any).mockRejectedValueOnce({
      response: { data: { message: "Invalid credentials" } },
    });
    render(<LoginForm />);
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: "fail@example.com" },
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: "wrong" },
    });
    fireEvent.click(screen.getByRole("button", { name: /login/i }));
    await waitFor(() => {
      expect(screen.getByText(/invalid credentials/i)).toBeInTheDocument();
    });
  });

  it("navigates to register page when Register button is clicked", () => {
    render(<LoginForm />);
    fireEvent.click(screen.getByRole("button", { name: /register/i }));
    expect(mockNavigate).toHaveBeenCalledWith("/register");
  });
});
