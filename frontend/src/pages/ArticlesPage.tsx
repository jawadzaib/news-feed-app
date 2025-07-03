import React, { useState, useEffect, useCallback, useMemo } from "react";
import useArticles from "@/hooks/useArticles";
import ArticleCard from "@/components/ArticleCard";
import Pagination from "@/components/common/Pagination";
import { preferencesApi } from "@/api/axios";
import { Source, Category } from "@/types/api";
import Button from "@/components/common/Button";

const ArticlesPage: React.FC = () => {
  const [keyword, setKeyword] = useState<string>("");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [selectedSource, setSelectedSource] = useState<string>("");

  const [availableSources, setAvailableSources] = useState<Source[]>([]);
  const [availableCategories, setAvailableCategories] = useState<Category[]>(
    []
  );

  const initialSearchFilters = useMemo(() => ({}), []);

  const {
    articles,
    paginationMeta,
    loading,
    error,
    handlePageChange,
    applyFilters,
  } = useArticles({
    isPersonalizedFeed: false,
    initialFilters: initialSearchFilters,
    enabled: true,
  });

  // Fetch available filters (sources, categories)
  useEffect(() => {
    const fetchFilters = async () => {
      try {
        const [sourcesRes, categoriesRes] = await Promise.all([
          preferencesApi.getSources(),
          preferencesApi.getCategories(),
        ]);
        setAvailableSources(sourcesRes.data);
        setAvailableCategories(categoriesRes.data);
      } catch (err) {
        console.error("Failed to fetch filter options:", err);
      }
    };
    fetchFilters();
  }, []);

  const handleSearchSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      applyFilters({
        keyword,
        start_date: startDate,
        end_date: endDate,
        category: selectedCategory,
        source: selectedSource,
      });
    },
    [
      keyword,
      startDate,
      endDate,
      selectedCategory,
      selectedSource,
      applyFilters,
    ]
  );

  const onPageChange = useCallback(
    (page: number) => {
      handlePageChange(page, {
        keyword,
        start_date: startDate,
        end_date: endDate,
        category: selectedCategory,
        source: selectedSource,
      });
    },
    [
      keyword,
      startDate,
      endDate,
      selectedCategory,
      selectedSource,
      handlePageChange,
    ]
  );

  const renderContent = () => {
    if (loading) {
      return (
        <div className="text-center py-8 text-gray-600">
          Loading articles...
        </div>
      );
    }
    if (error) {
      return <div className="text-center py-8 text-red-600">{error}</div>;
    }
    if (articles?.length === 0) {
      return (
        <div className="text-center py-8 text-gray-600">
          No articles found matching your criteria.
        </div>
      );
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
      <h2 className="text-2xl font-semibold text-gray-800 mb-6">
        Search Articles
      </h2>
      <form
        onSubmit={handleSearchSubmit}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6"
      >
        <div>
          <label
            htmlFor="keyword"
            className="block text-sm font-medium text-gray-700"
          >
            Keyword
          </label>
          <input
            type="text"
            id="keyword"
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="Search by title, author, content..."
          />
        </div>
        <div>
          <label
            htmlFor="startDate"
            className="block text-sm font-medium text-gray-700"
          >
            Start Date
          </label>
          <input
            type="date"
            id="startDate"
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </div>
        <div>
          <label
            htmlFor="endDate"
            className="block text-sm font-medium text-gray-700"
          >
            End Date
          </label>
          <input
            type="date"
            id="endDate"
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>
        <div>
          <label
            htmlFor="category"
            className="block text-sm font-medium text-gray-700"
          >
            Category
          </label>
          <select
            id="category"
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            <option value="">All Categories</option>
            {availableCategories.map((cat) => (
              <option key={cat.id} value={cat.name}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label
            htmlFor="source"
            className="block text-sm font-medium text-gray-700"
          >
            Source
          </label>
          <select
            id="source"
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            value={selectedSource}
            onChange={(e) => setSelectedSource(e.target.value)}
          >
            <option value="">All Sources</option>
            {availableSources.map((src) => (
              <option key={src.id} value={src.name}>
                {src.name}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-end">
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Searching..." : "Search"}
          </Button>
        </div>
      </form>
      {renderContent()}
      {!loading && !error && (
        <Pagination
          paginationMeta={paginationMeta}
          onPageChange={onPageChange}
        />
      )}
    </section>
  );
};

export default ArticlesPage;
