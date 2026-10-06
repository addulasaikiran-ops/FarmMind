"use client";
import {ResponsiveContainer,AreaChart,Area,XAxis,YAxis,Tooltip,Legend} from "recharts";
export default function ImpactChart({data}:{data:any[]}){
 return <div className="h-72 w-full"><ResponsiveContainer width="100%" height="100%"><AreaChart data={data}>
  <XAxis dataKey="day" tick={{fill:"#91aa98",fontSize:11}}/>
  <YAxis tick={{fill:"#91aa98",fontSize:11}}/>
  <Tooltip contentStyle={{background:"#102318",border:"1px solid #24422f",borderRadius:12}}/>
  <Legend/>
  <Area type="monotone" dataKey="water_used_l" name="Water used (L)" stroke="#65d88a" fill="#65d88a" fillOpacity={0.16}/>
  <Area type="monotone" dataKey="wait_count" name="Wait decisions" stroke="#7dd3fc" fill="#7dd3fc" fillOpacity={0.10}/>
 </AreaChart></ResponsiveContainer></div>
}
