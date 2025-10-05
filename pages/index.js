
import { useState, useEffect } from 'react';

export default function Home() {
  const initialTeams = [
    { id: 1, name: 'Dan & Bean', players: ['Dan', 'Bean'], points: 0 },
    { id: 2, name: 'Weedy & TJ', players: ['Weedy', 'TJ'], points: 0 },
    { id: 3, name: 'Rob & Pear', players: ['Rob', 'Pear'], points: 0 },
    { id: 4, name: 'Nova & Neil', players: ['Nova', 'Neil'], points: 0 },
    { id: 5, name: 'Bulby & JHD', players: ['Bulby', 'JHD'], points: 0 },
  ];

  const [teams, setTeams] = useState(initialTeams);
  const [matches, setMatches] = useState([]);
  const [ratings, setRatings] = useState({});
  const [team1, setTeam1] = useState('');
  const [team2, setTeam2] = useState('');
  const [score, setScore] = useState('');
  const [admin, setAdmin] = useState(false);
  const [password, setPassword] = useState('');

  useEffect(()=>{
    const stored = localStorage.getItem('padleData');
    if(stored){
      const data = JSON.parse(stored);
      setTeams(data.teams || initialTeams);
      setMatches(data.matches || []);
      setRatings(data.ratings || {});
    }
  },[]);

  useEffect(()=>{
    localStorage.setItem('padleData', JSON.stringify({ teams, matches, ratings }));
  }, [teams, matches, ratings]);

  const login = ()=>{
    if(password==='danisgreat'){ setAdmin(true); alert('Admin mode enabled') }
    else alert('Wrong password');
    setPassword('');
  };

  const addMatch = ()=>{
    if(!team1 || !team2 || !score || team1===team2) return alert('Select two teams and enter score');
    const winner = prompt(`Enter winner team name:
${team1}
${team2}`, team1);
    if(!winner) return;
    const newMatch = { id: Date.now(), team1, team2, score, winner };
    setMatches([newMatch,...matches]);
    setTeam1(''); setTeam2(''); setScore('');
  };

  const clearLastMatch = ()=>{ if(admin){ setMatches(matches.slice(1)); } };
  const resetAll = ()=>{ if(admin){ if(confirm('Reset all data?')){ setMatches([]); setRatings({}); setTeams(initialTeams); localStorage.removeItem('padleData'); } } };
  const ratePlayer = (player, value)=>{
    const newRatings = {...ratings};
    if(!newRatings[player]) newRatings[player]=[];
    newRatings[player].push(parseInt(value));
    setRatings(newRatings);
  };
  const avg = (player)=>{ const arr = ratings[player]||[]; return arr.length? (arr.reduce((a,b)=>a+b,0)/arr.length).toFixed(1):0; };

  const calcPoints = (teamName)=>matches.filter(m=>m.winner===teamName).length*3;

  return <div className="container">
    <h1>🎾 Padle League</h1>

    {!admin && <div className="card">
      <h3>Admin Login</h3>
      <input type="password" placeholder="Enter password" value={password} onChange={e=>setPassword(e.target.value)} />
      <button onClick={login}>Login</button>
    </div>}

    {admin && <div className="card">
      <h3>Record Match</h3>
      <select value={team1} onChange={e=>setTeam1(e.target.value)}><option value="">Team 1</option>{teams.map(t=><option key={t.id}>{t.name}</option>)}</select>
      <select value={team2} onChange={e=>setTeam2(e.target.value)}><option value="">Team 2</option>{teams.map(t=><option key={t.id}>{t.name}</option>)}</select>
      <input placeholder="Score e.g. 6-3,6-4" value={score} onChange={e=>setScore(e.target.value)} />
      <button onClick={addMatch}>Add Match</button>
      <button onClick={clearLastMatch}>Clear Last Match</button>
      <button onClick={resetAll}>Reset All Data</button>
    </div>}

    <div className="card">
      <h2>League Table / Results</h2>
      {matches.length===0 && <p>No matches yet</p>}
      {matches.map(m=><div key={m.id}><b>{m.team1}</b> vs <b>{m.team2}</b> → {m.score} | Winner: {m.winner}</div>)}
      <h3>Total Points</h3>
      {teams.map(t=><div key={t.id}>{t.name}: {calcPoints(t.name)} pts</div>)}
    </div>

    <div className="card">
      <h2>Player Ratings</h2>
      {teams.flatMap(t=>t.players).map(p=><div key={p}>{p} ⭐ Avg: {avg(p)} {admin && <span> | <select onChange={e=>ratePlayer(p,e.target.value)} defaultValue=""><option value="">Rate</option>{[1,2,3,4,5].map(n=><option key={n}>{n}</option>)}</select></span>}</div>)}
    </div>

    <footer>Designed & Created by DannyRush Apps</footer>
  </div>;
}
