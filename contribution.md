Contributing to Green Bee

Thank you for contributing to Green Bee.

This project is actively evolving, so clarity and consistency are more important than perfection.
Please follow the guidelines below to keep development efficient and stable.

General Principles
Keep changes small and focused
Do not break existing functionality
Prefer readability over cleverness
When in doubt: ask before changing core logic
Getting Started
Clone the repository
git clone https://github.com/SandroSchmidt/greenbee.git
Run a local server (required)
npx serve
Open in browser
http://localhost:3000
Workflow
1. Create a Branch

Always create a new branch for your work:

git checkout -b feature/short-description

Examples:

feature/ui-improvements
fix/firebase-write-bug
refactor/chart-rendering
2. Work on a Single Task

Each branch should solve one problem only.

Bad:

UI + Firebase + refactor in one PR

Good:

"Fix ticket calculation bug"
3. Commit Style

Use clear, short English commit messages:

fix: correct ticket calculation
feat: add marketing slider
refactor: split chart rendering logic
4. Pull Request

Before merging:

Create a Pull Request
Add a short description:
What was done
Why it was needed
Screenshots for UI changes are highly recommended
Code Guidelines
Structure
Keep logic simple and explicit
Avoid unnecessary abstraction
Prefer plain functions over complex patterns
Naming

Use clear names:

gameState ✔
calculateTicketSales() ✔
x1, tmpData ✘
Comments

Add comments only where needed:

complex logic
calculations
Firebase interactions

Example:

// Calculate ticket sales based on current suitability and remaining turns
Firebase Rules

Be careful when working with Firebase.

Important:
Do NOT change the data structure without discussion
Avoid full writes like:
set(gameState)

Prefer:

update({
  budget: newBudget
})
Security
Do not expose sensitive data
Do not commit credentials
Assume current setup is not production-safe
UI Changes
Keep layout consistent across all pages
Test:
index.html
overview.html
worldsettings.html
Avoid breaking responsiveness
What NOT to Do
Do not refactor large parts of the code without alignment
Do not introduce new frameworks
Do not change Firebase structure casually
Do not mix multiple concerns in one PR
Good First Tasks

If you're new, start with:

UI improvements
Bug fixes
Code cleanup (small scope)
Comments and documentation
Performance optimizations in rendering
Questions & Communication

If something is unclear:

Open an Issue
Or ask directly before implementing
Goal

The goal is not perfect code —
the goal is a working, understandable system that can evolve quickly.
