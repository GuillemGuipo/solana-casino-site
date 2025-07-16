# Agario Backend

Simple WebSocket server implementing minimal agar.io style rules.

## Features
- Players join by paying $1, $5, or $20. Larger deposits give a bigger starting cell.
- Cells grow by eating neutral pellets or other players.
- Withdraw at any time to receive your funds minus a 10% fee. Dying loses everything.
- Top 10 scores are kept in memory and available at `/leaderboard`.

Run in development:
```
npm run dev
```

Environment variables:
```
PORT=3001
WITHDRAW_FEE=0.1
```
