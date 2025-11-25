#!/bin/sh

FROM python:3.13.3-slim-bookworm

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /app

RUN apt-get update && apt-get install -y curl \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/

COPY src/requirements.txt .
RUN uv pip install -r requirements.txt --system --no-cache-dir

COPY src/ .

EXPOSE 8000

RUN python manage.py collectstatic --noinput

COPY ./src/entrypoint.sh .
ENTRYPOINT ["./entrypoint.sh"]


CMD ["gunicorn", "lms.wsgi:application", "--bind", "0.0.0.0:8000"]