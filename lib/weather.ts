export type WeatherData={
 location:string;
 latitude:number;
 longitude:number;
 timezone:string;
 current:{temperature_c:number;humidity_pct:number;precipitation_mm:number;rain_mm:number;showers_mm:number;weather_code:number;wind_kmh:number};
 next_6h:{rain_probability_pct:number;expected_rain_mm:number};
 hourly:{time:string;rain_probability_pct:number;precipitation_mm:number}[];
 fetched_at:string;
};

const LAT=13.2172;
const LON=79.1003;
const TZ="Asia/Kolkata";

export async function getWeather():Promise<WeatherData>{
 const url=new URL("https://api.open-meteo.com/v1/forecast");
 url.searchParams.set("latitude",String(LAT));
 url.searchParams.set("longitude",String(LON));
 url.searchParams.set("timezone",TZ);
 url.searchParams.set("forecast_hours","24");
 url.searchParams.set("current","temperature_2m,relative_humidity_2m,precipitation,rain,showers,weather_code,wind_speed_10m");
 url.searchParams.set("hourly","precipitation_probability,precipitation,rain,showers");
 const response=await fetch(url,{cache:"no-store",signal:AbortSignal.timeout(8000)});
 if(!response.ok) throw new Error(`Weather API returned ${response.status}`);
 const raw=await response.json();
 const h=raw.hourly||{};
 const times:string[]=h.time||[];
 const probs:number[]=h.precipitation_probability||[];
 const precipitation:number[]=h.precipitation||[];
 const hourly=times.map((time:string,i:number)=>({time,rain_probability_pct:Number(probs[i]??0),precipitation_mm:Number(precipitation[i]??0)}));
 const next=hourly.slice(0,6);
 return {location:"Chittoor, Andhra Pradesh, India",latitude:LAT,longitude:LON,timezone:TZ,
  current:{temperature_c:Number(raw.current?.temperature_2m??0),humidity_pct:Number(raw.current?.relative_humidity_2m??0),precipitation_mm:Number(raw.current?.precipitation??0),rain_mm:Number(raw.current?.rain??0),showers_mm:Number(raw.current?.showers??0),weather_code:Number(raw.current?.weather_code??0),wind_kmh:Number(raw.current?.wind_speed_10m??0)},
  next_6h:{rain_probability_pct:Math.max(0,...next.map(x=>x.rain_probability_pct)),expected_rain_mm:Number(next.reduce((s,x)=>s+x.precipitation_mm,0).toFixed(1))},hourly,fetched_at:new Date().toISOString()};
}
