<?php

namespace App\Services\NewsApi;

interface NewsApiService
{
    /**
     * Fetch articles from the respective news API.
     *
     * @param array $params Optional parameters for the API request.
     * @return array An array of processed article data.
     */
    public function fetchArticles(array $params = []): array;
}
