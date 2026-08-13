import os
import pytest
from app.ml.train_classifier import train_and_save_model, load_or_train_model, MODEL_PATH
from app.services.classification import classify_intake_text

def test_model_training_and_persistence(tmp_path):
    temp_model_path = str(tmp_path / "test_model.pkl")
    
    # Test model training & saving
    model_data = train_and_save_model(model_save_path=temp_model_path)
    assert os.path.exists(temp_model_path)
    assert "pipeline" in model_data
    acc = model_data.get("train_accuracy", model_data.get("accuracy", 1.0))
    assert acc >= 0.85

    # Test loading saved model
    loaded_data = load_or_train_model(model_save_path=temp_model_path)
    assert loaded_data.get("train_accuracy", loaded_data.get("accuracy", 1.0)) == acc

def test_classification_service_ml():
    res = classify_intake_text("Landlord refuses to return deposit money of 20000 rupees")
    assert res["domain"] == "tenant"
    assert res["issue_type"] == "deposit_not_returned"
    assert res["confidence"] > 0.0
    assert isinstance(res["candidate_matches"], list)
    assert len(res["candidate_matches"]) > 0
