<?php

namespace Database\Factories;

use App\Models\UserPreference;
use App\Models\User;
use App\Models\Source;
use App\Models\Category;
use Illuminate\Database\Eloquent\Factories\Factory;

class UserPreferenceFactory extends Factory
{
    /**
     * The name of the factory's corresponding model.
     *
     * @var string
     */
    protected $model = UserPreference::class;

    /**
     * Define the model's default state.
     *
     * @return array
     */
    public function definition(): array
    {
        $user = User::factory()->create();
        $source = Source::factory()->create();
        $category = Category::factory()->create();

        return [
            'user_id' => $user->id,
            'preferred_sources' => [$source->id],
            'preferred_categories' => [$category->id],
            'preferred_authors' => [$this->faker->name()],
        ];
    }

    /**
     * Indicate that the preference has no specific preferences set.
     *
     * @return \Illuminate\Database\Eloquent\Factories\Factory
     */
    public function noPreferences(): Factory
    {
        return $this->state(function (array $attributes) {
            return [
                'preferred_sources' => [],
                'preferred_categories' => [],
                'preferred_authors' => [],
            ];
        });
    }
}
