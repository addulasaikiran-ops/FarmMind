from mcp.server.fastmcp import FastMCP
from .simulator import FarmSimulator
from .decision import recommend_irrigation as decision_recommend_irrigation

mcp = FastMCP("FarmMind")
sim = FarmSimulator()

@mcp.tool()
def get_field_status(field_id: str = "") -> list[dict]:
    """Return current simulated field conditions."""
    fields = sim.fields if not field_id else [f for f in sim.fields if f.id == field_id]
    return [
        {
            "id": f.id, "name": f.name, "soil_moisture_pct": f.soil_moisture_pct,
            "soil_type": f.soil_type, "crop": f.crop.name,
            "growth_stage": f.crop.stage.value, "water_available_l": round(f.water_available_l, 1),
        } for f in fields
    ]

@mcp.tool()
def get_weather() -> dict:
    """Return the current simulated forecast."""
    w = sim.weather()
    return {
        "temperature_c": round(w.temperature_c, 1),
        "humidity_pct": round(w.humidity_pct, 1),
        "rain_probability_pct": round(w.rain_probability_pct, 1),
        "expected_rain_mm": round(w.expected_rain_mm, 1),
    }

@mcp.tool()
def recommend_irrigation(field_id: str) -> dict:
    """Explain whether a field should be irrigated and how much water to use."""
    field = next((f for f in sim.fields if f.id == field_id), None)
    if not field:
        return {"error": "Unknown field"}
    w = sim.weather()
    return decision_recommend_irrigation(field, w).__dict__

@mcp.tool()
def get_water_savings(days: int = 7) -> dict:
    """Return simulated water-use impact over the requested period."""
    return sim.analytics(max(1, min(days, 30)))

@mcp.tool()
def simulate_irrigation(field_id: str, water_l: float) -> dict:
    """Simulate applying a chosen amount of water to a field."""
    field = next((f for f in sim.fields if f.id == field_id), None)
    if not field:
        return {"error": "Unknown field"}
    before = field.soil_moisture_pct
    applied = max(0.0, min(water_l, field.water_available_l))
    field.soil_moisture_pct = min(90, before + applied * field.irrigation_efficiency / max(1, field.crop.area_m2) / 0.7)
    field.water_available_l -= applied
    return {
        "field_id": field_id, "water_applied_l": round(applied, 1),
        "moisture_before_pct": round(before, 1),
        "moisture_after_pct": round(field.soil_moisture_pct, 1),
    }

if __name__ == "__main__":
    mcp.run(transport="streamable-http")
