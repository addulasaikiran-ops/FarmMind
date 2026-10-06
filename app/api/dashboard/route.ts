import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { cacheGet, cacheSet } from "@/lib/cache";
import { getWeather } from "@/lib/weather";
import { recommendation } from "@/lib/farm";

export async function GET() {
  const cacheKey = "farmmind:dashboard:v2";
  const cached = await cacheGet(cacheKey);
  if (cached) return NextResponse.json(cached, { headers: { "X-FarmMind-Cache": "HIT" } });
  const pool = await db();
  const fields = (await pool.query("SELECT * FROM fields ORDER BY id")).rows;
  const readings = (await pool.query("SELECT * FROM readings ORDER BY recorded_at DESC LIMIT 1000")).rows;
  const daily = (await pool.query("SELECT DATE(recorded_at) AS recorded_day, ROUND(SUM(water_l)) water_used_l, SUM(CASE WHEN action='WAIT' THEN 1 ELSE 0 END)::int wait_count FROM readings GROUP BY 1 ORDER BY 1 DESC LIMIT 14")).rows.reverse();
  const totals = (await pool.query("SELECT COALESCE(SUM(water_l),0)::numeric water_used_l, COUNT(*)::int readings, SUM(CASE WHEN action='IRRIGATE' THEN 1 ELSE 0 END)::int irrigation_events FROM readings")).rows[0];
  let weather = await cacheGet("farmmind:weather:v1");
  if (!weather) { try { weather = await getWeather(); await cacheSet("farmmind:weather:v1", weather, 600); } catch {} }
  const enrichedFields = fields.map((field) => ({ ...field, recommendation: weather ? recommendation(field, weather.next_6h.rain_probability_pct, weather.next_6h.expected_rain_mm) : null }));
  const response = { fields: enrichedFields, readings, daily, totals, weather, database: "postgresql", weather_source: "Open-Meteo" };
  await cacheSet(cacheKey, response, 30);
  return NextResponse.json(response, { headers: { "X-FarmMind-Cache": "MISS" } });
}