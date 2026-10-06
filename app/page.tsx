"use client";
import {useEffect,useState} from "react";
import ReadingTable from "@/components/ReadingTable";
import ImpactChart from "@/components/ImpactChart";

type Dashboard={fields:any[];readings:any[];daily:any[];totals:any;database:string};
export default function Home(){
 const [data,setData]=useState<Dashboard|null>(null),[question,setQuestion]=useState(""),[answer,setAnswer]=useState(""),[loading,setLoading]=useState(false);
 async function load(){const r=await fetch("/api/dashboard",{cache:"no-store"});setData(await r.json())}
 useEffect(()=>{load()},[]);
 async function ask(e:React.FormEvent){e.preventDefault();if(!question.trim())return;setLoading(true);setAnswer("");const r=await fetch("/api/chat",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({message:question})});const j=await r.json();setAnswer(j.answer||j.error);setLoading(false)}
 if(!data)return <main className="min-h-screen p-8 text-emerald-100">Loading FarmMind…</main>;
 const f2=data.fields.find(f=>f.id==="F2");
 return <main className="min-h-screen px-5 py-7 lg:px-10">
  <div className="mx-auto max-w-[1500px]">
   <header className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
    <div><div className="mb-2 text-sm font-semibold tracking-[0.25em] text-emerald-400">FARMMIND</div><h1 className="text-4xl font-bold tracking-tight lg:text-5xl">Farm intelligence that explains every drop.</h1><p className="mt-3 max-w-2xl text-slate-400">Weather-aware irrigation decisions, persistent farm data, AI reasoning and operational analytics in one software system.</p></div>
    <div className="rounded-full border border-emerald-900 bg-emerald-950/40 px-4 py-2 text-sm text-emerald-300">● PostgreSQL connected</div>
   </header>
   <section className="grid gap-4 md:grid-cols-4">
    {[["Fields",data.fields.length],["Readings",Number(data.totals.readings).toLocaleString()],["Water used",`${Number(data.totals.water_used_l).toLocaleString()} L`],["Irrigation events",data.totals.irrigation_events]].map(([k,v])=><div key={k} className="glass rounded-2xl p-5"><div className="text-sm text-slate-400">{k}</div><div className="mt-2 text-3xl font-bold">{v}</div></div>)}
   </section>
   <section className="mt-5 grid gap-5 lg:grid-cols-[1.6fr_1fr]">
    <div className="glass rounded-2xl p-5"><div className="mb-5 flex items-center justify-between"><div><h2 className="text-lg font-semibold">Water & decision trend</h2><p className="text-sm text-slate-400">Last 14 days from PostgreSQL</p></div></div><ImpactChart data={data.daily}/></div>
    <div className="glass rounded-2xl p-5"><h2 className="text-lg font-semibold">Field priority</h2><div className="mt-4 space-y-3">{data.fields.map(f=><div key={f.id} className="rounded-xl border border-emerald-950 bg-[#0a1810] p-4"><div className="flex justify-between"><b>{f.name}</b><span className="text-xs text-emerald-400">{f.growth_stage}</span></div><div className="mt-2 flex justify-between text-sm text-slate-400"><span>{f.soil_moisture}% moisture</span><span>{Number(f.water_available_l).toLocaleString()} L available</span></div><div className="mt-3 h-2 overflow-hidden rounded-full bg-emerald-950"><div className="h-full rounded-full bg-emerald-400" style={{width:`${Math.min(100,Number(f.soil_moisture)*1.1)}%`}}/></div></div>)}</div>
    </div>
   </section>
   <section className="mt-5 glass rounded-2xl p-5"><div className="mb-4"><h2 className="text-lg font-semibold">AI FarmMind</h2><p className="text-sm text-slate-400">Ask for a recommendation, explanation or priority ranking.</p></div><form onSubmit={ask} className="flex flex-col gap-3 sm:flex-row"><input value={question} onChange={e=>setQuestion(e.target.value)} placeholder={`Should I irrigate ${f2?.name||"Field 2"}?`} className="flex-1 rounded-xl border border-emerald-900 bg-[#08150d] px-4 py-3 outline-none focus:border-emerald-400"/><button className="rounded-xl bg-emerald-400 px-6 py-3 font-semibold text-[#07130d]">{loading?"Thinking…":"Ask FarmMind"}</button></form>{answer&&<div className="mt-4 rounded-xl border border-emerald-900 bg-emerald-950/30 p-4 leading-7 text-slate-200">{answer}</div>}</section>
   <section className="mt-5 glass rounded-2xl p-5"><div className="mb-4 flex items-end justify-between"><div><h2 className="text-lg font-semibold">Farm sensor history</h2><p className="text-sm text-slate-400">1,000 latest rows rendered with TanStack Table + TanStack Virtual.</p></div><span className="text-xs text-emerald-400">virtualized</span></div><ReadingTable data={data.readings}/></section>
   <footer className="py-8 text-center text-xs text-slate-500">FarmMind · Next.js · Tailwind · PostgreSQL · TanStack Virtual · Recharts · OpenAI</footer>
  </div>
 </main>
}
