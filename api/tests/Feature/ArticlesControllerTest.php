<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use App\Models\Article;
use App\Models\Source;
use App\Models\Category;
use App\Models\User;
use Illuminate\Support\Facades\Cache;

class ArticlesControllerTest extends TestCase
{
    use RefreshDatabase;

    protected $user;

    /**
     * Set up the test environment.
     * This method is called before each test.
     */
    protected function setUp(): void
    {
        parent::setUp();

        // Clear cache before each test to ensure fresh data fetching
        Cache::flush();

        $this->seedDatabase();

        // Create a user and act as that user for authenticated tests
        $this->user = User::factory()->create();
    }

    /**
     * Seed the database with test data for articles, sources, and categories.
     * This method creates predictable data for testing.
     */
    protected function seedDatabase(): void
    {
        // Create sources
        $source1 = Source::factory()->create(['name' => 'NewsAPI Source', 'api_id' => 'news-api']);
        $source2 = Source::factory()->create(['name' => 'Guardian Source', 'api_id' => 'guardian-api']);
        $source3 = Source::factory()->create(['name' => 'NYT Source', 'api_id' => 'nyt-api']);

        // Create categories
        $category1 = Category::factory()->create(['name' => 'Technology']);
        $category2 = Category::factory()->create(['name' => 'Sports']);
        $category3 = Category::factory()->create(['name' => 'Politics']);

        // Create articles
        Article::factory()->create([
            'title' => 'Tech Innovations 2025',
            'description' => 'Latest in AI and robotics.',
            'content' => 'Detailed content about AI advancements.',
            'author' => 'Alice Smith',
            'source_id' => $source1->id,
            'category_id' => $category1->id,
            'published_at' => now()->subDays(5),
            'url' => 'http://example.com/tech-innovations',
            'url_to_image' => 'http://example.com/tech.jpg',
        ]);

        Article::factory()->create([
            'title' => 'Football World Cup Review',
            'description' => 'Highlights from the recent matches.',
            'content' => 'Analysis of team performances.',
            'author' => 'Bob Johnson',
            'source_id' => $source2->id,
            'category_id' => $category2->id,
            'published_at' => now()->subDays(2),
            'url' => 'http://example.com/football-review',
            'url_to_image' => 'http://example.com/football.jpg',
        ]);

        Article::factory()->create([
            'title' => 'New Political Reforms Proposed',
            'description' => 'Government discusses new policies.',
            'content' => 'Details on the upcoming bill.',
            'author' => 'Alice Smith',
            'source_id' => $source3->id,
            'category_id' => $category3->id,
            'published_at' => now()->subDays(1),
            'url' => 'http://example.com/political-reforms',
            'url_to_image' => 'http://example.com/politics.jpg',
        ]);

        Article::factory()->create([
            'title' => 'Another Tech Article',
            'description' => 'Deep dive into quantum computing.',
            'content' => 'Quantum computing breakthroughs.',
            'author' => 'Charlie Brown',
            'source_id' => $source1->id,
            'category_id' => $category1->id,
            'published_at' => now()->subDays(10),
            'url' => 'http://example.com/another-tech',
            'url_to_image' => 'http://example.com/another-tech.jpg',
        ]);

        Article::factory()->create([
            'title' => 'Local Sports News',
            'description' => 'Community sports events.',
            'content' => 'Upcoming local games.',
            'author' => 'David Lee',
            'source_id' => $source2->id,
            'category_id' => $category2->id,
            'published_at' => now()->subDays(7),
            'url' => 'http://example.com/local-sports',
            'url_to_image' => 'http://example.com/local-sports.jpg',
        ]);
    }

    /**
     * Test if the articles endpoint returns a successful response.
     */
    public function test_articles_endpoint_returns_successful_response(): void
    {
        $response = $this->actingAs($this->user)->getJson('/api/articles'); // Authenticate the request

        $response->assertStatus(200);
        $response->assertJsonStructure([
            'data' => [
                '*' => [
                    'id',
                    'title',
                    'author',
                    'source' => ['name'],
                    'category' => ['name'],
                ]
            ],
            'current_page',
            'last_page',
            'total',
        ]);
    }

    /**
     * Test if articles can be filtered by keyword.
     */
    public function test_articles_can_be_filtered_by_keyword(): void
    {
        $response = $this->actingAs($this->user)->getJson('/api/articles?keyword=tech'); // Authenticate

        $response->assertStatus(200);
        $response->assertJsonCount(2, 'data'); // Expecting 2 tech articles
        $response->assertJsonFragment(['title' => 'Tech Innovations 2025']);
        $response->assertJsonFragment(['title' => 'Another Tech Article']);

        $response = $this->actingAs($this->user)->getJson('/api/articles?keyword=Alice'); // Authenticate
        $response->assertStatus(200);
        $response->assertJsonCount(2, 'data');
        $response->assertJsonFragment(['author' => 'Alice Smith']);
    }

    /**
     * Test if articles can be filtered by date range.
     */
    public function test_articles_can_be_filtered_by_date_range(): void
    {
        // Test 1: Articles published in the last 3 days
        $response = $this->actingAs($this->user)->getJson('/api/articles?start_date=' . now()->subDays(3)->format('Y-m-d')); // Authenticate

        $response->assertStatus(200);
        $response->assertJsonCount(2, 'data'); // Football World Cup Review (2 days ago), Political Reforms (1 day ago)
        $response->assertJsonFragment(['title' => 'Football World Cup Review']);
        $response->assertJsonFragment(['title' => 'New Political Reforms Proposed']);
        $response->assertJsonMissing(['title' => 'Tech Innovations 2025']);

        // Test 2: Articles published on or before 4 days ago
        $response = $this->actingAs($this->user)->getJson('/api/articles?end_date=' . now()->subDays(4)->format('Y-m-d')); // Authenticate
        $response->assertStatus(200);
        $response->assertJsonCount(3, 'data'); // Corrected: Expecting 3 articles (Tech Innovations, Another Tech, Local Sports)
        $response->assertJsonFragment(['title' => 'Tech Innovations 2025']);
        $response->assertJsonFragment(['title' => 'Another Tech Article']);
        $response->assertJsonFragment(['title' => 'Local Sports News']); // Added assertion for the third article
    }

    /**
     * Test if articles can be filtered by category.
     */
    public function test_articles_can_be_filtered_by_category(): void
    {
        $response = $this->actingAs($this->user)->getJson('/api/articles?category=Technology'); // Authenticate

        $response->assertStatus(200);
        $response->assertJsonCount(2, 'data');
        $response->assertJsonFragment(['title' => 'Tech Innovations 2025']);
        $response->assertJsonFragment(['title' => 'Another Tech Article']);
    }

    /**
     * Test if articles can be filtered by source.
     */
    public function test_articles_can_be_filtered_by_source(): void
    {
        $response = $this->actingAs($this->user)->getJson('/api/articles?source=NewsAPI Source'); // Authenticate

        $response->assertStatus(200);
        $response->assertJsonCount(2, 'data');
        $response->assertJsonFragment(['title' => 'Tech Innovations 2025']);
        $response->assertJsonFragment(['title' => 'Another Tech Article']);
    }

    /**
     * Test if articles are paginated.
     */
    public function test_articles_are_paginated(): void
    {
        // Create enough articles to ensure pagination
        Article::factory()->count(20)->create([
            'source_id' => Source::first()->id,
            'category_id' => Category::first()->id,
            'published_at' => now(),
        ]);

        $response = $this->actingAs($this->user)->getJson('/api/articles?per_page=5'); // Authenticate

        $response->assertStatus(200);
        $response->assertJsonCount(5, 'data'); // Should return 5 articles per page
        $response->assertJsonPath('current_page', 1);
        $response->assertJsonPath('per_page', 5); // Corrected: Expecting integer 5
        $response->assertJsonPath('total', 25); // 5 initial + 20 new
        $response->assertJsonPath('last_page', 5);
    }

    /**
     * Test if the articles endpoint uses caching.
     */
    public function test_articles_endpoint_uses_caching(): void
    {
        Cache::flush();

        // First request - should hit the database and store in cache
        $this->actingAs($this->user)->getJson('/api/articles'); // Authenticate

        $cacheKey = 'articles_search_' . md5(json_encode([]));
        $this->assertTrue(Cache::has($cacheKey));

        $firstArticle = Article::first();
        $firstArticle->update(['title' => 'Cached Article Modified']);

        // Second request - should serve from cache, not reflect database change
        $response = $this->actingAs($this->user)->getJson('/api/articles'); // Authenticate
        $response->assertStatus(200);
        $response->assertJsonMissing(['title' => 'Cached Article Modified']);

        // Clear cache and request again - should reflect database change
        Cache::forget($cacheKey);
        $response = $this->actingAs($this->user)->getJson('/api/articles'); // Authenticate
        $response->assertStatus(200);
        $response->assertJsonFragment(['title' => 'Cached Article Modified']);
    }
}
