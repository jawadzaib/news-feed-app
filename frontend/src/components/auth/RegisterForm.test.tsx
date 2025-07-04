import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import RegisterForm from "./RegisterForm";

// Mock dependencies
vi.mock("@/api/axios", () => ({
  authApi: {
    register: vi.fn(),
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

describe("RegisterForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders all input fields", () => {
    render(<RegisterForm />);
    expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^email$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /register/i })
    ).toBeInTheDocument();
  });

  it("allows user to type in all fields", () => {
    render(<RegisterForm />);
    fireEvent.change(screen.getByLabelText(/name/i), {
      target: { value: "Test User" },
    });
    fireEvent.change(screen.getByLabelText(/^email$/i), {
      target: { value: "test@example.com" },
    });
    fireEvent.change(screen.getByLabelText(/^password$/i), {
      target: { value: "secret" },
    });
    fireEvent.change(screen.getByLabelText(/confirm password/i), {
      target: { value: "secret" },
    });
    expect(screen.getByLabelText(/name/i)).toHaveValue("Test User");
    expect(screen.getByLabelText(/^email$/i)).toHaveValue("test@example.com");
    expect(screen.getByLabelText(/^password$/i)).toHaveValue("secret");
    expect(screen.getByLabelText(/confirm password/i)).toHaveValue("secret");
  });

  it("submits and registers successfully", async () => {
    (authApi.register as any).mockResolvedValueOnce({
      data: {
        token: "token123",
        user: { id: 1, name: "Test", email: "test@example.com" },
      },
    });
    render(<RegisterForm />);
    fireEvent.change(screen.getByLabelText(/name/i), {
      target: { value: "Test User" },
    });
    fireEvent.change(screen.getByLabelText(/^email$/i), {
      target: { value: "test@example.com" },
    });
    fireEvent.change(screen.getByLabelText(/^password$/i), {
      target: { value: "secret" },
    });
    fireEvent.change(screen.getByLabelText(/confirm password/i), {
      target: { value: "secret" },
    });
    fireEvent.click(screen.getByRole("button", { name: /register/i }));
    await waitFor(() => {
      expect(authApi.register).toHaveBeenCalledWith({
        name: "Test User",
        email: "test@example.com",
        password: "secret",
        password_confirmation: "secret",
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
    (authApi.register as any).mockRejectedValueOnce({
      response: { data: { message: "Registration failed" } },
    });
    render(<RegisterForm />);
    fireEvent.change(screen.getByLabelText(/name/i), {
      target: { value: "Test User" },
    });
    fireEvent.change(screen.getByLabelText(/^email$/i), {
      target: { value: "fail@example.com" },
    });
    fireEvent.change(screen.getByLabelText(/^password$/i), {
      target: { value: "wrong" },
    });
    fireEvent.change(screen.getByLabelText(/confirm password/i), {
      target: { value: "wrong" },
    });
    fireEvent.click(screen.getByRole("button", { name: /register/i }));
    await waitFor(() => {
      expect(screen.getByText(/registration failed/i)).toBeInTheDocument();
    });
  });

  it("navigates to login page when Login button is clicked", () => {
    render(<RegisterForm />);
    fireEvent.click(screen.getByRole("button", { name: /^login$/i }));
    expect(mockNavigate).toHaveBeenCalledWith("/login");
  });
});
