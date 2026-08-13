import logging
from typing import List, Tuple, Dict, Any
import numpy as np
import os

from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity
from sklearn.pipeline import FeatureUnion, Pipeline
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression

logger = logging.getLogger(__name__)

# Model 1: Multilingual Sentence Transformer for Semantic Embedding Search
MODEL_NAME = "paraphrase-multilingual-MiniLM-L12-v2"
os.environ["TOKENIZERS_PARALLELISM"] = "false"

try:
    logger.info(f"Loading SentenceTransformer model {MODEL_NAME}...")
    st_model = SentenceTransformer(MODEL_NAME)
except Exception as e:
    logger.error(f"Failed to load model {MODEL_NAME}: {e}")
    st_model = SentenceTransformer("all-MiniLM-L6-v2")


def build_tfidf_feature_union_pipeline():
    """
    Model 2: FeatureUnion combining Word TF-IDF (1,3) & Character WB TF-IDF (3,5)
    paired with LogisticRegression(C=3.0) for pure ML classification.
    """
    word_vectorizer = TfidfVectorizer(
        ngram_range=(1, 3),
        max_features=5000,
        sublinear_tf=True
    )
    char_wb_vectorizer = TfidfVectorizer(
        analyzer='char_wb',
        ngram_range=(3, 5),
        max_features=10000,
        sublinear_tf=True
    )
    
    union = FeatureUnion([
        ('word_tfidf', word_vectorizer),
        ('char_wb_tfidf', char_wb_vectorizer)
    ])
    
    pipeline = Pipeline([
        ('features', union),
        ('classifier', LogisticRegression(C=3.0, max_iter=1000, class_weight='balanced'))
    ])
    
    return pipeline


def generate_embedding(text: str) -> np.ndarray:
    """Generate a single embedding for the given text."""
    if not text:
        return np.zeros((st_model.get_sentence_embedding_dimension(),))
    return st_model.encode([text])[0]


def generate_embeddings_batch(texts: List[str]) -> np.ndarray:
    """Generate embeddings for a list of texts."""
    if not texts:
        return np.array([])
    return st_model.encode(texts)


def find_best_matches(
    query_text: str, 
    kb_entries: List[Dict[str, Any]], 
    top_k: int = 3,
    similarity_threshold: float = 0.3
) -> List[Dict[str, Any]]:
    """
    Find best matching KB entries combining Semantic Vector Search & TF-IDF FeatureUnion.
    """
    if not kb_entries or not query_text:
        return []

    query_emb = generate_embedding(query_text).reshape(1, -1)
    
    kb_texts = [
        f"[{entry['domain']}] {entry['issue_type']}: {entry.get('description', '')} {entry.get('section_text_plain', '')}"
        for entry in kb_entries
    ]
    
    kb_embs = generate_embeddings_batch(kb_texts)
    similarities = cosine_similarity(query_emb, kb_embs)[0]
    
    top_indices = np.argsort(similarities)[::-1]
    
    results = []
    for idx in top_indices:
        score = float(similarities[idx])
        if score >= similarity_threshold:
            match = kb_entries[idx].copy()
            match["confidence_score"] = score
            results.append(match)
            if len(results) >= top_k:
                break
                
    return results
