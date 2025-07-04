# News Feed Application

This is a full-stack news feed application built with **Laravel (PHP)** for the backend API and **React (TypeScript)** for the frontend, both running in a Dockerized environment.

## Features

- **User Authentication & Registration:** Users can create accounts and log in.

- **Article Search & Filtering:** Search articles by keyword, date, category, and source.

- **Personalized News Feed:** Customize feed by preferred sources, categories, and authors.

- **Mobile-Responsive Design:** Optimized for various screen sizes.

- **Data Scraping:** Articles are scraped from external news APIs and saved locally.

- **Caching:** Implemented for improved performance on frequently accessed data.

## Prerequisites

Before you begin, ensure you have the following installed:

- **Docker Desktop:** (Includes Docker Engine and Docker Compose)

  - [Download Docker Desktop](https://www.docker.com/products/docker-desktop)

## Getting Started (Initial Setup)

Follow these steps to get the application up and running for the first time.

### 1. Clone the Repository

```bash
git clone https://github.com/jawadzaib/news-feed-app news-app
cd news-app
```

### 2. Create Root `.env` File

Create a .env file in the root of your news-app directory (same level as docker-compose.yml). This file will hold environment variables used by Docker Compose.

```bash
# Database credentials for development database
DB_DATABASE=news_app_db
DB_USERNAME=user
DB_PASSWORD=password
```

### 3. Build and Run Docker Containers

From the `news-app` root directory, build and start all services defined in docker-compose.yml. This includes Nginx, Laravel PHP-FPM, MySQL, and the React frontend.

```bash
docker-compose up --build -d
```

### 4. Configure Laravel .env for Docker

Copy content of `/api/.env.example` into `/api/.env` to have all configured env variables

### 5. Install Laravel Dependencies & Generate Key

Execute these commands inside your app (Laravel) Docker container.

```bash
docker-compose exec app composer install
docker-compose exec app php artisan key:generate
```

### 6. Run Laravel Migrations

This will create the necessary tables in your `news_app_db` database.

```bash
docker-compose exec app php artisan migrate
```

### 7. Restart docker services

After migrating `cache` tables, restart docker container to keep worker service running

```bash
docker-compose up -d
```

### 8. Setup Frontend

Navigate into your frontend directory `(news-app/frontend)`.
install all Node.js dependencies.

```bash
cd frontend
npm install
```

## Running the Application

### Accessing the Backend API

Your Laravel backend will be available at:

- http://localhost:8000

### Accessing the Frontend

Your React frontend development server will be available at:

- http://localhost:3000

To start the React development server (if not already running from docker-compose up -d):

```bash
docker-compose exec frontend npm run dev
```

## News Scraping & Data Import

The application includes a scheduled command to scrape articles from NewsAPI.org, The Guardian, and New York Times APIs and store them in your local database.

### 1. Obtain API Keys

You need API keys for the following services:

NewsAPI.org: https://newsapi.org/

The Guardian API: https://open-platform.theguardian.com/

New York Times API: https://developer.nytimes.com/ (Look for Article Search API)

### 2. Configure API Keys

Add your obtained API keys to your `api/.env` file (news-app/api/.env):

```bash
NEWS_API_KEY=your_newsapi_key_here
GUARDIAN_API_KEY=your_guardian_api_key_here
NYT_API_KEY=your_nyt_api_key_here
```

After adding keys, clear Laravel config cache:

```bash
docker-compose exec app php artisan config:clear
```

### 3. Dispatch the scrap articles job

- #### Manual trigger

  You can trigger the job to scrap articles from 3 sources (NewsAPI, Guardian and NY Times) with this command:

  ```bash
  docker-compose exec app php artisan news:scrape
  ```

- #### Scheduled trigger

  The `news:scrape` command is scheduled to run daily at 3:00 AM UTC. For the Laravel scheduler to run in a Docker environment, you typically set up a cron job on your host that executes the `schedule:run` command inside the `app` container.
  For development, you can manually run the scheduler to test:

  ```bash
  docker-compose exec app php artisan schedule:run
  ```

### 4. Monitor Logs

The `worker` service in docker-compose.yml is already configured to run `php artisan queue:work` automatically when you run docker-compose up -d

you can monitor the logs:

```bash
docker-compose logs worker
```

### 5. Clear cache

Once scrapping job is finished, cache can be cleared to see results on frontend:

```bash
docker compose exec app php artisan optimize:clear
```

## Testing

### Run Backend Tests

```bash
docker-compose exec app php artisan test
```

### Run Frontend Tests

```bash
cd frontend
npm run test
```

## Code Formatting

The project uses ESLint for linting and Prettier for code formatting to ensure consistency.

### VS Code Settings:

Copy `.vscode/settings.example.json` content into `.vscode/settings.json` to configure VS Code's editor settings and default formatters.
