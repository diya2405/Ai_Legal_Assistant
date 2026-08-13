import asyncio
from sqlalchemy.ext.asyncio import create_async_engine
from app.config import settings

async def main():
    engine = create_async_engine(
        settings.DATABASE_URL,
        pool_size=5,
        max_overflow=10,
        pool_pre_ping=True,
        connect_args={
            "statement_cache_size": 0,
            "prepared_statement_cache_size": 0,
        }
    )
    async with engine.connect() as conn:
        print("Connected!")

if __name__ == "__main__":
    asyncio.run(main())
