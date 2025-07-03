<?php

namespace Tests\Feature;

use App\Jobs\ScrapeNewsJob;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Cache;
use App\Models\Source;
use App\Models\Category;
use App\Services\NewsApi\GuardianApiService;
use App\Services\NewsApi\NewsApiOrgService;
use App\Services\NewsApi\NyTimesApiService;
use Illuminate\Support\Facades\Log;
use Mockery;

class ScrapeNewsJobTest extends TestCase
{
    use RefreshDatabase;

    /**
     * Set up the test environment.
     * This method is called before each test.
     */
    protected function setUp(): void
    {
        parent::setUp();

        Cache::flush();
        Log::spy();

        // Ensure some categories and sources exist for article creation
        Source::factory()->create(['name' => 'NewsAPI Source']);
        Source::factory()->create(['name' => 'Guardian Source']);
        Source::factory()->create(['name' => 'NYT Source']);
        Category::factory()->create(['name' => 'General']);
        Category::factory()->create(['name' => 'Technology']);
        Category::factory()->create(['name' => 'Sports']);
    }

    /**
     * Test that the command runs successfully and scrapes articles.
     */
    public function test_command_scrapes_articles_successfully(): void
    {
        Http::fake([
            'newsapi.org/*' => Http::response([
                'status' => 'ok',
                'totalResults' => 1,
                'articles' => [
                    [
                        'source' => ['id' => 'abc-news', 'name' => 'ABC News'],
                        'author' => 'Test Author NewsAPI',
                        'title' => 'NewsAPI Article Title',
                        'description' => 'NewsAPI description.',
                        'url' => 'http://newsapi.example.com/article1',
                        'urlToImage' => 'http://newsapi.example.com/image1.jpg',
                        'publishedAt' => now()->toISOString(),
                        'content' => 'NewsAPI content.',
                    ],
                ],
            ], 200),
            'content.guardianapis.com/*' => Http::response([
                'response' => [
                    'status' => 'ok',
                    'total' => 1,
                    'results' => [
                        [
                            'id' => 'guardian/article/1',
                            'type' => 'article',
                            'sectionId' => 'news',
                            'sectionName' => 'News',
                            'webPublicationDate' => now()->toISOString(),
                            'webTitle' => 'Guardian Article Title',
                            'webUrl' => 'http://guardian.example.com/article1',
                            'apiUrl' => 'http://guardian.example.com/api/article1',
                            'fields' => [
                                'byline' => 'Test Author Guardian',
                                'bodyText' => 'Guardian body text.',
                                'thumbnail' => 'http://guardian.example.com/thumbnail1.jpg',
                            ],
                        ],
                    ],
                ],
            ], 200),
            'api.nytimes.com/*' => Http::response([
                'response' => [
                    'docs' => [
                        [
                            'web_url' => 'http://nytimes.example.com/article1',
                            'headline' => ['main' => 'NYT Article Title'],
                            'pub_date' => now()->toISOString(),
                            'byline' => ['original' => 'By Test Author NYT'],
                            'snippet' => 'NYT snippet.',
                            'multimedia' => [['url' => 'images/2025/07/01/nyt-image1.jpg']],
                            '_id' => 'nyt-article-1',
                            'news_desk' => 'World',
                        ],
                    ],
                ],
            ], 200),
        ]);

        // Explicitly create instances of the services
        $newsApiOrgService = new NewsApiOrgService();
        $guardianApiService = new GuardianApiService();
        $nyTimesApiService = new NyTimesApiService();

        // Dispatch and handle the job
        $job = new ScrapeNewsJob();
        $job->handle(
            $newsApiOrgService,
            $guardianApiService,
            $nyTimesApiService
        );
        // Assert that articles were created in the database
        $this->assertDatabaseCount('articles', 3);

        // Assert that sources and categories were created/found
        $this->assertDatabaseHas('sources', ['name' => 'ABC News']);
        $this->assertDatabaseHas('sources', ['name' => 'The Guardian']);
        $this->assertDatabaseHas('sources', ['name' => 'New York Times']);
        $this->assertDatabaseHas('categories', ['name' => 'News']);
        $this->assertDatabaseHas('categories', ['name' => 'World']);

        // Assert that cache was flushed
        $this->assertFalse(Cache::has('articles_search_test_key'));
        $this->assertFalse(Cache::has('all_sources'));
        $this->assertFalse(Cache::has('all_categories'));
        $this->assertFalse(Cache::has('all_authors'));

        Log::shouldHaveReceived('info')->with('Scraping completed successfully (Job). Clearing relevant caches...');
    }

    /**
     * Test that the command handles API errors gracefully and does not clear cache.
     */
    public function test_command_handles_api_errors_and_does_not_clear_cache(): void
    {
        $mockNewsApiOrgService = Mockery::mock(NewsApiOrgService::class);
        $mockNewsApiOrgService->shouldReceive('fetchArticles')->once()->andThrow(new \Exception('Client error: `GET ...` resulted in a `500 Internal Server Error` response.'));

        $mockGuardianApiService = Mockery::mock(GuardianApiService::class);
        $mockGuardianApiService->shouldReceive('fetchArticles')->once()->andReturn([]);

        $mockNyTimesApiService = Mockery::mock(NyTimesApiService::class);
        $mockNyTimesApiService->shouldReceive('fetchArticles')->once()->andReturn([]);


        // Mock one API to fail
        Http::fake([
            'newsapi.org/*' => Http::response([], 500),
            'content.guardianapis.com/*' => Http::response([
                'response' => ['results' => []],
            ], 200),
            'api.nytimes.com/*' => Http::response([
                'response' => ['docs' => []],
            ], 200),
        ]);

        Cache::put('articles_search_test_key', 'dummy_data', 60);
        Cache::put('all_sources', 'dummy_data', 60);

        $job = new ScrapeNewsJob();
        $job->handle(
            $mockNewsApiOrgService,
            $mockGuardianApiService,
            $mockNyTimesApiService
        );
        $this->assertDatabaseCount('articles', 0);

        $this->assertTrue(Cache::has('articles_search_test_key'));
        $this->assertTrue(Cache::has('all_sources'));
    }

    /**
     * Test that the command handles missing API keys gracefully.
     */
    public function test_command_handles_missing_api_keys(): void
    {
        config(['services.newsapi.key' => null]);
        config(['services.guardian.key' => null]);
        config(['services.nyt.key' => null]);

        // Mock the services to return empty arrays when API key is missing
        $mockNewsApiOrgService = Mockery::mock(NewsApiOrgService::class);
        $mockNewsApiOrgService->shouldReceive('fetchArticles')->once()->andThrow(new \Exception('NewsAPI.org API key is not set.'));

        $mockGuardianApiService = Mockery::mock(GuardianApiService::class);
        $mockGuardianApiService->shouldReceive('fetchArticles')->once()->andThrow(new \Exception('The Guardian API key is not set.'));

        $mockNyTimesApiService = Mockery::mock(NyTimesApiService::class);
        $mockNyTimesApiService->shouldReceive('fetchArticles')->once()->andThrow(new \Exception('New York Times API key is not set.'));


        try {
            // Dispatch and handle the job
            $job = new ScrapeNewsJob();
            $job->handle(
                $mockNewsApiOrgService,
                $mockGuardianApiService,
                $mockNyTimesApiService
            );
            // Assert no articles were created
            $this->assertDatabaseCount('articles', 0);
        } finally {
            config(['services.newsapi.key' => 'dummy_key_newsapi']);
            config(['services.guardian.key' => 'dummy_key_guardian']);
            config(['services.nyt.key' => 'dummy_key_nyt']);
        }
    }

    /**
     * Test that the job's failed method logs the exception.
     */
    public function test_job_failed_method_logs_exception(): void
    {
        Log::spy();

        $job = new ScrapeNewsJob();
        $exception = new \RuntimeException('Test Job Failure');

        $job->failed($exception);

        Log::shouldHaveReceived('error')->with('ScrapeNewsJob failed: Test Job Failure', Mockery::any());
    }
}
