from fastapi import FastAPI
from fastapi.responses import HTMLResponse
from .simulator import FarmSimulator
from .decision import recommend_irrigation

app = FastAPI(title="FarmMind", version="0.1.0")
sim = FarmSimulator()

DASHBOARD = """<!doctype html>
<html><head><meta name="viewport" content="width=device-width,initial-scale=1">
<title>FarmMind</title>
<style>
body{font-family:Inter,Arial,sans-serif;max-width:1100px;margin:auto;padding:28px;background:#f5f7f2;color:#17321f}
h1{margin-bottom:4px}.sub{color:#607565}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(210px,1fr));gap:14px;margin:20px 0}
.card{background:white;border:1px solid #dbe5da;border-radius:14px;padding:18px;box-shadow:0 2px 8px #0000000b}
.metric{font-size:28px;font-weight:700}.field{border-left:5px solid #4b8f55}
button{border:0;border-radius:9px;padding:10px 14px;background:#246b3b;color:white;cursor:pointer}
pre{white-space:pre-wrap}.tag{display:inline-block;padding:4px 8px;border-radius:999px;background:#edf5ed}
</style></head><body>
<h1>🌱 FarmMind</h1><div class="sub">AI-powered irrigation decision system — software-only farm simulation</div>
<div id="metrics" class="grid"></div><h2>Field decisions</h2><div id="fields" class="grid"></div>
<h2>7-day impact simulation</h2><div class="card"><pre id="analytics">Loading…</pre></div>
<script>
async function load(){
 const [s,a]=await Promise.all([fetch('/api/status').then(r=>r.json()),fetch('/api/analytics?days=7').then(r=>r.json())]);
 document.getElementById('metrics').innerHTML=[
  ['Fields',s.fields.length],['Water used',a.water_used_l+' L'],['Water saved',a.water_saved_l+' L'],['Irrigation events',a.irrigation_events]
 ].map(x=>'<div class="card"><div class="sub">'+x[0]+'</div><div class="metric">'+x[1]+'</div></div>').join('');
 document.getElementById('fields').innerHTML=s.recommendations.map(r=>{
  const f=s.fields.find(x=>x.id===r.field_id);
  return '<div class="card field"><h3>'+f.name+'</h3><span class="tag">'+r.action+'</span><p><b>'+f.soil_moisture_pct+'%</b> moisture · '+f.crop+'</p><p>'+r.water_l+' L · '+r.pump_minutes+' min</p><p>'+r.reason+'</p><small>Confidence '+Math.round(r.confidence*100)+'%</small></div>'
 }).join('');
 document.getElementById('analytics').textContent=JSON.stringify(a,null,2);
}
load();
</script></body></html>"""

@app.get("/", response_class=HTMLResponse)
def dashboard():
    return DASHBOARD

@app.get("/health")
def health():
    return {"status": "ok", "service": "farmmind-api"}

@app.get("/api/status")
def status():
    weather = sim.weather()
    recommendations = [recommend_irrigation(f, weather).__dict__ for f in sim.fields]
    return {
        "weather": weather.__dict__,
        "fields": [
            {"id": f.id, "name": f.name, "soil_moisture_pct": f.soil_moisture_pct,
             "soil_type": f.soil_type, "crop": f.crop.name,
             "stage": f.crop.stage.value, "water_available_l": round(f.water_available_l,1)}
            for f in sim.fields
        ],
        "recommendations": recommendations,
    }

@app.get("/api/recommend/{field_id}")
def recommendation(field_id: str):
    field = next((f for f in sim.fields if f.id == field_id), None)
    if not field:
        return {"error": "Unknown field"}
    return recommend_irrigation(field, sim.weather()).__dict__

@app.get("/api/analytics")
def analytics(days: int = 7):
    return sim.analytics(max(1, min(days, 30)))

@app.post("/api/simulate/{field_id}")
def simulate(field_id: str, water_l: float):
    field = next((f for f in sim.fields if f.id == field_id), None)
    if not field:
        return {"error": "Unknown field"}
    before = field.soil_moisture_pct
    applied = max(0.0, min(water_l, field.water_available_l))
    field.soil_moisture_pct = min(90, before + applied * field.irrigation_efficiency / max(1, field.crop.area_m2) / 0.7)
    field.water_available_l -= applied
    return {"field_id": field_id, "water_applied_l": round(applied,1),
            "moisture_before_pct": round(before,1), "moisture_after_pct": round(field.soil_moisture_pct,1)}

# Mount MCP streamable HTTP endpoint when the installed SDK supports it.
try:
    from .mcp_server import mcp
    app.mount("/mcp", mcp.streamable_http_app())
except Exception:
    pass
