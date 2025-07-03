<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\WithFaker;
use Tests\TestCase;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

class AuthControllerTest extends TestCase
{
    use RefreshDatabase, WithFaker;

    /**
     * Test user registration with valid data.
     */
    public function test_user_can_register_with_valid_data(): void
    {
        $userData = [
            'name' => $this->faker->name,
            'email' => $this->faker->unique()->safeEmail,
            'password' => 'password123',
            'password_confirmation' => 'password123',
        ];

        $response = $this->postJson('/api/register', $userData);

        $response->assertStatus(201);
        $response->assertJsonStructure([
            'message',
            'user' => ['id', 'name', 'email'],
            'token',
        ]);
        $response->assertJson([
            'message' => 'User registered successfully',
            'user' => [
                'name' => $userData['name'],
                'email' => $userData['email'],
            ],
        ]);
        $response->assertDontSee('Unauthenticated.');

        $this->assertDatabaseHas('users', [
            'email' => $userData['email'],
        ]);
    }

    /**
     * Test user registration with invalid data (e.g., missing fields).
     */
    public function test_user_registration_fails_with_invalid_data(): void
    {
        $response = $this->postJson('/api/register', [
            'name' => 'Test User',
            'email' => 'invalid-email',
            'password' => 'short',
            'password_confirmation' => 'mismatch',
        ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['email', 'password']);
    }

    /**
     * Test user registration with an existing email.
     */
    public function test_user_registration_fails_with_existing_email(): void
    {
        $existingUser = User::factory()->create();

        $userData = [
            'name' => $this->faker->name,
            'email' => $existingUser->email,
            'password' => 'password123',
            'password_confirmation' => 'password123',
        ];

        $response = $this->postJson('/api/register', $userData);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['email']);
    }

    /**
     * Test user login with valid credentials.
     */
    public function test_user_can_login_with_valid_credentials(): void
    {
        $user = User::factory()->create([
            'password' => Hash::make('password123'),
        ]);

        $credentials = [
            'email' => $user->email,
            'password' => 'password123',
        ];

        $response = $this->postJson('/api/login', $credentials);

        $response->assertStatus(200);
        $response->assertJsonStructure([
            'message',
            'user' => ['id', 'name', 'email'],
            'token',
        ]);
        $response->assertJson([
            'message' => 'User logged in successfully',
            'user' => [
                'email' => $user->email,
            ],
        ]);
        $response->assertDontSee('Unauthenticated.');

        $this->assertNotNull($response->json('token'));
    }

    /**
     * Test user login with invalid credentials.
     */
    public function test_user_login_fails_with_invalid_credentials(): void
    {
        User::factory()->create([
            'password' => Hash::make('correctpassword'),
        ]);

        $credentials = [
            'email' => $this->faker->safeEmail,
            'password' => 'wrongpassword',
        ];

        $response = $this->postJson('/api/login', $credentials);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['email']);
        $response->assertJson([
            'errors' => [
                'email' => ['The provided credentials do not match our records.'],
            ],
        ]);
    }

    /**
     * Test getting authenticated user details.
     */
    public function test_can_get_authenticated_user_details(): void
    {
        /** @var User */
        $user = User::factory()->create();

        $response = $this->actingAs($user)->getJson('/api/user');

        $response->assertStatus(200);
        $response->assertJson([
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
        ]);
    }

    /**
     * Test user logout.
     */
    public function test_user_can_logout(): void
    {
        /** @var User */
        $user = User::factory()->create();

        // Create a token for the user
        $token = $user->createToken('test_token')->plainTextToken;

        // Make a logout request with the token
        $response = $this->withHeaders([
            'Authorization' => 'Bearer ' . $token,
        ])->postJson('/api/logout');

        $response->assertStatus(200);
        $response->assertJson([
            'message' => 'Logged out successfully',
        ]);

        // Assert that the token has been deleted from the database
        $this->assertDatabaseMissing('personal_access_tokens', [
            'token' => hash('sha256', $token),
        ]);
    }
}
