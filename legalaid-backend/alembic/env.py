from logging.config import fileConfig

from sqlalchemy import engine_from_config, pool

from alembic import context

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))
from app.config import settings
from app.db import Base
# Import all models so Alembic autogenerate detects them
import app.models  # noqa: F401

config = context.config

if config.config_file_name is not None:
    fileConfig(config.config_file_name)

target_metadata = Base.metadata


def get_sync_url() -> str:
    """Get a synchronous database URL for Alembic migrations.
    
    Uses DIRECT_URL (Supabase session-mode pooler on port 5432) if available,
    otherwise converts DATABASE_URL from asyncpg to synchronous psycopg2.
    """
    url = settings.DIRECT_URL if settings.DIRECT_URL else settings.DATABASE_URL
    
    # Ensure we're using a synchronous driver
    # Remove asyncpg driver if present
    if "postgresql+asyncpg://" in url:
        url = url.replace("postgresql+asyncpg://", "postgresql://", 1)
    
    # Strip pgbouncer query params that can interfere with Alembic
    if "?pgbouncer=true" in url:
        url = url.split("?pgbouncer=true")[0]
    
    return url


def run_migrations_offline() -> None:
    """Run migrations in 'offline' mode (generates SQL script)."""
    url = get_sync_url()
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    """Run migrations in 'online' mode (connects to DB directly).
    
    Uses synchronous psycopg2 driver against Supabase's session-mode pooler.
    """
    configuration = config.get_section(config.config_ini_section, {})
    configuration["sqlalchemy.url"] = get_sync_url()
    
    connectable = engine_from_config(
        configuration,
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata,
        )

        with context.begin_transaction():
            context.run_migrations()

    connectable.dispose()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
