(function(){const t=document.createElement("link").relList;if(t&&t.supports&&t.supports("modulepreload"))return;for(const s of document.querySelectorAll('link[rel="modulepreload"]'))a(s);new MutationObserver(s=>{for(const o of s)if(o.type==="childList")for(const d of o.addedNodes)d.tagName==="LINK"&&d.rel==="modulepreload"&&a(d)}).observe(document,{childList:!0,subtree:!0});function r(s){const o={};return s.integrity&&(o.integrity=s.integrity),s.referrerPolicy&&(o.referrerPolicy=s.referrerPolicy),s.crossOrigin==="use-credentials"?o.credentials="include":s.crossOrigin==="anonymous"?o.credentials="omit":o.credentials="same-origin",o}function a(s){if(s.ep)return;s.ep=!0;const o=r(s);fetch(s.href,o)}})();const P="fitjourney_state_v1",I="/api/fitness",y=()=>new Date().toISOString().slice(0,10),T=()=>`${Date.now()}-${Math.random().toString(16).slice(2)}`,h=e=>Number.parseFloat(e)||0,x=(e,t,r)=>Math.max(t,Math.min(r,e)),C={profile:null,progress:[],meals:{},workouts:{},weekPlan:{},aiEstimate:null,videos:[],activeTab:"dashboard"};let n=R(),W=new Map;const F=["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"],B=[{keys:["egg","eggs"],calories:78,protein:6,carbs:1,fat:5,unit:"piece"},{keys:["chicken","chicken breast"],calories:165,protein:31,carbs:0,fat:4,unit:"100g"},{keys:["rice"],calories:130,protein:3,carbs:28,fat:0,unit:"100g"},{keys:["beans"],calories:127,protein:9,carbs:23,fat:1,unit:"100g"},{keys:["oats","oatmeal"],calories:150,protein:5,carbs:27,fat:3,unit:"40g"},{keys:["bread"],calories:80,protein:3,carbs:15,fat:1,unit:"slice"},{keys:["banana"],calories:105,protein:1,carbs:27,fat:0,unit:"piece"},{keys:["apple"],calories:95,protein:0,carbs:25,fat:0,unit:"piece"},{keys:["milk"],calories:122,protein:8,carbs:12,fat:5,unit:"cup"},{keys:["yogurt"],calories:100,protein:10,carbs:7,fat:3,unit:"cup"},{keys:["beef"],calories:250,protein:26,carbs:0,fat:15,unit:"100g"},{keys:["fish","salmon","tuna"],calories:180,protein:25,carbs:0,fat:8,unit:"100g"},{keys:["pasta"],calories:158,protein:6,carbs:31,fat:1,unit:"100g"},{keys:["potato","yam"],calories:118,protein:2,carbs:27,fat:0,unit:"100g"},{keys:["avocado"],calories:240,protein:3,carbs:13,fat:22,unit:"piece"},{keys:["peanut butter"],calories:190,protein:7,carbs:7,fat:16,unit:"2 tbsp"},{keys:["oil","olive oil"],calories:120,protein:0,carbs:0,fat:14,unit:"tbsp"}];function R(){try{const e=JSON.parse(localStorage.getItem(P)),t={...C,...e};return t.activeTab==="videos"&&(t.activeTab="workouts"),t}catch{return{...C}}}function f(){localStorage.setItem(P,JSON.stringify(n)),fetch(I,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(n)}).catch(()=>{})}async function N(){try{const e=await fetch(I,{headers:{Accept:"application/json"}});if(!e.ok)return;const t=await e.json();if(!t||!t.profile)return;n={...C,...t},n.activeTab==="videos"&&(n.activeTab="workouts"),localStorage.setItem(P,JSON.stringify(n)),m()}catch{}}function U(e){const t=h(e.height),r=h(e.weight),a=h(e.age),s=e.gender==="female"?-161:5,o={sedentary:1.2,light:1.375,moderate:1.55,active:1.725,athlete:1.9},d={lose:-500,maintain:0,gain:350},i=10*r+6.25*t-5*a+s,c=Math.round(i*o[e.activity]+d[e.goal]),u=Math.round(r*(e.goal==="gain"?2:1.8)),l=Math.round(c*.27/9),g=Math.round((c-u*4-l*9)/4);return{calories:Math.max(c,1200),protein:Math.max(u,50),carbs:Math.max(g,80),fat:Math.max(l,35)}}function q(){return[...n.progress].sort((e,t)=>e.date.localeCompare(t.date)).at(-1)}function O(e=y()){const t=new Date(`${e}T00:00:00`),r=new Date(t.getFullYear(),0,1),a=Math.floor((t-r)/864e5);return`${t.getFullYear()}-W${String(Math.ceil((a+r.getDay()+1)/7)).padStart(2,"0")}`}function E(){return n.meals[y()]||[]}function H(e){return e.reduce((t,r)=>(t.calories+=h(r.calories),t.protein+=h(r.protein),t.carbs+=h(r.carbs),t.fat+=h(r.fat),t),{calories:0,protein:0,carbs:0,fat:0})}function G(e){const t=e.toLowerCase(),r=[],a={calories:0,protein:0,carbs:0,fat:0};if(B.forEach(s=>{const o=s.keys.find(u=>t.includes(u));if(!o)return;const i=t.slice(0,t.indexOf(o)).match(/(\d+(?:\.\d+)?)\s*$/),c=i?h(i[1]):1;a.calories+=s.calories*c,a.protein+=s.protein*c,a.carbs+=s.carbs*c,a.fat+=s.fat*c,r.push(`${c} ${s.unit} ${o}`)}),!r.length){const s=t.split(/\s+/).filter(Boolean).length;a.calories=Math.max(220,s*45),a.protein=Math.round(a.calories*.18/4),a.carbs=Math.round(a.calories*.48/4),a.fat=Math.round(a.calories*.28/9),r.push("general mixed meal estimate")}return{name:e.trim(),calories:Math.round(a.calories),protein:Math.round(a.protein),carbs:Math.round(a.carbs),fat:Math.round(a.fat),note:`Estimated from ${r.join(", ")}. You can edit the numbers before saving.`}}function J(e){const t=[...n.progress].sort((r,a)=>r.date.localeCompare(a.date));return t.length<2?0:h(t.at(-1)[e])-h(t.at(-2)[e])}function V(e){n.activeTab=e,f(),m()}function $(e,...t){return e.map((r,a)=>`${r}${t[a]??""}`).join("")}function m(){const e=document.getElementById("root");e.innerHTML=n.profile?_():Y(),ce(),requestAnimationFrame(le)}function Y(){return $`
    <main class="onboarding">
      <section class="intro-panel">
        <div class="brand-mark">FJ</div>
        <h1>FitJourney</h1>
        <p>Set your starting point, nutrition targets, training rhythm, and weekly progress tracking in one calm workspace.</p>
        <div class="intro-stats">
          <span>Weekly measurements</span>
          <span>Macro targets</span>
          <span>Workout library</span>
        </div>
      </section>
      <form class="setup-card" id="profileForm">
        <div class="form-head">
          <p class="eyebrow">Start profile</p>
          <h2>Your daily target begins here</h2>
        </div>
        <div class="form-grid">
          ${p("age","Age","number","28")}
          ${v("gender","Gender",[["male","Male"],["female","Female"]],"male")}
          ${p("height","Height (cm)","number","170")}
          ${p("weight","Current weight (kg)","number","82")}
          ${v("activity","Activity level",[["sedentary","Sedentary"],["light","Light activity"],["moderate","Moderate training"],["active","Very active"],["athlete","Athlete"]],"moderate")}
          ${v("goal","Goal",[["lose","Lose weight"],["maintain","Maintain"],["gain","Gain muscle"]],"lose")}
        </div>
        <button class="primary-action" type="submit">Create my plan</button>
      </form>
    </main>
  `}function _(){const e=U(n.profile),t=H(E()),r=q(),a=n.activeTab;return $`
    <div class="app-shell">
      <aside class="sidebar">
        <div class="brand-row"><span class="brand-mark small">FJ</span><strong>FitJourney</strong></div>
        <nav>
          ${S("dashboard","Dashboard")}
          ${S("progress","Progress")}
          ${S("nutrition","Nutrition")}
          ${S("workouts","Workouts")}
          ${S("settings","Settings")}
        </nav>
      </aside>
      <main class="content">
        <header class="topbar">
          <div>
            <p class="eyebrow">${new Date().toLocaleDateString(void 0,{weekday:"long",month:"short",day:"numeric"})}</p>
            <h1>${K(a)}</h1>
          </div>
          <div class="target-pill">${e.calories} kcal target</div>
        </header>
        ${a==="dashboard"?z(e,t,r):""}
        ${a==="progress"?Q(r):""}
        ${a==="nutrition"?X(e,t):""}
        ${a==="workouts"?ee():""}
        ${a==="settings"?re():""}
      </main>
    </div>
  `}function S(e,t){return`<button class="nav-item ${n.activeTab===e?"active":""}" data-tab="${e}">${t}</button>`}function K(e){return{dashboard:"Today",progress:"Weekly progress",nutrition:"Nutrition log",workouts:"Weekly workouts",settings:"Profile settings"}[e]}function z(e,t,r){var s;const a=!!((s=n.workouts[y()])!=null&&s.completed);return $`
    <section class="metric-grid">
      ${D("Weight",r?`${r.weight} kg`:`${n.profile.weight} kg`,`${oe(J("weight"))} kg since last check`)}
      ${D("Calories",`${Math.round(t.calories)}`,`${Math.max(e.calories-t.calories,0)} kcal left`)}
      ${D("Protein",`${Math.round(t.protein)} g`,`Goal ${e.protein} g`)}
      ${D("Workout",a?"Done":"Open",a?"Logged for today":"Waiting for check-in")}
    </section>
    <section class="dashboard-grid">
      <article class="panel chart-panel">
        <div class="panel-head"><h2>Weight trend</h2><span>${n.progress.length} entries</span></div>
        <canvas id="weightChart" height="260"></canvas>
      </article>
      <article class="panel">
        <div class="panel-head"><h2>Macro progress</h2><span>Today</span></div>
        ${b("Calories",t.calories,e.calories,"kcal")}
        ${b("Protein",t.protein,e.protein,"g")}
        ${b("Carbs",t.carbs,e.carbs,"g")}
        ${b("Fat",t.fat,e.fat,"g")}
      </article>
    </section>
  `}function Q(e){const t=O(),r=n.progress.some(s=>O(s.date)===t),a=e||{weight:n.profile.weight,waist:"",hips:"",arms:"",thighs:"",chest:""};return $`
    <section class="split-grid">
      <form class="panel" id="progressForm">
        <div class="panel-head">
          <h2>Weekly check-in</h2>
          <span>${r?"Logged this week":"Ready"}</span>
        </div>
        <input type="hidden" name="date" value="${y()}">
        <div class="form-grid compact">
          ${p("weight","Weight (kg)","number",a.weight)}
          ${p("waist","Waist (cm)","number",a.waist)}
          ${p("hips","Hips (cm)","number",a.hips)}
          ${p("arms","Arms (cm)","number",a.arms)}
          ${p("thighs","Thighs (cm)","number",a.thighs)}
          ${p("chest","Chest (cm)","number",a.chest)}
        </div>
        <button class="primary-action" ${r?"disabled":""} type="submit">${r?"Come back next week":"Save weekly update"}</button>
      </form>
      <article class="panel chart-panel">
        <div class="panel-head"><h2>Measurements</h2><span>Waist and hips</span></div>
        <canvas id="measureChart" height="300"></canvas>
      </article>
    </section>
    <section class="panel history-panel">
      <div class="panel-head"><h2>History</h2><span>${n.progress.length} total</span></div>
      <div class="history-list">
        ${n.progress.length?[...n.progress].reverse().map(se).join(""):L("No weekly measurements yet.")}
      </div>
    </section>
  `}function X(e,t){var r,a,s,o,d;return $`
    <section class="split-grid">
      <div class="stack">
        <form class="panel ai-panel" id="aiFoodForm">
          <div class="panel-head"><h2>AI food helper</h2><span>Estimate macros</span></div>
          <label>
            <span class="field-label">Describe your food</span>
            <textarea name="foodText" placeholder="Example: 2 eggs, 1 cup rice, chicken breast and avocado" required></textarea>
          </label>
          <button class="primary-action" type="submit">Estimate calories and macros</button>
          <div id="aiFoodResult" class="ai-result">${n.aiEstimate?Z(n.aiEstimate):"Tell me what you ate and I will estimate calories, protein, carbs, and fat."}</div>
        </form>
        <form class="panel" id="mealForm">
          <div class="panel-head"><h2>Add food</h2><span>${y()}</span></div>
          ${p("name","Food or meal","text",((r=n.aiEstimate)==null?void 0:r.name)||"","Greek yogurt, rice bowl, smoothie")}
          <div class="form-grid compact">
            ${p("calories","Calories","number",((a=n.aiEstimate)==null?void 0:a.calories)||"")}
            ${p("protein","Protein (g)","number",((s=n.aiEstimate)==null?void 0:s.protein)||"")}
            ${p("carbs","Carbs (g)","number",((o=n.aiEstimate)==null?void 0:o.carbs)||"")}
            ${p("fat","Fat (g)","number",((d=n.aiEstimate)==null?void 0:d.fat)||"")}
          </div>
          <button class="primary-action" type="submit">Log food</button>
        </form>
      </div>
      <article class="panel">
        <div class="panel-head"><h2>Daily intake</h2><span>${Math.round(t.calories)} / ${e.calories} kcal</span></div>
        ${b("Calories",t.calories,e.calories,"kcal")}
        ${b("Protein",t.protein,e.protein,"g")}
        ${b("Carbs",t.carbs,e.carbs,"g")}
        ${b("Fat",t.fat,e.fat,"g")}
      </article>
    </section>
    <section class="panel history-panel">
      <div class="panel-head"><h2>Today's food</h2><span>${E().length} items</span></div>
      <div class="food-list">
        ${E().length?E().map(ne).join(""):L("Start logging meals to see calories and macros.")}
      </div>
    </section>
  `}function Z(e){return`<div>
    <strong>${e.calories} kcal</strong>
    <span>P ${e.protein}g | C ${e.carbs}g | F ${e.fat}g</span>
    <small>${e.note}</small>
  </div>`}function ee(){const e=new Date().toLocaleDateString(void 0,{weekday:"long"}),t=F.filter(r=>{var a;return(a=n.workouts[r])==null?void 0:a.completed}).length;return $`
    <section class="split-grid">
      <form class="panel weekly-plan" id="weekPlanForm">
        <div class="panel-head"><h2>Workout plan for the week</h2><span>${t}/7 completed</span></div>
        <div class="week-plan-grid">
          ${F.map(r=>`
            <label>
              <span class="field-label">${r}</span>
              <textarea name="${r}" placeholder="Workout for ${r}">${n.weekPlan[r]||""}</textarea>
            </label>
          `).join("")}
        </div>
        <button class="primary-action" type="submit">Save weekly plan</button>
      </form>
      <article class="panel">
        <div class="panel-head"><h2>Daily check-in</h2><span>Today is ${e}</span></div>
        <div class="daily-checklist">
          ${F.map(r=>te(r)).join("")}
        </div>
      </article>
    </section>
    ${ae()}
  `}function te(e){const t=n.workouts[e]||{completed:!1};return`<label class="workout-check ${t.completed?"done":""}">
    <input type="checkbox" data-workout-day="${e}" ${t.completed?"checked":""}>
    <span>
      <strong>${e}</strong>
      <small>${n.weekPlan[e]||"No workout entered yet"}</small>
    </span>
  </label>`}function ae(){return $`
    <section class="panel">
      <div class="panel-head"><h2>Upload video</h2><span>MP4, WebM, MOV</span></div>
      <form id="videoForm" class="video-form">
        ${p("title","Video title","text","","Upper body day")}
        ${v("category","Workout type",[["Strength","Strength"],["Cardio","Cardio"],["Mobility","Mobility"],["HIIT","HIIT"],["Core","Core"]],"Strength")}
        ${v("day","Day",[["Any day","Any day"],...F.map(e=>[e,e])],"Any day")}
        <input class="file-input" type="file" name="video" accept="video/*" required>
        <button class="primary-action" type="submit">Add video</button>
      </form>
    </section>
    <section class="video-grid">
      ${n.videos.length?n.videos.map(ie).join(""):L("Upload workout videos to build your personal training library.")}
    </section>
  `}function re(){const e=n.profile;return $`
    <form class="panel settings-card" id="settingsForm">
      <div class="panel-head"><h2>Profile and goal</h2><span>Targets update automatically</span></div>
      <div class="form-grid">
        ${p("age","Age","number",e.age)}
        ${v("gender","Gender",[["male","Male"],["female","Female"]],e.gender)}
        ${p("height","Height (cm)","number",e.height)}
        ${p("weight","Current weight (kg)","number",e.weight)}
        ${v("activity","Activity level",[["sedentary","Sedentary"],["light","Light activity"],["moderate","Moderate training"],["active","Very active"],["athlete","Athlete"]],e.activity)}
        ${v("goal","Goal",[["lose","Lose weight"],["maintain","Maintain"],["gain","Gain muscle"]],e.goal)}
      </div>
      <button class="primary-action" type="submit">Update profile</button>
    </form>
  `}function p(e,t,r,a,s=""){return`<label><span class="field-label">${t}</span><input name="${e}" type="${r}" value="${a??""}" placeholder="${s}" ${r==="number"?'step="0.1" min="0"':""} required></label>`}function v(e,t,r,a){return`<label><span class="field-label">${t}</span><select name="${e}">${r.map(([s,o])=>`<option value="${s}" ${s===a?"selected":""}>${o}</option>`).join("")}</select></label>`}function D(e,t,r){return`<article class="metric-card"><span>${e}</span><strong>${t}</strong><small>${r}</small></article>`}function b(e,t,r,a){const s=x(t/r*100,0,100);return`<div class="macro-row">
    <div><strong>${e}</strong><span>${Math.round(t)} / ${r} ${a}</span></div>
    <div class="bar"><i style="width:${s}%"></i></div>
  </div>`}function se(e){return`<div class="history-row">
    <strong>${e.date}</strong>
    <span>${e.weight} kg</span>
    <span>Waist ${e.waist||"-"} cm</span>
    <span>Hips ${e.hips||"-"} cm</span>
  </div>`}function ne(e){return`<div class="food-row">
    <div><strong>${e.name}</strong><span>${e.calories} kcal</span></div>
    <small>P ${e.protein}g | C ${e.carbs}g | F ${e.fat}g</small>
    <button class="ghost-button" data-delete-meal="${e.id}">Remove</button>
  </div>`}function ie(e){const t=e.url||W.get(e.id)||"";return`<article class="video-card">
    ${t?`<video controls src="${t}"></video>`:'<div class="video-missing">Video file available in this browser session only</div>'}
    <div>
      <strong>${e.title}</strong>
      <span>${e.day} | ${e.category}</span>
      <button class="ghost-button" data-delete-video="${e.id}">Remove</button>
    </div>
  </article>`}function L(e){return`<div class="empty-state">${e}</div>`}function oe(e){return e?e>0?`+${e.toFixed(1)}`:e.toFixed(1):"0"}function ce(){var e,t,r,a,s,o,d;document.querySelectorAll("[data-tab]").forEach(i=>{i.addEventListener("click",()=>V(i.dataset.tab))}),(e=document.getElementById("profileForm"))==null||e.addEventListener("submit",i=>{i.preventDefault(),n.profile=Object.fromEntries(new FormData(i.currentTarget)),n.progress=[{id:T(),date:y(),weight:n.profile.weight,waist:"",hips:"",arms:"",thighs:"",chest:"",timestamp:new Date().toISOString()}],n.activeTab="dashboard",f(),m()}),(t=document.getElementById("progressForm"))==null||t.addEventListener("submit",i=>{i.preventDefault();const c=Object.fromEntries(new FormData(i.currentTarget));n.progress.push({id:T(),...c,timestamp:new Date().toISOString()}),n.profile.weight=c.weight,f(),m()}),(r=document.getElementById("mealForm"))==null||r.addEventListener("submit",i=>{i.preventDefault();const c={id:T(),...Object.fromEntries(new FormData(i.currentTarget))};n.meals[y()]=[c,...E()],n.aiEstimate=null,f(),m()}),(a=document.getElementById("aiFoodForm"))==null||a.addEventListener("submit",i=>{i.preventDefault();const c=Object.fromEntries(new FormData(i.currentTarget));n.aiEstimate=G(c.foodText),m()}),document.querySelectorAll("[data-delete-meal]").forEach(i=>{i.addEventListener("click",()=>{n.meals[y()]=E().filter(c=>c.id!==i.dataset.deleteMeal),f(),m()})}),(s=document.getElementById("weekPlanForm"))==null||s.addEventListener("submit",i=>{i.preventDefault();const c=Object.fromEntries(new FormData(i.currentTarget));n.weekPlan=F.reduce((u,l)=>(u[l]=c[l]||"",u),{}),f(),m()}),document.querySelectorAll("[data-workout-day]").forEach(i=>{i.addEventListener("change",()=>{const c=i.dataset.workoutDay;n.workouts[c]={completed:i.checked,checkedAt:i.checked?new Date().toISOString():""},f(),m()})}),(o=document.getElementById("videoForm"))==null||o.addEventListener("submit",async i=>{i.preventDefault();const c=i.currentTarget,u=new FormData(c),l=u.get("video"),g=T(),M=URL.createObjectURL(l);W.set(g,M);let w="";try{const k=new FormData;k.append("video",l),w=(await(await fetch("/api/upload-video",{method:"POST",body:k})).json()).url||""}catch{}n.videos.unshift({id:g,title:u.get("title"),category:u.get("category"),day:u.get("day"),fileName:l.name,url:w}),f(),m()}),document.querySelectorAll("[data-delete-video]").forEach(i=>{i.addEventListener("click",()=>{n.videos=n.videos.filter(c=>c.id!==i.dataset.deleteVideo),f(),m()})}),(d=document.getElementById("settingsForm"))==null||d.addEventListener("submit",i=>{i.preventDefault(),n.profile=Object.fromEntries(new FormData(i.currentTarget)),f(),m()})}function le(){de("weightChart",n.progress.map(e=>({x:e.date.slice(5),y:h(e.weight)})),"#ff37df"),pe("measureChart",[{label:"Waist",color:"#ff37df",points:n.progress.map(e=>({x:e.date.slice(5),y:h(e.waist)}))},{label:"Hips",color:"#8b5cff",points:n.progress.map(e=>({x:e.date.slice(5),y:h(e.hips)}))}])}function de(e,t,r){const a=document.getElementById(e);if(!a)return;const s=A(a),o=t.filter(d=>d.y);j(s,a,[{points:o,color:r}])}function pe(e,t){const r=document.getElementById(e);if(!r)return;const a=A(r);j(a,r,t.map(s=>({...s,points:s.points.filter(o=>o.y)})))}function A(e){const t=window.devicePixelRatio||1,r=e.getBoundingClientRect();e.width=r.width*t,e.height=e.height*t;const a=e.getContext("2d");return a.scale(t,t),a}function j(e,t,r){const a=t.getBoundingClientRect().width,s=t.height/(window.devicePixelRatio||1);e.clearRect(0,0,a,s),e.strokeStyle="rgba(255, 255, 255, 0.08)",e.lineWidth=1;for(let l=0;l<5;l+=1){const g=26+l*((s-54)/4);e.beginPath(),e.moveTo(18,g),e.lineTo(a-18,g),e.stroke()}const o=r.flatMap(l=>l.points);if(o.length<2){e.fillStyle="#91869f",e.font="14px Inter",e.fillText("Add weekly entries to build your chart.",24,48);return}const d=Math.min(...o.map(l=>l.y)),c=Math.max(...o.map(l=>l.y))-d||1,u=Math.max(...r.map(l=>l.points.length));r.forEach(l=>{e.strokeStyle=l.color,e.lineWidth=3,e.beginPath(),l.points.forEach((g,M)=>{const w=24+M/Math.max(u-1,1)*(a-54),k=s-28-(g.y-d)/c*(s-68);M===0?e.moveTo(w,k):e.lineTo(w,k)}),e.stroke(),l.points.forEach((g,M)=>{const w=24+M/Math.max(u-1,1)*(a-54),k=s-28-(g.y-d)/c*(s-68);e.fillStyle="#f7ecff",e.beginPath(),e.arc(w,k,4,0,Math.PI*2),e.fill(),e.stroke()})})}m();N();
