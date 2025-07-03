import React, { useEffect, useMemo, useState, useCallback } from "react";
import useArticles from "@/hooks/useArticles";
import ArticleCard from "@/components/ArticleCard";
import Pagination from "@/components/common/Pagination";
import { preferencesApi } from "@/api/axios";
import { UserPreference } from "@/types/api";
import PreferencesPanel from "@/components/PreferencesPanel";

const PersonalFeed: React.FC = () => {
  const initialFeedFilters = useMemo(() => ({}), []);

  const {
    articles,
    paginationMeta,
    loading,
    error,
    handlePageChange,
    fetchArticles,
  } = useArticles({
    isPersonalizedFeed: true,
    initialFilters: initialFeedFilters,
    enabled: true,
  });

  const [userPreferences, setUserPreferences] = useState<UserPreference | null>(
    null
  );
  const [loadingPreferences, setLoadingPreferences] = useState<boolean>(true);
  const [preferencesError, setPreferencesError] = useState<string | null>(null);
  const [isPreferencesPanelOpen, setIsPreferencesPanelOpen] =
    useState<boolean>(false);

  // Fetch User Preferences
  const fetchUserPreferences = useCallback(async () => {
    setLoadingPreferences(true);
    setPreferencesError(null);
    try {
      const response = await preferencesApi.getPreferences();
      setUserPreferences(response.data);
    } catch (error: any) {
      console.error("Failed to fetch user preferences:", error);
      setPreferencesError(
        error.response?.data?.message || "Failed to load preferences."
      );
    } finally {
      setLoadingPreferences(false);
    }
  }, []);

  // Initial fetch for personalized feed and user preferences
  useEffect(() => {
    fetchArticles();
    fetchUserPreferences();
  }, [fetchArticles, fetchUserPreferences]);

  const handlePreferencesSaved = useCallback(() => {
    fetchArticles();
    setIsPreferencesPanelOpen(false);
  }, [fetchArticles]);

  const renderContent = () => {
    if (loading || loadingPreferences) {
      return (
        <div className="text-center py-8 text-gray-600">
          Loading articles...
        </div>
      );
    }
    if (error) {
      return <div className="text-center py-8 text-red-600">{error}</div>;
    }
    if (preferencesError) {
      return (
        <div className="text-center py-8 text-red-600">{preferencesError}</div>
      );
    }

    const hasPreferences =
      userPreferences &&
      ((userPreferences.preferred_sources &&
        userPreferences.preferred_sources.length > 0) ||
        (userPreferences.preferred_categories &&
          userPreferences.preferred_categories.length > 0) ||
        (userPreferences.preferred_authors &&
          userPreferences.preferred_authors.length > 0));

    if (!articles?.length) {
      if (!hasPreferences) {
        return (
          <div className="text-center py-8 text-gray-600">
            No preferences set. Displaying general news.
            <button
              onClick={() => setIsPreferencesPanelOpen(true)}
              className="block mx-auto mt-4 px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
            >
              Set Your Preferences
            </button>
          </div>
        );
      } else {
        return (
          <div className="text-center py-8 text-gray-600">
            No articles found matching your personalized preferences. Try
            adjusting your preferences or checking back later.
          </div>
        );
      }
    }
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {articles.map((article) => (
          <ArticleCard key={article.id} article={article} />
        ))}
      </div>
    );
  };

  return (
    <section className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-semibold text-gray-800 mb-6 flex justify-between items-center">
        Personalized News Feed
        <button
          onClick={() => setIsPreferencesPanelOpen(true)}
          className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition duration-150 ease-in-out text-sm"
        >
          Manage Preferences
        </button>
      </h2>
      {renderContent()}
      {!loading &&
        !error &&
        !loadingPreferences &&
        !preferencesError &&
        articles?.length > 0 && (
          <Pagination
            paginationMeta={paginationMeta}
            onPageChange={(page) => handlePageChange(page, {})}
          />
        )}

      {/* Render the PreferencesPanel */}
      <PreferencesPanel
        isOpen={isPreferencesPanelOpen}
        onClose={() => setIsPreferencesPanelOpen(false)}
        onPreferencesSaved={handlePreferencesSaved}
      />
    </section>
  );
};

export default PersonalFeed;
