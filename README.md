# Stickman Heist

Stickman Heist is a browser-based adventure game where players guide Alex, a stickman thief, through seven challenging stages to steal a diamond. Solve puzzles, outsmart guards, discover secret clues, and complete the heist with only three lives.

## Features

- Seven challenging stages with different puzzles and mini-games.
- Interactive gameplay featuring guards, traps, doors, and a diamond vault.
- Randomized challenges for a different experience on each run.
- Secret code clues hidden throughout the game.
- Three lives to complete the heist.
- User authentication with signup, login, and logout.
- Score tracking for registered players.
- Leaderboard displaying top players, best scores, and total plays.
- Character animations, visual effects, and background music.

## Tech Stack

- HTML, CSS, JavaScript
- Node.js and Express.js
- EJS
- MongoDB and Mongoose
- Passport.js
- Express Session

## Routes

| Method | Route | Description |
|---|---|---|
| GET | `/` | Display the home page |
| GET | `/signup` | Display the signup page |
| POST | `/signup` | Register a new user |
| GET | `/login` | Display the login page |
| POST | `/login` | Authenticate the user |
| GET | `/logout` | Log out the current user |
| GET | `/game` | Display the game |
| POST | `/score` | Save the player's score |
| GET | `/leaderboard` | Display the leaderboard |

## How to Play

1. Start the heist and guide Alex through seven stages.
2. Solve puzzles and complete challenges to progress.
3. Find secret notes and collect clues to discover the vault code.
4. Avoid mistakes and manage your three lives.
5. Reach the diamond to complete the heist.
6. Log in to save your scores and compete on the leaderboard.

Guests can play the game, but logging in is required to save scores.

## Future Improvements

- Add more levels, puzzles, and difficulty modes.
- Introduce achievements and personal best scores.
- Improve mobile controls and accessibility.
- Add new character animations and sound effects.

## Author

Developed by Akshat Chauhan.
