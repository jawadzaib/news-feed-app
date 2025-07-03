FROM php:8.2-fpm-alpine

WORKDIR /var/www/html

# Install system dependencies
# Add build-base for C compiler and other build tools
RUN apk add --no-cache \
    nginx \
    mysql-client \
    git \
    unzip \
    libzip-dev \
    libpng-dev \
    libjpeg-turbo-dev \
    freetype-dev \
    icu-dev \
    redis \
    php82-dev \
    libtool \
    build-base \
    ;

# Install PHP extensions
RUN docker-php-ext-configure gd --with-freetype --with-jpeg \
    && docker-php-ext-install -j$(nproc) \
    pdo_mysql \
    zip \
    gd \
    intl \
    ;

# Install the Redis PECL extension separately
RUN pecl install -o -f redis \
    && rm -rf /tmp/pear \
    && docker-php-ext-enable redis \
    ;

# Install Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

EXPOSE 9000

CMD ["php-fpm"]
