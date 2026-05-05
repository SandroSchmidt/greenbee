function clamp01(v) {
  return Math.max(0, Math.min(1, Number(v || 0)));
}

function saturate(value, k) {
    const v = Math.max(0, Number(value || 0));
    const kk = Math.max(1, Number(k || 1));
    return v <= 0 ? 0 : v / (v + kk);
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, Number(value || 0)));
}

function randomBetween(min, max) {
  return Number(min || 0) + Math.random() * (Number(max || 0) - Number(min || 0));
}

function smoothstep(x) {
  x = clamp(x, 0, 1);
  return x * x * (3 - 2 * x);
}

function weightedRecentAverage(values, recencyDecay = 0.7) {
  if (!Array.isArray(values) || values.length === 0) return null;

  let weight = 1;
  let total = 0;
  let weightTotal = 0;

  // assumes values are ordered oldest -> newest
  for (let i = values.length - 1; i >= 0; i--) {
    const value = clamp(values[i], 0, 2.0);
    total += value * weight;
    weightTotal += weight;
    weight *= recencyDecay;
  }

  return weightTotal > 0 ? total / weightTotal : null;
}

function averageNestedNumbers(values) {
  if (!Array.isArray(values) || values.length === 0) return 0;

  let total = 0;
  let count = 0;

  values.forEach(item => {
    if (Array.isArray(item)) {
      item.forEach(v => {
        const n = Number(v);
        if (Number.isFinite(n)) {
          total += n;
          count += 1;
        }
      });
    } else {
      const n = Number(item);
      if (Number.isFinite(n)) {
        total += n;
        count += 1;
      }
    }
  });

  return count > 0 ? total / count : 0;
}

function getInfrastructureDivisor(worldSettings, gameState, { deterministic = false } = {}) {
  const population = Array.isArray(worldSettings && worldSettings.population)
    ? worldSettings.population
    : [0, 0, 0];

  const totalPopulation = population.reduce((sum, current) => sum + (Number(current) || 0), 0);
  const min = totalPopulation * 0.1;
  const max = totalPopulation * 0.2;
  const baseDivisor = deterministic ? (min + max) / 2 : randomBetween(min, max);

  // Soften optimal price pressure in the first five rounds.
  const turn = Number(gameState && gameState.turn || 0);
  return Math.max(1, baseDivisor / Math.max(1, 5 - turn));
}

function calculateTicketPriceReasonableness({
  ticketPrice,
  infrastructuralSpendings,
  infrastructureDivisor,

  previousPriceFactors = [],
  cumulativeSalesFactor = 0,

  minOptimalPrice = 1,

  // Higher = expensive tickets get punished faster.
  priceSteepness = 1.8,

  // How much previous rounds matter.
  historySensitivity = 0.25,

  // How much previous sales success matters.
  salesSensitivity = 0.15,
}) {
  const price = Math.max(0, Number(ticketPrice || 0));

  // Free tickets are maximally attractive, but still capped so the game cannot explode.
  if (price <= 0) return 2.0;

  const maxFactor = 2.0;
  const idealFactor = 1.0;
  const safeDivisor = Math.max(1, Number(infrastructureDivisor || 1));
  const optimalPrice = Math.max(
    Number(minOptimalPrice || 1),
    Math.max(0, Number(infrastructuralSpendings || 0)) / safeDivisor
  );

  const priceRatio = price / optimalPrice;

  // priceRatio = 1 => 1.0, cheaper approaches 2.0, expensive approaches 0.
  const curveA = maxFactor / idealFactor - 1;
  let infrastructureFactor = maxFactor / (1 + curveA * Math.pow(priceRatio, priceSteepness));
  infrastructureFactor = clamp(infrastructureFactor, 0, maxFactor);

  const previousAverage = weightedRecentAverage(previousPriceFactors);
  let historyAdjustedFactor = infrastructureFactor;

  if (previousAverage !== null) {
    const improvement = infrastructureFactor - previousAverage;
    const historyAdjustment = clamp(improvement * historySensitivity, -0.2, 0.2);
    historyAdjustedFactor += historyAdjustment;
  }

  historyAdjustedFactor = clamp(historyAdjustedFactor, 0, maxFactor);

  // Social proof / scarcity effect from previous sales.
  // 0% sold => slight penalty, 50% sold => neutral, 100% sold => boost.
  const salesMomentum = smoothstep(cumulativeSalesFactor);
  const salesMultiplier = 1 + (salesMomentum - 0.5) * 2 * salesSensitivity;

  return clamp(historyAdjustedFactor * salesMultiplier, 0, maxFactor);
}

function calculateTicketsAfterTurn(suitabilityVec, worldSettings, gameState, globalSettings, options = {}) {
  const opts = options || {};

  const groupPopulation = Array.isArray(worldSettings && worldSettings.population)
    ? worldSettings.population.map(v => Math.max(0, Number(v) || 0))
    : [0, 0, 0];

  const sold = Array.isArray(gameState && gameState.ticketSales)
    ? gameState.ticketSales.map(v => Math.max(0, Number(v) || 0))
    : [0, 0, 0];

  const marketingScore = Array.isArray(gameState && gameState.interest)
    ? gameState.interest.map(v => Math.max(0, Number(v) || 0))
    : [0, 0, 0];

  const infrastructureDivisor = Number(opts.infrastructureDivisor || getInfrastructureDivisor(worldSettings, gameState, {
    deterministic: !!opts.deterministic,
  }));

  const cumulativeSalesFactor = Number.isFinite(Number(opts.cumulativeSalesFactor))
    ? Number(opts.cumulativeSalesFactor)
    : averageNestedNumbers(gameState && gameState.cumulativeSalesFactorProgress);

  const priceReasonablenessFactor = calculateTicketPriceReasonableness({
    ticketPrice: gameState && gameState.ticketPrice,
    infrastructuralSpendings: gameState && gameState.infrastructuralSpendings,
    infrastructureDivisor,
    previousPriceFactors: Array.isArray(gameState && gameState.priceReasonablenessProgress)
      ? gameState.priceReasonablenessProgress
      : [],
    cumulativeSalesFactor,
    minOptimalPrice: 0.5,
  });

  const remaining = groupPopulation.map((total, i) => Math.max(0, total - (sold[i] || 0)));
  const rules = (globalSettings && globalSettings.baseRules) || {};
  const marketingK = Number(rules.marketingSaturationK || 50);
  const marketingWeight = Number(rules.ticketMarketingWeight ?? 0.40);
  const maxDemand = Number(rules.ticketMaxDemand ?? 1.0);

  const maxTurns = Number((worldSettings && worldSettings.maxTurns) || 10);
  const currentTurn = Number((gameState && gameState.turn) || 0);
  const turnsLeft = Math.max(1, maxTurns - currentTurn);

  const newSales = [0, 0, 0];
  const salesEfficiency = [0, 0, 0];

  for (let i = 0; i < 3; i++) {
    if (remaining[i] <= 0) {
      newSales[i] = 0;
      salesEfficiency[i] = 1;
      continue;
    }

    const marketingFactor = saturate(marketingScore[i], marketingK);


    const demand = clamp(marketingFactor * priceReasonablenessFactor, 0, maxDemand);

    const baseSalesPace = remaining[i] / turnsLeft;
    const tickets = Math.min(remaining[i], Math.round(baseSalesPace * demand));
    newSales[i] = tickets;
    salesEfficiency[i] = baseSalesPace > 0 ? clamp(tickets / baseSalesPace, 0, 1) : 1;
  }

  const ticketSalesRes = sold.map((oldVal, i) => oldVal + (newSales[i] || 0));
  const totalNewSales = newSales.reduce((acc, itm) => acc + itm, 0);
  const ticketIncome = totalNewSales * Math.max(0, Number(gameState && gameState.ticketPrice || 0));

 
  gameState.ticketSales = ticketSalesRes;
  

  return {
    ticketSalesRes,
    newSales,
    salesEfficiency,
    priceReasonablenessRes: priceReasonablenessFactor,
    cumulativeSalesFactor,
    ticketIncome,
    totalNewSales,
    infrastructureDivisor,
  };
}


/* VENDORS PROPOSALS LOGIC */

/*function generateProposals(gameState, worldSettings, globalSettings) {
    const totalTicketSales = gameState.ticketSales.reduce((acc, itm) => acc + itm, 0);
    const populationTotal = worldSettings.population.reduce((acc, itm) => acc + itm, 0);
    const totalSoldTicketsPercentage = totalTicketSales/populationTotal;
    //console.log("GAME STATE: ", gameState)
    const totalSoldTicketAvgSalesFactor = gameState.cumulativeSalesFactorProgress.reduce((acc, itm) => acc + itm.reduce((acc1, itm1) => acc1 + itm1, 0), 0) / gameState.cumulativeSalesFactorProgress.length;
 
    const availableStands = [];
    const nonAvailableStands = [];

    Object.keys(gameState.board).forEach((obj) => {
      if((gameState.board[obj] == 'Stand' || gameState.board[obj] == 'Premium Stand') && !(gameState?.rentedBooths ?? []).some(itm=>itm.tile == obj)){
        availableStands.push({tile: obj, obj_key: gameState.board[obj]});
      }
    })

    console.log("STANDS: ", availableStands);
}*/

function generateProposals(gameState, worldSettings, globalSettings, options = {}) {
  const opts = {
    maxOffersPerTile: 5,
    maxTotalOffers: 12,
    roundPriceTo: 10,
    ...options,
  };

  const objects = globalSettings?.objects || {};
  const population = Array.isArray(worldSettings?.population)
    ? worldSettings.population
    : [0, 0, 0];

  const ticketSales = Array.isArray(gameState?.ticketSales)
    ? gameState.ticketSales
    : [0, 0, 0];

  const totalTicketSales = ticketSales.reduce((acc, v) => acc + Number(v || 0), 0);
  const populationTotal = Math.max(
    1,
    population.reduce((acc, v) => acc + Number(v || 0), 0)
  );

  const totalSoldTicketsPercentage = clamp01(totalTicketSales / populationTotal);

  const avgSalesFactor = averageNestedNumbers(
    gameState?.cumulativeSalesFactorProgress || []
  );

  const marketingFactor = calculateMarketingProposalFactor(
    gameState,
    globalSettings
  );

  const availableStands = getAvailableVendorTiles(gameState);

  const proposals = [];

  availableStands.forEach(stand => {
    console.log("AVAILABLE STAND: ", stand);
    const proximity = calculateVendorTileProximityScore(
      stand.tile,
      gameState,
      worldSettings,
      globalSettings
    );

    const offerCount = calculateOfferCountForTile({
      gameState,
      totalSoldTicketsPercentage,
      avgSalesFactor,
      marketingFactor,
      proximityMultiplier: proximity.multiplier,
      maxOffersPerTile: opts.maxOffersPerTile,
    });

    const arrProps = [];
    for (let i = 0; i < offerCount; i++) {
      const price = calculateVendorOfferPrice({
        stand,
        gameState,
        globalSettings,
        totalSoldTicketsPercentage,
        avgSalesFactor,
        marketingFactor,
        proximityMultiplier: proximity.multiplier,
        roundPriceTo: opts.roundPriceTo,
      });

      proposals.push({
        price,
        obj_key: stand.obj_key,
        tile: stand.tile,
        vendorSuitabilityByGroup: generateVendorSuitabilityByGroup(stand.obj_key),
        vendorId: createVendorId(stand.tile, gameState.turn, i),
      });
      arrProps.push({
        price,
        obj_key: stand.obj_key,
        tile: stand.tile,
        vendorSuitabilityByGroup: generateVendorSuitabilityByGroup(stand.obj_key),
        vendorId: createVendorId(stand.tile, gameState.turn, i),
      })
    }
    console.log("PROPOSALS: ", proposals);
    console.log("check: ", arrProps);
  });


  console.log("PROPOSALS: ", proposals);
  return shuffleArray(proposals).slice(0, opts.maxTotalOffers);
    //.sort((a, b) => b.price - a.price)
}


/* =========================================================
   OFFER PRICE
========================================================= */

function calculateVendorOfferPrice({
  stand,
  gameState,
  globalSettings,
  totalSoldTicketsPercentage,
  avgSalesFactor,
  marketingFactor,
  proximityMultiplier,
  roundPriceTo = 1,
}) {
  const objects = globalSettings?.objects || {};
  const obj = objects[stand.obj_key] || {};

  const addRandomToBasePrice = randomInt(-10,25);
  const basePrice = Math.max(1, Number(obj.price + addRandomToBasePrice || 0));

  // Ticket sales make vendors more confident.
  // Range roughly: 0.85x -> 1.35x
  const ticketSalesMultiplier =
    0.85 + smoothstep(totalSoldTicketsPercentage) * 0.5;

  // Recent sales efficiency also affects offer quality.
  // Range roughly: 0.50x -> 1.80x
  const salesFactorMultiplier =
    0.6 + clamp01(avgSalesFactor || 0) * 0.8;

  // Marketing attracts vendors.
  // Range roughly: 0.5x -> 1.5x
  const marketingMultiplier =
    0.6 + clamp01(marketingFactor) * 0.8;

  // Sales team negotiates better lease prices.
  // Between +20% to +50%.
  const salesTeamMultiplier = gameState?.salesTeam
    ? randomBetween(1.2, 1.5)
    : 1;

  // Small natural randomness so offers do not feel robotic.
  const marketNoise = randomBetween(0.9, 1.2);

  let price =
    basePrice *
    ticketSalesMultiplier *
    salesFactorMultiplier *
    marketingMultiplier *
    proximityMultiplier *
    salesTeamMultiplier *
    marketNoise;

  return roundToNearest(Math.max(1, price), roundPriceTo);
}


/* =========================================================
   OFFER COUNT
========================================================= */

function calculateOfferCountForTile({
  gameState,
  totalSoldTicketsPercentage,
  avgSalesFactor,
  marketingFactor,
  proximityMultiplier,
  maxOffersPerTile,
}) {
  const ticketScore = smoothstep(totalSoldTicketsPercentage);
  const salesScore = clamp01(avgSalesFactor || 0);
  const marketingScore = clamp01(marketingFactor);

  // proximityMultiplier usually floats around 0.55 - 1.75.
  const proximityScore = clamp01((proximityMultiplier - 0.55) / 1.2);

  const demandScore =
    ticketScore * 0.30 +
    salesScore * 0.20 +
    marketingScore * 0.35 +
    proximityScore * 0.15;

  // Base count can be 0 if the event is unattractive.
  let count = Math.floor(randomBetween(0, 1.25) + demandScore * 3);
  
  console.log("Offer count for tile:", count);
  // Sales team brings extra vendor leads.
  // 1 to 3 offers.
  // ## This should be applied overal - as up to three more proposals total, not per tile
  if (gameState?.salesTeam) {
    count += randomInt(1, 3);
  }

  return clampInt(count, 0, maxOffersPerTile);
}


/* =========================================================
   PROXIMITY
========================================================= */

function calculateVendorTileProximityScore(tile, gameState, worldSettings, globalSettings) {
  const board = gameState?.board || {};
  const objects = globalSettings?.objects || {};
  const neighbors = getNeighborTiles(tile, worldSettings?.gridSize || 5);

  let bonus = 0;
  const reasons = [];

  neighbors.forEach(neighborTile => {
    const neighborObjKey = board[neighborTile];
    if (!neighborObjKey) return;

    const normalized = normalizeObjectKey(neighborObjKey);
    const neighborObj = objects[neighborObjKey] || {};

    if (isVendorStandKey(neighborObjKey)) {
      const penalty = isPremiumStandKey(neighborObjKey) ? 0.22 : 0.16;
      bonus -= penalty;
      reasons.push({
        tile: neighborTile,
        obj_key: neighborObjKey,
        effect: -penalty,
        reason: "Nearby competing stand",
      });
      return;
    }

    if (normalized.includes("stage")) {
      bonus += 0.28;
      reasons.push({
        tile: neighborTile,
        obj_key: neighborObjKey,
        effect: 0.28,
        reason: "Stage nearby increases foot traffic",
      });
      return;
    }

    if (isDecorationLikeObject(normalized)) {
      bonus += 0.14;
      reasons.push({
        tile: neighborTile,
        obj_key: neighborObjKey,
        effect: 0.14,
        reason: "Decoration nearby improves attractiveness",
      });
      return;
    }

    // Generic useful nearby object.
    // Uses suitability from object schema if available.
    const suitability = Array.isArray(neighborObj.suitability)
      ? neighborObj.suitability
      : [0, 0, 0];

    const positiveSuitability = suitability.reduce(
      (acc, v) => acc + Math.max(0, Number(v || 0)),
      0
    );

    const genericBonus = saturate(positiveSuitability, 30) * 0.16;

    if (genericBonus > 0) {
      bonus += genericBonus;
      reasons.push({
        tile: neighborTile,
        obj_key: neighborObjKey,
        effect: genericBonus,
        reason: "Attractive nearby object",
      });
    }
  });

  return {
    multiplier: clamp(1 + bonus, 0.55, 1.75),
    reasons,
  };
}


/* =========================================================
   AVAILABLE STANDS
========================================================= */

function getAvailableVendorTiles(gameState) {
  const board = gameState?.board || {};
  const rentedBooths = Array.isArray(gameState?.rentedBooths)
    ? gameState.rentedBooths
    : [];

  const rentedTiles = new Set(rentedBooths.map(booth => booth.tile));

  const available = [];

  Object.keys(board).forEach(tile => {
    const objKey = board[tile];

    if (!isVendorStandKey(objKey)) return;
    if (rentedTiles.has(tile)) return;

    available.push({
      tile,
      obj_key: objKey,
    });
  });

  return available;
}

function isVendorStandKey(objKey) {
  return isRegularStandKey(objKey) || isPremiumStandKey(objKey);
}

function isRegularStandKey(objKey) {
  return normalizeObjectKey(objKey) === "stand";
}

function isPremiumStandKey(objKey) {
  const key = normalizeObjectKey(objKey);
  return key === "premium stand" || key === "premium";
}

function normalizeObjectKey(objKey) {
  return String(objKey || "")
    .trim()
    .toLowerCase()
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ");
}


/* =========================================================
   VENDOR SUITABILITY
========================================================= */

function generateVendorSuitabilityByGroup(objKey) {
  const total = isPremiumStandKey(objKey)
    ? randomInt(5, 15)
    : randomInt(1, 9);

  return generateVec3WithExactSumAndMagnitudeLimit(total);
}

function generateVec3WithExactSumAndMagnitudeLimit(total) {
  total = Math.max(1, Math.round(Number(total || 1)));

  for (let attempt = 0; attempt < 1000; attempt++) {
    const a = randomInt(-total, total);
    const b = randomInt(-total, total);
    const c = total - a - b;

    if (Math.abs(c) <= total) {
      return [a, b, c];
    }
  }

  const idx = randomInt(0, 2);
  let returnArr = [0, 0, 0];
  returnArr[idx] = total;
  return returnArr;
}


/* =========================================================
   MARKETING FACTOR
========================================================= */

function calculateMarketingProposalFactor(gameState, globalSettings) {
  const interest = Array.isArray(gameState?.interest)
    ? gameState.interest
    : [0, 0, 0];

  const rules = globalSettings?.baseRules || {};
  const marketingK = Number(rules.marketingSaturationK || 50);

  let interestFactor =
    interest.reduce((acc, v) => acc + saturate(v, marketingK), 0) / 3;

  console.log("interest factor before website accounted: ", interestFactor);
  if(gameState?.website){
    interestFactor = (interestFactor * (100+randomInt(12, 25))) / 100; 
  }

  console.log("Interest factor: ", interestFactor);
  return interestFactor
}


/* =========================================================
   BOARD HELPERS
========================================================= */

function getNeighborTiles(tile, gridSize) {
  const parsed = parseBoardTile(tile);
  if (!parsed) return [];

  const { col, row } = parsed;
  const size = Math.max(1, Number(gridSize || 5));

  const candidates = [
    { col: col - 1, row },
    { col: col + 1, row },
    { col, row: row - 1 },
    { col, row: row + 1 },
  ];

  return candidates
    .filter(p => p.col >= 0 && p.col < size && p.row >= 1 && p.row <= size)
    .map(p => tileFromCoords(p.col, p.row));
}

function parseBoardTile(tile) {
  const match = String(tile || "").match(/^([A-Z]+)(\d+)$/i);
  if (!match) return null;

  return {
    col: lettersToIndex(match[1].toUpperCase()),
    row: Number(match[2]),
  };
}

function tileFromCoords(col, row) {
  return indexToLetters(col) + String(row);
}

function lettersToIndex(letters) {
  let n = 0;

  for (let i = 0; i < letters.length; i++) {
    n = n * 26 + (letters.charCodeAt(i) - 64);
  }

  return n - 1;
}

function indexToLetters(index) {
  let n = Number(index) + 1;
  let result = "";

  while (n > 0) {
    const rem = (n - 1) % 26;
    result = String.fromCharCode(65 + rem) + result;
    n = Math.floor((n - 1) / 26);
  }

  return result;
}


/* =========================================================
   MISC HELPERS
========================================================= */

function isDecorationLikeObject(normalizedObjKey) {
  return (
    normalizedObjKey.includes("decor") ||
    normalizedObjKey.includes("decoration") ||
    normalizedObjKey.includes("plant") ||
    normalizedObjKey.includes("flower") ||
    normalizedObjKey.includes("garden") ||
    normalizedObjKey.includes("bench") ||
    normalizedObjKey.includes("bank")
  );
}

function averageNestedNumbers(values) {
  if (!Array.isArray(values) || values.length === 0) return 0;

  let total = 0;
  let count = 0;

  values.forEach(item => {
    if (Array.isArray(item)) {
      item.forEach(v => {
        const n = Number(v);
        if (Number.isFinite(n)) {
          total += n;
          count += 1;
        }
      });
    } else {
      const n = Number(item);
      if (Number.isFinite(n)) {
        total += n;
        count += 1;
      }
    }
  });

  return count > 0 ? total / count : 0;
}

function createVendorId(tile, turn, index) {
  const rand = Math.random().toString(36).slice(2, 8);
  return `vendor_${tile}_t${turn || 0}_${index}_${rand}`;
}

function roundToNearest(value, nearest) {
  const n = Math.max(1, Number(nearest || 1));
  return Math.round(Number(value || 0) / n) * n;
}

function randomBetween(min, max) {
  return Number(min || 0) + Math.random() * (Number(max || 0) - Number(min || 0));
}

function randomInt(min, max) {
  const lo = Math.ceil(Number(min || 0));
  const hi = Math.floor(Number(max || 0));
  return Math.floor(Math.random() * (hi - lo + 1)) + lo;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, Number(value || 0)));
}

function clamp01(value) {
  return clamp(value, 0, 1);
}

function clampInt(value, min, max) {
  return Math.round(clamp(value, min, max));
}

function smoothstep(x) {
  x = clamp01(x);
  return x * x * (3 - 2 * x);
}

function saturate(value, k) {
  const v = Math.max(0, Number(value || 0));
  const kk = Math.max(1, Number(k || 1));
  return v <= 0 ? 0 : v / (v + kk);
}

function shuffleArray(arr) {
  const copy = arr.slice();

  for (let i = copy.length - 1; i > 0; i--) {
    const j = randomInt(0, i);
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }

  return copy;
}
