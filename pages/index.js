
import { useState, useEffect } from 'react';

export default function Home() {
  const [teams, setTeams] = useState([
    { id: 1, name: 'Dan & Bean', points: 0 },
    { id: 2, name: 'Weedy & TJ', points: 0 },
    { id: 3, name: 'Rob & Pear', points: 0 },
    { id: 4, name: 'Nova & Neil', points: 0 },
    { id: 5, name: 'Bulby & JHD', points: 0 },
  ]);
  const [matchHistory, setMatchHistory] = useState([]);
  const [team1, setTeam1] = useState('');
  const [team2, setTeam2] = useState('');
  const [score, setScore] = useState('');
  const [adminMode, setAdminMode] = useState(false);
  const [password, setPassword] = useState('');

  useEffect(() => {
    const storedTeams = localStorage.getItem('padleTeams');
    const storedMatches = localStorage.getItem('padleMatches');
    if (storedTeams) setTeams(JSON.parse(storedTeams));
    if (storedMatches) setMatchHistory(JSON.parse(storedMatches));
  }, []);

  useEffect(() => {
    localStorage.setItem('padleTeams', JSON.stringify(teams));
    localStorage.setItem('padleMatches', JSON.stringify(matchHistory));
  }, [teams, matchHistory]);

  const recordMatch = () => {
    if (!team1 || !team2 || !score || team1 === team2) return alert('Select two different teams and enter a score.');
    const updatedTeams = teams.map((t) => {
      if (t.name === team1) return { ...t, points: t.points + 3 };
      return t;
    });
    setTeams(updatedTeams);
    const newMatch = { id: Date.now(), team1, team2, score };
    setMatchHistory([newMatch, ...matchHistory]);
    setTeam1('');
    setTeam2('');
    setScore('');
  };

  const resetAll = () => {
    if (confirm('Are you sure you want to clear all data?')) {
      setTeams(teams.map(t => ({ ...t, points: 0 })));
      setMatchHistory([]);
      localStorage.clear();
    }
  };

  const handleLogin = () => {
    if (password === 'danisgreat') {
      setAdminMode(true);
    } else {
      alert('Incorrect password');
    }
  };

  return (
    <div className="container">
      <h1>Padle League</h1>

      {!adminMode ? (
        <div className="card">
          <h3>Admin Login</h3>
          <input 
            type="password" 
            placeholder="Enter admin password" 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button onClick={handleLogin}>Login</button>
        </div>
      ) : (
        <div className="card">
          <h3>Record Match</h3>
          <select value={team1} onChange={(e) => setTeam1(e.target.value)}>
            <option value="">Select Team 1</option>
            {teams.map(t => <option key={t.id}>{t.name}</option>)}
          </select>
          <select value={team2} onChange={(e) => setTeam2(e.target.value)}>
            <option value="">Select Team 2</option>
            {teams.map(t => <option key={t.id}>{t.name}</option>)}
          </select>
          <input type="text" placeholder="Score (e.g. 6-3, 6-4)" value={score} onChange={(e) => setScore(e.target.value)} />
          <button onClick={recordMatch}>Add Result</button>
          <button onClick={resetAll}>Reset League</button>
        </div>
      )}

      <div className="card">
        <h3>League Table</h3>
        {teams.sort((a, b) => b.points - a.points).map(t => (
          <p key={t.id}>{t.name}: {t.points} pts</p>
        ))}
      </div>

      <div className="card">
        <h3>Match History</h3>
        {matchHistory.map((m) => (
          <p key={m.id}>{m.team1} vs {m.team2} → {m.score}</p>
        ))}
      </div>

      <footer style={{marginTop:'40px', fontSize:'0.8rem'}}>
        Designed & Created by <b>DannyRush Apps</b>
      </footer>
    </div>
  );
}
