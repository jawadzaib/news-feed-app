<?php

namespace Database\Factories;

use App\Models\Article;
use App\Models\Source;
use App\Models\Category;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

class ArticleFactory extends Factory
{
    protected $model = Article::class;

    public function definition(): array
    {
        return [
            'title' => $this->faker->sentence(rand(5, 10)),
            'description' => $this->faker->paragraph(rand(2, 5)),
            'content' => $this->faker->paragraphs(rand(5, 10), true),
            'author' => $this->faker->name(),
            'url' => $this->faker->unique()->url(),
            'url_to_image' => $this->faker->imageUrl(),
            'published_at' => $this->faker->dateTimeBetween('-1 month', 'now'),
            'source_id' => Source::factory(),
            'category_id' => Category::factory(),
            'api_article_id' => Str::random(10),
        ];
    }
}
