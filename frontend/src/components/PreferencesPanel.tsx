import React, { useState, useEffect, useCallback, useRef } from "react";
import { preferencesApi } from "@/api/axios";
import { Source, Category, UserPreference } from "@/types/api";
import Button from "./common/Button";

interface PreferencesPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onPreferencesSaved: () => void;
}

const PreferencesPanel: React.FC<PreferencesPanelProps> = React.memo(({
  isOpen,
  onClose,
  onPreferencesSaved,
}) => {
  const [userPreferences, setUserPreferences] = useState<UserPreference | null>(
    null
  );
  const [initialUserPreferences, setInitialUserPreferences] =
    useState<UserPreference | null>(null);
  const [availableSources, setAvailableSources] = useState<Source[]>([]);
  const [availableCategories, setAvailableCategories] = useState<Category[]>(
    []
  );
  const [availableAuthors, setAvailableAuthors] = useState<string[]>([]);
  const [loadingPreferences, setLoadingPreferences] = useState<boolean>(true);
  const [preferencesError, setPreferencesError] = useState<string | null>(null);
  const [savingStatus, setSavingStatus] = useState<
    "idle" | "saving" | "success" | "error"
  >("idle");
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  const saveMessageTimeoutRef = useRef<number | null>(null);

  const hasUnsavedChanges = React.useMemo(() => {
    if (!userPreferences || !initialUserPreferences) return false;


    // Deep comparison of preference arrays
    const areSourcesEqual =
      JSON.stringify(userPreferences.preferred_sources.sort()) ===
      JSON.stringify(initialUserPreferences.preferred_sources.sort());
    const areCategoriesEqual =
      JSON.stringify(userPreferences.preferred_categories.sort()) ===
      JSON.stringify(initialUserPreferences.preferred_categories.sort());
    const areAuthorsEqual =
      JSON.stringify(userPreferences.preferred_authors.sort()) ===
      JSON.stringify(initialUserPreferences.preferred_authors.sort());

    return !(areSourcesEqual && areCategoriesEqual && areAuthorsEqual);
  }, [userPreferences, initialUserPreferences]);

  const handleSavePreferences = useCallback(async () => {
    if (!userPreferences) return;

    if (saveMessageTimeoutRef.current) {
      clearTimeout(saveMessageTimeoutRef.current);
    }

    setSavingStatus("saving");
    setSaveMessage("Saving preferences...");
    try {
      const payload = {
        preferred_sources: userPreferences.preferred_sources,
        preferred_categories: userPreferences.preferred_categories,
        preferred_authors: userPreferences.preferred_authors,
      };
      const response = await preferencesApi.savePreferences(payload);
      setSavingStatus("success");
      setSaveMessage(response.data.message);
      setInitialUserPreferences(userPreferences);
      onPreferencesSaved();
    } catch (error: any) {
      console.error("Failed to save preferences:", error);
      setSavingStatus("error");
      setSaveMessage(
        error.response?.data?.message || "Failed to save preferences."
      );
    } finally {
      saveMessageTimeoutRef.current = window.setTimeout(() => {
        setSavingStatus("idle");
        setSaveMessage(null);
      }, 2000);
    }
  }, [userPreferences, onPreferencesSaved]);

  // Fetch User Preferences
  const fetchUserPreferences = useCallback(async () => {
    setLoadingPreferences(true);
    setPreferencesError(null);
    try {
      const response = await preferencesApi.getPreferences();
      setUserPreferences(response.data);
      setInitialUserPreferences(response.data);
    } catch (error: any) {
      console.error("Failed to fetch user preferences:", error);
      setPreferencesError(
        error.response?.data?.message || "Failed to load preferences."
      );
    } finally {
      setLoadingPreferences(false);
    }
  }, []);

  // Fetch Available Sources, Categories, Authors
  useEffect(() => {
    if (isOpen) {
      const fetchAvailableOptions = async () => {
        try {
          const [sourcesRes, categoriesRes, authorsRes] = await Promise.all([
            preferencesApi.getSources(),
            preferencesApi.getCategories(),
            preferencesApi.getAuthors(),
          ]);
          setAvailableSources(sourcesRes.data);
          setAvailableCategories(categoriesRes.data);
          setAvailableAuthors(authorsRes.data);
        } catch (err) {
          console.error("Failed to fetch available options:", err);
        }
      };
      fetchUserPreferences();
      fetchAvailableOptions();
    }
  }, [isOpen, fetchUserPreferences]);

  const handlePreferenceChange = (
    type: "sources" | "categories" | "authors",
    value: number | string
  ) => {
    setUserPreferences((prev: any) => {
      if (!prev) return null;

      const currentArray = prev[`preferred_${type}`] || [];
      const updatedArray = currentArray.includes(value as any)
        ? currentArray.filter((item: any) => item !== value)
        : [...currentArray, value as any];

      return { ...prev, [`preferred_${type}`]: updatedArray };
    });
  };

  return (
    <div
      className={`fixed inset-0 z-50 transform transition-transform duration-300 ease-in-out ${
        isOpen ? "translate-x-0" : "translate-x-full"
      }`}
    >
      {isOpen && (
        <div
          className="absolute inset-0 bg-gray-900/80"
          onClick={onClose}
          data-testid="overlay"
        ></div>
      )}

      {/* Panel content */}
      <div className="fixed top-0 right-0 w-full md:w-1/2 lg:w-1/3 h-full bg-white shadow-xl p-6 overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold text-gray-800">
            Your Preferences
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 focus:outline-none"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M6 18L18 6M6 6l12 12"
              ></path>
            </svg>
          </button>
        </div>

        {(hasUnsavedChanges || savingStatus !== "idle") && (
          <div
            className={`p-3 rounded-md border text-sm mb-4 flex items-center justify-between ${
              savingStatus === "saving"
                ? "bg-blue-100 text-blue-700 border-blue-200"
                : savingStatus === "success"
                ? "bg-green-100 text-green-700 border-green-200"
                : savingStatus === "error"
                ? "bg-red-100 text-red-700 border-red-200"
                : "bg-yellow-100 text-yellow-700 border-yellow-200"
            }`}
          >
            <span>
              {savingStatus === "saving" &&
                (saveMessage || "Saving preferences...")}
              {savingStatus === "success" &&
                (saveMessage || "Preferences saved successfully!")}
              {savingStatus === "error" &&
                (saveMessage || "Failed to save preferences.")}
              {savingStatus === "idle" &&
                hasUnsavedChanges &&
                "There are unsaved changes."}
            </span>
            {hasUnsavedChanges && (
              <Button
                onClick={handleSavePreferences}
                disabled={savingStatus === "saving"}
              >
                Save
              </Button>
            )}
          </div>
        )}

        {loadingPreferences ? (
          <div className="text-center text-gray-600">
            Loading preferences...
          </div>
        ) : preferencesError ? (
          <div className="text-center text-red-600">{preferencesError}</div>
        ) : (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-700 mb-2">
                Preferred Sources
              </h3>
              <div className="flex flex-wrap gap-2">
                {availableSources.map((source) => (
                  <button
                    key={source.id}
                    onClick={() => handlePreferenceChange("sources", source.id)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition duration-150 ease-in-out ${
                      userPreferences?.preferred_sources?.includes(source.id)
                        ? "bg-blue-500 text-white"
                        : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                    }`}
                    disabled={savingStatus === "saving"}
                  >
                    {source.name}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-lg font-medium text-gray-700 mb-2">
                Preferred Categories
              </h3>
              <div className="flex flex-wrap gap-2">
                {availableCategories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() =>
                      handlePreferenceChange("categories", category.id)
                    }
                    className={`px-4 py-2 rounded-full text-sm font-medium transition duration-150 ease-in-out ${
                      userPreferences?.preferred_categories?.includes(
                        category.id
                      )
                        ? "bg-blue-500 text-white"
                        : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                    }`}
                    disabled={savingStatus === "saving"}
                  >
                    {category.name}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-lg font-medium text-gray-700 mb-2">
                Preferred Authors
              </h3>
              <div className="flex flex-wrap gap-2">
                {availableAuthors.map((author) => (
                  <button
                    key={author}
                    onClick={() => handlePreferenceChange("authors", author)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition duration-150 ease-in-out ${
                      userPreferences?.preferred_authors?.includes(author)
                        ? "bg-blue-500 text-white"
                        : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                    }`}
                    disabled={savingStatus === "saving"}
                  >
                    {author}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
});

export default PreferencesPanel;
