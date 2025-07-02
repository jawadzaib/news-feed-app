<?php

namespace App\Services\NewsApi;

use App\Models\Article;
use App\Models\Category;
use App\Models\Source;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class NyTimesApiService implements NewsApiService
{
    protected string $apiKey;
    protected string $baseUrl = 'https://api.nytimes.com/svc/search/v2/articlesearch.json';

    public function __construct()
    {
        $this->apiKey = config('services.nyt.key');
    }

    /**
     * Fetch articles from New York Times API and store them.
     *
     * @param array $params Optional parameters for the API request.
     * @return array An array of processed article data.
     */
    public function fetchArticles(array $params = []): array
    {
        if (empty($this->apiKey)) {
            Log::error('New York Times API key is not set.');
            return [];
        }

        try {
            $response = Http::get($this->baseUrl, array_merge([
                'api-key' => $this->apiKey,
                'q' => 'news',
                'fl' => 'web_url,headline,pub_date,byline,snippet,multimedia,_id,news_desk',
                'page' => 0, // Start from page 0
                'sort' => 'newest',
            ], $params));

            $response->throw();

            $articlesData = $response->json('response.docs');
            $processedArticles = [];

            foreach ($articlesData as $articleData) {
                // Skip if url is missing
                if (empty($articleData['web_url']) || empty($articleData['headline']['main'])) {
                    continue;
                }

                // Find or create Source
                $source = Source::firstOrCreate(
                    ['name' => 'New York Times'],
                    ['api_id' => 'new-york-times']
                );

                // Find or create Category based on news_desk
                $categoryName = $articleData['news_desk'] ?? 'General';
                $category = Category::firstOrCreate(['name' => $categoryName]);

                // Extract image URL
                $imageUrl = null;
                if (!empty($articleData['multimedia'])) {
                    foreach ($articleData['multimedia'] as $media) {
                        if (isset($media['url'])) {
                            $imageUrl = 'https://www.nytimes.com/' . $media['url'];
                            break;
                        }
                    }
                }

                // Prepare article data for storage
                $articleToStore = [
                    'source_id' => $source->id,
                    'category_id' => $category->id,
                    'api_article_id' => $articleData['_id'],
                    'author' => $articleData['byline']['original'] ?? null,
                    'title' => substr($articleData['headline']['main'], 0, 255),
                    'description' => $articleData['snippet'] ?? null,
                    'url' => substr($articleData['web_url'], 0, 767),
                    'url_to_image' => $imageUrl,
                    'published_at' => $articleData['pub_date'] ?? null,
                    'content' => $articleData['lead_paragraph'] ?? null, // Using lead_paragraph as content
                ];

                $article = Article::updateOrCreate(
                    ['url' => $articleToStore['url']],
                    $articleToStore
                );

                $processedArticles[] = $article;
            }
            
            return $processedArticles;

        } catch (\Exception $e) {
            Log::error('Error fetching from New York Times API: ' . $e->getMessage(), ['exception' => $e]);
            return [];
        }
    }
}
