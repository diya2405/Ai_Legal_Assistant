"""Script to seed the Knowledge Base (kb_entries) table from JSON."""
import asyncio
import json
import logging
from pathlib import Path
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
import sys
import os

# Add the project root to the python path
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from app.db import AsyncSessionLocal, engine
from app.models.kb import KBEntry
from app.schemas.kb import KBEntrySeed

# Configure logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)

SEED_FILE_PATH = Path("app/kb_data/seed.json")


async def seed_kb():
    """Reads seed.json, validates it, and upserts into the database."""
    if not SEED_FILE_PATH.exists():
        logger.error(f"Seed file not found: {SEED_FILE_PATH}")
        return

    logger.info(f"Loading seed data from {SEED_FILE_PATH}")
    with open(SEED_FILE_PATH, "r", encoding="utf-8") as f:
        raw_data = json.load(f)

    # Validate data using Pydantic
    validated_entries = []
    for i, item in enumerate(raw_data):
        try:
            entry = KBEntrySeed(**item)
            validated_entries.append(entry)
        except Exception as e:
            logger.error(f"Validation failed for entry {i}: {e}")
            return

    logger.info(f"Successfully validated {len(validated_entries)} entries.")

    async with AsyncSessionLocal() as session:
        try:
            # For simplicity, we'll clear the existing entries and re-insert
            # In a real production system, you'd want a more robust upsert mechanism
            # or versioning, but since this is seed data, wiping is fine for now.
            logger.info("Clearing existing kb_entries...")
            await session.execute(text("TRUNCATE TABLE kb_entries CASCADE"))
            
            logger.info("Inserting new entries...")
            db_entries = [
                KBEntry(
                    domain=entry.domain,
                    issue_type=entry.issue_type,
                    act_name=entry.act_name,
                    section_number=entry.section_number,
                    section_text_plain=entry.section_text_plain,
                    remedy_forum=entry.remedy_forum,
                    limitation_period=entry.limitation_period,
                    notice_template_id=entry.notice_template_id,
                    law_code=entry.law_code,
                    source_url=entry.source_url,
                    last_verified_date=entry.last_verified_date,
                )
                for entry in validated_entries
            ]
            
            session.add_all(db_entries)
            await session.commit()
            logger.info(f"Successfully inserted {len(db_entries)} entries into the database.")
            
        except Exception as e:
            await session.rollback()
            logger.error(f"Database error during seeding: {e}")
        finally:
            await engine.dispose()


if __name__ == "__main__":
    asyncio.run(seed_kb())
