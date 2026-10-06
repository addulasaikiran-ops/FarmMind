from dataclasses import dataclass
from datetime import date, timedelta
import random

from .decision import recommend_irrigation
from .models import Crop, CropStage, Field, Weather

@dataclass
class SimulationDay:
    day: str
    field_id: str
    moisture_before: float
    recommendation: dict
    rain_mm: float
    moisture_after: float
    water_used_l: float
    water_saved_l: float

class FarmSimulator:
    def __init__(self, seed: int = 7):
        self.rng = random.Random(seed)
        self.fields = self._seed_fields()

    def _seed_fields(self):
        return [
            Field(
                id="F1", name="Tomato North", soil_moisture_pct=41,
                soil_type="loamy",
                crop=Crop("Tomato", CropStage.FLOWERING, 600),
                water_available_l=7000,
            ),
            Field(
                id="F2", name="Chilli East", soil_moisture_pct=29,
                soil_type="sandy",
                crop=Crop("Chilli", CropStage.FRUiting if False else CropStage.FRUITING, 450),
                water_available_l=5000,
            ),
            Field(
                id="F3", name="Groundnut South", soil_moisture_pct=58,
                soil_type="clay",
                crop=Crop("Groundnut", CropStage.VEGETATIVE, 800),
                water_available_l=8500,
            ),
        ]

    def weather(self, day_index: int = 0) -> Weather:
        rain = self.rng.choice([0, 0, 2, 4, 8, 14])
        probability = min(90, 15 + rain * 5 + self.rng.randint(0, 20))
        return Weather(
            temperature_c=27 + self.rng.uniform(-1, 6),
            humidity_pct=55 + self.rng.uniform(-10, 20),
            rain_probability_pct=probability,
            expected_rain_mm=rain,
        )

    def recommend_all(self):
        weather = self.weather()
        rows = [recommend_irrigation(f, weather) for f in self.fields]
        return weather, sorted(rows, key=lambda x: (x.priority, -x.water_l))

    def run(self, days: int = 7) -> list[SimulationDay]:
        results = []
        start = date.today()
        for offset in range(days):
            weather = self.weather(offset)
            for field in self.fields:
                before = field.soil_moisture_pct
                rec = recommend_irrigation(field, weather)
                baseline_water = max(0.0, (field.crop.target_moisture - before) * field.crop.area_m2 * 0.7 / field.irrigation_efficiency)
                if rec.action == "IRRIGATE":
                    field.soil_moisture_pct += min(18, rec.water_l / max(1, field.crop.area_m2) * field.irrigation_efficiency / 0.7)
                    field.water_available_l -= rec.water_l
                    field.last_irrigation_l = rec.water_l
                field.soil_moisture_pct -= max(0.0, 1.2 + (weather.temperature_c - 27) * 0.12)
                field.soil_moisture_pct += min(10, weather.expected_rain_mm * 0.8)
                field.soil_moisture_pct = max(10, min(90, field.soil_moisture_pct))
                results.append(SimulationDay(
                    day=str(start + timedelta(days=offset)),
                    field_id=field.id,
                    moisture_before=round(before, 1),
                    recommendation={
                        "action": rec.action, "water_l": rec.water_l,
                        "pump_minutes": rec.pump_minutes, "reason": rec.reason,
                        "confidence": rec.confidence, "priority": rec.priority,
                    },
                    rain_mm=weather.expected_rain_mm,
                    moisture_after=round(field.soil_moisture_pct, 1),
                    water_used_l=rec.water_l,
                    water_saved_l=round(max(0.0, baseline_water - rec.water_l), 1),
                ))
        return results

    def analytics(self, days: int = 7):
        rows = self.run(days)
        used = sum(r.water_used_l for r in rows)
        saved = sum(r.water_saved_l for r in rows)
        irrigations = sum(r.recommendation["action"] == "IRRIGATE" for r in rows)
        return {
            "days": days,
            "water_used_l": round(used, 1),
            "water_saved_l": round(saved, 1),
            "irrigation_events": irrigations,
            "avoidable_irrigation_rate_pct": round((saved / max(1, saved + used)) * 100, 1),
            "closed_loop": ["Sense", "Decide", "Act", "Measure", "Improve"],
        }
