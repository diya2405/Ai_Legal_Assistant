# LegalAId Backend

AI Legal Rights Assistant for First-Generation Litigants.

## Prerequisites
- Python 3.11+
- PostgreSQL / Supabase

## Setup

1. Create a virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # Linux/Mac
venv\Scripts\activate  # Windows
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Setup environment variables:
Copy `.env.example` to `.env` and fill in your Supabase database credentials and API keys.

## Running the App
```bash
uvicorn app.main:app --reload
```

## Running Migrations
```bash
alembic upgrade head
```

## Project Structure
- `app/`: FastAPI application code
  - `routers/`: API endpoints
  - `models/`: SQLAlchemy database models
  - `schemas/`: Pydantic models for validation
  - `services/`: Business logic and AI integrations
- `alembic/`: Database migrations

## API Documentation
Once running, visit http://localhost:8000/docs for the Swagger UI documentation.
