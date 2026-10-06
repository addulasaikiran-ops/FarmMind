from .models import Field, Weather, IrrigationRecommendation, CropStage

STAGE_FACTOR = {
    CropStage.VEGETATIVE: 0.90,
    CropStage.FLOWERING: 1.10,
    CropStage.FRUITING: 1.20,
}

SOIL_FACTOR = {
    "sandy": 1.10,
    "loamy": 1.00,
    "clay": 0.85,
}

def calculate_water_requirement(field: Field, weather: Weather) -> float:
    moisture_gap = max(0.0, field.crop.target_moisture - field.soil_moisture_pct)
    # Simple interpretable model: 1% moisture gap ≈ 0.7 L/m².
    base_l = moisture_gap * field.crop.area_m2 * 0.7
    stage = STAGE_FACTOR[field.crop.stage]
    soil = SOIL_FACTOR.get(field.soil_type, 1.0)
    heat = 1.0 + max(0.0, weather.temperature_c - 28.0) * 0.02
    rain_credit = min(0.65, weather.expected_rain_mm / 25.0)
    return max(0.0, base_l * stage * soil * heat * (1.0 - rain_credit) / field.irrigation_efficiency)

def recommend_irrigation(field: Field, weather: Weather) -> IrrigationRecommendation:
    required = calculate_water_requirement(field, weather)
    severe = field.soil_moisture_pct < 30
    rain_soon = weather.rain_probability_pct >= 60 and weather.expected_rain_mm >= 5
    water_short = field.water_available_l < required

    if rain_soon and not severe:
        action, water, reason = "WAIT", 0.0, (
            f"Rain is likely ({weather.rain_probability_pct:.0f}%) with "
            f"about {weather.expected_rain_mm:.1f} mm expected, so irrigation can wait."
        )
        confidence = min(0.98, 0.65 + weather.rain_probability_pct / 300)
    elif required <= 40:
        action, water, reason = "WAIT", 0.0, (
            f"Soil moisture is already near the {field.crop.target_moisture:.0f}% target; "
            "irrigation would add little value."
        )
        confidence = 0.91
    else:
        water = min(required, field.water_available_l)
        if water_short:
            reason = (
                f"The field needs about {required:.0f} L, but only {field.water_available_l:.0f} L "
                "is currently available, so the recommendation is capped at available water."
            )
        else:
            reason = (
                f"Soil moisture is {field.soil_moisture_pct:.0f}% versus a "
                f"{field.crop.target_moisture:.0f}% target; weather does not justify waiting."
            )
        action = "IRRIGATE"
        confidence = 0.94 if severe else 0.88

    priority = 1 if severe and action == "IRRIGATE" else 2 if action == "IRRIGATE" else 3
    return IrrigationRecommendation(
        field_id=field.id,
        action=action,
        water_l=round(water, 1),
        pump_minutes=round(water / 20.0, 1),
        confidence=round(confidence, 2),
        reason=reason,
        priority=priority,
    )
