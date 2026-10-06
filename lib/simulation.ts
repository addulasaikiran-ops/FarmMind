import { recommendation } from "@/lib/farm";

export type LiveField={id:string;name:string;crop:string;growth_stage:string;soil_type:string;area_m2:number;soil_moisture:number;water_available_l:number;target_moisture:number;pump_flow_lpm:number};

function demandFactor(f:LiveField){
  const stage=f.growth_stage==="fruiting"?1.2:f.growth_stage==="flowering"?1.1:.9;
  const soil=f.soil_type==="sandy"?1.12:f.soil_type==="clay"?.82:1;
  return stage*soil;
}

export function advanceFarm(fields:LiveField[],tank:number,simTime:Date,forecast:any,hours=1){
  const nextTime=new Date(simTime.getTime()+hours*3600000);
  const hour=nextTime.getHours();
  const dayIndex=Math.floor(nextTime.getTime()/86400000);
  const rainChance=Number(forecast?.next_6h?.rain_probability_pct||20);
  const expectedRain=Number(forecast?.next_6h?.expected_rain_mm||0);
  let nextTank=tank;
  const events:any[]=[];
  const nextFields=fields.map((f,i)=>{
    const factor=demandFactor(f);
    const heat=Math.max(0,Number(forecast?.current?.temperature_c||30)-24)/20;
    const naturalLoss=Math.min(5,0.7*factor+heat);
    const rainOccurs=((dayIndex+i*3+hour)%10===0)&&rainChance>=50;
    const rainGain=rainOccurs?Math.min(10,Math.max(1,expectedRain*.75)):0;
    let moisture=Math.max(0,Number(f.soil_moisture)-naturalLoss+rainGain);
    if(rainOccurs) events.push({type:"RAIN",field_id:f.id,field:f.name,water_l:Math.round(rainGain),moisture:Number(moisture.toFixed(1)),reason:"Deterministic rain event from forecast risk."});
    const virtualField={...f,soil_moisture:moisture};
    const rec=recommendation(virtualField,rainChance,expectedRain);
    let action=rec.action, water=0;
    if(rec.action==="IRRIGATE" && nextTank>0){
      water=Math.min(Number(rec.water_l),nextTank,Number(f.water_available_l));
      if(water>0){
        const flow=Math.max(1,Number(f.pump_flow_lpm)||20);
        moisture=Math.min(Number(f.target_moisture),moisture+water/(Number(f.area_m2)*.7));
        nextTank-=water;
        events.push({type:"IRRIGATE",field_id:f.id,field:f.name,water_l:Math.round(water),pump_minutes:Number((water/flow).toFixed(1)),moisture:Number(moisture.toFixed(1)),reason:rec.reason});
      } else action="WAIT";
    }
    return {...f,soil_moisture:Number(moisture.toFixed(1)),water_available_l:Math.max(0,Number(f.water_available_l)-water),recommendation:{...rec,water_l:Math.round(water),pump_minutes:water?Number((water/(Number(f.pump_flow_lpm)||20)).toFixed(1)):0},last_action:action};
  });
  return {fields:nextFields,tank:Number(nextTank.toFixed(1)),simTime:nextTime.toISOString(),events};
}
