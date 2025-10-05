import { useState, useEffect } from "react";
import { db } from "../lib/firebase";
import {
  collection,
  addDoc,
  getDocs,
  updateDoc,
  doc,
  deleteDoc,
  query,
  orderBy
} from "firebase/firestore";

const initialTeams = [
  { id: 1, name: 'Dan & Bean', players: ['Dan', 'Bean'] },
  { id: 2, name: 'Weedy & TJ', players: ['Weedy', 'TJ'] },
  { id: 3, name: 'Rob & Pear', players: ['Rob', 'Pear'] },
  { id: 4, name: 'Nova & Neil', players: ['Nova', 'Neil'] },
  { id: 5, name: 'Bulby & JHD', players: ['Bulby', 'JHD'] },
];

// Generate fixtures (all unique pairings)
const generateFixtures = (teams) => {
  const fixtures = [];
  for (let i = 0; i < teams.length; i++) {
    for (let j = i + 1; j < teams.length; j++) {
      fixtures.push({ team1: teams[i].name, team2: teams[j].name, played: false, score: "", winner: "" });
    }
  }
  return fixtures;
};

export default function Home() {
  const [teams, setTeams] = useState([]);
  const [matches, setMatches] = useState([]);
  const [ratings, setRatings] = useState([]);
  const [adminMode, setAdminMode] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");

  const [selectedMatch, setSelectedMatch] = useState(null);
  const [scoreInput, setScoreInput] = useState("");
  const [winnerInput, setWinnerInput] = useState("");
  const [playerRatingsInput, setPlayerRatingsInput] = useState({});

  useEffect(() => {
    const loadData = async () => {
      // Load teams
      const teamsSnapshot = await getDocs(collection(db, "teams"));
      if (teamsSnapshot.empty) {
        for (let t of initialTeams) {
          await addDoc(collection(db, "teams"), { ...t, points: 0 });
        }
      }
      const teamData = await getDocs(collection(db, "teams"));
      setTeams(teamData.docs.map(d => ({ id: d.id, ...d.data() })));

      // Load matches
      const matchData = await getDocs(query(collection(db, "matches"), orderBy("team1")));
      if (matchData.empty) {
        const fixtures = generateFixtures(initialTeams);
        for (let f of fixtures) await addDoc(collection(db, "matches"), f);
      }
      const matchDocs = await getDocs(collection(db, "matches"));
      setMatches(matchDocs.docs.map(d => ({ id: d.id, ...d.data() })));

      // Load ratings
      const ratingData = await getDocs(collection(db, "ratings"));
      setRatings(ratingData.docs.map(d => ({ id: d.id, ...d.data() })));
    };
    loadData();
  }, []);

  const handleAdminLogin = () => {
    if (passwordInput === "danisgreat") setAdminMode(true);
    else alert("Incorrect password");
  };

  const handleSelectMatch = (match) => {
    setSelectedMatch(match);
    setScoreInput(match.score || "");
    setWinnerInput(match.winner || "");
    const pr = {};
    teams.flatMap(t => t.players).forEach(p => pr[p] = "");
    setPlayerRatingsInput(pr);
  };

  const handleAddResult = async () => {
    if (!selectedMatch || !scoreInput || !winnerInput) {
      alert("Fill score and winner");
      return;
    }
    // Update match
    const matchDoc = doc(db, "matches", selectedMatch.id);
    await updateDoc(matchDoc, { score: scoreInput, winner: winnerInput, played: true });

    // Update team points
    const winnerTeam = teams.find(t => t.name === winnerInput);
    if (winnerTeam) {
      const teamDoc = doc(db, "teams", winnerTeam.id);
      await updateDoc(teamDoc, { points: winnerTeam.points + 3 });
      setTeams(teams.map(t => t.id === winnerTeam.id ? { ...t, points: t.points + 3 } : t));
    }

    // Save ratings
    for (let player in playerRatingsInput) {
      if (playerRatingsInput[player]) {
        await addDoc(collection(db, "ratings"), { player, raterTeam: `${selectedMatch.team1} & ${selectedMatch.team2}`, rating: Number(playerRatingsInput[player]) });
      }
    }

    // Refresh matches
    const matchDocs = await getDocs(collection(db, "matches"));
    setMatches(matchDocs.docs.map(d => ({ id: d.id, ...d.data() })));

    setSelectedMatch(null);
    setScoreInput(""); setWinnerInput(""); setPlayerRatingsInput({});
  };

  const clearLastMatch = async () => {
    if (!adminMode || matches.length === 0) return;
    const last = matches.filter(m => m.played).slice(-1)[0];
    if (!last) return;
    await updateDoc(doc(db, "matches", last.id), { score: "", winner: "", played: false });
    setMatches(matches.map(m => m.id === last.id ? { ...m, score: "", winner: "", played: false } : m));
  };

  const resetAllData = async () => {
    if (!adminMode) return;
    for (let m of matches) await updateDoc(doc(db, "matches", m.id), { score: "", winner: "", played: false });
    setMatches(matches.map(m => ({ ...m, score: "", winner: "", played: false })));
    for (let r of ratings) await deleteDoc(doc(db, "ratings", r.id));
    setRatings([]);
    for (let t of teams) {
      await updateDoc(doc(db, "teams", t.id), { points: 0 });
    }
    setTeams(teams.map(t => ({ ...t, points: 0 })));
  };

  const getPlayerRatings = (player) => {
    const playerRatings = ratings.filter(r => r.player === player);
    if (playerRatings.length === 0) return "—";
    const avg = (playerRatings.reduce((a, r) => a + r.rating, 0) / playerRatings.length).toFixed(2);
    return `${avg} (${playerRatings.map(r => r.raterTeam).join(", ")})`;
  };

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", fontFamily: "Arial, sans-serif", padding: 20 }}>
      <h1 style={{ textAlign: "center", color: "#0077cc" }}>Padle League</h1>

      {!adminMode && (
        <div style={{ textAlign: "center", marginBottom: 20 }}>
          <input type="password" placeholder="Admin password" value={passwordInput} onChange={e => setPasswordInput(e.target.value)}
            style={{ padding: 8, fontSize: 16 }} />
          <button onClick={handleAdminLogin} style={{ padding: 8, marginLeft: 10, fontSize: 16, backgroundColor: "#0077cc", color: "white", border: "none", borderRadius: 6 }}>
            Login
          </button>
        </div>
      )}

      {adminMode && (
        <div style={{ marginBottom: 30, padding: 10, border: "1px solid #0077cc", borderRadius: 10 }}>
          <h2>Admin: Enter Match Result</h2>
          <select value={selectedMatch?.id || ""} onChange={e => handleSelectMatch(matches.find(m => m.id === e.target.value))} style={{ marginRight: 10 }}>
            <option value="">Select Match</option>
            {matches.map(m => <option key={m.id} value={m.id}>{m.team1} vs {m.team2}</option>)}
          </select>

          {selectedMatch && (
            <div style={{ marginTop: 10 }}>
              <input type="text" placeholder="Score e.g. 6-3,6-2" value={scoreInput} onChange={e => setScoreInput(e.target.value)} style={{ marginRight: 10 }} />
              <input type="text" placeholder="Winner Team" value={winnerInput} onChange={e => setWinnerInput(e.target.value)} style={{ marginRight: 10 }} />
              <h4>Rate Players (1-5)</h4>
              {teams.flatMap(t => t.players).map(player => (
                <div key={player} style={{ marginBottom: 5 }}>
                  <label>{player}: </label>
                  <input type="number" min="1" max="5" value={playerRatingsInput[player] || ""} onChange={e => setPlayerRatingsInput({ ...playerRatingsInput, [player]: e.target.value })} style={{ width: 50 }} />
                </div>
              ))}
              <button onClick={handleAddResult} style={{ marginTop: 10, padding: 10, backgroundColor: "#0077cc", color: "white", border: "none", borderRadius: 6 }}>Save Result & Ratings</button>
            </div>
          )}
        </div>
      )}

      <h2>League Table</h2>
      <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 20 }}>
        <thead>
          <tr style={{ backgroundColor: "#0077cc", color: "white" }}>
            <th style={{ padding: 8 }}>Team</th>
            <th>Points</th>
          </tr>
        </thead>
        <tbody>
          {teams.sort((a,b)=>b.points-a.points).map(t => (
            <tr key={t.id} style={{ borderBottom: "1px solid #ccc" }}>
              <td style={{ padding: 8 }}>{t.name}</td>
              <td style={{ textAlign: "center" }}>{t.points}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h2>Fixtures</h2>
      <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 20 }}>
        <thead>
          <tr style={{ backgroundColor: "#ffaa00", color: "white" }}>
            <th>Team 1</th>
            <th>Team 2</th>
            <th>Score</th>
            <th>Winner</th>
          </tr>
        </thead>
        <tbody>
          {matches.map(m => (
            <tr key={m.id} style={{ borderBottom: "1px solid #ccc" }}>
              <td>{m.team1}</td>
              <td>{m.team2}</td>
              <td>{m.score || "—"}</td>
              <td>{m.winner || "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h2>Player Ratings</h2>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ backgroundColor: "#ffaa00", color: "white" }}>
            <th>Player</th>
            <th>Average Rating</th>
          </tr>
        </thead>
        <tbody>
          {teams.flatMap(t => t.players).map(player => (
            <tr key={player} style={{ borderBottom: "1px solid #ccc" }}>
              <td style={{ padding: 8 }}>{player}</td>
              <td>{getPlayerRatings(player)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {adminMode && (
        <div style={{ marginTop: 20 }}>
          <button onClick={clearLastMatch} style={{ padding: 10, marginRight: 10, borderRadius: 6, backgroundColor: "#0077cc", color: "white", border: "none" }}>Clear Last Match</button>
          <button onClick={resetAllData} style={{ padding: 10, borderRadius: 6, backgroundColor: "#cc0000", color: "white", border: "none" }}>Reset All Data</button>
        </div>
      )}

      <p style={{ marginTop: 40, fontSize: 12, color: "#555" }}>Designed and created by DannyRush Apps</p>
    </div>
  );
}
