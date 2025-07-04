import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { AuthProvider, useAuth } from "./AuthContext";
import api, { authApi } from "@/api/axios";
import React from "react";

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
  };
})();
Object.defineProperty(window, "localStorage", { value: localStorageMock });

// Mock console
const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

// Mock API calls
const mockCsrfCookieFetch = vi
  .spyOn(api, "get")
  .mockResolvedValue({ data: {} });
const mockFetchUser = vi.spyOn(authApi, "fetchUser");
const mockLogoutApi = vi.spyOn(authApi, "logout");

const TestConsumer: React.FC = () => {
  const { user, token, isAuthenticated, login, logout, loading } = useAuth();

  return (
    <div>
      <span data-testid="loading">
        {loading ? "Loading..." : "Finished Loading"}
      </span>
      <span data-testid="isAuthenticated">
        {isAuthenticated ? "Authenticated" : "Not Authenticated"}
      </span>
      <span data-testid="user-email">{user ? user.email : "No User"}</span>
      <span data-testid="token">{token || "No Token"}</span>
      <button
        data-testid="login-button"
        onClick={() =>
          login("new-token", {
            id: 1,
            name: "Test User",
            email: "test@example.com",
          })
        }
      >
        Login
      </button>
      <button data-testid="logout-button" onClick={logout}>
        Logout
      </button>
    </div>
  );
};

describe("AuthContext", () => {
  beforeEach(() => {
    localStorageMock.clear();
    localStorageMock.getItem.mockClear();
    localStorageMock.setItem.mockClear();
    localStorageMock.removeItem.mockClear();

    mockCsrfCookieFetch.mockClear();
    mockFetchUser.mockClear();
    mockLogoutApi.mockClear();

    // Set default mock implementations for API calls
    mockCsrfCookieFetch.mockResolvedValue({ data: {} });
    mockFetchUser.mockResolvedValue({
      data: { id: 1, name: "Fetched User", email: "fetched@example.com" },
    } as any);
    mockLogoutApi.mockResolvedValue({ data: {} } as any);
  });

  afterEach(() => {
    consoleErrorSpy.mockClear();
  });

  it("initializes with loading true and then fetches CSRF cookie and user if token exists", async () => {
    localStorageMock.setItem("authToken", "existing-token");

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    // Should initially be loading
    expect(screen.getByTestId("loading")).toHaveTextContent("Loading...");

    // Wait for useEffect to complete
    await waitFor(() => {
      expect(screen.getByTestId("loading")).toHaveTextContent(
        "Finished Loading"
      );
    });

    // CSRF cookie should be fetched
    expect(mockCsrfCookieFetch).toHaveBeenCalledWith("/sanctum/csrf-cookie");
    // User data should be fetched because a token exists
    expect(mockFetchUser).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId("isAuthenticated")).toHaveTextContent(
      "Authenticated"
    );
    expect(screen.getByTestId("user-email")).toHaveTextContent(
      "fetched@example.com"
    );
    expect(screen.getByTestId("token")).toHaveTextContent("existing-token");
  });

  it("initializes with loading true and then sets isAuthenticated to false if no token", async () => {
    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    expect(screen.getByTestId("loading")).toHaveTextContent("Loading...");

    await waitFor(() => {
      expect(screen.getByTestId("loading")).toHaveTextContent(
        "Finished Loading"
      );
    });

    expect(mockCsrfCookieFetch).toHaveBeenCalledWith("/sanctum/csrf-cookie");
    expect(mockFetchUser).not.toHaveBeenCalled();
    expect(screen.getByTestId("isAuthenticated")).toHaveTextContent(
      "Not Authenticated"
    );
    expect(screen.getByTestId("user-email")).toHaveTextContent("No User");
    expect(screen.getByTestId("token")).toHaveTextContent("No Token");
  });

  it("calls login function to set user, token, and isAuthenticated", async () => {
    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    // Wait for initial loading to finish
    await waitFor(() =>
      expect(screen.getByTestId("loading")).toHaveTextContent(
        "Finished Loading"
      )
    );

    fireEvent.click(screen.getByTestId("login-button"));

    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      "authToken",
      "new-token"
    );
    expect(screen.getByTestId("isAuthenticated")).toHaveTextContent(
      "Authenticated"
    );
    expect(screen.getByTestId("user-email")).toHaveTextContent(
      "test@example.com"
    );
    expect(screen.getByTestId("token")).toHaveTextContent("new-token");
  });

  it("calls logout function to clear user, token, and isAuthenticated", async () => {
    localStorageMock.setItem("authToken", "existing-token");
    mockFetchUser.mockResolvedValue({
      data: { id: 1, name: "Logged In", email: "logged@example.com" },
    } as any);

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    await waitFor(() =>
      expect(screen.getByTestId("isAuthenticated")).toHaveTextContent(
        "Authenticated"
      )
    );

    fireEvent.click(screen.getByTestId("logout-button"));

    await waitFor(() => {
      expect(mockLogoutApi).toHaveBeenCalledTimes(1);
      expect(localStorageMock.removeItem).toHaveBeenCalledWith("authToken");
      expect(screen.getByTestId("isAuthenticated")).toHaveTextContent(
        "Not Authenticated"
      );
      expect(screen.getByTestId("user-email")).toHaveTextContent("No User");
      expect(screen.getByTestId("token")).toHaveTextContent("No Token");
    });
  });

  it("handles user fetch failure during initialization by logging out", async () => {
    localStorageMock.setItem("authToken", "invalid-token");
    mockFetchUser.mockRejectedValue(new Error("Invalid token"));

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId("loading")).toHaveTextContent(
        "Finished Loading"
      );
    });

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "Failed to fetch user data with token:",
      expect.any(Error)
    );
    expect(localStorageMock.removeItem).toHaveBeenCalledWith("authToken");
    expect(screen.getByTestId("isAuthenticated")).toHaveTextContent(
      "Not Authenticated"
    );
  });

  it("handles CSRF cookie fetch failure during initialization", async () => {
    mockCsrfCookieFetch.mockRejectedValue(new Error("CSRF fetch failed"));

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId("loading")).toHaveTextContent(
        "Finished Loading"
      );
    });

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "Failed to fetch CSRF cookie or initialize auth:",
      expect.any(Error)
    );
    expect(screen.getByTestId("isAuthenticated")).toHaveTextContent(
      "Not Authenticated"
    );
  });
});
