import json
import os

from openai import OpenAI

from .decision import recommend_irrigation
from .simulator import FarmSimulator


SYSTEM_PROMPT = """You are FarmMind, an explainable AI farm irrigation advisor.
Use the supplied simulated farm data as the source of truth. Never invent sensor readings.
Give concise, farmer-friendly recommendations. Explain WHY, especially rainfall, soil moisture,
crop stage, soil type, and available water. If the data says WAIT, do not recommend irrigation.
You are advising, not claiming to control physical hardware."""


class FarmAgent:
    def __init__(self, simulator: FarmSimulator):
        self.sim = simulator

    def snapshot(self) -> dict:
        weather = self.sim.weather()
        fields = []
        for field in self.sim.fields:
            rec = recommend_irrigation(field, weather)
            fields.append({
                "id": field.id,
                "name": field.name,
                "crop": field.crop.name,
                "growth_stage": field.crop.stage.value,
                "soil_type": field.soil_type,
                "soil_moisture_pct": round(field.soil_moisture_pct, 1),
                "water_available_l": round(field.water_available_l, 1),
                "recommendation": rec.__dict__,
            })
        return {
            "weather": weather.__dict__,
            "fields": fields,
            "analytics": self.sim.analytics(7),
        }

    def answer(self, message: str) -> dict:
        data = self.snapshot()
        if not os.getenv("OPENAI_API_KEY"):
            return {
                "answer": self.fallback_answer(message, data),
                "mode": "deterministic-fallback",
                "data": data,
            }

        client = OpenAI()
        response = client.responses.create(
            model=os.getenv("FARMMIND_MODEL", "gpt-5.5"),
            instructions=SYSTEM_PROMPT,
            input=[
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "input_text",
                            "text": f"Farm data:\n{json.dumps(data, indent=2)}\n\nFarmer question: {message}",
                        }
                    ],
                }
            ],
            max_output_tokens=500,
        )
        return {
            "answer": response.output_text,
            "mode": "openai",
            "data": data,
        }

    @staticmethod
    def fallback_answer(message: str, data: dict) -> str:
        msg = message.lower()
        if "which" in msg or "priority" in msg:
            ranked = sorted(
                data["fields"],
                key=lambda x: x["recommendation"]["priority"],
                reverse=True,
            )
            top = ranked[0]
            return f"{top['name']} is the highest priority: {top['recommendation']['reason']} Recommended water: {top['recommendation']['water_l']} L."
        if "save" in msg or "water" in msg:
            a = data["analytics"]
            return f"In the 7-day simulation, FarmMind used {a['water_used_l']} L and estimated {a['water_saved_l']} L avoided through weather-aware decisions."
        for field in data["fields"]:
            if field["id"].lower() in msg or field["name"].lower() in msg:
                r = field["recommendation"]
                return f"{field['name']}: {r['action']}. {r['reason']} Water: {r['water_l']} L."
        return "Ask me whether to irrigate a field, why to wait, which field has priority, or how much water FarmMind saved."
