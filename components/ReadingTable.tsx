"use client";
import {useMemo,useRef} from "react";
import {createSortedRowModel,rowSortingFeature,sortFns,tableFeatures,useTable} from "@tanstack/react-table";
import type {ColumnDef} from "@tanstack/react-table";
import {useVirtualizer} from "@tanstack/react-virtual";
type Reading={id:number;field_id:string;recorded_at:string;soil_moisture:number;temperature_c:number;rain_probability:number;action:string;water_l:number;reason:string};
const features=tableFeatures({rowSortingFeature,sortedRowModel:createSortedRowModel(),sortFns});
const columns:Array<ColumnDef<typeof features,Reading>>=[
 {accessorKey:"id",header:"ID"},{accessorKey:"field_id",header:"Field"},{accessorKey:"recorded_at",header:"Recorded",cell:i=>new Date(i.getValue<string>()).toLocaleString()},
 {accessorKey:"soil_moisture",header:"Moisture",cell:i=>`${i.getValue<number>()}%`},{accessorKey:"temperature_c",header:"Temp",cell:i=>`${i.getValue<number>()}°C`},
 {accessorKey:"rain_probability",header:"Rain",cell:i=>`${i.getValue<number>()}%`},{accessorKey:"action",header:"Decision"},{accessorKey:"water_l",header:"Water",cell:i=>`${i.getValue<number>()} L`},{accessorKey:"reason",header:"Reason"}
];
const width=(id:string)=>({id:"w-20",field_id:"w-24",recorded_at:"w-44",soil_moisture:"w-24",temperature_c:"w-20",rain_probability:"w-20",action:"w-24",water_l:"w-24",reason:"w-[360px]"}[id]||"w-24");
export default function ReadingTable({data}:{data:Reading[]}){
 const parentRef=useRef<HTMLDivElement>(null);
 const table=useTable({key:"farm-readings",features,columns,data,initialState:{sorting:[{id:"recorded_at",desc:true}]}});
 const rows=table.getRowModel().rows;
 const virtualizer=useVirtualizer({count:rows.length,getScrollElement:()=>parentRef.current,estimateSize:()=>44,overscan:10});
 return <div ref={parentRef} className="h-[520px] overflow-auto rounded-xl border border-emerald-950 bg-[#08150d]">
  <div className="min-w-[900px]">
   <div className="sticky top-0 z-10 flex border-b border-emerald-900 bg-[#102318] text-xs uppercase tracking-wider text-emerald-300">
    {table.getHeaderGroups()[0].headers.map(h=><button key={h.id} onClick={h.column.getToggleSortingHandler()} className={`shrink-0 ${width(h.column.id)} px-3 py-3 text-left`}>{h.isPlaceholder?null:<><table.FlexRender header={h}/>{h.column.getIsSorted()==="asc"?" ↑":h.column.getIsSorted()==="desc"?" ↓":""}</>}</button>)}
   </div>
   <div style={{height:virtualizer.getTotalSize(),position:"relative"}}>
    {virtualizer.getVirtualItems().map(v=>{const row=rows[v.index];return <div key={row.id} className="absolute left-0 top-0 flex border-b border-emerald-950/70 text-sm text-slate-200" style={{transform:`translateY(${v.start}px)`,width:"100%",height:v.size}}>
     {row.getAllCells().map(c=><div key={c.id} className={`shrink-0 truncate px-3 py-3 ${width(c.column.id)}`}><table.FlexRender cell={c}/></div>)}
    </div>})}
   </div>
  </div>
 </div>
}
