"use client";
import {useMemo,useRef} from "react";
import {createSortedRowModel,rowSortingFeature,sortFns,tableFeatures,useTable} from "@tanstack/react-table";
import type {ColumnDef,SortingState} from "@tanstack/react-table";
import {useVirtualizer} from "@tanstack/react-virtual";

type Reading={id:number;field_id:string;recorded_at:string;soil_moisture:number;temperature_c:number;rain_probability:number;action:string;water_l:number;reason:string};
const features=tableFeatures({rowSortingFeature,sortedRowModel:createSortedRowModel(),sortFns});
const columns:Array<ColumnDef<typeof features,Reading>>=[
 {accessorKey:"id",header:"ID",size:80},
 {accessorKey:"field_id",header:"Field",size:100},
 {accessorKey:"recorded_at",header:"Recorded",size:180,cell:i=>new Date(i.getValue<string>()).toLocaleString()},
 {accessorKey:"soil_moisture",header:"Moisture",size:110,cell:i=>`${i.getValue<number>()}%`},
 {accessorKey:"temperature_c",header:"Temp",size:90,cell:i=>`${i.getValue<number>()}°C`},
 {accessorKey:"rain_probability",header:"Rain",size:90,cell:i=>`${i.getValue<number>()}%`},
 {accessorKey:"action",header:"Decision",size:120},
 {accessorKey:"water_l",header:"Water",size:100,cell:i=>`${i.getValue<number>()} L`},
 {accessorKey:"reason",header:"Reason",size:360},
];
export default function ReadingTable({data}:{data:Reading[]}){
 const parentRef=useRef<HTMLDivElement>(null);
 const table=useTable({key:"farm-readings",features,columns,data,initialState:{sorting:[{id:"recorded_at",desc:true}]}});
 const rows=table.getRowModel().rows;
 const virtualizer=useVirtualizer({count:rows.length,getScrollElement:()=>parentRef.current,estimateSize:()=>44,overscan:10});
 return <div ref={parentRef} className="h-[520px] overflow-auto rounded-xl border border-emerald-950 bg-[#08150d]">
  <div className="min-w-[1120px]">
   <div className="sticky top-0 z-10 flex border-b border-emerald-900 bg-[#102318] text-xs uppercase tracking-wider text-emerald-300">
    {table.getHeaderGroups()[0].headers.map(h=><button key={h.id} onClick={h.column.getToggleSortingHandler()} style={{width:h.getSize()}} className="shrink-0 px-3 py-3 text-left">{h.isPlaceholder?null:<><table.FlexRender header={h}/>{h.column.getIsSorted()==="asc"?" ↑":h.column.getIsSorted()==="desc"?" ↓":""}</>}</button>)}
   </div>
   <div style={{height:virtualizer.getTotalSize(),position:"relative"}}>
    {virtualizer.getVirtualItems().map(v=>{
      const row=rows[v.index];
      return <div key={row.id} className="absolute left-0 top-0 flex border-b border-emerald-950/70 text-sm text-slate-200" style={{transform:`translateY(${v.start}px)`,width:"100%",height:v.size}}>
       {row.getAllCells().map(c=><div key={c.id} style={{width:c.column.getSize()}} className="shrink-0 truncate px-3 py-3"><table.FlexRender cell={c}/></div>)}
      </div>
    })}
   </div>
  </div>
 </div>
}
