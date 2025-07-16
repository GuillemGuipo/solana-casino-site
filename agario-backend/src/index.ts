import WebSocket from 'ws';
import express from 'express';
import dotenv from 'dotenv';

dotenv.config();

const PORT = process.env.PORT ? Number(process.env.PORT) : 3001;
const FEE = process.env.WITHDRAW_FEE ? Number(process.env.WITHDRAW_FEE) : 0.1;
const app = express();
const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

app.get('/leaderboard', (_req, res) => {
  res.json(leaderboard);
});

const wss = new WebSocket.Server({ server });

interface Player {
  id: string;
  money: number;
  size: number;
  x: number;
  y: number;
  alive: boolean;
}

interface Score {
  id: string;
  money: number;
  size: number;
  time: number;
}

const players = new Map<string, Player>();
const pellets: { x: number; y: number; size: number }[] = [];
const leaderboard: Score[] = [];

function spawnPellet() {
  const pellet = {
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: 1,
  };
  pellets.push(pellet);
}

setInterval(spawnPellet, 2000);

function recordScore(player: Player) {
  leaderboard.push({
    id: player.id,
    money: player.money,
    size: player.size,
    time: Date.now(),
  });
  leaderboard.sort((a, b) => b.money - a.money);
  if (leaderboard.length > 10) leaderboard.length = 10;
}

function startSizeForDeposit(amount: number) {
  if (amount === 1) return 5;
  if (amount === 5) return 12;
  if (amount === 20) return 25;
  return 5;
}

function broadcast(data: any) {
  const str = JSON.stringify(data);
  wss.clients.forEach(c => {
    if (c.readyState === WebSocket.OPEN) c.send(str);
  });
}

wss.on('connection', ws => {
  let playerId: string | null = null;

  ws.on('message', msg => {
    const data = JSON.parse(msg.toString());
    if (data.type === 'JOIN') {
      const amount = data.amount;
      if (![1,5,20].includes(amount)) {
        ws.send(JSON.stringify({ type: 'ERROR', message: 'Invalid amount' }));
        return;
      }
      const id = data.id;
      playerId = id;
      const player: Player = {
        id,
        money: amount,
        size: startSizeForDeposit(amount),
        x: Math.random() * 100,
        y: Math.random() * 100,
        alive: true,
      };
      players.set(id, player);
      ws.send(JSON.stringify({ type: 'JOINED', player, leaderboard }));
      broadcast({ type: 'PLAYERS', players: Array.from(players.values()), leaderboard });
    } else if (data.type === 'MOVE' && playerId) {
      const player = players.get(playerId);
      if (!player || !player.alive) return;
      player.x = data.x;
      player.y = data.y;
      broadcast({ type: 'UPDATE', player, leaderboard });
      // check pellet collisions
      for (let i = pellets.length - 1; i >= 0; i--) {
        const p = pellets[i];
        const dx = player.x - p.x;
        const dy = player.y - p.y;
        if (Math.hypot(dx, dy) < player.size) {
          player.size += p.size;
          pellets.splice(i, 1);
        }
      }
      // check player collisions
      for (const other of players.values()) {
        if (other.id !== player.id && other.alive) {
          const dx = player.x - other.x;
          const dy = player.y - other.y;
          if (Math.hypot(dx, dy) < player.size - other.size / 2) {
            // player eats other
            player.size += other.size;
            player.money += other.money;
            other.alive = false;
            recordScore(other);
            broadcast({ type: 'DEAD', id: other.id, leaderboard });
          }
        }
      }
    } else if (data.type === 'WITHDRAW' && playerId) {
      const player = players.get(playerId);
      if (!player) return;
      const fee = player.money * FEE;
      const payout = player.money - fee;
      recordScore(player);
      ws.send(JSON.stringify({ type: 'WITHDRAWN', amount: payout, leaderboard }));
      players.delete(playerId);
      broadcast({ type: 'LEFT', id: playerId, leaderboard });
    }
  });

  ws.on('close', () => {
    if (playerId && players.has(playerId)) {
      const player = players.get(playerId)!;
      if (player.alive) {
        recordScore(player);
      }
      players.delete(playerId);
      broadcast({ type: 'LEFT', id: playerId, leaderboard });
    }
  });
});
