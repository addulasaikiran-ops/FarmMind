# FarmMind

FarmMind is a software-only agricultural decision system for smarter irrigation. It does **not** require AI or hardware.

## Features
- Real 7-day weather forecast from Open-Meteo
- 6-hour rain-aware irrigation recommendations
- Crop growth stage + soil type + soil moisture rules
- Water availability and tank/borewell-aware decisions
- Predictive moisture/irrigation logic
- Field priority map
- Automatic farm alerts
- 14-day PostgreSQL water/decision analytics
- 30-day traditional-vs-FarmMind water simulator
- Water-savings measurement
- Redis caching
- PostgreSQL source of truth
- TanStack Virtual sensor history
- Responsive farmer dashboard

## Decision flow
**Sense → Forecast → Calculate → Prioritize → Irrigate/Wait → Measure**

No generative AI is used in the application. All irrigation recommendations are deterministic and explainable.

## Stack
Next.js · React · Tailwind CSS · PostgreSQL · Redis · Open-Meteo · TanStack Table/Virtual · Recharts · Railway

## Weather
The production dashboard uses live Open-Meteo forecast data for Chittoor, Andhra Pradesh. Weather is cached for 10 minutes and the dashboard for 30 seconds.

## Run
```bash
npm install
npm run dev
```

Set `DATABASE_URL` and optionally `REDIS_URL`. The application creates and seeds its PostgreSQL tables on first connection.
