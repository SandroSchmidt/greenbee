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

  let sponsorsMultiplier = 1.0;
  if(gameState?.sponsors){
    const sponsorsCatalog = typeof SPONSORS_LIST !== "undefined"
      ? SPONSORS_LIST
      : (typeof window !== "undefined" && Array.isArray(window.SPONSORS_LIST) ? window.SPONSORS_LIST : []);
    gameState?.sponsors.forEach(itm=>{
      const sponsor = sponsorsCatalog.find(spo => spo.id == itm.id);
      if(!sponsor){
        sponsorsMultiplier *= 1.0;
      }
      else{
        const possibleOffers = Array.isArray(sponsor.possible_offers) ? sponsor.possible_offers : [];
        const sponsorMultiplier = (100 + (possibleOffers[itm.deal]?.ticket_reasonableness_boost || 0)) / 100;
        sponsorsMultiplier *= sponsorMultiplier;
      }
    })
  }

  return clamp(historyAdjustedFactor * salesMultiplier * sponsorsMultiplier, 0, maxFactor);
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

/* ---------------------------------------------------------------------------------------- */
/* ------------------------------VENDOR PROPOSALS LOGIC------------------------------------ */
/* ---------------------------------------------------------------------------------------- */

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
    //console.log("AVAILABLE STAND: ", stand);
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
  });


  //console.log("PROPOSALS: ", proposals);
  return shuffleArray(proposals).slice(0, opts.maxTotalOffers);
    //.sort((a, b) => b.price - a.price)
}

function getBrandingProposal(gameState){
return {
  price: 200,
  code: 'branding',
  title: 'Branding Package',
  vendorId: 'Sales Team XY'
}
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

  const low_high = (gameState?.salesTeam && gameState?.salesTeam == 'havenfield') ? [10, 50] : [-10, 25];
  
  const addRandomToBasePrice = randomInt(low_high[0], low_high[1]);
  const basePrice = Math.max(1, Number(obj.price + addRandomToBasePrice || 0));
  //console.log("Base price> ", basePrice)
  // Ticket sales make vendors more confident.
  // Range roughly: 0.85x -> 1.35x
  const ticketSalesMultiplier =
    0.85 + smoothstep(totalSoldTicketsPercentage) * 0.5;

   // console.log("Ticket sales multiplier> ", ticketSalesMultiplier);
  // Recent sales efficiency also affects offer quality.
  // Range roughly: 0.50x -> 1.80x
  const salesFactorMultiplier =
    0.6 + clamp01(avgSalesFactor || 0) * 0.8;

   // console.log("Sales factor multiplier> ", salesFactorMultiplier);
  // Marketing attracts vendors.
  // Range roughly: 0.5x -> 1.5x
  const marketingMultiplier =
    0.6 + clamp01(marketingFactor) * 0.8;

    //console.log("Marketing multiplier> ", marketingMultiplier)
  // Sales team negotiates better lease prices.
  // Between +20% to +50%.
  const salesTeamMultiplier = gameState?.salesTeam
    ? randomBetween(1.2, 1.5)
    : 1;

    //console.log("Sales multiplier> ", salesTeamMultiplier)
  // Small natural randomness so offers do not feel robotic.
  const marketNoise = randomBetween(0.9, 1.2);

    //console.log("Market noise> ", marketNoise);
  let price =
    basePrice *
    ticketSalesMultiplier *
    salesFactorMultiplier *
    marketingMultiplier *
    proximityMultiplier *
    salesTeamMultiplier *
    marketNoise;
    

    //console.log("Final price> ", roundToNearest(Math.max(1, price), roundPriceTo));
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
  
  //console.log("Offer count for tile:", count);
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

  //console.log("interest factor before website accounted: ", interestFactor);
  if(gameState?.website){
    interestFactor = (interestFactor * (100+randomInt(12, 25))) / 100; 
  }

  //console.log("Interest factor: ", interestFactor);
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


/* ---------------------------------------------------------------------------------------- */
/* --------------------------VENDORS SATISFACTION LOGIC------------------------------------ */
/* ---------------------------------------------------------------------------------------- */

function computeVendorsSatisfaction(gameState, tileId) {
  console.log("");
}

/* ---------------------------------------------------------------------------------------- */
/* --------------------------VISITORS SATISFACTION LOGIC----------------------------------- */
/* ---------------------------------------------------------------------------------------- */

const saturation = (x, power = 1, k=1) => {
      return Math.pow(x / (x + k), power);
};

function getVisitorsSatisfaction(peopleTracker, groupCount = 3) {
  const satisfactionByGroup = Array.from({ length: groupCount }, () => []);

  for (const person of peopleTracker) {
    const satisfactionVector = person.satisfactionProgress;
    const personSatisfactionMEAN = satisfactionVector.reduce((sum, value) => sum + value, 0) / satisfactionVector.length;
    satisfactionByGroup[person.group].push(personSatisfactionMEAN);
  }

  const averageSatisfactionByGroup = satisfactionByGroup.map(groupValues =>{
   return groupValues.reduce((sum, value) => sum + value, 0) / groupValues.length
  });

  console.log("SATISFACTION BY GROUP: ", satisfactionByGroup);
  console.log("Average satisfaction by group: ", averageSatisfactionByGroup);

  return averageSatisfactionByGroup
}

/* ________________________________________________________________________________________ */
// so basically just getting how similar is visitors vector to vendors suitability vector
// it shows us how proportional our visitors strucutre is to what vendor would expect based on his suitability vector
const kosinusSimilarity = (a, b) => {
  if (a.length !== b.length) {
    throw new Error("Vectors must have the same length");
  }

  let dotProduct = 0;
  let magnitudeA = 0;
  let magnitudeB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    magnitudeA += a[i] * a[i];
    magnitudeB += b[i] * b[i];
  }

  magnitudeA = Math.sqrt(magnitudeA);
  magnitudeB = Math.sqrt(magnitudeB);

  if (magnitudeA === 0 || magnitudeB === 0) {
    return 0; // or null, because zero-vector has no direction
  }

  return dotProduct / (magnitudeA * magnitudeB);
};

function normalizeVector(x){
  console.log("VECx", x);
  let copy = x.slice();
  for(let i; i<x.length; i++){
    if(copy[i]<0){
      copy[i] = 0;
    }
  }

  return copy.map(itm=>itm/copy.reduce((acc, itm)=>acc+itm, 0));
}

function getVendorsSatisfaction(tileVisits, gameState){
  const similarityArr = gameState.rentedBooths.map(itm=>{
    const normalizedVector1 = normalizeVector(itm.vendorSuitabilityByGroup)
    console.log("Vendor suit passed---")
    console.log("TILE VISITS: ", tileVisits)
    const normalizedVector2 = normalizeVector(tileVisits[itm.tile]);
    const similarity = kosinusSimilarity(normalizedVector1, normalizedVector2);
    console.log("Vector1: ", normalizedVector1);
    console.log("Vector2: ", normalizedVector2);
    console.log("Similarity: ", similarity);
    return similarity;
  })

  const visitsSatisfaction = gameState.rentedBooths.map(itm=>{
    const visits= tileVisits[itm.tile].reduce((acc, itm)=>acc+itm, 0);
    return saturation(visits, 2, 200);
  })

  console.log("SIMilarity arr: ", similarityArr)
  console.log("VISITS satisfaction: ", visitsSatisfaction);
  const combined = [];
  for(let i=0; i<visitsSatisfaction.length; i++){
    combined[i] = similarityArr[i]*visitsSatisfaction[i];
  }
  console.log("combined: ", combined);
  console.log("overall satisfaction: ", combined.reduce((acc, itm)=>acc+itm, 0)/combined.length);
  return combined.reduce((acc, itm)=>acc+itm, 0)/combined.length;
}

/* ________________________________________________________________________________________ */

const rows_notation = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
function getArrayOfKind(size, kind){
  const returnArr= [];
  for(let i=0; i<size; i++){
    returnArr.push(kind);
  }
  return returnArr
}

function getBatches(populationArray, batchSize, numberOfRandomPeopleAirdrops){
  const batches = [];
  console.log("hEreweare");
  for(let i=0; i<numberOfRandomPeopleAirdrops; i++){
    const to = i !== (numberOfRandomPeopleAirdrops-1) ? i*batchSize+batchSize : 10000000000;
    batches.push(populationArray.slice(i*batchSize,to));
  }
  console.log("BATCHES: ", batches);
  return batches;
}

function pickGates(rows, cols, gameState, numberOfRandomPeopleAirdrops){
  const entryRing = [];
  for(let i=0; i<rows; i++){
    for(let j=0; j<cols; j++){
      const col = j+1;
      if(i==0 || i==rows-1 || j==0 || j==cols-1){
        //basically all the edging squares
        entryRing.push(rows_notation[i]+col);
      }
    }
  }
  console.log("ENTRY LAYER: ", entryRing);
  const pickedGates = []

  
  const freeSquares = entryRing.filter(itm=>!gameState.board[itm]);
  console.log("FREE SQR: ", freeSquares);
  if(freeSquares.length<1){
    return ["A1"];
  }
  if(freeSquares.length<=numberOfRandomPeopleAirdrops){
    return freeSquares;
  }

  while(pickedGates.length!==numberOfRandomPeopleAirdrops){
    const randNum = randomInt(0,freeSquares.length-1);
    if(!pickedGates.find(itm=>itm==freeSquares[randNum])){
      pickedGates.push(freeSquares[randNum]);
    }
  }
  console.log("Picked Gates: ", pickedGates)
  return pickedGates;
}

function initialArrangement(gates, batches){
  let batchesFormatted = batches.slice();
  while(gates.length<batchesFormatted.length){
    batchesFormatted = [[...batchesFormatted[0],...batchesFormatted[1]],...batchesFormatted.slice(2)];
    console.log("Batches formatted: ", batchesFormatted);
  }
  const peopleTracker = [];
  gates.forEach((itm, i)=>{
    batchesFormatted[i].map(group => {
      const personNote = {
        group: group,
        currentSquare: itm,
        visitedSquaresHistory: [itm],
        totalAccumulatedSuitability: [0, 0, 0],
        satisfactionProgress: []
      }
      peopleTracker.push(personNote)
    })
  })
  console.log("People tracker: ", peopleTracker);
  return peopleTracker;
  //console.log("BAtches formatted: ", batchesFormatted);
}
/* ---------------------------------------------------------------------------------------- */
/* --------------------------EVENT SIMULATION----------------------------------- */
/* ---------------------------------------------------------------------------------------- */
function eventSimulation(gameState, worldSettings, globalSettings){
  const numberOfRandomPeopleAirdrops = 6;
  const peopleArr= shuffleArray([...getArrayOfKind(gameState.ticketSales[0], 0), //youth
  ...getArrayOfKind(gameState.ticketSales[1], 1), //families
  ...getArrayOfKind(gameState.ticketSales[2], 2)]); //senior citizens
  console.log("People arr: ", peopleArr);
  const batchSize = Math.round(peopleArr.length/numberOfRandomPeopleAirdrops);
  const batches = getBatches(peopleArr, batchSize, numberOfRandomPeopleAirdrops);
  const gates = pickGates(worldSettings.gridSize, worldSettings.gridSize, gameState, numberOfRandomPeopleAirdrops);
  const peopleTracker = initialArrangement(gates, batches);

  const dataForSuitabilityNet = prepareDataForBoardSuitabilityNet(gameState, worldSettings, globalSettings);
  const netResult = mapBoardSuitabilityNet(worldSettings.gridSize, worldSettings.gridSize, dataForSuitabilityNet)
 

  const numberOfSimulations = 20;
  runSimulationSteps(peopleTracker, worldSettings.gridSize, worldSettings.gridSize, netResult, dataForSuitabilityNet, numberOfSimulations);
  console.log("Final people tracker: ", peopleTracker);
  console.log("SUITABILITY NET: ", netResult);
  const tileVisits = getVisitCountsByTile(peopleTracker, worldSettings.gridSize, worldSettings.gridSize);
  console.log("Tile visits: ", tileVisits);
  const visitorsSatisfaction = getVisitorsSatisfaction(peopleTracker);
  const vendorsSatisfaction = getVendorsSatisfaction(tileVisits, gameState);
  return {
    visitorsSatisfaction: visitorsSatisfaction,
    vendorsSatisfaction: vendorsSatisfaction,
    tileVisits: tileVisits,
    peopleTracker: peopleTracker,
  }
}

/* -----------------------------------------------------------------------------------------*/
function prepareDataForBoardSuitabilityNet(gameState, worldSettings, globalSettings){
  const data = [];
  for(let i=0; i<worldSettings.gridSize; i++){
    for (let j=0; j<worldSettings.gridSize; j++){
      const col = j+1;
      const tileId = rows_notation[i]+col;
      const objKey = gameState.board[tileId];
      if(!objKey){
        const emptySquareInfo = {
            square: tileId,
            object: "Empty",
            suitability: [0, 0, 0],
            effectPower: 1,
            absorptionPower: 0,
        };
        data.push(emptySquareInfo);
      }
      else {
        const object = globalSettings.objects[objKey];
        const suitability = object.suitability.slice();
        const booth = (gameState?.rentedBooths ?? []).find(itm => itm.tile === tileId);
        const vendorSuitability = booth && (booth.vendorSuitabilityByGroup.slice() || booth.suitability.slice());
        if (Array.isArray(vendorSuitability)){
          vendorSuitability.forEach((v, i) => { suitability[i] += Number(v || 0); });
        }

        //adding suitability points that speaker brings to the table
        const speakerAppointment = (gameState?.appointedSpeakers ?? []).find(itm => itm.tileId == tileId);
        if(speakerAppointment){
          const appointedSpeaker = SPEAKERS_LIST.find(itm=>itm.id == speakerAppointment.speakerId);
          if (appointedSpeaker && Array.isArray(appointedSpeaker.suitability)) {
            appointedSpeaker.suitability.forEach((v, i)=> {suitability[i] += Number(v || 0); });
          }
        }
        
        const occupiedSquareInfo = {
          square: tileId,
          object: objKey,
          suitability: suitability,
          effectPower: object?.effect ?? 0,
          absorptionPower: object?.absorption ?? 0,
        }

        data.push(occupiedSquareInfo);
      }
    }
  }
  console.log("DATA: ", data);
  return data;
}


function mapBoardSuitabilityNet(rows, cols, items) {
  // ---- ID helpers (Excel-style: A1, B2, ... AA1, etc.) ----
  const parseId = id => {
    const m = id.match(/^([A-Z]+)(\d+)$/);
    if (!m) throw new Error(`Invalid square ID: ${id}`);
    let row = 0;
    for (const ch of m[1]) row = row * 26 + (ch.charCodeAt(0) - 64);
    return { row: row - 1, col: parseInt(m[2], 10) - 1 };
  };
  const makeId = (row, col) => {
    let letters = '', r = row + 1;
    while (r > 0) {
      letters = String.fromCharCode(65 + (r - 1) % 26) + letters;
      r = Math.floor((r - 1) / 26);
    }
    return letters + (col + 1);
  };

  // ---- Board lookup ----
  const board = Array.from({ length: rows }, () => Array(cols).fill(null));
  for (const item of items) {
    const { row, col } = parseId(item.square);
    if (row >= 0 && row < rows && col >= 0 && col < cols) board[row][col] = item;
  }

  const dim = items[0]?.suitability?.length ?? 3;

  // ---- Result grid ----
  const result = Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => Array(dim).fill(0))
  );

  // ---- Parent rule: one step toward origin from relative offset (dr, dc).
  // For a cell at Chebyshev distance L from the source, this yields its
  // unique "upstream" neighbor at distance L-1. Matches the branching
  // described in the spec (cardinals → 1 child, diagonals → 3 children).
  const parentOf = (dr, dc) => {
    const adr = Math.abs(dr), adc = Math.abs(dc);
    if (adr > adc) return [dr - Math.sign(dr), dc];
    if (adc > adr) return [dr, dc - Math.sign(dc)];
    return [dr - Math.sign(dr), dc - Math.sign(dc)];
  };

  // ---- Propagate from each source ----
  for (const item of items) {
    const { suitability, effectPower = 0 } = item;
    if (!suitability || suitability.every(v => v === 0)) continue;

    const { row: sr, col: sc } = parseId(item.square);
    if (sr < 0 || sr >= rows || sc < 0 || sc >= cols) continue;

    // Source's own square: full suitability (layer 0, no falloff, no absorption)
    for (let i = 0; i < dim; i++) result[sr][sc][i] += suitability[i];

    // factor[r][c] = multiplier on this source's suitability that reaches (r, c)
    const factor = Array.from({ length: rows }, () => Array(cols).fill(null));
    factor[sr][sc] = 1;

    const maxLayer = Math.max(sr, rows - 1 - sr, sc, cols - 1 - sc);
    for (let layer = 1; layer <= maxLayer; layer++) {
      for (let dr = -layer; dr <= layer; dr++) {
        for (let dc = -layer; dc <= layer; dc++) {
          if (Math.max(Math.abs(dr), Math.abs(dc)) !== layer) continue;
          const tr = sr + dr, tc = sc + dc;
          if (tr < 0 || tr >= rows || tc < 0 || tc >= cols) continue;

          const [pdr, pdc] = parentOf(dr, dc);
          const pr = sr + pdr, pc = sc + pdc;
          const pf = factor[pr][pc];
          if (pf === null) continue;

          // Parent absorbs power flowing through it to its children,
          // EXCEPT when parent is the source (source emits, doesn't absorb its own emission).
          const parentIsSource = (pr === sr && pc === sc);
          const parentObj = board[pr][pc];
          const passThrough = parentIsSource || !parentObj
            ? 1
            : 1 - (parentObj.absorptionPower || 0);

          const f = pf * effectPower * passThrough;
          factor[tr][tc] = f;
          for (let i = 0; i < dim; i++) result[tr][tc][i] += suitability[i] * f;
        }
      }
    }
  }

  // ---- Format output ----
  const out = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      out.push({ square: makeId(r, c), suitability: result[r][c] });
    }
  }
  return out;
}


/* ---------------------------------------------------------------------------------------- */
/* --------------------------SIMULATION STEPPING----------------------------------- */
/* ---------------------------------------------------------------------------------------- */

function getNeighborSquares(squareId, rows, cols) {
  const m = squareId.match(/^([A-Z]+)(\d+)$/);
  let row = 0;
  for (const ch of m[1]) row = row * 26 + (ch.charCodeAt(0) - 64);
  row -= 1;
  const col = parseInt(m[2], 10) - 1;

  const neighbors = [];
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      if (dr === 0 && dc === 0) continue;
      const nr = row + dr, nc = col + dc;
      if (nr >= 0 && nr < rows && nc >= 0 && nc < cols) {
        neighbors.push(rows_notation[nr] + (nc + 1));
      }
    }
  }
  return neighbors;
}

function weightedPick(candidates, weights) {
  const total = weights.reduce((a, b) => a + b, 0);
  // Fallback: if every weight is 0 (all surroundings unsuitable), stay put.
  if (total <= 0) {
    //if all the candidate squares are unsuitable we just randomly pick one (uniform probabilities)
    const sqIdx = randomInt(0, candidates.length-1);
    return candidates[sqIdx];
  } 
  let r = Math.random() * total;
  for (let i = 0; i < candidates.length; i++) {
    r -= weights[i];
    if (r <= 0) return candidates[i];
  }
  return candidates[candidates.length - 1];
}


function pickNextSquare(person, rows, cols, netLookup) {
  // Candidate set: current square (person can stay) + all 8-neighbors.
  // We put currentSquare first so the "stay put" fallback in weightedPick is sensible.
  let candidates = [person.currentSquare, ...getNeighborSquares(person.currentSquare, rows, cols)];

  const weights = candidates.map(sq => {
    const netSuit = netLookup[sq]?.suitability ?? [0, 0, 0];
    // 1. Take only the value for this person's group.
    let val = netSuit[person.group] ?? 0;
    // 2. Clamp negatives to 0 (negative * positive multipliers stays negative,
    //    so clamping after multiplication would also work — but doing it here
    //    is clearer and avoids surprises later).
    if (val < 0) val = 0;
    // 3. Penalise current square (lower chance of staying).
    if (sq === person.currentSquare) val *= 0.5;
    // 4. Penalise per prior visit (compounding 0.66 per visit).
    const visitCount = person.visitedSquaresHistory.reduce((n, v) => n + (v === sq ? 1 : 0), 0);
    for (let i = 0; i < visitCount; i++) val *= 0.66;
    return val;
  });

  return weightedPick(candidates, weights);
}

function runSimulationSteps(peopleTracker, rows, cols, netResult, dataForSuitabilityNet, numberOfSimulations) {
  // Build O(1) lookups by square id once, instead of .find() inside the inner loop.
  const netLookup = {};
  for (const itm of netResult) netLookup[itm.square] = itm;
  const dataLookup = {};
  for (const itm of dataForSuitabilityNet) dataLookup[itm.square] = itm;

  for (let step = 0; step < numberOfSimulations; step++) {
    for (const person of peopleTracker) {
      const nextSquare = pickNextSquare(person, rows, cols, netLookup);
      person.currentSquare = nextSquare;
      person.visitedSquaresHistory.push(nextSquare);

      // Accumulate the raw square suitability (NOT the net value).
      const squareSuit = dataLookup[nextSquare]?.suitability;
      if (squareSuit) {
        for (let i = 0; i < person.totalAccumulatedSuitability.length; i++) {
          person.totalAccumulatedSuitability[i] += squareSuit[i] ?? 0;
        }

        const satisfaction = saturation(Math.max(0, squareSuit[person.group]), 1)
        person.satisfactionProgress.push(satisfaction);
      }
    }
  }

  return peopleTracker;
}


function getVisitCountsByTile(peopleTracker, rows, cols) {
  const counts = {};

  // Pre-fill every tile with [0, 0, 0] so downstream code doesn't have to
  // null-check missing keys (heatmap rendering, scoring, etc).
  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      counts[rows_notation[i] + (j + 1)] = [0, 0, 0];
    }
  }

  for (const person of peopleTracker) {
    for (const tile of person.visitedSquaresHistory) {
      if (counts[tile]) counts[tile][person.group] += 1;
    }
  }

  return counts;
}


//SPONSOR LOGIC

function getInterestedSponsors(gameState, SPONSORS){
  const currentSponsorIds = (Array.isArray(gameState?.sponsors) ? gameState.sponsors : [])
    .map(itm => itm && itm.id)
    .filter(Boolean);
  const potentialSponsors = SPONSORS.filter(itm => !currentSponsorIds.includes(itm.id));
  if(potentialSponsors.length<1) return [];

  return potentialSponsors
    .filter(sponsor => {
      const requirementSets = Array.isArray(sponsor.requirement_sets)
        ? sponsor.requirement_sets
        : [];

      if (requirementSets.length < 1) return true;
      return requirementSets.some(requirements => sponsorRequirementsMet(gameState, requirements));
    })
    .map(sponsor => {
      const offers = Array.isArray(sponsor.possible_offers) ? sponsor.possible_offers : [];
      const selected_offer = offers.length > 0 ? randomInt(0, offers.length - 1) : -1;
      return {
        ...sponsor,
        selected_offer,
      };
    });
}

function sponsorRequirementsMet(gameState, requirements = {}) {
  if (requirements.sales_team_required && !gameState?.salesTeam) return false;

  if (!meetsMinimum(
    getTicketSalesPercentage(gameState),
    requirements.min_ticket_sales_percentage
  )) return false;

  if (!meetsRecentTicketSalesEfficiency(
    getTicketSalesEfficiencyHistory(gameState),
    requirements.min_ticket_sales_efficiency_last_turns
  )) return false;

  if (!meetsVectorMinimum(
    getLatestSuitability(gameState),
    requirements.min_suitability_per_group
  )) return false;

  if (!meetsMinimum(
    gameState?.infrastructuralSpendings,
    requirements.min_infrastructural_investment
  )) return false;

  if (!meetsMinimum(
    Array.isArray(gameState?.rentedBooths) ? gameState.rentedBooths.length : 0,
    requirements.min_vendors
  )) return false;

  if (!meetsMinimum(
    Array.isArray(gameState?.appointedSpeakers) ? gameState.appointedSpeakers.length : 0,
    requirements.min_appointed_speakers
  )) return false;

  return true;
}

function meetsMinimum(value, minimum) {
  if (minimum == null) return true;
  return Number(value || 0) >= Number(minimum || 0);
}

function meetsVectorMinimum(values, minimums) {
  if (!Array.isArray(minimums) || minimums.length < 1) return true;
  if (!Array.isArray(values)) return false;

  return minimums.every((minimum, index) => (
    Number(values[index] || 0) >= Number(minimum || 0)
  ));
}

function meetsRecentTicketSalesEfficiency(history, requiredLastTurns) {
  if (!Array.isArray(requiredLastTurns) || requiredLastTurns.length < 1) return true;
  if (!Array.isArray(history) || history.length < requiredLastTurns.length) return false;

  const recent = history.slice(history.length - requiredLastTurns.length);
  return requiredLastTurns.every((minimum, index) => (
    averageNumbers(recent[index]) >= Number(minimum || 0)
  ));
}

function averageNumbers(value) {
  if (Array.isArray(value)) {
    if (value.length < 1) return 0;
    return value.reduce((sum, current) => sum + Number(current || 0), 0) / value.length;
  }

  return Number(value || 0);
}

function getTicketSalesEfficiencyHistory(gameState) {
  if (Array.isArray(gameState?.cumulativeSalesFactorProgress)) {
    return gameState.cumulativeSalesFactorProgress;
  }

  if (Array.isArray(gameState?.turnReports)) {
    return gameState.turnReports
      .map(report => report && report.salesEfficiency)
      .filter(Boolean);
  }

  return [];
}

function getLatestSuitability(gameState) {
  if (Array.isArray(gameState?.suitability)) return gameState.suitability;

  const reports = Array.isArray(gameState?.turnReports) ? gameState.turnReports : [];
  for (let i = reports.length - 1; i >= 0; i--) {
    if (Array.isArray(reports[i]?.suitability)) return reports[i].suitability;
  }

  return null;
}

function getTicketSalesPercentage(gameState) {
  if (Number.isFinite(Number(gameState?.ticketSalesPercentage))) {
    return Number(gameState.ticketSalesPercentage);
  }

  const totalTicketSales = Array.isArray(gameState?.ticketSales)
    ? gameState.ticketSales.reduce((sum, current) => sum + Number(current || 0), 0)
    : 0;

  const capacity = Number(
    gameState?.ticketSalesCapacity
    ?? gameState?.cardsCapacity
    ?? gameState?.finalInfo?.simulationResult?.cardsCapacity
    ?? (Array.isArray(gameState?.population)
      ? gameState.population.reduce((sum, current) => sum + Number(current || 0), 0)
      : undefined)
    ?? (Array.isArray(gameState?.worldSettings?.population)
      ? gameState.worldSettings.population.reduce((sum, current) => sum + Number(current || 0), 0)
      : undefined)
    ?? 0
  );

  if (capacity <= 0) return 0;
  return (totalTicketSales / capacity) * 100;
}
