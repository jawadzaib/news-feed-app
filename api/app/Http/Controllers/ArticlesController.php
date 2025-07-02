<?php

namespace App\Http\Controllers;

use App\Models\Article;
use Illuminate\Http\Request;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\Cache; // Import the Cache facade

class ArticlesController extends Controller
{
    /**
     * Search and filter articles.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function index(Request $request)
    {
        // Generate a unique cache key based on all request parameters
        $cacheKey = 'articles_search_' . md5(json_encode($request->all()));

        // Try to retrieve from cache first. If not found, execute the query and store for 60 minutes.
        $articles = Cache::remember($cacheKey, 60 * 60, function () use ($request) {
            $query = Article::with(['source', 'category']);

            // Filter by keyword
            if ($keyword = $request->input('keyword')) {
                $query->where(function (Builder $q) use ($keyword) {
                    $q->where('title', 'like', '%' . $keyword . '%')
                        ->orWhere('description', 'like', '%' . $keyword . '%')
                        ->orWhere('content', 'like', '%' . $keyword . '%')
                        ->orWhereHas('source', function (Builder $sq) use ($keyword) {
                            $sq->where('name', 'like', '%' . $keyword . '%');
                        })
                        ->orWhere('author', 'like', '%' . $keyword . '%');
                });
            }

            // Filter by date range
            if ($startDate = $request->input('start_date')) {
                $query->whereDate('published_at', '>=', $startDate);
            }
            if ($endDate = $request->input('end_date')) {
                $query->whereDate('published_at', '<=', $endDate);
            }

            // Filter by category
            if ($categoryName = $request->input('category')) {
                $query->whereHas('category', function (Builder $q) use ($categoryName) {
                    $q->where('name', $categoryName);
                });
            }

            // Filter by source
            if ($sourceName = $request->input('source')) {
                $query->whereHas('source', function (Builder $q) use ($sourceName) {
                    $q->where('name', $sourceName);
                });
            }

            // Order by published_at
            $query->orderBy('published_at', 'desc');

            // Paginate the results
            return $query->paginate($request->input('per_page', 15));
        });

        return response()->json($articles);
    }
}