#!/bin/sh

echo "Running migrations from entrypoint script..."
python manage.py migrate --noinput
exec "$@"
