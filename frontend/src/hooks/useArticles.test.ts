import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import useArticles from './useArticles';
import { newsApi } from '@/api/axios';

vi.mock('@/api/axios', () => {
  return {
    newsApi: {
      getArticles: vi.fn(),
      getPersonalizedFeed: vi.fn(),
    },
  };
});

const mockArticlesResponse = {
  data: {
    data: [
      { id: 1, title: 'Article 1' },
      { id: 2, title: 'Article 2' },
    ],
    current_page: 1,
    total: 2,
    per_page: 10,
    last_page: 1,
  },
};

const mockPersonalizedResponse = {
  data: {
    data: [
      { id: 3, title: 'Personalized 1' },
    ],
    current_page: 1,
    total: 1,
    per_page: 10,
    last_page: 1,
  },
};

describe('useArticles', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches articles on mount (default feed)', async () => {
    (newsApi.getArticles as any).mockResolvedValueOnce(mockArticlesResponse);
    const { result } = renderHook(() => useArticles());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.articles).toHaveLength(2);
    expect(result.current.articles[0].title).toBe('Article 1');
    expect(newsApi.getArticles).toHaveBeenCalledWith({ page: 1 });
  });

  it('fetches personalized feed if isPersonalizedFeed is true', async () => {
    (newsApi.getPersonalizedFeed as any).mockResolvedValueOnce(mockPersonalizedResponse);
    const { result } = renderHook(() => useArticles({ isPersonalizedFeed: true }));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.articles).toHaveLength(1);
    expect(result.current.articles[0].title).toBe('Personalized 1');
    expect(newsApi.getPersonalizedFeed).toHaveBeenCalledWith({ page: 1 });
  });

  it('sets error if API call fails', async () => {
    (newsApi.getArticles as any).mockRejectedValueOnce({ response: { data: { message: 'API Error' } } });
    const { result } = renderHook(() => useArticles());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(['API Error', 'Failed to load articles.']).toContain(result.current.error);
    expect(result.current.articles).toHaveLength(0);
  });

  it('applies filters and fetches new articles', async () => {
    (newsApi.getArticles as any)
      .mockResolvedValueOnce(mockArticlesResponse)
      .mockResolvedValueOnce({
        data: {
          data: [{ id: 10, title: 'Filtered' }],
          current_page: 1,
          total: 1,
          per_page: 10,
          last_page: 1,
        },
      });
    const { result } = renderHook(() => useArticles());
    await waitFor(() => expect(result.current.loading).toBe(false));
    await act(async () => {
      result.current.applyFilters({ keyword: 'test' });
    });
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(newsApi.getArticles).toHaveBeenLastCalledWith({ page: 1, keyword: 'test' });
    expect(result.current.articles[0].title).toBe('Filtered');
  });

  it('handles page change', async () => {
    (newsApi.getArticles as any)
      .mockResolvedValueOnce(mockArticlesResponse)
      .mockResolvedValueOnce({
        data: {
          data: [{ id: 20, title: 'Page 2' }],
          current_page: 2,
          total: 1,
          per_page: 10,
          last_page: 2,
        },
      });
    const { result } = renderHook(() => useArticles());
    await waitFor(() => expect(result.current.loading).toBe(false));
    await act(async () => {
      result.current.handlePageChange(2, {});
    });
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(newsApi.getArticles).toHaveBeenLastCalledWith({ page: 2 });
    expect(result.current.currentPage).toBe(2);
    expect(result.current.articles[0].title).toBe('Page 2');
  });

  it('does not fetch if enabled is false', async () => {
    const { result } = renderHook(() => useArticles({ enabled: false }));
    expect(result.current.loading).toBe(false);
    expect(newsApi.getArticles).not.toHaveBeenCalled();
  });
});