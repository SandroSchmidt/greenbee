# Green Bee: Datenstruktur und Speicherkonzept

## Überblick

Das Projekt speichert die fachlichen Spieldaten zentral in **Firebase Realtime Database** und nutzt **`localStorage`** im Browser nur für kleine lokale Zustände.

Aktuell gibt es zwei Speicherarten:

- **Firebase Realtime Database** für globale Einstellungen, Welten, Schüler und Spielstände
- **Browser `localStorage`** für Theme-Umschaltung und in einem separaten Django-Spielteil für einen lokalen `gameState`

## Verwendete Speicherorte

### 1. Firebase Realtime Database

Die zentrale Struktur ist aktuell sinngemäß:

```text
globalsettings/
  groups: ["youth", "families", "seniors"]
  objects/
    <objectKey>/
      price: number
      income: number
      color: string
      suitability: [number, number, number]
      icon: string
  marketingChannels/
    <channelKey>/
      maxSpend: number
      effectiveness: [number, number, number]
  baseRules/
    suitabilitySaturationK: number

worlds/
  <worldId>/
    worldsettings/
      name: string
      startBudget: number
      maxTurns: number
      gridSize: number
      tickets: [number, number, number]
      objectsEnabled/
        <objectKey>: boolean
      marketingEnabled/
        <channelKey>: boolean
      students/
        <playerId>/
          name: string
          code: string
    players/
      <playerId>/
        name: string
        lastUpdate: number
        gameState/
          turn: number
          budget: number
          board/
            <tileId>: <objectKey>
          budgetHistory: number[]
          incomeHistory: number[]
          ticketSales: [number, number, number]
          marketingBudgetHistory: number[]
          marketingPlan/
            <channelKey>: number
          interest: [number, number, number]
          lastUpdate: number
```

### 2. Browser `localStorage`

Es werden aktuell diese Keys genutzt:

- `gb-theme`: speichert nur `"light"` oder `"dark"`
- `gameState`: nur im Django-Teil unter `src/backend/greenbee_django/static/js/game.js`

Wichtig: Der eigentliche Hauptspielstand in `index.html` liegt **nicht** im `localStorage`, sondern in Firebase unter `worlds/<worldId>/players/<playerId>/gameState`.

## Fachliche Aufteilung der Daten

### `globalsettings`

Globale, weltübergreifende Konfiguration:

- Zielgruppen
- baubare Objekte
- Marketing-Kanäle
- Basisregeln für die Berechnung

Diese Daten werden in der Admin-Seite `universalsettings.html` gepflegt.

### `worlds/<worldId>/worldsettings`

Welt-spezifische Konfiguration:

- Name der Welt
- Startbudget
- Rundenzahl
- Spielfeldgröße
- verfügbare Tickets je Zielgruppe
- aktivierte Objekte
- aktivierte Marketing-Kanäle
- Schülerliste inklusive Zugangscode

Diese Daten werden in `worldsettings.html` gepflegt.

### `worlds/<worldId>/players/<playerId>/gameState`

Individueller Spielstand pro Spieler:

- aktuelles Budget
- aktuelle Runde
- belegte Felder auf dem Spielfeld
- Ticketverkäufe
- Budget- und Einkommenshistorie
- Marketing-Plan
- kumuliertes Interesse

Diese Daten werden während des Spiels in `index.html` geladen und bei Änderungen vollständig zurück nach Firebase geschrieben.

## Aktuelles Speicherkonzept

Das Projekt arbeitet im Kern wie folgt:

1. Beim Start lädt das Frontend globale Einstellungen und Welt-Einstellungen aus Firebase.
2. Der Spieler wird über `worldsettings.students` ausgewählt und per einfachem Code geprüft.
3. Der Spielstand wird unter `players/<playerId>/gameState` geladen oder neu angelegt.
4. Bei Aktionen wie Bauen, Verkaufen oder Rundenwechsel wird der komplette `gameState` wieder in Firebase gespeichert.

## Auffälligkeiten im aktuellen Stand

- Firebase-Konfiguration ist direkt im Frontend in `functions.js` hinterlegt.
- Schülercodes werden im Klartext in der Realtime Database gespeichert.
- Der Spielstand wird oft als kompletter Block mit `set(...)` gespeichert statt nur geänderte Felder zu aktualisieren.
- Es wird Firebase Realtime Database verwendet, obwohl viele Daten eher dokumentenartig und selten geändert sind.
- Im Firebase-Config ist auch ein Storage-Bucket eingetragen, im gezeigten Code wird Firebase Storage aber nicht aktiv genutzt.

## Optimierungshinweise

### Schnell umsetzbar

- **Nur Teilbereiche speichern**:
  Statt den kompletten `gameState` nach jeder Aktion mit `set(...)` zu schreiben, besser gezielt `update(...)` auf `budget`, `board`, `turn` oder `marketingPlan` verwenden. Das reduziert Schreibvolumen.
- **Writes bündeln**:
  Während einer Spielaktion mehrere Änderungen erst lokal sammeln und anschließend einmal speichern.
- **Unnötige Daten vermeiden**:
  Historien nur speichern, wenn sie wirklich im UI benötigt werden. Besonders `budgetHistory`, `incomeHistory` und `marketingBudgetHistory` wachsen mit jeder Runde.

### Für Kostenreduktion sinnvoll

- **Welt-Stammdaten cachen**:
  `globalsettings` und `worldsettings` ändern sich selten. Diese Daten können lokal zwischengespeichert und nur bei Admin-Änderungen neu geladen werden.
- **Spielstand kleiner schneiden**:
  `board` nur mit belegten Feldern speichern ist bereits gut. Das sollte beibehalten werden.
- **Übersichtsseite optimieren**:
  `overview.html` lädt alle Spieler einer Welt. Bei vielen Spielern kann das teuer werden. Besser nur benötigte Felder laden oder eine kompakte Summary pro Spieler separat ablegen.

### Strukturell sinnvoll

- **Authentifizierung sauber lösen**:
  Statt Codes im Klartext besser Firebase Auth oder mindestens gehashte Codes plus Security Rules verwenden.
- **Security Rules konsequent absichern**:
  Spieler sollten nur ihren eigenen Spielstand lesen und schreiben dürfen.
- **Firestore prüfen**:
  Wenn das Projekt eher dokumentenbasiert bleibt, kann Firestore langfristig wartbarer sein. Wenn viele kleine Echtzeit-Updates gebraucht werden, kann Realtime Database weiter sinnvoll sein.
- **Server-seitige Logik auslagern**:
  Berechnungen oder Validierungen, die nicht manipulierbar sein sollen, sollten mittelfristig nicht nur im Browser laufen.

## Empfehlung

Wenn kurzfristig nur Kosten und Wartbarkeit verbessert werden sollen, würde ich zuerst diese zwei Punkte umsetzen:

1. Schreibzugriffe von `set(...)` auf gezielte `update(...)`-Operationen umstellen
2. Schülercodes und Firebase-Zugriffe mit Security Rules absichern

Das bringt den größten Nutzen bei wenig Umbau.
