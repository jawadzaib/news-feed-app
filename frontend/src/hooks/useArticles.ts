import { useState, useEffect, useCallback, useRef } from 'react';
import { newsApi } from '@/api/axios';
import { Article, PaginatedResponse } from '@/types/api';

interface ArticleFilters {
  keyword?: string;
  start_date?: string;
  end_date?: string;
  category?: string;
  source?: string;
  per_page?: number;
}

interface UseArticlesOptions {
  isPersonalizedFeed?: boolean;
  initialFilters?: ArticleFilters;
  enabled?: boolean;
}

const useArticles = (options?: UseArticlesOptions) => {
  const { isPersonalizedFeed = false, initialFilters = {}, enabled = true } = options || {};

  const [loading, setLoading] = useState<boolean>(false);
  const [articles, setArticles] = useState<Article[]>([]);
  const [paginationMeta, setPaginationMeta] = useState<PaginatedResponse<Article> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Use a ref to hold the latest currentPage value.
  const currentPageRef = useRef(currentPage);
  useEffect(() => {
    currentPageRef.current = currentPage;
  }, [currentPage]);

  // Memoize the core fetch logic to ensure its reference is stable
  const memoizedFetchLogic = useCallback(async (page: number, filters: ArticleFilters) => {
    if (!enabled) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const params: Record<string, any> = { page, ...filters };

      Object.keys(params).forEach(key => {
        if (params[key] === '' || params[key] === null || params[key] === undefined) {
          delete params[key];
        }
      });

      const response = isPersonalizedFeed
        ? await newsApi.getPersonalizedFeed(params)
        : await newsApi.getArticles(params);

      setArticles(response.data.data);
      setPaginationMeta(response.data);
      setCurrentPage(response.data.current_page);
    } catch (err: any) {
      console.error('Failed to fetch articles:', err);
      setError(err.response?.data?.message || 'Failed to load articles.');
    } finally {
      setLoading(false);
    }
  }, [isPersonalizedFeed, enabled]);

  const fetchArticles = useCallback((page?: number, filters?: ArticleFilters) => {
    memoizedFetchLogic(
      page ?? currentPageRef.current,
      filters ?? initialFilters
    );
  }, [memoizedFetchLogic, initialFilters]);

  useEffect(() => {
    if (enabled) {
      fetchArticles(1, initialFilters);
    }
  }, [fetchArticles, initialFilters, enabled]);

  const handlePageChange = useCallback((page: number, currentFiltersFromComponent: ArticleFilters) => {
    fetchArticles(page, currentFiltersFromComponent);
  }, [fetchArticles]);

  const applyFilters = useCallback((newFilters: ArticleFilters) => {
    fetchArticles(1, newFilters);
  }, [fetchArticles]);

  return {
    articles,
    paginationMeta,
    loading,
    error,
    currentPage,
    fetchArticles,
    handlePageChange,
    applyFilters,
  };
};

export default useArticles;
