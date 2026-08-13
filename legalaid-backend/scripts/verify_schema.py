"""Verify database schema after migration."""
import asyncio
from sqlalchemy import text
from app.db import engine


async def verify():
    async with engine.connect() as conn:
        # List all tables
        result = await conn.execute(text(
            "SELECT table_name FROM information_schema.tables "
            "WHERE table_schema = 'public' AND table_type = 'BASE TABLE' "
            "ORDER BY table_name"
        ))
        tables = [row[0] for row in result.fetchall()]
        print("=== TABLES IN DATABASE ===")
        for t in tables:
            print(f"  + {t}")
        print(f"\nTotal: {len(tables)} tables")

        # Check kb_entries columns
        result = await conn.execute(text(
            "SELECT column_name, data_type, is_nullable "
            "FROM information_schema.columns "
            "WHERE table_name = 'kb_entries' "
            "ORDER BY ordinal_position"
        ))
        print("\n=== kb_entries SCHEMA ===")
        for row in result.fetchall():
            nullable = "NULL" if row[2] == "YES" else "NOT NULL"
            print(f"  {row[0]}: {row[1]} {nullable}")

        # Check indexes on kb_entries
        result = await conn.execute(text(
            "SELECT indexname, indexdef FROM pg_indexes WHERE tablename = 'kb_entries'"
        ))
        print("\n=== kb_entries INDEXES ===")
        for row in result.fetchall():
            print(f"  {row[0]}: {row[1]}")

        # Check all check constraints across tables
        result = await conn.execute(text(
            "SELECT conrelid::regclass AS table_name, conname, pg_get_constraintdef(oid) "
            "FROM pg_constraint WHERE contype = 'c' "
            "AND conrelid::regclass::text NOT LIKE 'pg_%' "
            "ORDER BY conrelid::regclass::text"
        ))
        print("\n=== CHECK CONSTRAINTS ===")
        for row in result.fetchall():
            print(f"  [{row[0]}] {row[1]}: {row[2]}")

        # Check foreign keys
        result = await conn.execute(text(
            "SELECT conrelid::regclass AS table_name, conname, pg_get_constraintdef(oid) "
            "FROM pg_constraint WHERE contype = 'f' "
            "AND conrelid::regclass::text NOT LIKE 'pg_%' "
            "ORDER BY conrelid::regclass::text"
        ))
        print("\n=== FOREIGN KEYS ===")
        for row in result.fetchall():
            print(f"  [{row[0]}] {row[1]}: {row[2]}")

    await engine.dispose()


if __name__ == "__main__":
    asyncio.run(verify())
