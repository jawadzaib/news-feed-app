<?php

namespace App\Http\Controllers;

use App\Models\Article;
use App\Models\Category;
use App\Models\Source;
use App\Models\UserPreference;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\Cache; // Import the Cache facade

class UserPreferencesController extends Controller
{
    /**
     * Get the authenticated user's preferences.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function show(Request $request)
    {
        $preferences = Auth::user()->preference;

        if (!$preferences) {
            return response()->json([
                'message' => 'No preferences set for this user.',
                'preferences' => (object)[
                    'preferred_sources' => [],
                    'preferred_categories' => [],
                    'preferred_authors' => [],
                ]
            ], 200);
        }

        return response()->json($preferences);
    }

    /**
     * Store or update the authenticated user's preferences.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function store(Request $request)
    {
        $request->validate([
            'preferred_sources' => ['nullable', 'array'],
            'preferred_sources.*' => ['exists:sources,id'],
            'preferred_categories' => ['nullable', 'array'],
            'preferred_categories.*' => ['exists:categories,id'],
            'preferred_authors' => ['nullable', 'array'],
            'preferred_authors.*' => ['string', 'max:255'],
        ]);

        $user = Auth::user();

        $preferences = UserPreference::updateOrCreate(
            ['user_id' => $user->id],
            [
                'preferred_sources' => $request->input('preferred_sources', []),
                'preferred_categories' => $request->input('preferred_categories', []),
                'preferred_authors' => $request->input('preferred_authors', []),
            ]
        );

        // remove feed cache after preferences are updated
        Cache::forget('user_feed_' . $user->id . '_' . md5(json_encode($request->all())));
        Cache::forget('user_feed_' . $user->id . '_default_' . md5(json_encode($request->all())));

        return response()->json([
            'message' => 'Preferences saved successfully.',
            'preferences' => $preferences,
        ], 200);
    }

    /**
     * Get the personalized news feed for the authenticated user.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function feed(Request $request)
    {
        $user = Auth::user();
        $preferences = $user->preference;

        // Generate a unique cache key for the user's feed
        $cacheKey = 'user_feed_' . $user->id . '_' . md5(json_encode($request->all()));

        // If no preferences are set, return latest articles
        if (!$preferences || (empty($preferences->preferred_sources) && empty($preferences->preferred_categories) && empty($preferences->preferred_authors))) {
            // Use a different cache key for the default feed
            $defaultCacheKey = 'user_feed_' . $user->id . '_default_' . md5(json_encode($request->all()));
            $articles = Cache::remember($defaultCacheKey, 60 * 60, function () use ($request) {
                return Article::with(['source', 'category'])
                    ->orderBy('published_at', 'desc')
                    ->paginate($request->input('per_page', 15));
            });
            return response()->json([
                'message' => 'No preferences set, returning general feed.',
                'articles' => $articles,
            ]);
        }

        // Cache the personalized feed for 60 minutes
        $articles = Cache::remember($cacheKey, 60 * 60, function () use ($request, $preferences) {
            $query = Article::with(['source', 'category']);

            // Apply filters based on user preferences
            $query->where(function (Builder $q) use ($preferences) {
                if (!empty($preferences->preferred_sources)) {
                    $q->orWhereIn('source_id', $preferences->preferred_sources);
                }
                if (!empty($preferences->preferred_categories)) {
                    $q->orWhereIn('category_id', $preferences->preferred_categories);
                }
                if (!empty($preferences->preferred_authors)) {
                    $q->orWhereIn('author', $preferences->preferred_authors);
                }
            });

            // Order by published_at, newest first
            $query->orderBy('published_at', 'desc');

            return $query->paginate($request->input('per_page', 15));
        });

        return response()->json($articles);
    }

    /**
     * Get all available sources
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function getSources()
    {
        // Cache sources or until cleared by new scrape
        $sources = Cache::remember('all_sources', 24 * 60 * 60, function () {
            return Source::all(['id', 'name']);
        });
        return response()->json($sources);
    }

    /**
     * Get all available categories
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function getCategories()
    {
        // Cache categories or until cleared by new scrape
        $categories = Cache::remember('all_categories', 24 * 60 * 60, function () {
            return Category::all(['id', 'name']);
        });
        return response()->json($categories);
    }

    /**
     * Get all distinct authors from scraped articles.
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function getAuthors()
    {
        // Cache authors or until cleared by new scrape
        $authors = Cache::remember('all_authors', 24 * 60 * 60, function () {
            return Article::distinct()->whereNotNull('author')->pluck('author');
        });
        return response()->json($authors);
    }
}
