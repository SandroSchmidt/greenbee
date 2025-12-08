
// functions.js – zentrale Firebase- und Daten-API für Green Bee
// Hinweis: Erwartet, dass Firebase bereits initialisiert wurde (firebase.initializeApp(...)).
// Keine Hardcodierung von Settings – alles kommt aus der Realtime Database.
const firebaseConfig = {
  apiKey: "AIzaSyCGa46LhhIxWnAm4D1crESWLEqpe5PvdkE",
  authDomain: "greenbee-66232.firebaseapp.com",
  databaseURL: "https://greenbee-66232-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "greenbee-66232",
  storageBucket: "greenbee-66232.firebasestorage.app",
  messagingSenderId: "226719701239",
  appId: "1:226719701239:web:3bf65092b139e52ef71bf2"
};
firebase.initializeApp(firebaseConfig);
console.log("Firebase app initialised")

if (typeof firebase === "undefined") {
  throw new Error("Firebase SDK not loaded. Please include firebase-app.js and firebase-database.js before functions.js");
}

try {
  firebase.app();
} catch (e) {
  console.warn("Firebase app is not initialised yet. Make sure to call firebase.initializeApp(...) before using functions.js");
}

const db = firebase.database();
const globalRef = db.ref("globalsettings");
const worldsRef = db.ref("worlds");

let globalsettingsCache = null;
let worldsettingsCache = {};

// ===== Helper =====
function ensureArray(a) {
  if (Array.isArray(a)) return a;
  if (a == null) return [];
  return [a];
}

// ===== Global Settings (Admin & Game) ============================

async function loadGlobalSettings() {
  if (globalsettingsCache) return globalsettingsCache;
  const snap = await globalRef.once("value");
  const val = snap.val() || {};

  if (!val.groups) {
    // Minimal-Default: kann später per Admin-UI überschrieben werden
    val.groups = ["youth", "families", "seniors"];
  }
  if (!val.objects) {
    val.objects = {}; // Admin legt alles an
  }
  if (!val.baseRules) {
    val.baseRules = {}; // optional, kann leer sein
  }

  globalsettingsCache = val;
  return val;
}

async function saveGlobalSettings(newSettings) {
  globalsettingsCache = newSettings;
  await globalRef.set(newSettings);
}

// ===== World Settings (pro Welt) =================================

async function listWorlds() {
  const snap = await worldsRef.once("value");
  const val = snap.val() || {};
  return Object.keys(val);
}

async function loadWorldSettings(worldId) {
  if (!worldId) throw new Error("loadWorldSettings: worldId fehlt");
  if (worldsettingsCache[worldId]) return worldsettingsCache[worldId];

  const snap = await worldsRef.child(worldId).child("worldsettings").once("value");
  const ws = snap.val() || {};

  // Nichts weiter hardcoden – Lehrer/Admin füllen alles über UI.
  // Wir stellen nur sicher, dass einige Strukturen existieren.
  if (!ws.tickets) ws.tickets = {};
  if (!ws.students) ws.students = {};
  if (!ws.objectsEnabled) ws.objectsEnabled = {};

  worldsettingsCache[worldId] = ws;
  return ws;
}

async function saveWorldSettings(worldId, ws) {
  if (!worldId) throw new Error("saveWorldSettings: worldId fehlt");
  worldsettingsCache[worldId] = ws;
  await worldsRef.child(worldId).child("worldsettings").set(ws);
}

// ===== Spieler / GameState =======================================

async function loadPlayerList(worldId) {
  if (!worldId) throw new Error("loadPlayerList: worldId fehlt");
  const snap = await worldsRef.child(worldId).child("players").once("value");
  return snap.val() || {};
}

async function ensurePlayer(worldId, playerId, displayName) {
  if (!worldId || !playerId) throw new Error("ensurePlayer: worldId oder playerId fehlt");
  const playerRef = worldsRef.child(worldId).child("players").child(playerId);
  const snap = await playerRef.once("value");
  const val = snap.val();

  if (!val) {
    const payload = {
      name: displayName || playerId,
      lastUpdate: Date.now()
    };
    await playerRef.set(payload);
    return payload;
  }
  return val;
}

async function loadGameState(worldId, playerId) {
  if (!worldId || !playerId) throw new Error("loadGameState: worldId oder playerId fehlt");
  const ref = worldsRef.child(worldId).child("players").child(playerId).child("gameState");
  const snap = await ref.once("value");
  return snap.val() || null;
}

async function saveGameState(worldId, playerId, gameState) {
  if (!worldId || !playerId) throw new Error("saveGameState: worldId oder playerId fehlt");
  const ref = worldsRef.child(worldId).child("players").child(playerId).child("gameState");
  const payload = Object.assign({}, gameState, { lastUpdate: Date.now() });
  await ref.set(payload);
}

// ===== einfache Getter für gecachte Settings =====================

function getCachedGlobalSettings() {
  return globalsettingsCache;
}

function getCachedWorldSettings(worldId) {
  return worldsettingsCache[worldId] || null;
}

console.log("functions.js loaded");
