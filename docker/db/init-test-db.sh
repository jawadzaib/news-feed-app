#!/bin/bash
# docker/db/init-test-db.sh

# --- Configuration for the Test Database ---
TEST_DB_NAME="news_app_test_db"
TEST_DB_USER="test_user"
TEST_DB_PASSWORD="test_password"
# ------------------------------------------

echo "Initializing test database: ${TEST_DB_NAME}"

# Wait for MySQL to be ready to accept connections
# Use `mysqladmin ping` which is a more direct check for server readiness
# and specify the host as 'localhost' since the script runs inside the 'db' container
until mysqladmin ping -h"localhost" -u"root" -p"${MYSQL_ROOT_PASSWORD}" --silent; do
  echo "MySQL is unavailable - sleeping"
  sleep 2 # Increased sleep duration for more stability
done

echo "MySQL is up - creating test database and user"

# Execute SQL commands
mysql -h"localhost" -u"root" -p"${MYSQL_ROOT_PASSWORD}" <<EOF
CREATE DATABASE IF NOT EXISTS \`${TEST_DB_NAME}\`;
CREATE USER IF NOT EXISTS \`${TEST_DB_USER}\`@'%' IDENTIFIED BY '${TEST_DB_PASSWORD}';
GRANT ALL PRIVILEGES ON \`${TEST_DB_NAME}\`.* TO \`${TEST_DB_USER}\`@'%';
FLUSH PRIVILEGES;
EOF

echo "Test database and user setup complete."
