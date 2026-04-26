Green Bee

Green Bee is a browser-based strategy and simulation game for learning resource management, planning, and decision-making.
The application is built with HTML, JavaScript (D3.js) and uses Firebase Realtime Database as backend.

Overview

The game simulates a venue where different target groups (youth, families, seniors) buy tickets based on how attractive the environment is.

Players:

Build objects on a grid
Allocate marketing budget
Optimize their strategy over multiple turns
Try to sell all available tickets
Tech Stack
Frontend: HTML, CSS, JavaScript
Visualization: D3.js
Backend: Firebase Realtime Database
Storage: Firebase + browser localStorage (minimal)
Project Structure

Main files:

index.html
→ Main game interface
overview.html
→ Overview of all players (e.g. teacher/admin view)
universalsettings.html
→ Global configuration (objects, marketing, rules)
worldsettings.html
→ World setup (players, grid size, tickets, etc.)
Data Architecture

All core data is stored in Firebase Realtime Database.

Global Settings
globalsettings/
  groups
  objects
  marketingChannels
  baseRules

Defines:

target groups
available objects
marketing channels
base formulas
World Settings
worlds/<worldId>/worldsettings/

Defines:

world name
grid size
available tickets
enabled objects
enabled marketing channels
players (students)
Player Game State
worlds/<worldId>/players/<playerId>/gameState/

Contains:

current turn
budget
board state
ticket sales
marketing plan
history values
Game Logic (Simplified)

Each turn:

Player builds objects
Player sets marketing budget
Suitability per target group is calculated
Tickets are sold based on:
