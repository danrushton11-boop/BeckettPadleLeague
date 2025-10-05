
import { useState, useEffect } from 'react';

export default function Home() {
  const initialTeams = [
    { id: 1, name: 'Dan & Bean', players: ['Dan', 'Bean'], points: 0, ratings: {} },
    { id: 2, name: 'Weedy & TJ', players: ['Weedy', 'TJ'], points: 0, ratings: {} },
    { id: 3, name: 'Rob & Pear', players: ['Rob', 'Pear'], points: 0, ratings: {} },
    { id: 4, name: 'Nova & Neil', players: ['Nova', 'Neil'], points: 0, ratings: {} },
    { id: 5, name: 'Bulby & JHD', players: ['Bulby', 'JHD'], points: 0, ratings: {} },
  ];

  const [teams, setTeams] = useState(initialTeams);
  const [matchHistory, setMatchHistory] = useState([]);
  const [team1, setTeam1] = useState('');
  const [team2, setTeam2] = useState('');
  const [score, setScore] = useState('');
  const [ratings, setRatings] = useState({});
  const [password, setPassword] = useState('');
  const [adminMode, setAdminMode] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('padleData');
    if (stored) {
      const parsed = JSON.parse(stored);
      setTeams(parsed.teams || initialTeams);
      setMatchHistory(parsed.matchHistory || []);
      setRatings(parsed.ratings || {});
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('padleData', JSON.stringify({ teams, matchHistory, ratings }));
  }, [teams, matchHistory, ratings]);

  const recordMatch = () => {
    if (!team1 || !team2 || !score || team1 === team2) return alert('Select two different teams and enter a score.');
    const newMatch = { id: Date.now(), team1, team2, score, ratings: {} };
    setMatchHistory([newMatch, ...matchHistory]);
    setTeam1('');
    setTeam2('');
    setScore('');
  };

  const ratePlayers = (matchId, team, player, value) => {
    const updatedRatings = { ...ratings };
    if (!updatedRatings[player]) updatedRatings[player] = [];
    updatedRatings[player].push(parseInt(value));
    setRatings(updatedRatings);
  };

  const getAverageRating = (player) => {
    const arr = ratings[player] || [];
    if (arr.length === 0) return 0;
    return (arr.reduce((a,b) => a + b, 0) / arr.length).toFixed(1);
  };

  const resetAll = () => {
    if (confirm('Are you sure you want to clear all data?')) {
      setTeams(initialTeams);
      setMatchHistory([]);
      setRatings({});
      localStorage.removeItem('padleData');
    }
  };

  const clearLast = () => {
    if (matchHistory.length === 0) return;
    const updated = [...matchHistory];
    updated.shift();
    setMatchHistory(updated);
  };

  const handleLogin = () => {
    if (password === 'danisgreat') setAdminMode(true);
    else alert('Incorrect password');
  };

  return (
    <div className="container">
      <h1>🎾 Padle League</h1>

      {!adminMode ? (
        <div className="card">
          <h3>Admin Login</h3>
          <input type="password" placeholder="Enter admin password" value={password} onChange={(e) => setPassword(e.target.value)} />
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
          <button onClick={clearLast}>Clear Last Match</button>
          <button onClick={resetAll}>Reset All Data</button>
        </div>
      )}

      <div className="card">
        <h3>League Table</h3>
        {teams.map(team => (
          <div key={team.id}>
            <strong>{team.name}</strong>
            <ul style={{listStyle:'none', padding:0}}>
              {team.players.map(p => (
                <li key={p}>{p} ⭐ {getAverageRating(p)}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="card">
        <h3>Match History & Ratings</h3>
        {matchHistory.map(match => (
          <div key={match.id}>
            <p><b>{match.team1}</b> vs <b>{match.team2}</b> → {match.score}</p>
            {adminMode && (
              <div>
                {[...match.team1.split(' & '), ...match.team2.split(' & ')].map(player => (
                  <div key={player}>
                    {player}: 
                    <select onChange={(e)=>ratePlayers(match.id, match.team1, player, e.target.value)} defaultValue="">
                      <option value="">Rate</option>
                      {[1,2,3,4,5].map(r => <option key={r}>{r}</option>)}
                    </select>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      <footer>Designed & Created by <b>DannyRush Apps</b></footer>
    </div>
  );
}
