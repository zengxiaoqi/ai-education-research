# AI Education MVP Web

## Run

1. `cp .env.example .env`
2. `npm install`
3. `npx prisma generate`
4. `npx prisma db push`
5. `node prisma/seed.js`
6. `npm run dev`

## Demo accounts
- teacher@example.com / role teacher
- student@example.com / role student

## Implemented
- Demo login + role guard
- Teacher: dashboard / classes / new assignment / review queue / insights
- Student: home / answer / result
- APIs: classes / assignments / submissions / diagnosis / review queue
