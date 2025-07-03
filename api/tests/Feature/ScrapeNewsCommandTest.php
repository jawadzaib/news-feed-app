<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Queue;
use App\Jobs\ScrapeNewsJob;

class ScrapeNewsCommandTest extends TestCase
{
    use RefreshDatabase;

    /**
     * Test that the news:scrape command dispatches the ScrapeNewsJob.
     */
    public function test_news_scrape_command_dispatches_job(): void
    {
        Queue::fake();

        // Run the Artisan command
        $exitCode = Artisan::call('news:scrape');
        $output = Artisan::output();

        // Assert command exited successfully
        $this->assertEquals(0, $exitCode);
        $this->assertStringContainsString('Dispatching news scraping job...', $output);
        $this->assertStringContainsString('News scraping job dispatched successfully!', $output);

        Queue::assertPushed(ScrapeNewsJob::class);
    }
}
