# SoleMar Backend

This is the backend for the SoleMar website, built with Node.js, Express, and SQLite.

## Features
- Local file-based SQLite database
- REST API endpoints for FAQ, reviews, bookings, and users
- CORS enabled for frontend integration

## Setup
1. Run `npm install` in the backend directory to install dependencies.
2. Start the server with `npm start`.
3. The API will be available at `http://localhost:3001`.

## Endpoints
- `GET /api/faq` — List all FAQ entries
- `GET /api/reviews` — List all reviews with usernames
- `GET /api/bookings` — List all bookings

You can expand this backend with POST/PUT/DELETE endpoints as needed.
