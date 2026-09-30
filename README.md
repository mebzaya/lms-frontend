# lms-front

React (JS) frontend for the LMS project. Talks to the `lms` Laravel API over
JWT bearer authentication.

## Stack

- React 19 + Vite
- react-router-dom for routing
- axios for API calls
- JWT auth (via `tymon/jwt-auth` on the `lms` backend)

## Getting started

```bash
npm install
cp .env.example .env   # adjust VITE_API_URL if the API isn't at http://localhost/api
npm run dev
```

The app runs at `http://localhost:5173` by default.

## Environment variables

| Variable        | Description                          | Default                  |
| --------------- | ------------------------------------- | ------------------------ |
| `VITE_API_URL`  | Base URL of the `lms` API             | `http://localhost/api`   |

## Backend requirements

The `lms` Laravel app must have `CORS_ALLOWED_ORIGINS` in its `.env` include
this app's dev origin (`http://localhost:5173` by default) so the browser is
allowed to call the API.

## Auth flow

- `POST /auth/register` and `POST /auth/login` return `{ user, access_token, token_type, expires_in }`.
- The access token is stored in `localStorage` and attached as
  `Authorization: Bearer <token>` to every request (see `src/api/client.js`).
- `GET /auth/me` hydrates the session on page load/refresh.
- `POST /auth/logout` invalidates the token server-side.
- A 401 response anywhere clears the stored token.

## Project structure

```
src/
  api/            axios client + auth API calls + token storage
  context/        AuthContext (login/register/logout/current user)
  components/     ProtectedRoute guard
  pages/          Landing (login/signup) and Dashboard
```

## Scripts

- `npm run dev` – start the dev server
- `npm run build` – production build
- `npm run preview` – preview the production build
- `npm run lint` – run oxlint
