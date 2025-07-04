import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import PreferencesPanel from "./PreferencesPanel";

// Mock dependencies
vi.mock("@/api/axios", () => ({
  preferencesApi: {
    getPreferences: vi.fn(),
    getSources: vi.fn(),
    getCategories: vi.fn(),
    getAuthors: vi.fn(),
    savePreferences: vi.fn(),
  },
}));
vi.mock("./common/Button", () => ({
  __esModule: true,
  default: (props: any) => <button {...props}>{props.children}</button>,
}));
import { preferencesApi } from "@/api/axios";

describe("PreferencesPanel", () => {
  const baseSources = [
    { id: 1, name: "Source A" },
    { id: 2, name: "Source B" },
  ];
  const baseCategories = [
    { id: 10, name: "Category X" },
    { id: 20, name: "Category Y" },
  ];
  const baseAuthors = ["Author 1", "Author 2"];
  const basePreferences = {
    preferred_sources: [1],
    preferred_categories: [10],
    preferred_authors: ["Author 1"],
  };
  const onClose = vi.fn();
  const onPreferencesSaved = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (preferencesApi.getPreferences as any).mockResolvedValue({
      data: basePreferences,
    });
    (preferencesApi.getSources as any).mockResolvedValue({ data: baseSources });
    (preferencesApi.getCategories as any).mockResolvedValue({
      data: baseCategories,
    });
    (preferencesApi.getAuthors as any).mockResolvedValue({ data: baseAuthors });
  });

  it("renders and loads preferences and options", async () => {
    render(
      <PreferencesPanel
        isOpen={true}
        onClose={onClose}
        onPreferencesSaved={onPreferencesSaved}
      />
    );
    expect(screen.getByText(/loading preferences/i)).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByText(/your preferences/i)).toBeInTheDocument();
      expect(screen.getByText("Source A")).toBeInTheDocument();
      expect(screen.getByText("Category X")).toBeInTheDocument();
      expect(screen.getByText("Author 1")).toBeInTheDocument();
    });
  });

  it("shows error if loading preferences fails", async () => {
    (preferencesApi.getPreferences as any).mockRejectedValueOnce({
      response: { data: { message: "Failed to load preferences" } },
    });
    render(
      <PreferencesPanel
        isOpen={true}
        onClose={onClose}
        onPreferencesSaved={onPreferencesSaved}
      />
    );
    await waitFor(() => {
      expect(
        screen.getByText(/failed to load preferences/i)
      ).toBeInTheDocument();
    });
  });

  it("allows selecting and saving preferences", async () => {
    (preferencesApi.savePreferences as any).mockResolvedValueOnce({
      data: { message: "Saved!" },
    });
    render(
      <PreferencesPanel
        isOpen={true}
        onClose={onClose}
        onPreferencesSaved={onPreferencesSaved}
      />
    );
    await waitFor(() =>
      expect(screen.getByText("Source B")).toBeInTheDocument()
    );
    fireEvent.click(screen.getByText("Source B"));
    // Save button should appear
    expect(screen.getByRole("button", { name: /save/i })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /save/i }));
    await waitFor(() => {
      expect(preferencesApi.savePreferences).toHaveBeenCalledWith({
        preferred_sources: [1, 2],
        preferred_categories: [10],
        preferred_authors: ["Author 1"],
      });
      expect(onPreferencesSaved).toHaveBeenCalled();
      expect(screen.getByText(/saved!/i)).toBeInTheDocument();
    });
  });

  it("shows error if saving preferences fails", async () => {
    (preferencesApi.savePreferences as any).mockRejectedValueOnce({
      response: { data: { message: "Save failed" } },
    });
    render(
      <PreferencesPanel
        isOpen={true}
        onClose={onClose}
        onPreferencesSaved={onPreferencesSaved}
      />
    );
    await waitFor(() =>
      expect(screen.getByText("Source B")).toBeInTheDocument()
    );
    fireEvent.click(screen.getByText("Source B"));
    fireEvent.click(screen.getByRole("button", { name: /save/i }));
    await waitFor(() => {
      expect(screen.getByText(/save failed/i)).toBeInTheDocument();
    });
  });

  it("calls onClose when overlay or close button is clicked", async () => {
    render(
      <PreferencesPanel
        isOpen={true}
        onClose={onClose}
        onPreferencesSaved={onPreferencesSaved}
      />
    );
    await waitFor(() =>
      expect(screen.getByText("Source B")).toBeInTheDocument()
    );
    fireEvent.click(screen.getByTestId("overlay"));
    // Close button
    fireEvent.click(screen.getAllByRole("button")[0]);
    expect(onClose).toHaveBeenCalled();
  });
});
