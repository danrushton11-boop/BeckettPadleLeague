import { useEffect, useState } from "react";

/*
  Padle League v5 - Offline (localStorage)
  Admin password: danisgreat
*/

const STORAGE_KEY = "padle_v5_data";

const initialTeams = [
  { id: 1, name: "Dan & Bean", players: ["Dan", "Bean"], points: 0, wins: 0, draws: 0, losses: 0 },
  { id: 2, name: "Weedy & TJ", players: ["Weedy", "TJ"], points: 0, wins: 0, draws: 0, losses: 0 },
  { id: 3, name: "Rob & Pear", players: ["Rob", "Pear"], points: 0, wins: 0, draws: 0, losses: 0 },
  { id: 4, name: "Nova & Neil", players: ["Nova", "Neil"], points: 0, wins: 0, draws: 0, losses: 0 },
  { id: 5, name: "Bulby & JHD", players: ["Bulby", "JHD"], points: 0, wins: 0, draws: 0, losses: 0 },
];

// allowed set scores (simple validation)
const validSetScores = ["6-0","6-1","6-2","6-3","6-4","7-5","7-6"];

function saveToStorage(data){
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch(e){}
}
function loadFromStorage(){
  try { const raw = localStorage.getItem(STORAGE_KEY); return raw ? JSON.parse(raw) : null; } catch(e){ return null; }
}

export default function Home(){
  const [teams, setTeams] = useState(initialTeams);
  const [fixtures, setFixtures] = useState([]); // {team1, team2, played}
  const [matches, setMatches] = useState([]); // {id, team1, team2, score, winner, ts}
  const [ratings, setRatings] = useState({}); // { player: [ {matchId, value} ] }

  // form + admin
  const [teamA, setTeamA] = useState("");
  const [teamB, setTeamB] = useState("");
  const [scoreInput, setScoreInput] = useState("");
  const [adminPass, setAdminPass] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);

  // load initial data
  useEffect(()=> {
    const s = loadFromStorage();
    if(s){
      setTeams(s.teams || initialTeams);
      setFixtures(s.fixtures || generateFixtures(initialTeams));
      setMatches(s.matches || []);
      setRatings(s.ratings || {});
    } else {
      setTeams(initialTeams.map(t => ({...t})));
      setFixtures(generateFixtures(initialTeams));
      setMatches([]);
      setRatings({});
      saveToStorage({
        teams: initialTeams.map(t => ({...t})),
        fixtures: generateFixtures(initialTeams),
        matches: [],
        ratings: {}
      });
    }
  }, []);

  // persist whenever main state changes
  useEffect(()=> {
    saveToStorage({ teams, fixtures, matches, ratings });
  }, [teams, fixtures, matches, ratings]);

  // Helpers
  function generateFixtures(teamList){
    const list = [];
    for(let i=0;i<teamList.length;i++){
      for(let j=i+1;j<teamList.length;j++){
        list.push({ team1: teamList[i].name, team2: teamList[j].name, played:false });
      }
    }
    return list;
  }

  function isValidScoreString(s){
    if(!s) return false;
    const parts = s.split(",").map(x=>x.trim()).filter(Boolean);
    return parts.length > 0 && parts.every(p => validSetScores.includes(p));
  }

  // Recompute team stats from matches (safer when deleting last match)
  function recomputeTeamsFromMatches(matchList){
    const base = initialTeams.map(t => ({ ...t, points:0, wins:0, draws:0, losses:0 }));
    matchList.forEach(m => {
      if(m.winner === "Draw"){
        base.forEach(b=>{
          if(b.name === m.team1 || b.name === m.team2){ b.draws++; b.points += 1; }
        });
      } else {
        const winner = base.find(b => b.name === m.winner);
        if(winner) { winner.wins++; winner.points += 3; }
        base.forEach(b=>{
          if(b.name === m.team1 && m.winner !== b.name && m.winner !== "Draw") { if(b.name!==m.winner) b.losses++; }
          if(b.name === m.team2 && m.winner !== b.name && m.winner !== "Draw") { if(b.name!==m.winner) b.losses++; }
        });
      }
    });
    return base;
  }

  // admin login
  function handleAdminLogin(){
    if(adminPass === "danisgreat"){ setIsAdmin(true); alert("Admin enabled"); }
    else alert("Wrong password");
    setAdminPass("");
  }

  // Add match (admin)
  function handleAddMatch(){
    if(!isAdmin) return alert("Admin only");
    if(!teamA || !teamB) return alert("Select both teams");
    if(teamA === teamB) return alert("Pick two different teams");
    if(!isValidScoreString(scoreInput)) return alert("Invalid score. Use comma-separated sets (e.g. 6-3,6-4). Allowed sets: " + validSetScores.join(", "));

    // ask who's the winner or Draw
    const winnerPrompt = prompt(`Enter winner team name, or type "Draw":\n${teamA}\n${teamB}`, teamA);
    if(!winnerPrompt) return;
    const winner = (winnerPrompt.trim() === "Draw") ? "Draw" : winnerPrompt.trim();

    const newMatch = { id: Date.now(), team1: teamA, team2: teamB, score: scoreInput.trim(), winner, ts: Date.now() };
    const newMatches = [newMatch, ...matches];
    setMatches(newMatches);

    // recompute teams from newMatches (safe)
    const recomputed = recomputeTeamsFromMatches(newMatches);
    // preserve players if user customized names in teams; merge players field
    const merged = recomputed.map(rt => {
      const orig = teams.find(t => t.name === rt.name);
      return orig ? { ...rt, players: orig.players } : rt;
    });
    setTeams(merged);

    // mark fixture as played
    const updatedFixtures = fixtures.map(f => {
      if((f.team1 === teamA && f.team2 === teamB) || (f.team1 === teamB && f.team2 === teamA)){
        return { ...f, played: true };
      }
      return f;
    });
    setFixtures(updatedFixtures);

    // reset form
    setTeamA(""); setTeamB(""); setScoreInput("");
  }

  // Rate a player for a specific match
  function handleRatePlayer(matchId, player, value){
    if(!isAdmin) return alert("Admin only");
    const v = parseInt(value, 10);
    if(isNaN(v) || v < 1 || v > 5) return;
    const copy = { ...ratings };
    if(!copy[player]) copy[player] = [];
    // allow multiple ratings per match if needed: but we avoid duplicates for same match+player by removing older rating for this match
    copy[player] = copy[player].filter(r => r.matchId !== matchId);
    copy[player].push({ matchId, value: v });
    setRatings(copy);
  }

  // player average
  function playerAverage(player){
    const arr = ratings[player] || [];
    if(arr.length === 0) return "0.0";
    const avg = arr.reduce((s,a)=>s+a.value,0) / arr.length;
    return avg.toFixed(1);
  }

  // Clear last match (admin)
  function handleClearLastMatch(){
    if(!isAdmin) return alert("Admin only");
    if(matches.length === 0) return alert("No matches to clear");
    if(!confirm("Remove the last entered match?")) return;
    const [, ...rest] = matches; // remove first (most recent)
    setMatches(rest);

    // remove ratings for that match
    const lastMatchId = matches[0].id;
    const newRatings = {};
    Object.entries(ratings).forEach(([player, arr]) => {
      const filtered = arr.filter(r => r.matchId !== lastMatchId);
      if(filtered.length) newRatings[player] = filtered;
    });
    setRatings(newRatings);

    // recompute teams based on remaining matches
    const recomputed = recomputeTeamsFromMatches(rest);
    const merged = recomputed.map(rt => {
      const orig = teams.find(t => t.name === rt.name);
      return orig ? { ...rt, players: orig.players } : rt;
    });
    setTeams(merged);

    // unmark fixture if the removed match was used to mark it
    const lastMatch = matches[0];
    const updatedFixtures = fixtures.map(f => {
      if((f.team1 === lastMatch.team1 && f.team2 === lastMatch.team2) || (f.team1 === lastMatch.team2 && f.team2 === lastMatch.team1)){
        return { ...f, played: false };
      }
      return f;
    });
    setFixtures(updatedFixtures);
  }

  // Reset everything (admin)
  function handleResetAll(){
    if(!isAdmin) return alert("Admin only");
    if(!confirm("Reset ALL data? This cannot be undone.")) return;
    setTeams(initialTeams.map(t => ({ ...t, points:0, wins:0, draws:0, losses:0 })));
    setMatches([]);
    setRatings({});
    setFixtures(generateFixtures(initialTeams));
    localStorage.removeItem(STORAGE_KEY);
  }

  // helper for matches display in fixtures table
  function findMatchBetween(a,b){
    return matches.find(m => (m.team1===a && m.team2===b) || (m.team1===b && m.team2===a));
  }

  // Render
  return (
    <div className="container">
      <header className="header">
        <div className="logo">🎾</div>
        <h1 className="title">Padle League</h1>
        <div className="subtitle">Friendly over-40 social league</div>
      </header>

      {/* Admin login / controls */}
      {!isAdmin ? (
        <div className="card">
          <div style={{display:"flex", gap:10, alignItems:"center"}}>
            <input className="input" placeholder="Admin password" type="password" value={adminPass} onChange={e=>setAdminPass(e.target.value)} />
            <button className="button" onClick={handleAdminLogin}>Enter Admin</button>
          </div>
          <div style={{marginTop:8, color:"rgba(0,0,0,0.6)"}}>Admin-only features: add match, rate players, clear last match, reset data</div>
        </div>
      ) : (
        <div className="card">
          <div style={{display:"flex", gap:10, alignItems:"center", justifyContent:"space-between", flexWrap:"wrap"}}>
            <div style={{fontWeight:800, color:"#2e7d32"}}>✅ Admin mode</div>
            <div style={{display:"flex", gap:8}}>
              <button className="button" onClick={handleClearLastMatch}>Clear Last Match</button>
              <button className="button danger" onClick={handleResetAll}>Reset All Data</button>
            </div>
          </div>
        </div>
      )}

      {/* Record match (admin only) */}
      {isAdmin && (
        <div className="card">
          <h2 style={{marginTop:0}}>Record Match</h2>
          <div className="row">
            <select className="input" value={teamA} onChange={e=>setTeamA(e.target.value)}>
              <option value="">Select Team A</option>
              {teams.map(t => <option key={t.id} value={t.name}>{t.name}</option>)}
            </select>
            <select className="input" value={teamB} onChange={e=>setTeamB(e.target.value)}>
              <option value="">Select Team B</option>
              {teams.map(t => <option key={t.id} value={t.name}>{t.name}</option>)}
            </select>
            <input className="input" placeholder="Score e.g. 6-3,6-4" value={scoreInput} onChange={e=>setScoreInput(e.target.value)} />
            <button className="button" onClick={handleAddMatch}>Add Match</button>
          </div>

          {/* After a match is added, admin can open the Match History (below) and rate players per match */}
          <div style={{marginTop:8, color:"rgba(0,0,0,0.6)"}}>
            After saving a match, scroll to Match History to rate each player per game (1–5).
          </div>
        </div>
      )}

      {/* League table */}
      <div className="card">
        <h2 style={{marginTop:0}}>League Table</h2>
        <table>
          <thead>
            <tr>
              <th>Team</th>
              <th>Points</th>
              <th>Wins</th>
              <th>Draws</th>
              <th>Losses</th>
            </tr>
          </thead>
          <tbody>
            {teams.slice().sort((a,b)=>b.points - a.points).map(t => (
              <tr key={t.id}>
                <td>{t.name}</td>
                <td>{t.points}</td>
                <td>{t.wins}</td>
                <td>{t.draws}</td>
                <td>{t.losses}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Fixtures */}
      <div className="card">
        <h2 style={{marginTop:0}}>Fixtures</h2>
        <table>
          <thead><tr><th>Team 1</th><th>Team 2</th><th>Status</th></tr></thead>
          <tbody>
            {fixtures.map((f,i) => {
              const m = findMatchBetween(f.team1, f.team2);
              return (
                <tr key={i}>
                  <td>{f.team1}</td>
                  <td>{f.team2}</td>
                  <td>{m ? `Played — ${m.score}` : (f.played ? 'Played' : 'Pending')}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Match History with rating inputs per match (admin can rate) */}
      <div className="card">
        <h2 style={{marginTop:0}}>Match History</h2>
        {matches.length === 0 ? <div style={{color:"#666"}}>No matches yet</div> : matches.map(m => (
          <div key={m.id} style={{marginBottom:12, paddingBottom:8, borderBottom:"1px solid rgba(0,0,0,0.06)"}}>
            <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", gap:10}}>
              <div><strong>{m.team1}</strong> vs <strong>{m.team2}</strong></div>
              <div style={{fontWeight:800}}>{m.winner === "Draw" ? "Draw" : `${m.winner} — ${m.score}`}</div>
            </div>

            <div style={{marginTop:8}}>
              <div style={{fontSize:13, color:"#333", marginBottom:6}}>Rate players for this match (admin only)</div>
              <div style={{display:"flex", gap:8, flexWrap:"wrap"}}>
                {getPlayersForMatch(m).map(player => (
                  <div key={player} className="player-card" style={{minWidth:160}}>
                    <div style={{fontWeight:800}}>{player}</div>
                    <div style={{marginTop:8, display:"flex", gap:6}}>
                      {[1,2,3,4,5].map(n => {
                        const existing = (ratings[player]||[]).find(r => r.matchId === m.id);
                        const isActive = existing && existing.value === n;
                        return (
                          <button
                            key={n}
                            className="button"
                            style={{ padding:"8px 10px", fontWeight:700, background: isActive ? "#1e88e5" : undefined, color: isActive ? "#fff" : undefined }}
                            onClick={() => handleRatePlayer(m.id, player, n)}
                          >
                            {n}
                          </button>
                        )
                      })}
                    </div>
                    <div style={{marginTop:8, fontSize:13, color:"#666"}}>Avg: {playerAverage(player)}</div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{marginTop:8, fontSize:12, color:"#666"}}>Played at: {new Date(m.ts).toLocaleString()}</div>
          </div>
        ))}
      </div>

      {/* Player Ratings table (per-match rows + per-player average) */}
      <div className="card">
        <h2 style={{marginTop:0}}>Player Ratings</h2>

        <table>
          <thead>
            <tr>
              <th>Player</th>
              <th>Match</th>
              <th>Rating</th>
              <th>Average</th>
            </tr>
          </thead>
          <tbody>
            {Array.from(new Set(teams.flatMap(t => t.players))).map(player => {
              const entries = ratings[player] || [];
              if(entries.length === 0){
                return (
                  <tr key={player + "-empty"}>
                    <td>{player}</td>
                    <td>—</td>
                    <td>—</td>
                    <td>{playerAverage(player)}</td>
                  </tr>
                );
              }
              return entries.map((r, i) => {
                const match = matches.find(mm => mm.id === r.matchId);
                return (
                  <tr key={player + "-" + i}>
                    <td>{player}</td>
                    <td>{match ? `${match.team1} vs ${match.team2}` : 'N/A'}</td>
                    <td>{r.value}</td>
                    <td>{playerAverage(player)}</td>
                  </tr>
                );
              });
            })}
          </tbody>
        </table>
      </div>

      <footer className="footer">Designed &amp; Created by DannyRush Apps</footer>
    </div>
  );

  // helper to get players for a match (both teams)
  function getPlayersForMatch(match){
    const t1 = teams.find(t => t.name === match.team1);
    const t2 = teams.find(t => t.name === match.team2);
    return [...(t1?.players || []), ...(t2?.players || [])];
  }
}
