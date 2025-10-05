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
        const playerRatings = ratings[player] || [];
        return playerRatings.map((r, i) => {
          const match = matches.find(m => m.id === r.matchId);
          return (
            <tr key={player + '-' + i}>
              <td>{player}</td>
              <td>{match ? `${match.team1} vs ${match.team2}` : 'N/A'}</td>
              <td>{r.value}</td>
              <td>
                {(
                  playerRatings.reduce((sum, x) => sum + x.value, 0) /
                  playerRatings.length
                ).toFixed(1)}
              </td>
            </tr>
          );
        });
      })}
    </tbody>
  </table>
  {admin && <p>Rate players in the Record Match section</p>}
</div>
