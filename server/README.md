# NeuralQuiz Backend

The backend is an Express API with a file-backed JSON database at `server/data/database.json`.
It is seeded from `server/data/seed.js` the first time the server starts.

## Run

```bash
npm run server
```

The API listens on `http://localhost:4000` by default. Set `PORT` to use a different port.

## Main Endpoints

- `GET /api/health`
- `GET /api/bootstrap`
- `GET /api/auth/password-policy?password=Example%231234`
- `POST /api/auth/password/signup`
- `POST /api/auth/password/signin`
- `POST /api/auth/google`
- `POST /api/auth/phone/request-otp`
- `POST /api/auth/phone/verify-otp`
- `GET /api/domains`
- `GET /api/questions`
- `GET /api/questions/duplicates`
- `GET /api/quiz/questions?category=Artificial%20Intelligence&limit=10`
- `POST /api/questions`
- `PUT /api/questions/:id`
- `DELETE /api/questions/:id`
- `GET /api/settings`
- `PUT /api/settings`
- `GET /api/attempts`
- `POST /api/attempts`
- `GET /api/leaderboard`
- `GET /api/stats`
- `GET /api/users/:username/progress`
- `GET /api/users/:username/recommendations`
- `GET /api/users/:username/difficulty`

## Authentication

Password sign-up validates all required strength rules: minimum length,
uppercase, lowercase, number, and symbol. `GET /api/auth/password-policy`
returns real-time strength metadata (`weak`, `medium`, `strong`) for UI meters.

Phone authentication uses a 6-digit OTP with a 10-minute expiry. In development
the response includes `devOtp` so local testing works without an SMS provider;
production responses omit the code.

Google authentication is exposed as a profile exchange endpoint for a frontend
Google Identity integration. Send the verified Google profile fields
(`email`, `googleId`, `name`, `avatarUrl`) to `/api/auth/google` to create or
update the local user record.

## Smart Learning

The progress endpoints analyze stored attempts per user. When the latest score
falls below `settings.recommendationThreshold`, the API returns weak areas,
targeted study prompts, recommended exercises, and a performance-adjusted next
difficulty. Question-bank duplicate detection uses normalized question text and
options to find repeated entries.

## Attempt Payload

Post answered quiz sessions to `/api/attempts`. The server recalculates the score
from stored answers.

```json
{
  "username": "Ada",
  "mode": "standard",
  "duration": 128,
  "hintsUsed": 1,
  "questions": [
    {
      "id": "q1",
      "answers": [2]
    }
  ]
}
```
