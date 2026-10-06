import { Pool } from "pg";
declare global { var farmMindPool: Pool | undefined }
const pool = globalThis.farmMindPool ?? new Pool({connectionString:process.env.DATABASE_URL,max:10,ssl:process.env.DATABASE_URL?.includes("railway")?{rejectUnauthorized:false}:undefined});
if(process.env.NODE_ENV!=="production") globalThis.farmMindPool=pool;

export async function db(){
  await pool.query(`
    CREATE TABLE IF NOT EXISTS fields(
      id TEXT PRIMARY KEY,name TEXT NOT NULL,crop TEXT NOT NULL,growth_stage TEXT NOT NULL,soil_type TEXT NOT NULL,
      area_m2 NUMERIC NOT NULL,soil_moisture NUMERIC NOT NULL,water_available_l NUMERIC NOT NULL,
      target_moisture NUMERIC NOT NULL DEFAULT 55,pump_flow_lpm NUMERIC NOT NULL DEFAULT 20,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    ALTER TABLE fields ADD COLUMN IF NOT EXISTS pump_flow_lpm NUMERIC NOT NULL DEFAULT 20;
    CREATE TABLE IF NOT EXISTS readings(
      id BIGSERIAL PRIMARY KEY,field_id TEXT NOT NULL REFERENCES fields(id),recorded_at TIMESTAMPTZ NOT NULL,
      soil_moisture NUMERIC NOT NULL,temperature_c NUMERIC NOT NULL,humidity_pct NUMERIC NOT NULL,
      rain_probability NUMERIC NOT NULL,expected_rain_mm NUMERIC NOT NULL,action TEXT NOT NULL,water_l NUMERIC NOT NULL,reason TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS readings_recorded_at_idx ON readings(recorded_at DESC);
    CREATE TABLE IF NOT EXISTS irrigation_events(
      id BIGSERIAL PRIMARY KEY,field_id TEXT NOT NULL REFERENCES fields(id),started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      water_l NUMERIC NOT NULL,pump_flow_lpm NUMERIC NOT NULL,pump_minutes NUMERIC NOT NULL,
      moisture_before NUMERIC NOT NULL,moisture_after NUMERIC NOT NULL,notes TEXT NOT NULL DEFAULT ''
    );
    CREATE INDEX IF NOT EXISTS irrigation_events_started_at_idx ON irrigation_events(started_at DESC);
    CREATE TABLE IF NOT EXISTS farm_water(
      id INTEGER PRIMARY KEY CHECK(id=1),source TEXT NOT NULL DEFAULT 'Tank + Borewell',
      capacity_l NUMERIC NOT NULL,current_l NUMERIC NOT NULL,refill_l NUMERIC NOT NULL DEFAULT 0,updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS chat_history(id BIGSERIAL PRIMARY KEY,message TEXT NOT NULL,answer TEXT NOT NULL,created_at TIMESTAMPTZ NOT NULL DEFAULT NOW());
  `);
  const {rows}=await pool.query("SELECT COUNT(*)::int AS count FROM fields");
  if(rows[0].count===0){
    await pool.query(`INSERT INTO fields(id,name,crop,growth_stage,soil_type,area_m2,soil_moisture,water_available_l,target_moisture,pump_flow_lpm)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10),($11,$12,$13,$14,$15,$16,$17,$18,$19,$20),($21,$22,$23,$24,$25,$26,$27,$28,$29,$30)`,
      ["F1","Tomato North","Tomato","flowering","loamy",600,41,7000,55,20,"F2","Chilli East","Chilli","fruiting","sandy",450,29,5000,55,20,"F3","Groundnut South","Groundnut","vegetative","clay",800,58,8500,55,20]);
    const ids=["F1","F2","F3"];
    for(let i=0;i<1800;i++){
      const fieldId=ids[i%3],moisture=25+((i*17)%48),temp=27+((i*7)%9),rain=((i*11)%7)*10,action=moisture<36&&rain<60?"IRRIGATE":"WAIT",water=action==="IRRIGATE"?Math.round((55-moisture)*9):0;
      await pool.query(`INSERT INTO readings(field_id,recorded_at,soil_moisture,temperature_c,humidity_pct,rain_probability,expected_rain_mm,action,water_l,reason)
        VALUES($1,NOW()-($2 || ' hours')::interval,$3,$4,$5,$6,$7,$8,$9,$10)`,
        [fieldId,i,moisture,temp,55+(i%35),rain,Math.round(rain/12),action,water,action==="IRRIGATE"?"Low moisture and limited rain risk.":"Rain or adequate moisture makes irrigation unnecessary."]);
    }
  }
  await pool.query(`INSERT INTO farm_water(id,source,capacity_l,current_l) VALUES(1,'Tank + Borewell',30000,20500)
    ON CONFLICT(id) DO NOTHING`);
  return pool;
}