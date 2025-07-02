<?php

namespace App\Console\Commands;

use App\Services\NewsApi\GuardianApiService;
use App\Services\NewsApi\NewsApiOrgService;
use App\Services\NewsApi\NewsApiService;
use App\Services\NewsApi\NyTimesApiService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Cache;

class ScrapeNewsCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'news:scrape';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Scrape articles from various news APIs and store them locally.';

    /**
     * An array of NewsApiService implementations to scrape from.
     *
     * @var array<NewsApiService>
     */
    protected array $newsServices;

    /**
     * Create a new command instance.
     *
     * @param NewsApiOrgService $newsApiOrgService
     * @param GuardianApiService $guardianApiService
     * @param NyTimesApiService $nyTimesApiService
     */
    public function __construct(
        NewsApiOrgService $newsApiOrgService,
        GuardianApiService $guardianApiService,
        NyTimesApiService $nyTimesApiService
    ) {
        parent::__construct();
        $this->newsServices = [
            $newsApiOrgService,
            $guardianApiService,
            $nyTimesApiService,
        ];
    }

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $this->info('Starting news scraping process...');

        $totalArticlesScraped = 0;
        $scrapeSuccessful = true;

        foreach ($this->newsServices as $service) {
            $serviceName = class_basename($service);
            $this->info("Scraping from {$serviceName}...");

            try {
                $articles = $service->fetchArticles();
                $count = count($articles);
                $totalArticlesScraped += $count;
                $this->info("Successfully scraped {$count} articles from {$serviceName}.");
            } catch (\Exception $e) {
                $this->error("Error scraping from {$serviceName}: " . $e->getMessage());
                Log::error("Scraping failed for {$serviceName}: " . $e->getMessage(), ['exception' => $e]);
                $scrapeSuccessful = false;
            }
        }

        if ($scrapeSuccessful) {
            $this->info('Scraping completed successfully. Clearing relevant caches...');
            // Clear all article search caches
            Cache::forget('articles_search_*');

            // Clear caches for sources, categories, authors
            Cache::forget('all_sources');
            Cache::forget('all_categories');
            Cache::forget('all_authors');

            $this->info('Caches cleared.');
        } else {
            $this->warn('Scraping completed with errors. Caches were NOT cleared to prevent serving incomplete data.');
        }


        $this->info("News scraping process completed. Total articles scraped: {$totalArticlesScraped}");

        return Command::SUCCESS;
    }
}