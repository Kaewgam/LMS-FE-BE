#!/bin/sh

FROM python:3.13.3-slim-bookworm

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libcairo2 \
    libpango-1.0-0 \
    libpangocairo-1.0-0 \
    libpangoft2-1.0-0 \
    libgdk-pixbuf-2.0-0 \
    libffi-dev \
    libjpeg62-turbo \
    libxml2 \
    shared-mime-info \
    fonts-th-sarabun-new \
    fonts-noto-core fonts-noto-cjk fonts-noto-color-emoji \
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