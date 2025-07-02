<?php

namespace App\Services\NewsApi;

use App\Models\Article;
use App\Models\Category;
use App\Models\Source;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class GuardianApiService implements NewsApiService
{
    protected string $apiKey;
    protected string $baseUrl = 'https://content.guardianapis.com/';

    public function __construct()
    {
        $this->apiKey = config('services.guardian.key');
    }

    /**
     * Fetch articles from The Guardian API and store them.
     *
     * @param array $params Optional parameters for the API request.
     * @return array An array of processed article data.
     */
    public function fetchArticles(array $params = []): array
    {
        if (empty($this->apiKey)) {
            Log::error('The Guardian API key is not set.');
            return [];
        }

        try {
            $response = Http::get($this->baseUrl . 'search', array_merge([
                'api-key' => $this->apiKey,
                'q' => 'news',
                'show-fields' => 'bodyText,byline,thumbnail',
                'page-size' => 50,
            ], $params));

            $response->throw();

            $articlesData = $response->json('response.results');
            $processedArticles = [];

            foreach ($articlesData as $articleData) {
                // Skip if url is missing
                if (empty($articleData['webUrl']) || empty($articleData['webTitle'])) {
                    continue;
                }

                // Find or create Source
                $source = Source::firstOrCreate(
                    ['name' => 'The Guardian'],
                    ['api_id' => 'the-guardian']
                );

                $categoryName = $articleData['sectionName'] ?? 'General';
                $category = Category::firstOrCreate(['name' => $categoryName]);

                // Prepare article data for storage
                $articleToStore = [
                    'source_id' => $source->id,
                    'category_id' => $category->id,
                    'api_article_id' => $articleData['id'],
                    'author' => $articleData['fields']['byline'] ?? null,
                    'title' => substr($articleData['webTitle'], 0, 255),
                    'description' => null, // Guardian API search results don't always have a distinct description
                    'url' => substr($articleData['webUrl'], 0, 767),
                    'url_to_image' => $articleData['fields']['thumbnail'] ?? null,
                    'published_at' => $articleData['webPublicationDate'] ?? null,
                    'content' => $articleData['fields']['bodyText'] ?? null,
                ];

                $article = Article::updateOrCreate(
                    ['url' => $articleToStore['url']],
                    $articleToStore
                );

                $processedArticles[] = $article;
            }

            return $processedArticles;

        } catch (\Exception $e) {
            Log::error('Error fetching from The Guardian API: ' . $e->getMessage(), ['exception' => $e]);
            return [];
        }
    }
}