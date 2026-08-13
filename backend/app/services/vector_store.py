import os
import joblib
import numpy as np
from typing import List, Tuple, Dict, Any, Optional
from sqlalchemy.orm import Session
from app.db.models import StatuteChunk

VECTOR_CACHE_PATH = os.path.join(os.path.dirname(__file__), "vector_cache.pkl")
_ST_MODEL = None

def get_embedding_model():
    global _ST_MODEL
    if _ST_MODEL is None:
        try:
            from sentence_transformers import SentenceTransformer
            _ST_MODEL = SentenceTransformer("all-MiniLM-L6-v2")
        except Exception:
            _ST_MODEL = False
    return _ST_MODEL

def cosine_similarity_matrix(query_emb: np.ndarray, doc_embs: np.ndarray) -> np.ndarray:
    query_norm = np.linalg.norm(query_emb)
    doc_norms = np.linalg.norm(doc_embs, axis=1)
    if query_norm == 0.0:
        return np.zeros(len(doc_embs))
    doc_norms[doc_norms == 0.0] = 1.0
    return np.dot(doc_embs, query_emb) / (doc_norms * query_norm)

class VectorStore:
    def __init__(self):
        self.chunk_ids: List[str] = []
        self.doc_embeddings: Optional[np.ndarray] = None
        self.is_indexed: bool = False

    def build_index(self, db: Session) -> int:
        model = get_embedding_model()
        if not model:
            print("[VectorStore] SentenceTransformer model unavailable. Skipping dense index build.")
            return 0

        chunks = db.query(StatuteChunk).all()
        if not chunks:
            print("[VectorStore] No statute chunks found in DB.")
            return 0

        texts = [f"{c.act_name} {c.section_number} {c.chunk_text}" for c in chunks]
        self.chunk_ids = [str(c.id) for c in chunks]
        self.doc_embeddings = model.encode(texts, show_progress_bar=False)
        self.is_indexed = True

        cache_data = {
            "chunk_ids": self.chunk_ids,
            "embeddings": self.doc_embeddings
        }
        joblib.dump(cache_data, VECTOR_CACHE_PATH)
        print(f"[VectorStore] Dense vector index successfully built for {len(chunks)} legal chunks.")
        return len(chunks)

    def search(self, db: Session, query: str, domain_hint: Optional[str] = None, k: int = 5, min_score: float = 0.20) -> List[StatuteChunk]:
        model = get_embedding_model()
        if not model:
            return []

        if not self.is_indexed:
            if os.path.exists(VECTOR_CACHE_PATH):
                try:
                    cache_data = joblib.load(VECTOR_CACHE_PATH)
                    self.chunk_ids = cache_data["chunk_ids"]
                    self.doc_embeddings = cache_data["embeddings"]
                    self.is_indexed = True
                except Exception:
                    self.build_index(db)
            else:
                self.build_index(db)

        if not self.is_indexed or self.doc_embeddings is None or len(self.chunk_ids) == 0:
            return []

        query_emb = model.encode([query])[0]
        sims = cosine_similarity_matrix(query_emb, self.doc_embeddings)

        all_chunks = db.query(StatuteChunk).all()
        chunk_map = {str(c.id): c for c in all_chunks}

        scored_results = []
        for idx, sim in enumerate(sims):
            cid = self.chunk_ids[idx]
            chunk = chunk_map.get(cid)
            if not chunk:
                continue
            if domain_hint and chunk.domain_hint != domain_hint:
                continue

            score = float(sim)
            # Boost score if section number matches query
            if chunk.section_number and any(part.lower() in query.lower() for part in chunk.section_number.split()):
                score += 0.30

            if score >= min_score:
                scored_results.append((score, chunk))

        scored_results.sort(key=lambda x: x[0], reverse=True)
        return [c for _, c in scored_results[:k]]

_VECTOR_STORE_INSTANCE = VectorStore()

def get_vector_store() -> VectorStore:
    return _VECTOR_STORE_INSTANCE
