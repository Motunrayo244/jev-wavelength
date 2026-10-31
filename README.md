# Wavelength

Multiplayer party game: a dilemma hits the airwaves, OpenAI answers **yes** or **no**, and everyone guesses the model’s **confidence** (0–100). Closest dial wins the round.

## Stack

- Next.js (App Router) + TypeScript + Tailwind CSS
- In-memory rooms with short polling (local / single-process demos)
- OpenAI Chat Completions for decision + confidence (`OPENAI_API_KEY`), with mock fallback

## Quick start

```bash
npm install
cp .env.example .env.local   # add OPENAI_API_KEY when you have one
npm run dev
```

Open [http://localhost:3000](http://localhost:3000), host a room, share the 4-letter code.

## How to play

1. Host creates a room and shares the code.
2. Friends join with the same code.
3. Host starts a round — a yes/no dilemma is shown; the model decides privately.
4. Everyone locks a confidence guess on the dial.
5. When all guesses are in (or the host reveals early), the target confidence is shown. Closest score(s) earn a point.

Without `OPENAI_API_KEY`, rounds still work using a deterministic mock confidence so you can try the flow offline.

## Notes

Room state lives in process memory. That is fine for local play and a single Node server; it will not survive restarts or multi-instance serverless deploys. A shared store (Redis, DB, etc.) would be the next step for production multiplayer.
