\# Poker Preflop Trainer



\## Project Overview

A React-based flashcard trainer for memorizing poker preflop ranges. The app quizzes users on correct actions (raise, 3bet, call, fold) for specific situations and hands.



\## Tech Stack

\- React with Vite

\- Plain CSS (no frameworks)

\- Vitest for testing

\- No backend required



\## Core Features



\### 1. Situation Selection

User can select which scenario to practice:

\- \*\*Open Ranges\*\*: EP Open, HJ Open, BTN Open, BTN vs Limp, BTN vs 2 Fish

\- \*\*Vs Open\*\*: HJ vs EP Open, BTN vs Aggro Open, BTN vs Passive Open, BB vs Passive Open, BB vs Aggro Open, BTN Squeeze, EP vs Pro Open, BTN vs CO Pro Open

\- \*\*Vs 3bet\*\*: OOP vs Passive 3bet, OOP vs Aggro 3bet, IP vs Passive 3bet, IP vs Aggro 3bet

\- \*\*Cold 4bet\*\*: Cold 4bet vs Tight, Cold 4bet vs Aggro

\- \*\*Vs 4bet\*\*: Vs Passive 4bet, Vs Aggro 4bet



\### 2. Quiz Mode

\- Show a random hand (e.g., "AJs", "87s", "KQo")

\- Show the current situation

\- User selects action: Raise/3bet/4bet/5bet, Call, or Fold

\- Show if correct or incorrect

\- Track score: correct / total



\### 3. Hand Display

\- Large, readable format

\- Suit colors: spades/clubs black, hearts/diamonds red



\## Range Data



```json

{

&nbsp; "open\_ranges": {

&nbsp;   "ep\_open": \["AA", "KK", "QQ", "JJ", "TT", "99", "88", "77", "AKs", "AQs", "AJs", "ATs", "A9s", "A5s", "A4s", "A3s", "AKo", "AQo", "KQs", "KJs", "KTs", "K9s", "QJs", "QTs", "Q9s", "JTs", "J9s", "T9s", "98s", "87s", "76s", "65s"],

&nbsp;   "hj\_open": \["AA", "KK", "QQ", "JJ", "TT", "99", "88", "77", "55", "44", "AKs", "AQs", "AJs", "ATs", "A9s", "A8s", "A7s", "A6s", "A5s", "A4s", "A3s", "A2s", "AKo", "AQo", "AJo", "ATo", "KQs", "KJs", "KTs", "K9s", "K8s", "K7s", "KQo", "KJo", "QJs", "QTs", "Q9s", "Q8s", "JTs", "J9s", "J8s", "T9s", "T8s", "98s", "87s", "76s", "65s", "54s"],

&nbsp;   "btn\_open": \["AA", "KK", "QQ", "JJ", "TT", "99", "88", "77", "66", "55", "44", "33", "22", "AKs", "AQs", "AJs", "ATs", "A9s", "A8s", "A7s", "A6s", "A5s", "A4s", "A3s", "A2s", "AKo", "AQo", "AJo", "ATo", "A9o", "A8o", "A7o", "A6o", "A5o", "A4o", "KQs", "KJs", "KTs", "K9s", "K8s", "K7s", "K6s", "K5s", "K4s", "K3s", "K2s", "KQo", "KTo", "K9o", "QJs", "QTs", "Q9s", "Q8s", "Q7s", "Q6s", "Q5s", "Q4s", "Q3s", "Q2s", "QJo", "QTo", "Q9o", "JTs", "J9s", "J8s", "J7s", "J6s", "J5s", "JTo", "T9s", "T8s", "T7s", "T6s", "T9o", "98s", "97s", "96s", "98o", "87s", "86s", "85s", "76s", "75s", "74s", "65s", "64s", "54s", "53s", "43s"],

&nbsp;   "btn\_vs\_limp": \["AA", "KK", "QQ", "JJ", "TT", "99", "88", "77", "66", "55", "44", "33", "22", "AKs", "AQs", "AJs", "ATs", "A9s", "A8s", "A7s", "A6s", "A5s", "A4s", "A3s", "A2s", "AKo", "AQo", "AJo", "ATo", "KQs", "KJs", "KTs", "K9s", "K8s", "K7s", "K6s", "K5s", "K4s", "K3s", "K2s", "KQo", "QJs", "QTs", "Q9s", "Q8s", "JTs", "J9s", "J8s", "T9s", "T8s", "98s", "97s", "87s", "86s", "76s", "75s", "65s", "54s"],

&nbsp;   "btn\_vs\_2\_fish": \["AA", "KK", "QQ", "JJ", "TT", "99", "88", "77", "66", "55", "44", "33", "22", "AKs", "AQs", "AJs", "ATs", "A9s", "A8s", "A7s", "A6s", "A5s", "A4s", "A3s", "A2s", "AKo", "AQo", "AJo", "ATo", "A9o", "A8o", "A7o", "A6o", "A5o", "A4o", "A3o", "A2o", "KQs", "KJs", "KTs", "K9s", "K8s", "K7s", "K6s", "K5s", "K4s", "K3s", "K2s", "KQo", "KJo", "KTo", "K9o", "K8o", "K7o", "K6o", "K5o", "K4o", "K3o", "K2o", "QJs", "QTs", "Q9s", "Q8s", "Q7s", "Q6s", "Q5s", "Q4s", "Q3s", "Q2s", "QJo", "QTo", "Q9o", "Q8o", "Q7o", "Q6o", "Q5o", "Q4o", "Q3o", "JTs", "J9s", "J8s", "J7s", "J6s", "J5s", "J4s", "J3s", "J2s", "JTo", "J9o", "J8o", "J7o", "J6o", "J5o", "T9s", "T8s", "T7s", "T6s", "T5s", "T4s", "T3s", "T2s", "T9o", "T8o", "T7o", "T6o", "98s", "97s", "96s", "95s", "94s", "93s", "92s", "98o", "97o", "96o", "87s", "86s", "85s", "84s", "83s", "82s", "87o", "76s", "75s", "74s", "73s", "72s", "76o", "75o", "65s", "64s", "63s", "62s", "65o", "64o", "54s", "53s", "52s", "54o", "53o", "43s", "43o", "32s"]

&nbsp; },

&nbsp; "vs\_open\_ranges": {

&nbsp;   "hj\_vs\_ep\_open": {

&nbsp;     "3bet": \["AA", "KK", "QQ", "JJ", "TT", "99", "88", "AKs", "AQs", "AJs", "ATs", "A9s", "A5s", "A4s", "A3s", "AKo", "AQo", "KQs", "KJs", "KTs", "QJs", "QTs", "JTs"]

&nbsp;   },

&nbsp;   "btn\_vs\_aggro\_open": {

&nbsp;     "3bet": \["AA", "AKs", "AQs", "AJs", "ATs", "A9s", "A8s", "A3s", "A2s", "AKo", "AQo", "AJo", "ATo", "KK", "KQs", "KJs", "KTs", "K9s", "K8s", "KQo", "KJo", "KTo", "QQ", "QJs", "QTs", "JJ", "JTs", "J9s", "TT", "T9s", "66", "33"],

&nbsp;     "call": \["A7s", "A6s", "A5s", "A4s", "K6s", "Q9s", "J8s", "T8s", "99", "98s", "88", "87s", "77", "76s", "65s", "55", "54s", "44", "22"]

&nbsp;   },

&nbsp;   "btn\_vs\_passive\_open": {

&nbsp;     "3bet": \["AA", "AJs", "AKo", "KJs", "QQ", "JJ"],

&nbsp;     "call": \["AKs", "AQs", "ATs", "A5s", "A4s", "KK", "KQs", "KTs", "QJs", "TT", "T9s", "99", "88", "77", "66", "65s", "55", "54s", "44", "33", "22"]

&nbsp;   },

&nbsp;   "bb\_vs\_passive\_open": {

&nbsp;     "3bet": \["AA", "AJs", "AKo", "KK", "AQo", "QQ", "JJ", "TT"],

&nbsp;     "call": \["AKs", "AQs", "ATs", "A9s", "A5s", "KQs", "KJs", "KTs", "QJs", "QTs", "Q9s", "JTs", "J9s", "T9s", "99", "98s", "88", "87s", "86s", "77", "76s", "75s", "66", "65s", "64s", "55", "54s", "53s", "44", "43s", "33", "22"]

&nbsp;   },

&nbsp;   "bb\_vs\_aggro\_open": {

&nbsp;     "3bet": \["AA", "AQs", "ATs", "A7s", "A4s", "AKo", "KK", "KQs", "K9s", "K5s", "K3s", "KQo", "KJo", "QQ", "QTs", "Q8s", "Q6s", "Q4s", "AJo", "QJo", "JJ", "J9s", "J7s", "JTo", "ATo", "KTo", "QTo", "TT", "T8s", "T6s", "A9o", "J9o", "T9o", "99", "97s", "98o", "77", "75s", "66", "64s", "55", "53s", "44", "42s", "33", "22"],

&nbsp;     "call": \["AKs", "AJs", "A9s", "A8s", "A6s", "A5s", "A3s", "A2s", "KJs", "KTs", "K8s", "K7s", "K6s", "K4s", "K2s", "KTo", "QJs", "Q9s", "Q7s", "Q5s", "JTs", "J8s", "J6s", "T9s", "T7s", "88", "98s", "96s", "87s", "86s", "85s", "76s", "74s", "65s", "63s", "54s", "43s", "32s"]

&nbsp;   },

&nbsp;   "btn\_squeeze": {

&nbsp;     "3bet": \["AA", "AKs", "AQs", "AJs", "ATs", "A8s", "A7s", "A5s", "A3s", "A2s", "AKo", "AQo", "KK", "KQs", "KJs", "KTs", "K9s", "K8s", "KQo", "QQ", "QJs", "QTs", "AJo", "KJo", "JJ", "JTs", "J9s", "TT", "T9s", "99", "98s", "88", "87s", "66", "55", "44", "33", "22"],

&nbsp;     "call": \["A9s", "A6s", "A4s", "Q9s", "77", "76s", "65s"]

&nbsp;   },

&nbsp;   "ep\_vs\_pro\_open": {

&nbsp;     "3bet": \["AA", "AKs", "AJs", "ATs", "A5s", "AKo", "KK", "KQs", "KJs", "QQ", "QJs", "JJ"],

&nbsp;     "call": \["AQs", "JTs", "TT", "99", "88", "77"]

&nbsp;   },

&nbsp;   "btn\_vs\_co\_pro\_open": {

&nbsp;     "3bet": \["AA", "AKs", "AJs", "A9s", "A8s", "A7s", "A6s", "A5s", "A4s", "A3s", "A2s", "AKo", "AQo", "AJo", "KK", "KQs", "KJs", "KTs", "K9s", "KQo", "QQ", "QJs", "QTs", "Q9s", "JJ", "JTs", "J9s", "TT", "T9s", "99", "98s", "87s"],

&nbsp;     "call": \["AQs", "ATs", "88", "77", "76s", "66", "65s", "55", "44", "33", "22"]

&nbsp;   }

&nbsp; },

&nbsp; "vs\_3bet\_ranges": {

&nbsp;   "oop\_vs\_passive\_3bet": {

&nbsp;     "4bet": \["AA", "AKo", "QQ"],

&nbsp;     "call": \["AKs", "AQs", "AJs", "ATs", "A9s", "KK", "KQs", "KJs", "KTs", "QJs", "QTs", "Q9s", "JJ", "JTs", "J9s", "TT", "T9s", "T8s", "99", "98s", "88", "87s", "77", "76s", "66", "65s", "55", "54s", "44", "43s", "33", "22"]

&nbsp;   },

&nbsp;   "oop\_vs\_aggro\_3bet": {

&nbsp;     "4bet": \["AA", "AJs", "ATs", "A5s", "AKo", "AQo", "KK", "KQo", "QQ", "JJ", "TT"],

&nbsp;     "call": \["AKs", "AQs", "A9s", "KQs", "KJs", "KTs", "QJs", "QTs", "Q9s", "JTs", "J9s", "T9s", "T8s", "99", "98s", "88", "87s", "77", "76s", "66", "65s", "55", "54s", "44", "43s", "33", "22"]

&nbsp;   },

&nbsp;   "ip\_vs\_passive\_3bet": {

&nbsp;     "4bet": \["AA", "AKs", "ATs", "A5s", "AKo", "KK", "KTs", "87s"],

&nbsp;     "call": \["AQs", "AJs", "A9s", "KQs", "KJs", "QQ", "QJs", "QTs", "Q9s", "JJ", "JTs", "J9s", "TT", "T9s", "T8s", "99", "98s", "88", "77", "76s", "75s", "66", "65s", "64s", "55", "54s", "53s", "44", "43s", "33", "22"]

&nbsp;   },

&nbsp;   "ip\_vs\_aggro\_3bet": {

&nbsp;     "4bet": \["AKo", "A7s", "JJ", "87s"],

&nbsp;     "call": \["AA", "AKs", "AQs", "AJs", "ATs", "A9s", "A8s", "A6s", "A5s", "A4s", "A3s", "A2s", "KK", "KQs", "KJs", "KTs", "K9s", "K8s", "K7s", "K6s", "K5s", "K4s", "K3s", "AQo", "KQo", "QQ", "QJs", "QTs", "Q9s", "Q8s", "AJo", "KJo", "QJo", "JTs", "J9s", "J8s", "ATo", "TT", "T9s", "T8s", "T7s", "99", "98s", "97s", "96s", "88", "86s", "77", "76s", "75s", "66", "65s", "64s", "55", "54s", "53s", "44", "43s", "33", "22"]

&nbsp;   }

&nbsp; },

&nbsp; "cold\_4bet\_ranges": {

&nbsp;   "cold\_4bet\_vs\_tight": {

&nbsp;     "4bet": \["AA", "AKs", "AKo", "KK", "QQ", "JJ"]

&nbsp;   },

&nbsp;   "cold\_4bet\_vs\_aggro": {

&nbsp;     "4bet": \["AA", "AKs", "AQs", "AJs", "A5s", "AKo", "KK", "KQs", "KJs", "AQo", "QQ", "JJ", "TT"]

&nbsp;   }

&nbsp; },

&nbsp; "vs\_4bet\_ranges": {

&nbsp;   "vs\_passive\_4bet": {

&nbsp;     "5bet": \["AA", "AKo"],

&nbsp;     "call": \["AKs", "KK", "QQ", "JJ", "TT"]

&nbsp;   },

&nbsp;   "vs\_aggro\_4bet": {

&nbsp;     "5bet": \["AA", "AJs", "AKo", "QQ"],

&nbsp;     "call": \["AKs", "AQs", "KK", "JJ", "TT", "87s", "76s", "65s", "54s"]

&nbsp;   }

&nbsp; }

}

```



\## Game Logic



\### Determining Correct Action

1\. For \*\*open\_ranges\*\*: If hand is in array → "Raise", else → "Fold"

2\. For other ranges: If hand in "3bet"/"4bet"/"5bet" → that action; if in "call" → "Call"; else → "Fold"



\### Quiz Flow

1\. User selects situation category and scenario

2\. App shows random hand from all 169 possible hands

3\. User clicks action button

4\. App reveals correct/incorrect, shows correct action if wrong

5\. Update score, show next hand



\## UI Requirements



\- Dark theme (dark gray background, light text)

\- Large hand display

\- Clear action buttons (mobile-friendly)

\- Score display: "15/20 (75%) - Streak: 5"

\- Feedback: green for correct, red for incorrect

\- Auto-advance after 1.5 seconds



\## Testing



Create tests in `src/\_\_tests\_\_/` using Vitest:

1\. Range logic: AA in ep\_open → "Raise", 72o → "Fold"

2\. Hand generation: exactly 169 unique hands

3\. Component rendering



Add to vite.config.js:

```js

import { defineConfig } from 'vite'

import react from '@vitejs/plugin-react'



export default defineConfig({

&nbsp; plugins: \[react()],

&nbsp; test: {

&nbsp;   environment: 'jsdom',

&nbsp;   globals: true,

&nbsp;   setupFiles: './src/setupTests.js',

&nbsp; },

})

```



Create src/setupTests.js:

```js

import '@testing-library/jest-dom'

```



Add to package.json scripts:

```json

"test": "vitest"

```



\## Definition of Done



1\. All tests pass (`npm test`)

2\. App runs without errors (`npm run dev`)

3\. All situations selectable and working

4\. Score tracking works

5\. Visually clean and usable



\## Autonomous Instructions



When running autonomously:

1\. Write tests FIRST

2\. Implement features to pass tests

3\. Run `npm test` after each change

4\. Commit after each working feature

5\. Keep iterating until all tests pass



Do not ask questions. Make reasonable decisions.

