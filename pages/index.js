
import Head from "next/head";
import { useEffect, useState } from "react";

const STORAGE_KEY = "padle_league_v2";

const initialTeams = [
  { id: 1, name: "Dan & Bean", players: ["Dan", "Bean"], points: 0 },
  { id: 2, name: "Weedy & TJ", players: ["Weedy", "TJ"], points: 0 },
  { id: 3, name: "Rob & Pear", players: ["Rob", "Pear"], points: 0 },
  { id: 4, name: "Nova & Neil", players: ["Nova", "Neil"], points: 0 },
  { id: 5, name: "Bulby & JHD", players: ["Bulby", "JHD"], points: 0 },
];

const schedule = [
  [1,2],[3,4],[5,1],[2,3],[4,5],
  [1,3],[2,4],[5,3],[1,4],[2,5]
];

const validSetScores = ["6-0","6-1","6-2","6-3","6-4","7-5","7-6"];

function save(state){
  try{ localStorage.setItem(STORAGE_KEY, JSON.stringify(state)) }catch(e){}
}
function load(){
  try{ const raw = localStorage.getItem(STORAGE_KEY); return raw?JSON.parse(raw):null }catch(e){return null}
}

export default function Home(){
  const [teams, setTeams] = useState([]);
  const [results, setResults] = useState([]);
  const [ratings, setRatings] = useState({}); // {player: [ {fromTeam, score, matchId, ts} ] }
  const [admin, setAdmin] = useState(false);
  const [adminPass, setAdminPass] = useState("");
  const [selectedTeam, setSelectedTeam] = useState("");
  const [form, setForm] = useState({ matchId:0, teamA: "", teamB: "", score: "" });
  const [ratingDraft, setRatingDraft] = useState({}); // {player: score}

  useEffect(()=>{
    const s = load();
    if(s){
      setTeams(s.teams||initialTeams.map(t=>({...t})));
      setResults(s.results||[]);
      setRatings(s.ratings||{});
    } else {
      setTeams(initialTeams.map(t=>({...t})));
      setResults([]);
      setRatings({});
      save({teams: initialTeams.map(t=>({...t})), results: [], ratings: {}});
    }
  },[]);

  useEffect(()=>{
    // recalc points from results
    const tcopy = teams.map(t => ({...t, points:0}));
    results.forEach(r => {
      const w = tcopy.find(tt=>tt.id===r.winnerId);
      if(w) w.points += 3;
    });
    // merge names/players if initial changed
    const merged = tcopy.map(tc => { const orig = teams.find(x=>x.id===tc.id); return orig? {...orig, points: tc.points}: tc });
    setTeams(merged);
    save({teams: merged, results, ratings});
  }, [results, ratings]);

  function loginAdmin(){
    if(adminPass === "danisgreat"){ setAdmin(true); alert("Admin mode enabled") }
    else alert("Wrong password");
    setAdminPass("");
  }

  function isValidScore(s){
    if(!s) return false;
    return s.split(",").map(x=>x.trim()).every(x=> validSetScores.includes(x));
  }

  function addResultWithRatings(){
    const { teamA, teamB, score } = form;
    if(!teamA || !teamB || teamA===teamB) return alert("Choose two different teams");
    if(!isValidScore(score)) return alert("Invalid score. Allowed sets: " + validSetScores.join(", "));
    const matchId = Date.now();
    const winnerId = findTeamByName(teamA).id; // for simplicity assume teamA is winner selection; we'll offer winner select after
    // In this UI, we'll ask winner via prompt
    const winnerName = prompt(`Who won? Enter exact team name:\n${teamA}\n${teamB}`, teamA);
    if(!winnerName) return;
    const winner = findTeamByName(winnerName);
    if(!winner) return alert("Invalid winner name");
    const newEntry = { matchId, teams: [ findTeamByName(teamA).id, findTeamByName(teamB).id ], winnerId: winner.id, score, ts: Date.now() };
    const newResults = [newEntry, ...results];
    setResults(newResults);

    // ratingsDraft must contain per-player ratings for both teams; if empty, prompt admin to enter
    const playersToRate = [...findTeamByName(teamA).players, ...findTeamByName(teamB).players];
    let draft = {...ratingDraft};
    let needPrompt = playersToRate.some(p => !draft[p]);
    if(needPrompt){
      // prompt sequentially for each player (admin enters rating)
      playersToRate.forEach(p => {
        const r = prompt(`Rate player ${p} out of 5 (1-5). Leave empty to skip.`,"5");
        if(r){
          const num = parseInt(r,10);
          if(!isNaN(num) && num>=1 && num<=5){
            draft[p] = parseInt(num,10);
          }
        }
      });
    }
    // convert draft to ratings structure
    const newRatings = {...ratings};
    Object.entries(draft).forEach(([player, scoreVal]) => {
      const arr = newRatings[player] || [];
      arr.push({ fromTeam: admin? "Admin": selectedTeam, score: scoreVal, matchId, ts: Date.now() });
      newRatings[player] = arr;
    });
    setRatings(newRatings);
    setRatingDraft({});
    setForm({ matchId:0, teamA:"", teamB:"", score:"" });
  }

  function findTeamByName(name){ return teams.find(t=>t.name===name) }

  function addRatingForPlayer(player, val){
    const arr = ratings[player] || [];
    arr.push({ fromTeam: selectedTeam||"Unknown", score: val, matchId: null, ts: Date.now() });
    setRatings({...ratings, [player]: arr});
  }

  function clearLastMatch(){
    if(!admin) return;
    if(results.length===0) return alert("No matches to clear.");
    if(!confirm("Clear last match?")) return;
    const updated = results.slice(1);
    setResults(updated);
  }
  function resetAll(){
    if(!admin) return;
    if(!confirm("Reset all data? This cannot be undone.")) return;
    setResults([]); setRatings({}); setTeams(initialTeams.map(t=>({...t, points:0})));
    save({teams: initialTeams.map(t=>({...t, points:0})), results: [], ratings: {}});
  }

  function clearAllRatings(){
    if(!admin) return;
    if(!confirm("Clear ALL ratings?")) return;
    setRatings({});
  }

  // helper average
  function avgForPlayer(player){
    const arr = ratings[player]||[];
    if(arr.length===0) return 0;
    return (arr.reduce((s,a)=>s+a.score,0)/arr.length).toFixed(2);
  }

  return (
    <div className="container">
      <Head>
        <title>Padle League</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <header className="header">
        <div className="logo">🏓</div>
        <div>
          <h1 className="title">Padle League</h1>
          <div className="subtitle">Friendly over-40 social league</div>
        </div>
      </header>

      <div className="card">
        {!admin ? (
          <div style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap"}}>
            <input className="input" type="password" placeholder="Admin password" value={adminPass} onChange={e=>setAdminPass(e.target.value)} />
            <button className="button" onClick={loginAdmin}>Enter Admin</button>
            <div style={{marginLeft:"auto", fontSize:13, color:"#666"}}>Logged out</div>
          </div>
        ) : (
          <div style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap"}}>
            <div style={{fontWeight:800,color:"#2e7d32"}}>✅ Admin mode</div>
            <button className="button secondary" onClick={clearLastMatch}>Clear Last Match</button>
            <button className="button danger" onClick={resetAll}>Reset All Data</button>
            <button className="button" onClick={clearAllRatings}>Clear All Ratings</button>
          </div>
        )}
      </div>

      <section className="card">
        <h2 style={{marginTop:0}}>Record Result & Ratings</h2>
        <div className="match-card">
          <div className="row">
            <select className="input" value={form.teamA} onChange={e=>setForm({...form, teamA:e.target.value})}>
              <option value="">Select Team A</option>
              {teams.map(t=> <option key={t.id} value={t.name}>{t.name}</option>)}
            </select>
            <select className="input" value={form.teamB} onChange={e=>setForm({...form, teamB:e.target.value})}>
              <option value="">Select Team B</option>
              {teams.map(t=> <option key={t.id} value={t.name}>{t.name}</option>)}
            </select>
          </div>
          <div className="row" style={{marginTop:8}}>
            <input className="input" placeholder="Score (e.g. 6-3,6-4)" value={form.score} onChange={e=>setForm({...form, score:e.target.value})} />
            <button className="button" onClick={addResultWithRatings}>Add Result & Rate</button>
          </div>
          <div style={{marginTop:8, fontSize:13,color:"#666"}}>Allowed set scores: {validSetScores.join(", ")}</div>
        </div>
      </section>

      <section className="card">
        <h2 style={{marginTop:0}}>League Table</h2>
        <div>
          {teams.slice().sort((a,b)=>b.points-a.points).map(t=>(
            <div className="league-row" key={t.id}>
              <div className="team-name">{t.name}</div>
              <div style={{display:"flex",gap:12,alignItems:"center"}}>
                <div style={{fontSize:13,color:"#666"}}>Avg player rating: <strong>{(t.players.map(p=>parseFloat(avgForPlayer(p))||0).reduce((s,n)=>s+n,0)/t.players.length).toFixed(2)}</strong></div>
                <div className="points">{t.points} pts</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="card">
        <h2 style={{marginTop:0}}>Match History</h2>
        {results.length===0 ? <div style={{color:"#666"}}>No matches yet</div> : results.map((r,idx)=>(
          <div key={r.matchId} style={{marginBottom:10}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <div><strong>{findTeamByName(teams,r.teams[0])?.name}</strong> vs <strong>{findTeamByName(teams,r.teams[1])?.name}</strong></div>
              <div style={{fontWeight:800}}>{findTeamByName(teams,r.winnerId)?.name} — {r.score}</div>
            </div>
            <div style={{marginTop:6}}>
              <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                {(findTeamByName(teams,r.teams[0])?.players||[]).concat(findTeamByName(teams,r.teams[1])?.players||[]).map(player => (
                  <div key={player} style={{background:"#fff",padding:8,borderRadius:8}}>
                    <div style={{fontWeight:700, marginBottom:6}}>{player}</div>
                    <div style={{display:"flex",gap:6}}>
                      {[1,2,3,4,5].map(n => (
                        <button key={n} className="small" onClick={()=>{ addRatingForPlayer(player, n); }}>
                          {n}
                        </button>
                      ))}
                    </div>
                    <div style={{fontSize:12,color:"#666",marginTop:6}}>Avg: {avgForPlayer(player)}</div>
                    {admin && <div style={{marginTop:6}}><button className="small" onClick={()=>{ if(confirm('Delete all ratings for '+player+'?')){ const r = {...ratings}; delete r[player]; setRatings(r); } }}>Clear {player} ratings</button></div>}
                  </div>
                ))}
              </div>
            </div>
            {admin && <div style={{marginTop:6}}>Entered: {new Date(r.ts).toLocaleString()}</div>}
            <hr style={{border:"none",borderTop:"1px solid #f1f5f9",margin:"10px 0"}}/>
          </div>
        ))}
      </section>

      <section className="card">
        <h2 style={{marginTop:0}}>All Players</h2>
        <div className="player-grid">
          {teams.flatMap(t=>t.players).map(player => (
            <div className="player-card" key={player}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <div style={{fontWeight:800}}>{player}</div>
                <div>⭐ {avgForPlayer(player)}</div>
              </div>
              <div style={{marginTop:8,fontSize:13,color:"#666"}}>
                Ratings:
                {(ratings[player]||[]).length===0 ? <div style={{color:"#999"}}>No ratings yet</div> :
                  (ratings[player]||[]).map((r,i)=> <div key={i} style={{display:"flex",justifyContent:"space-between",marginTop:6}}><div>{r.fromTeam} — {r.score}</div>{admin && <div><button className="small" onClick={()=>{ if(confirm('Delete rating?')){ const copy = {...ratings}; copy[player].splice(i,1); setRatings(copy); } }}>✖</button></div>}</div>)
                }
              </div>
            </div>
          ))}
        </div>
      </section>

      <footer className="footer">Designed &amp; Created by DannyRush Apps</footer>
    </div>
  );

  // helper inside component
  function findTeamByName(teamList, nameOrId){
    if(typeof nameOrId === "number") return teamList.find(t=>t.id===nameOrId);
    return teamList.find(t=>t.name===nameOrId);
  }
  function avgForPlayer(player){
    const arr = ratings[player]||[];
    if(arr.length===0) return "0.00";
    return (arr.reduce((s,a)=>s+a.score,0)/arr.length).toFixed(2);
  }
}
