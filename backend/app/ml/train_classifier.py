import os
import json
import joblib
import numpy as np
from datetime import datetime
from typing import Dict, Any, Tuple, List

from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.pipeline import FeatureUnion, Pipeline
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import StratifiedKFold, cross_val_score
from sklearn.metrics import classification_report, accuracy_score

MODEL_DIR = os.path.join(os.path.dirname(__file__), "models")
MODEL_PATH = os.path.join(MODEL_DIR, "classification_model.pkl")
DATASET_PATH = os.path.join(os.path.dirname(__file__), "dataset.json")

def load_dataset(dataset_path: str = DATASET_PATH) -> List[Dict[str, str]]:
    with open(dataset_path, "r", encoding="utf-8") as f:
        return json.load(f)

def build_model_pipeline() -> Pipeline:
    # Feature union combining word n-grams and character n-grams for multilingual & typo robustness
    word_vectorizer = TfidfVectorizer(
        ngram_range=(1, 3),
        analyzer="word",
        sublinear_tf=True,
        min_df=1
    )
    char_vectorizer = TfidfVectorizer(
        ngram_range=(3, 5),
        analyzer="char_wb",
        sublinear_tf=True,
        min_df=1
    )
    features = FeatureUnion([
        ("word_tfidf", word_vectorizer),
        ("char_tfidf", char_vectorizer)
    ])
    
    classifier = LogisticRegression(C=3.0, max_iter=1000, solver="lbfgs")
    
    pipeline = Pipeline([
        ("features", features),
        ("classifier", classifier)
    ])
    return pipeline

def train_and_save_model(dataset_path: str = DATASET_PATH, model_save_path: str = MODEL_PATH) -> Dict[str, Any]:
    if os.getenv("VERCEL"):
        model_save_path = "/tmp/classification_model.pkl"
        
    try:
        os.makedirs(os.path.dirname(model_save_path), exist_ok=True)
    except Exception:
        model_save_path = "/tmp/classification_model.pkl"
        os.makedirs(os.path.dirname(model_save_path), exist_ok=True)
    
    data = load_dataset(dataset_path)
    X = [item["text"] for item in data]
    y = [f"{item['domain']}:{item['issue_type']}" for item in data]
    
    pipeline = build_model_pipeline()
    
    # Perform 5-fold cross-validation evaluation
    skf = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
    cv_scores = cross_val_score(pipeline, X, y, cv=skf, scoring="accuracy")
    
    pipeline.fit(X, y)
    y_pred = pipeline.predict(X)
    train_acc = accuracy_score(y, y_pred)
    mean_cv_acc = float(np.mean(cv_scores))
    
    report = classification_report(y, y_pred, output_dict=True)
    
    model_payload = {
        "pipeline": pipeline,
        "classes": list(pipeline.classes_),
        "train_accuracy": round(float(train_acc), 4),
        "cv_accuracy": round(mean_cv_acc, 4),
        "trained_at": datetime.now().isoformat(),
        "sample_count": len(X),
        "metrics_report": report
    }
    
    try:
        joblib.dump(model_payload, model_save_path)
    except Exception:
        model_save_path = "/tmp/classification_model.pkl"
        joblib.dump(model_payload, model_save_path)

    print(f"================ ML MODEL TRAINING METRICS ================")
    print(f" Dataset Size: {len(X)} samples across {len(set(y))} classes")
    print(f" Training Accuracy: {train_acc * 100:.2f}%")
    print(f" 5-Fold Cross-Validation Accuracy: {mean_cv_acc * 100:.2f}%")
    print(f" Saved Model Artifact: {model_save_path}")
    print(f"===========================================================")
    return model_payload

def load_or_train_model(model_save_path: str = MODEL_PATH) -> Dict[str, Any]:
    if os.getenv("VERCEL"):
        model_save_path = "/tmp/classification_model.pkl"
        
    if os.path.exists(model_save_path):
        try:
            return joblib.load(model_save_path)
        except Exception as e:
            print(f"[ML Model] Error loading model file ({e}). Retraining...")
    return train_and_save_model(model_save_path=model_save_path)

if __name__ == "__main__":
    train_and_save_model()
