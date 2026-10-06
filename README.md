# FarmMind 🌱

FarmMind is a software-only AI farm decision system for irrigation planning.

## What it demonstrates
- Simulated soil moisture, crop stage, weather and water availability
- Explainable irrigation recommendations
- Multi-field prioritisation
- What-if simulation and water-saving analytics
- FastAPI REST API
- MCP tools for an AI farm agent
- Browser dashboard with no frontend build step

## Run locally
```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn farmmind.api:app --reload
```

Open http://localhost:8000

## Core loop
**Sense → Decide → Act → Measure → Improve**

The current release is hardware-free: all sensor and weather values are simulated so the complete decision workflow can be demonstrated without physical devices.
