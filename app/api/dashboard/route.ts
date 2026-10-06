import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { cacheGet, cacheSet } from "@/lib/cache";

export async function GET() {
  const cacheKey = "farmmind:dashboard:v1";
  const cached = await cacheGet(cacheKey);
  if (cached) return NextResponse.json(cached, { headers: { "X-FarmMind-Cache": "HIT" } });

  const pool = await db();
  const fields = (await pool.query("SELECT * FROM fields ORDER BY id")).rows;
  const readings = (await pool.query("SELECT * FROM readings ORDER BY recorded_at DESC LIMIT 1000")).rows;
  const daily = (await pool.query(`SELECT DATE(recorded_at) AS recorded_day, ROUND(SUM(water_l)) water_used_l, SUM(CASE WHEN action='WAIT' THEN 1 ELSE 0 END)::int wait_count FROM readings GROUP BY 1 ORDER BY 1 DESC LIMIT 14`)).rows.reverse();
  const totals = (await pool.query("SELECT COALESCE(SUM(water_l),0)::numeric water_used_l, COUNT(*)::int readings, SUM(CASE WHEN action='IRRIGATE' THEN 1 ELSE 0 END)::int irrigation_events FROM readings")).rows[0];

  const response = { fields, readings, daily, totals, database: "postgresql" };
  await cacheSet(cacheKey, response, 30);
  return NextResponse.json(response, { headers: { "X-FarmMind-Cache": "MISS" } });
}