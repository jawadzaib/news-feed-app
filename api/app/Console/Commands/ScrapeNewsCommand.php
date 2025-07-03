<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Jobs\ScrapeNewsJob;
use Illuminate\Support\Facades\Log;

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
    protected $description = 'Dispatches a job to scrape articles from various news APIs.';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $this->info('Dispatching news scraping job...');

        try {
            ScrapeNewsJob::dispatch();
            $this->info('News scraping job dispatched successfully!');
            Log::info('News scraping job dispatched.');
        } catch (\Exception $e) {
            $this->error('Failed to dispatch news scraping job: ' . $e->getMessage());
            Log::error('Failed to dispatch news scraping job: ' . $e->getMessage(), ['exception' => $e]);
            return Command::FAILURE;
        }

        return Command::SUCCESS;
    }
}
