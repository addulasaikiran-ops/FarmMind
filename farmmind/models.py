from dataclasses import dataclass, asdict
from enum import Enum
from typing import Any

class CropStage(str, Enum):
    VEGETATIVE = "vegetative"
    FLOWERING = "flowering"
    FRUITING = "fruiting"

@dataclass
class Crop:
    name: str
    stage: CropStage
    area_m2: float
    target_moisture: float = 55.0

@dataclass
class Weather:
    temperature_c: float
    humidity_pct: float
    rain_probability_pct: float
    expected_rain_mm: float
    forecast_hours: int = 24

@dataclass
class Field:
    id: str
    name: str
    soil_moisture_pct: float
    soil_type: str
    crop: Crop
    water_available_l: float
    irrigation_efficiency: float = 0.85
    last_irrigation_l: float = 0.0

@dataclass
class IrrigationRecommendation:
    field_id: str
    action: str
    water_l: float
    pump_minutes: float
    confidence: float
    reason: str
    priority: int

def to_dict(obj: Any):
    if hasattr(obj, "__dataclass_fields__"):
        return asdict(obj)
    return obj
