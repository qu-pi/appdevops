FROM mysql:8.4

ENV MYSQL_CHARACTER_SET_SERVER=utf8mb4 \
    MYSQL_COLLATION_SERVER=utf8mb4_unicode_ci

# Runs automatically on first boot against an empty data directory.
COPY schema.sql /docker-entrypoint-initdb.d/01-schema.sql
