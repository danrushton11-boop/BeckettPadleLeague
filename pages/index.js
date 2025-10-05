
import { useState, useEffect } from 'react';

export default function Home() {
  const initialTeams = [
    { id: 1, name: 'Dan & Bean', players: ['Dan', 'Bean'], points: 0, wins: 0, draws: 0, losses: 0 },
    { id: 2, name: 'Weedy & TJ', players: ['Weedy', 'TJ'], points: 0, wins: 0, draws: 0, losses: 0 },
    { id: 3, name: 'Rob & Pear', players: ['Rob', 'Pear'], points: 0, wins: 0, draws: 0, losses: 0 },
    { id: 4, name: 'Nova & Neil', players: ['Nova', 'Neil'], points: 0, wins: 0, draws: 0, losses: 0 },
    { id: 5, name: 'Bulby & JHD', players: ['Bulby', 'JHD'], points: 0, wins: 0, draws: 0, losses: 0 },
  ];

  const [teams, setTeams] = useState(initialTeams);
  const [matches, setMatches] = useState([]);
  const [ratings, setRatings] = useState({});
  const [team1, setTeam1] = useState('');
  const [team2, setTeam2] = useState('');
  const [score, setScore] = useState('');
  const [admin, setAdmin] = useState(false);
  const [password, setPassword] = useState('');
  const [fixtures, setFixtures] = useState([]);

  useEffect(() => {
    const stored = localStorage.getItem('padleData');
    if (stored) {
      const data = JSON.parse(stored);
      setTeams(data.teams || initialTeams);
      setMatches(data.matches || []);
      setRatings(data.ratings || {});
      setFixtures(data.fixtures || []);
    } else {
      let fs = [];
      for (let i = 0; i < initialTeams.length; i++) {
        for (let j = i + 1; j < initialTeams.length; j++) {
          fs.push({ team1: initialTeams[i].name, team2: initialTeams[j].name, played: false });
        }
      }
      setFixtures(fs);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('padleData', JSON.stringify({ teams, matches, ratings, fixtures }));
  }, [teams, matches, ratings, fixtures]);

  const login = () => {
    if (password === 'danisgreat') {
      setAdmin(true);
      alert('Admin mode enabled');
    } else {
      alert('Wrong password');
    }
    setPassword('');
  };

  const addMatch = () => {
    if (!team1 || !team2 || !score || team1 === team2) return alert('Select two teams and enter score');
    const winner = prompt(`Enter winner team name (or Draw):\n${team1}\n${team2}`, team1);
    if (!winner) return;
    const newMatch = { id: Date.now(), team1, team2, score, winner, ratings: {} };
    setMatches([newMatch, ...matches]);

    const updatedTeams = teams.map(t => {
      let tCopy = { ...t };
      if (t.name === winner) {
        tCopy.wins++;
        tCopy.points += 3;
      } else if (winner === 'Draw') {
        if (t.name === team1 || t.name === team2) {
          tCopy.draws++;
          tCopy.points += 1;
        }
      } else if (t.name === team1 || t.name === team2) {
        tCopy.losses++;
      }
      return tCopy;
    });
    setTeams(updatedTeams);

    const updatedFixtures = fixtures.map(f => {
      if ((f.team1 === team1 && f.team2 === team2) || (f.team1 === team2 && f.team2 === team1)) f.played = true;
      return f;
    });
    setFixtures(updatedFixtures);

    setTeam1('');
    setTeam2('');
    setScore('');
  };

  const ratePlayer = (matchId, player, value) => {
    const newRatings = { ...ratings };
    if (!newRatings[player]) newRatings[player] = [];
    newRatings[player].push({ matchId, value: parseInt(value) });
    setRatings(newRatings);
  };

  const avg = (player) => {
    const arr = ratings[player] || [];
    if (arr.length === 0) return 0;
    return (arr.reduce((a, b) => a + b.value, 0) / arr.length).toFixed(1);
  };

  const clearLastMatch = () => {
    if (admin) {
      const updated = matches.slice(1);
      setMatches(updated);
    }
  };

  const resetAll = () => {
    if (admin) {
      if (confirm('Reset all data?')) {
        setMatches([]);
        setRatings({});
        setTeams(initialTeams.map(t => ({ ...t, points: 0, wins: 0, draws: 0, losses: 0 })));
        setFixtures([]);
      }
    }
  };

  return (
    <div className="container">
      <h1>🎾 Padle League</h1>

      {!admin && (
        <div className="card">
          <h3>Admin Login</h3>
          <input
            type="password"
            placeholder="Enter password"
            value={password}
            onChange={e => setPassword(e.target.value)}
          />
          <button onClick={login}>Login</button>
        </div>
      )}

      {admin && (
        <div className="card">
          <h3>Record Match</h3>
          <select value={team1} onChange={e => setTeam1(e.target.value)}>
            <option value="">Team 1</option>
            {teams.map(t => (
              <option key={t.id}>{t.name}</option>
            ))}
          </select>
          <select value={team2} onChange={e => setTeam2(e.target.value)}>
            <option value="">Team 2</option>
            {teams.map(t => (
              <option key={t.id}>{t.name}</option>
            ))}
          </select>
          <input
            placeholder="Score e.g. 6-3,6-4"
            value={score}
            onChange={e => setScore(e.target.value)}
          />
          <button onClick={addMatch}>Add Match</button>
          <button onClick={clearLastMatch}>Clear Last Match</button>
          <button onClick={resetAll}>Reset All Data</button>
        </div>
      )}

      <div className="card">
        <h2>League Table</h2>
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
            {teams
              .sort((a, b) => b.points - a.points)
              .map(t => (
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

      <div className="card">
        <h2>Fixtures</h2>
        <table>
          <thead>
            <tr>
              <th>Team 1</th>
              <th>Team 2</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {fixtures.map((f, i) => (
              <tr key={i}>
                <td>{f.team1}</td>
                <td>{f.team2}</td>
                <td>{f.played ? 'Played' : 'Pending'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="card">
        <h2>Player Ratings</h2>
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
            {teams.flatMap(t => t.players).map(player => {
              const playerRatings = ratings
::contentReference[oaicite:18]{index=18}
 
