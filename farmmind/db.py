import os
from datetime import datetime, timezone

try:
    from pymongo import MongoClient
except ImportError:
    MongoClient = None


class FarmRepository:
    """MongoDB persistence with an automatic in-memory fallback for local demos."""

    def __init__(self):
        self.client = None
        self.db = None
        self.enabled = False
        uri = os.getenv("MONGO_URL")
        if MongoClient and uri:
            try:
                self.client = MongoClient(uri, serverSelectionTimeoutMS=2000)
                self.client.admin.command("ping")
                self.db = self.client["farmmind"]
                self.enabled = True
            except Exception:
                self.client = None
                self.db = None

    def load_fields(self):
        if not self.enabled:
            return []
        return list(self.db.fields.find({}, {"_id": 0}))

    def save_fields(self, fields):
        if not self.enabled:
            return
        for field in fields:
            self.db.fields.replace_one({"id": field.id}, self._field_doc(field), upsert=True)

    def log_chat(self, message: str, answer: str, mode: str):
        if not self.enabled:
            return
        self.db.chat_history.insert_one({
            "message": message,
            "answer": answer,
            "mode": mode,
            "created_at": datetime.now(timezone.utc),
        })

    @staticmethod
    def _field_doc(field):
        return {
            "id": field.id,
            "name": field.name,
            "soil_moisture_pct": field.soil_moisture_pct,
            "soil_type": field.soil_type,
            "crop": {
                "name": field.crop.name,
                "stage": field.crop.stage.value,
                "area_m2": field.crop.area_m2,
                "target_moisture": field.crop.target_moisture,
            },
            "water_available_l": field.water_available_l,
            "irrigation_efficiency": field.irrigation_efficiency,
            "last_irrigation_l": field.last_irrigation_l,
        }
