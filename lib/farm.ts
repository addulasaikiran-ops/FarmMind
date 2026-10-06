export type Field={id:string;name:string;crop:string;growth_stage:string;soil_type:string;area_m2:number;soil_moisture:number;water_available_l:number;target_moisture:number};
export type Reading={id:number;field_id:string;recorded_at:string;soil_moisture:number;temperature_c:number;humidity_pct:number;rain_probability:number;expected_rain_mm:number;action:string;water_l:number;reason:string};
export function recommendation(f:Field,rainProbability=45,expectedRain=4){
 const gap=Math.max(0,f.target_moisture-f.soil_moisture),severe=f.soil_moisture<30;
 if(!severe&&rainProbability>=60&&expectedRain>=5)return{field_id:f.id,action:"WAIT",water_l:0,pump_minutes:0,confidence:.91,priority:1,reason:"Rain is likely soon, so irrigation now would waste water."};
 const stageFactor=f.growth_stage==="fruiting"?1.2:f.growth_stage==="flowering"?1.1:.9,soilFactor=f.soil_type==="sandy"?1.1:f.soil_type==="clay"?.85:1;
 const water=Math.min(f.water_available_l,Math.round(gap*f.area_m2*.7/.85*stageFactor*soilFactor));
 if(water<=40)return{field_id:f.id,action:"WAIT",water_l:0,pump_minutes:0,confidence:.86,priority:1,reason:"Soil moisture is close enough to target; avoid unnecessary irrigation."};
 return{field_id:f.id,action:"IRRIGATE",water_l:water,pump_minutes:Math.round(water/20*10)/10,confidence:severe?.96:.9,priority:severe?3:2,reason:`Moisture is ${f.soil_moisture}% and the crop is in ${f.growth_stage} stage; replenish the moisture gap.`};
}
