import {NextResponse} from "next/server";
import {db} from "@/lib/db";
import {getWeather} from "@/lib/weather";
import {advanceFarm} from "@/lib/simulation";

export async function GET(){
  const pool=await db();
  const fields=(await pool.query("SELECT * FROM fields ORDER BY id")).rows;
  const water=(await pool.query("SELECT * FROM farm_water WHERE id=1")).rows[0];
  const weather=await getWeather();
  return NextResponse.json({fields,tank:Number(water?.current_l||0),simTime:new Date().toISOString(),weather});
}

export async function POST(req:Request){
  const body=await req.json();
  const weather=await getWeather();
  const result=advanceFarm(body.fields||[],Number(body.tank||0),new Date(body.simTime||Date.now()),weather,Number(body.hours||1));
  return NextResponse.json({...result,weather});
}
