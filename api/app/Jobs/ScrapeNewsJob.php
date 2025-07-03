<?php

namespace App\Jobs;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use App\Services\NewsApi\GuardianApiService;
use App\Services\NewsApi\NewsApiOrgService;
use App\Services\NewsApi\NyTimesApiService;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Cache;
use Exception;

class ScrapeNewsJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    /**
     * The number of seconds the job can run before timing out.
     *
     * @var int
     */
    public $timeout = 300;

    /**
     * The number of times the job may be attempted.
     *
     * @var int
     */
    public $tries = 3;

    /**
     * Create a new job instance.
     *
     * @return void
     */
    public function __construct()
    {
        //
    }

    /**
     * Execute the job.
     *
     * @param NewsApiOrgService $newsApiOrgService
     * @param GuardianApiService $guardianApiService
     * @param NyTimesApiService $nyTimesApiService
     * @return void
     */
    public function handle(
        NewsApiOrgService $newsApiOrgService,
        GuardianApiService $guardianApiService,
        NyTimesApiService $nyTimesApiService
    ) {
        $newsServices = [
            $newsApiOrgService,
            $guardianApiService,
            $nyTimesApiService,
        ];

        $totalArticlesScraped = 0;
        $scrapeSuccessful = true;

        foreach ($newsServices as $service) {
            $serviceName = class_basename($service);
            Log::info("Scraping from {$serviceName} (Job)...");

            try {
                $articles = $service->fetchArticles();
                $count = count($articles);
                $totalArticlesScraped += $count;
                Log::info("Successfully scraped {$count} articles from {$serviceName} (Job).");
            } catch (Exception $e) {
                Log::error("Error scraping from {$serviceName} (Job): " . $e->getMessage(), ['exception' => $e]);
                $scrapeSuccessful = false;
            }
        }

        if ($scrapeSuccessful) {
            Log::info('Scraping completed successfully (Job). Clearing relevant caches...');
            // Clear all article search caches
            Cache::forget('articles_search_*'); // Note: Wildcard works best with Redis/Memcached

            // Clear caches for sources, categories, authors
            Cache::forget('all_sources');
            Cache::forget('all_categories');
            Cache::forget('all_authors');

            Log::info('Caches cleared (Job).');
        } else {
            Log::warn('Scraping completed with errors (Job). Caches were NOT cleared to prevent serving incomplete data.');
        }

        Log::info("News scraping process completed (Job). Total articles scraped: {$totalArticlesScraped}");
    }

    /**
     * Handle a job failure.
     *
     * @param  \Throwable  $exception
     * @return void
     */
    public function failed(\Throwable $exception)
    {
        Log::error('ScrapeNewsJob failed: ' . $exception->getMessage(), ['exception' => $exception]);
    }
}
