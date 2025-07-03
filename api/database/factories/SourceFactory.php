<?php

namespace Database\Factories;

use App\Models\Source;
use Illuminate\Database\Eloquent\Factories\Factory;

class SourceFactory extends Factory
{
    protected $model = Source::class;

    public function definition(): array
    {
        return [
            'name' => $this->faker->unique()->word() . ' News',
            'api_id' => $this->faker->unique()->slug(2),
            'url' => $this->faker->unique()->url(),
        ];
    }
}
