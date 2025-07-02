<?php

namespace App\Services\NewsApi;

use App\Models\Article;
use App\Models\Category;
use App\Models\Source;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class NewsApiOrgService implements NewsApiService
{
    protected string $apiKey;
    protected string $baseUrl = 'https://newsapi.org/v2/';

    public function __construct()
    {
        $this->apiKey = config('services.newsapi.key');
    }

    /**
     * Fetch articles and store them
     *
     * @param array $params Optional
     * @return array An array of processed article data.
     */
    public function fetchArticles(array $params = []): array
    {
        if (empty($this->apiKey)) {
            Log::error('NewsAPI.org API key is not set.');
            return [];
        }

        try {
            $response = Http::withHeaders([
                'X-Api-Key' => $this->apiKey,
            ])->get($this->baseUrl . 'everything', array_merge([
                'q' => 'news',
                'language' => 'en',
                'pageSize' => 100,
            ], $params));

            $response->throw();

            $articlesData = $response->json('articles');
            $processedArticles = [];

            foreach ($articlesData as $articleData) {
                // Skip if url is missing
                if (empty($articleData['url']) || empty($articleData['title'])) {
                    continue;
                }

                // Find or create Source
                $source = Source::firstOrCreate(
                    ['name' => $articleData['source']['name'] ?? 'Unknown Source'],
                    ['api_id' => $articleData['source']['id'] ?? null]
                );

                $category = Category::firstOrCreate(['name' => 'General']);

                // Prepare article data for storage
                $articleToStore = [
                    'source_id' => $source->id,
                    'category_id' => $category->id,
                    'api_article_id' => $articleData['url'], // Using URL as unique ID for now
                    'author' => substr($articleData['author'] ?? 'Unknown', 0, 255), // Truncate author if too long
                    'title' => substr($articleData['title'], 0, 255), // Truncate title if too long
                    'description' => $articleData['description'] ?? null,
                    'url' => substr($articleData['url'], 0, 767), // Truncate URL to fit schema
                    'url_to_image' => $articleData['urlToImage'] ?? null,
                    'published_at' => $articleData['publishedAt'] ?? null,
                    'content' => $articleData['content'] ?? null,
                ];

                // Create or update the article
                $article = Article::updateOrCreate(
                    ['url' => $articleToStore['url']],
                    $articleToStore
                );

                $processedArticles[] = $article;
            }

            return $processedArticles;

        } catch (\Exception $e) {
            Log::error('Error fetching from NewsAPI.org: ' . $e->getMessage(), ['exception' => $e]);
            return [];
        }
    }
}

