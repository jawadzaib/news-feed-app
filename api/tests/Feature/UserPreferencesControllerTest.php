<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\WithFaker;
use Tests\TestCase;
use App\Models\User;
use App\Models\UserPreference;
use App\Models\Source;
use App\Models\Category;
use App\Models\Article;
use Illuminate\Support\Facades\Cache;

class UserPreferencesControllerTest extends TestCase
{
    use RefreshDatabase, WithFaker;

    protected $user;

    /**
     * Set up the test environment.
     * This method is called before each test.
     */
    protected function setUp(): void
    {
        parent::setUp();

        Cache::flush();

        $this->user = User::factory()->create();

        $this->seedBasicData();
    }

    /**
     * Seed basic data for sources, categories, and articles.
     */
    protected function seedBasicData(): void
    {
        Source::factory()->create(['name' => 'Source A']);
        Source::factory()->create(['name' => 'Source B']);
        Category::factory()->create(['name' => 'Category X']);
        Category::factory()->create(['name' => 'Category Y']);

        Article::factory()->count(10)->create([
            'source_id' => Source::all()->random()->id,
            'category_id' => Category::all()->random()->id,
            'author' => $this->faker->name,
            'published_at' => now()->subDays(rand(1, 30)),
        ]);
    }

    /**
     * Test getting user preferences when none are set.
     */
    public function test_show_preferences_returns_empty_when_no_preferences_set(): void
    {
        $response = $this->actingAs($this->user)->getJson('/api/preferences');

        $response->assertStatus(200);
        $response->assertJson([
            'preferred_sources' => [],
            'preferred_categories' => [],
            'preferred_authors' => [],
        ]);
    }

    /**
     * Test storing new user preferences.
     */
    public function test_store_preferences_creates_new_preferences(): void
    {
        $source = Source::factory()->create();
        $category = Category::factory()->create();
        $author = 'Test Author';

        $payload = [
            'preferred_sources' => [$source->id],
            'preferred_categories' => [$category->id],
            'preferred_authors' => [$author],
        ];

        $response = $this->actingAs($this->user)->postJson('/api/preferences', $payload);

        $response->assertStatus(200);
        $response->assertJson([
            'message' => 'Preferences saved successfully.',
            'preferences' => [
                'user_id' => $this->user->id,
                'preferred_sources' => [$source->id],
                'preferred_categories' => [$category->id],
                'preferred_authors' => [$author],
            ],
        ]);
    }

    /**
     * Test updating existing user preferences.
     */
    public function test_store_preferences_updates_existing_preferences(): void
    {
        // Create initial preferences
        $initialSource = Source::factory()->create();
        $initialCategory = Category::factory()->create();
        UserPreference::factory()->create([
            'user_id' => $this->user->id,
            'preferred_sources' => [$initialSource->id],
            'preferred_categories' => [$initialCategory->id],
            'preferred_authors' => ['Old Author'],
        ]);

        // New preferences to update with
        $newSource = Source::factory()->create();
        $newCategory = Category::factory()->create();
        $newAuthor = 'New Author';

        $payload = [
            'preferred_sources' => [$newSource->id],
            'preferred_categories' => [$newCategory->id],
            'preferred_authors' => [$newAuthor],
        ];

        $response = $this->actingAs($this->user)->postJson('/api/preferences', $payload);

        $response->assertStatus(200);
        $response->assertJson([
            'message' => 'Preferences saved successfully.',
            'preferences' => [
                'user_id' => $this->user->id,
                'preferred_sources' => [$newSource->id],
                'preferred_categories' => [$newCategory->id],
                'preferred_authors' => [$newAuthor],
            ],
        ]);
    }

    /**
     * Test storing preferences with invalid source ID.
     */
    public function test_store_preferences_fails_with_invalid_source_id(): void
    {
        $payload = [
            'preferred_sources' => [9999],
        ];

        $response = $this->actingAs($this->user)->postJson('/api/preferences', $payload);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors('preferred_sources.0');
    }

    /**
     * Test storing preferences with invalid category ID.
     */
    public function test_store_preferences_fails_with_invalid_category_id(): void
    {
        $payload = [
            'preferred_categories' => [9999],
        ];

        $response = $this->actingAs($this->user)->postJson('/api/preferences', $payload);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors('preferred_categories.0');
    }

    /**
     * Test getting personalized news feed when no preferences are set.
     */
    public function test_feed_returns_general_articles_when_no_preferences_set(): void
    {
        // Ensure no preferences for the user
        UserPreference::where('user_id', $this->user->id)->delete();

        $response = $this->actingAs($this->user)->getJson('/api/feed');

        $response->assertStatus(200);
        $response->assertJsonStructure([
            'data' => [
                '*' => ['id', 'title']
            ],
            'current_page',
            'last_page',
            'total',
        ]);
        $response->assertJsonPath('total', Article::count());
    }

    /**
     * Test getting personalized news feed with preferences set.
     */
    public function test_feed_returns_filtered_articles_with_preferences(): void
    {
        // Create specific preferences
        $preferredSource = Source::factory()->create();
        $preferredCategory = Category::factory()->create();
        $preferredAuthor = 'Preferred Author';

        UserPreference::factory()->create([
            'user_id' => $this->user->id,
            'preferred_sources' => [$preferredSource->id],
            'preferred_categories' => [$preferredCategory->id],
            'preferred_authors' => [$preferredAuthor],
        ]);

        // Create articles matching preferences
        Article::factory()->create([
            'source_id' => $preferredSource->id,
            'category_id' => $preferredCategory->id,
            'author' => $preferredAuthor,
            'title' => 'Matching Article 1',
            'published_at' => now(),
        ]);
        Article::factory()->create([
            'source_id' => $preferredSource->id,
            'category_id' => Category::all()->random()->id,
            'author' => 'Other Author',
            'title' => 'Matching Source Only',
            'published_at' => now(),
        ]);
        Article::factory()->create([
            'source_id' => Source::all()->random()->id,
            'category_id' => $preferredCategory->id,
            'author' => 'Other Author',
            'title' => 'Matching Category Only',
            'published_at' => now(),
        ]);
        Article::factory()->create([
            'source_id' => Source::all()->random()->id,
            'category_id' => Category::all()->random()->id,
            'author' => $preferredAuthor,
            'title' => 'Matching Author Only',
            'published_at' => now(),
        ]);

        // Create a non-matching article
        Article::factory()->create([
            'source_id' => Source::factory()->create()->id,
            'category_id' => Category::factory()->create()->id,
            'author' => 'Non-Matching Author',
            'title' => 'Non-Matching Article',
            'published_at' => now(),
        ]);


        $response = $this->actingAs($this->user)->getJson('/api/feed');

        $response->assertStatus(200);
        $response->assertJsonStructure([
            'data' => [
                '*' => ['id', 'title']
            ],
            'current_page',
        ]);

        $response->assertJsonCount(4, 'data');
        $response->assertJsonFragment(['title' => 'Matching Article 1']);
        $response->assertJsonFragment(['title' => 'Matching Source Only']);
        $response->assertJsonFragment(['title' => 'Matching Category Only']);
        $response->assertJsonFragment(['title' => 'Matching Author Only']);
        $response->assertJsonMissing(['title' => 'Non-Matching Article']);
    }

    /**
     * Test getting all available sources.
     */
    public function test_get_sources_returns_all_sources(): void
    {
        $response = $this->actingAs($this->user)->getJson('/api/sources');

        $response->assertStatus(200);
        $response->assertJsonCount(Source::count());
        $response->assertJsonStructure([
            '*' => ['id', 'name']
        ]);
    }

    /**
     * Test getting all available categories.
     */
    public function test_get_categories_returns_all_categories(): void
    {
        $response = $this->actingAs($this->user)->getJson('/api/categories');

        $response->assertStatus(200);
        $response->assertJsonCount(Category::count());
        $response->assertJsonStructure([
            '*' => ['id', 'name']
        ]);
    }

    /**
     * Test getting all distinct authors.
     */
    public function test_get_authors_returns_all_distinct_authors(): void
    {
        // Ensure some articles with distinct authors are present
        Article::factory()->create(['author' => 'Unique Author 1']);
        Article::factory()->create(['author' => 'Unique Author 2']);
        Article::factory()->create(['author' => 'Unique Author 1']);

        $response = $this->actingAs($this->user)->getJson('/api/authors');

        $response->assertStatus(200);
        $this->assertGreaterThanOrEqual(2, count($response->json()));
        $response->assertJsonFragment(['Unique Author 1']);
        $response->assertJsonFragment(['Unique Author 2']);
    }

    /**
     * Test caching for getSources endpoint.
     */
    public function test_get_sources_uses_caching(): void
    {
        Cache::flush();

        // First request should cache
        $this->actingAs($this->user)->getJson('/api/sources');
        $this->assertTrue(Cache::has('all_sources'));

        // Add a new source after caching
        Source::factory()->create(['name' => 'New Cached Source']);

        // Second request should return cached data, not the new source
        $response = $this->actingAs($this->user)->getJson('/api/sources');
        $response->assertStatus(200);
        $response->assertJsonMissing(['name' => 'New Cached Source']);

        // Clear cache and re-request, should now see the new source
        Cache::forget('all_sources');
        $response = $this->actingAs($this->user)->getJson('/api/sources');
        $response->assertStatus(200);
        $response->assertJsonFragment(['name' => 'New Cached Source']);
    }

    /**
     * Test caching for getCategories endpoint.
     */
    public function test_get_categories_uses_caching(): void
    {
        Cache::flush();

        $this->actingAs($this->user)->getJson('/api/categories');
        $this->assertTrue(Cache::has('all_categories'));

        Category::factory()->create(['name' => 'New Cached Category']);

        $response = $this->actingAs($this->user)->getJson('/api/categories');
        $response->assertStatus(200);
        $response->assertJsonMissing(['name' => 'New Cached Category']);

        Cache::forget('all_categories');
        $response = $this->actingAs($this->user)->getJson('/api/categories');
        $response->assertStatus(200);
        $response->assertJsonFragment(['name' => 'New Cached Category']);
    }

    /**
     * Test caching for getAuthors endpoint.
     */
    public function test_get_authors_uses_caching(): void
    {
        Cache::flush();

        $this->actingAs($this->user)->getJson('/api/authors');
        $this->assertTrue(Cache::has('all_authors'));

        Article::factory()->create(['author' => 'New Cached Author']);

        $response = $this->actingAs($this->user)->getJson('/api/authors');
        $response->assertStatus(200);
        $response->assertJsonMissing(['New Cached Author']);

        Cache::forget('all_authors');
        $response = $this->actingAs($this->user)->getJson('/api/authors');
        $response->assertStatus(200);
        $response->assertJsonFragment(['New Cached Author']);
    }
}
