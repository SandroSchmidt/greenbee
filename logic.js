/* ----------------------------------------------------------------------------------------*/
/* ------------------------------- HELPER FUNCTIONS ---------------------------------------*/
/* ----------------------------------------------------------------------------------------*/

/* Numeric helpers */

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

function averageNumbers(value) {
  if (Array.isArray(value)) {
    if (value.length < 1) return 0;
    return value.reduce((sum, current) => sum + Number(current || 0), 0) / value.length;
  }

  return Number(value || 0);
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, Number(value || 0)));
}

function clamp01(v) {
  return Math.max(0, Math.min(1, Number(v || 0)));
}

function clampInt(value, min, max) {
  return Math.round(clamp(value, min, max));
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

function roundToNearest(value, nearest) {
  const n = Math.max(1, Number(nearest || 1));
  return Math.round(Number(value || 0) / n) * n;
}

function saturate(value, k) {
  const v = Math.max(0, Number(value || 0));
  const kk = Math.max(1, Number(k || 1));
  return v <= 0 ? 0 : v / (v + kk);
}

const saturation = (x, power = 1, k = 1) => {
  return Math.pow(x / (x + k), power);
};

function saturationSigned(x, power = 1, k = 1) {
  const value = Number(x || 0);
  const magnitude = Math.abs(value);
  const safeK = Math.max(0.000001, Number(k || 1));

  if (magnitude === 0) return 0;

  const result = Math.pow(magnitude / (magnitude + safeK), power);

  return value < 0 ? -result : result;
}

function smoothstep(x) {
  x = clamp(x, 0, 1);
  return x * x * (3 - 2 * x);
}

/* Random and collection helpers */

function getArrayOfKind(size, kind){
  const returnArr= [];
  for(let i=0; i<size; i++){
    returnArr.push(kind);
  }
  return returnArr
}

function randomBetween(min, max) {
  return Number(min || 0) + Math.random() * (Number(max || 0) - Number(min || 0));
}

function randomInt(min, max) {
  const lo = Math.ceil(Number(min || 0));
  const hi = Math.floor(Number(max || 0));

  if (hi < lo) {
    return lo;
  }

  return Math.floor(Math.random() * (hi - lo + 1)) + lo;
}

function shuffleArray(arr) {
  const copy = arr.slice();

  for (let i = copy.length - 1; i > 0; i--) {
    const j = randomInt(0, i);
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }

  return copy;
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

/* Object and config helpers */

function deepMerge(...objects) {
  const output = {};

  objects.forEach(obj => {
    mergeInto(output, obj);
  });

  return output;
}

function fixMinMax(obj, minKey, maxKey) {
  const min = Number(obj?.[minKey]);
  const max = Number(obj?.[maxKey]);

  if (!Number.isFinite(min) || !Number.isFinite(max)) return;
  if (min <= max) return;

  obj[minKey] = max;
  obj[maxKey] = min;
}

function mergeInto(target, source) {
  if (!source || typeof source !== 'object') return target;

  Object.keys(source).forEach(key => {
    const value = source[key];

    if (Array.isArray(value)) {
      target[key] = value.slice();
      return;
    }

    if (value && typeof value === 'object') {
      if (!target[key] || typeof target[key] !== 'object' || Array.isArray(target[key])) {
        target[key] = {};
      }
      mergeInto(target[key], value);
      return;
    }

    if (value !== undefined) {
      target[key] = value;
    }
  });

  return target;
}

/* IDs and lookup helpers */

function createVendorId(tile, turn, index) {
  const rand = Math.random().toString(36).slice(2, 8);
  return `vendor_${tile}_t${turn || 0}_${index}_${rand}`;
}

/* Board and tile helpers */

const rows_notation = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

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

function indexToLetters(index) {
  let n = Number(index) + 1;
  let result = '';

  while (n > 0) {
    const rem = (n - 1) % 26;
    result = String.fromCharCode(65 + rem) + result;
    n = Math.floor((n - 1) / 26);
  }

  return result;
}

function lettersToIndex(letters) {
  let n = 0;

  for (let i = 0; i < letters.length; i++) {
    n = n * 26 + (letters.charCodeAt(i) - 64);
  }

  return n - 1;
}

function parseBoardTile(tile) {
  const match = String(tile || '').match(/^([A-Z]+)(\d+)$/i);
  if (!match) return null;

  return {
    col: lettersToIndex(match[1].toUpperCase()),
    row: Number(match[2]),
  };
}

function tileFromCoords(col, row) {
  return indexToLetters(col) + String(row);
}


/* ---------------------------------------------------------------------------------------- */
/* ------------------------------- TICKET SALES LOGIC ------------------------------------- */
/* ---------------------------------------------------------------------------------------- */

const DEFAULT_TICKET_SALES_RULES = {
  infrastructure: {
    populationDivisorMinMultiplier: 0.1,
    populationDivisorMaxMultiplier: 0.2,
    earlyTurnSofteningTurns: 5,
    minInfrastructureDivisor: 1,
  },

  priceReasonableness: {
    minOptimalPrice: 0.5,

    freeTicketFactor: 2.0,
    maxFactor: 2.0,
    idealFactor: 1.0,

    priceSteepness: 1.8,

    previousPriceFactorRecencyDecay: 0.7,
    previousPriceFactorMaxClamp: 2.0,

    historySensitivity: 0.25,
    historyAdjustmentMin: -0.2,
    historyAdjustmentMax: 0.2,

    salesSensitivity: 0.15,
    salesMomentumNeutralPoint: 0.5,

    brandingMultiplier: 1.03,
    premiumWifiMultiplier: 1.01,
  },

  marketing: {
    saturationK: 50,
  },

  demand: {
    maxDemand: 1.0,
    minTurnsLeft: 1,

    soldOutSalesEfficiency: 1,
    minSalesEfficiency: 0,
    maxSalesEfficiency: 1,
  },
};

function calculateTicketsAfterTurn(worldSettings, gameState, globalSettings, options = {}) {
  const rules = getTicketSalesRules(globalSettings, options.ticketSalesRulesOverrides);

  const groupPopulation = Array.isArray(worldSettings?.population)
    ? worldSettings.population.map(v => Math.max(0, Number(v) || 0))
    : [0, 0, 0];

  const sold = Array.isArray(gameState?.ticketSales)
    ? gameState.ticketSales.map(v => Math.max(0, Number(v) || 0))
    : [0, 0, 0];

  const marketingScore = Array.isArray(gameState?.interest)
    ? gameState.interest.map(v => Math.max(0, Number(v) || 0))
    : [0, 0, 0];

  applySalesTeamMarketingImpact(marketingScore, gameState, globalSettings);

  const infrastructureDivisor = Number.isFinite(Number(options.infrastructureDivisor))
    ? Number(options.infrastructureDivisor)
    : getInfrastructureDivisor(worldSettings, gameState, rules, {
        deterministic: !!options.deterministic,
      });

  const cumulativeSalesFactor = Number.isFinite(Number(options.cumulativeSalesFactor))
    ? Number(options.cumulativeSalesFactor)
    : averageNestedNumbers(gameState?.cumulativeSalesFactorProgress);

  const priceReasonablenessFactor = calculateTicketPriceReasonableness({
    ticketPrice: gameState?.ticketPrice,
    infrastructuralSpendings: gameState?.infrastructuralSpendings,
    infrastructureDivisor,
    gameState,
    globalSettings,
    sponsorsList: globalSettings?.sponsors,
    previousPriceFactors: Array.isArray(gameState?.priceReasonablenessProgress)
      ? gameState.priceReasonablenessProgress
      : [],
    cumulativeSalesFactor,
    rules,
  });

  const remaining = groupPopulation.map((total, i) => Math.max(0, total - (sold[i] || 0)));

  const marketingK = Number(rules.marketing.saturationK);
  const maxDemand = Number(rules.demand.maxDemand);

  const maxTurns = Number(worldSettings?.maxTurns);
  const currentTurn = Number(gameState?.turn || 0);
  const turnsLeft = Math.max(
    Number(rules.demand.minTurnsLeft || 1),
    maxTurns - currentTurn
  );

  const newSales = [0, 0, 0];
  const salesEfficiency = [0, 0, 0];

  for (let i = 0; i < 3; i++) {
    if (remaining[i] <= 0) {
      newSales[i] = 0;
      salesEfficiency[i] = rules.demand.soldOutSalesEfficiency;
      continue;
    }

    const marketingFactor = saturate(marketingScore[i], marketingK);
    const demand = clamp(marketingFactor * priceReasonablenessFactor, 0, maxDemand);

    const baseSalesPace = remaining[i] / turnsLeft;
    const tickets = Math.min(remaining[i], Math.round(baseSalesPace * demand));

    newSales[i] = tickets;
    salesEfficiency[i] = baseSalesPace > 0
      ? clamp(
          tickets / baseSalesPace,
          rules.demand.minSalesEfficiency,
          rules.demand.maxSalesEfficiency
        )
      : rules.demand.soldOutSalesEfficiency;
  }

  const ticketSalesRes = sold.map((oldVal, i) => oldVal + (newSales[i] || 0));
  const totalNewSales = newSales.reduce((acc, itm) => acc + itm, 0);
  const ticketIncome = totalNewSales * Math.max(0, Number(gameState?.ticketPrice || 0));

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

/* =========================================================
   INFRASTRUCTURE / OPTIMAL PRICE SUPPORT
========================================================= */

function getInfrastructureDivisor(worldSettings, gameState, rules, { deterministic = false } = {}) {
  const population = Array.isArray(worldSettings?.population)
    ? worldSettings.population
    : [0, 0, 0];

  const totalPopulation = population.reduce(
    (sum, current) => sum + (Number(current) || 0),
    0
  );

  const infrastructureRules = rules.infrastructure;

  const min = totalPopulation * infrastructureRules.populationDivisorMinMultiplier;
  const max = totalPopulation * infrastructureRules.populationDivisorMaxMultiplier;
  const baseDivisor = deterministic ? (min + max) / 2 : randomBetween(min, max);

  const turn = Number(gameState?.turn || 0);
  const earlySupportMultiplier = getEarlyInfrastructureSupportMultiplier(
     turn,
     infrastructureRules
  );

  console.log("INFRASTRUCTURE DIVISOR: ",
    infrastructureRules.minInfrastructureDivisor,
    baseDivisor / earlySupportMultiplier
  )
  return Math.max(
    infrastructureRules.minInfrastructureDivisor,
    baseDivisor / earlySupportMultiplier
  );
}

function getEarlyInfrastructureSupportMultiplier(turn, infrastructureRules) {
  const maxMultiplier = Math.max(
    1,
    Number(infrastructureRules.earlySupportMaxMultiplier || 1)
  );

  const durationTurns = Math.max(
    1,
    Number(infrastructureRules.earlySupportDurationTurns || 1)
  );

  const progress = clamp01(Number(turn || 0) / durationTurns);
  const easedProgress = smoothstep(progress);

  return 1 + (maxMultiplier - 1) * (1 - easedProgress);
}

/* =========================================================
   PRICE REASONABLENESS
========================================================= */

function calculateTicketPriceReasonableness({
  ticketPrice,
  infrastructuralSpendings,
  infrastructureDivisor,
  gameState,
  globalSettings,
  sponsorsList,
  previousPriceFactors = [],
  cumulativeSalesFactor = 0,
  rules,
}) {
  const priceRules = rules.priceReasonableness;
  const price = Math.max(0, Number(ticketPrice || 0));

  if (price <= 0) {
    return clamp(priceRules.freeTicketFactor, 0, priceRules.maxFactor);
  }

  const maxFactor = Number(priceRules.maxFactor || 2.0);
  const idealFactor = Math.max(0.000001, Number(priceRules.idealFactor || 1.0));
  const safeDivisor = Math.max(1, Number(infrastructureDivisor || 1));

  const optimalPrice = Math.max(
    Number(priceRules.minOptimalPrice || 0.5),
    Math.max(0, Number(infrastructuralSpendings || 0)) / safeDivisor
  );

  const priceRatio = price / optimalPrice;

  // priceRatio = 1 => idealFactor, cheaper approaches maxFactor, expensive approaches 0.
  const curveA = maxFactor / idealFactor - 1;
  let infrastructureFactor = maxFactor / (
    1 + curveA * Math.pow(priceRatio, priceRules.priceSteepness)
  );

  infrastructureFactor = clamp(infrastructureFactor, 0, maxFactor);

  const previousAverage = weightedRecentAverage(
    previousPriceFactors,
    priceRules.previousPriceFactorRecencyDecay,
    priceRules.previousPriceFactorMaxClamp
  );

  let historyAdjustedFactor = infrastructureFactor;

  if (previousAverage !== null) {
    const improvement = infrastructureFactor - previousAverage;
    const historyAdjustment = clamp(
      improvement * priceRules.historySensitivity,
      priceRules.historyAdjustmentMin,
      priceRules.historyAdjustmentMax
    );

    historyAdjustedFactor += historyAdjustment;
  }

  historyAdjustedFactor = clamp(historyAdjustedFactor, 0, maxFactor);

  // Social proof / scarcity effect from previous sales.
  // Below neutral point => penalty, above neutral point => boost.
  const salesMomentum = smoothstep(cumulativeSalesFactor);
  const neutralPoint = clamp01(priceRules.salesMomentumNeutralPoint);
  const neutralSafe = Math.max(0.000001, neutralPoint);

  const salesMomentumCentered = (salesMomentum - neutralPoint) / neutralSafe;
  const salesMultiplier = 1 + salesMomentumCentered * priceRules.salesSensitivity;

  let sponsorsMultiplier = 1.0;
  if (Array.isArray(gameState?.sponsors) && typeof getAccumulatedSponsorEffects === 'function') {
    const sponsorsEffect = getAccumulatedSponsorEffects(gameState, sponsorsList);
    sponsorsMultiplier *= (100 + (sponsorsEffect.ticket_reasonableness_boost || 0)) / 100;
  }

  const brandingMultiplier = gameState?.brandingPackage
    ? priceRules.brandingMultiplier
    : 1.0;

  const wifiMultiplier = gameState?.premiumWifi
    ? priceRules.premiumWifiMultiplier
    : 1.0;

  const salesTeamMultiplier = getSalesTeamTicketReasonablenessMultiplier(
    gameState,
    globalSettings
  );

  return clamp(
    historyAdjustedFactor *
      salesMultiplier *
      sponsorsMultiplier *
      brandingMultiplier *
      wifiMultiplier *
      salesTeamMultiplier,
    0,
    maxFactor
  );
}

function weightedRecentAverage(values, recencyDecay = 0.7, maxClamp = 2.0) {
  if (!Array.isArray(values) || values.length === 0) return null;

  let weight = 1;
  let total = 0;
  let weightTotal = 0;

  // assumes values are ordered oldest -> newest
  for (let i = values.length - 1; i >= 0; i--) {
    const value = clamp(values[i], 0, maxClamp);
    total += value * weight;
    weightTotal += weight;
    weight *= recencyDecay;
  }

  return weightTotal > 0 ? total / weightTotal : null;
}

/* =========================================================
   SALES TEAM EFFECTS
========================================================= */

function applySalesTeamMarketingImpact(marketingScore, gameState, globalSettings) {
  const salesTeam = getSalesTeamById(globalSettings, gameState?.salesTeam);
  const marketingImpact = salesTeam?.effects?.marketing_impact;

  if (!marketingImpact?.active) return;

  const randAddon = randomInt(
    marketingImpact?.value?.from ?? 0,
    marketingImpact?.value?.to ?? 0
  );

  marketingScore.forEach((value, idx) => {
    marketingScore[idx] = value + randAddon;
  });
}

function getSalesTeamTicketReasonablenessMultiplier(gameState, globalSettings) {
  const salesTeam = getSalesTeamById(globalSettings, gameState?.salesTeam);
  const reasonablenessEffect = salesTeam?.effects?.ticket_price_reasonableness;

  if (!reasonablenessEffect?.active) {
    return 1.0;
  }

  const randPercentIncrease = randomInt(
    reasonablenessEffect?.value?.from ?? 0,
    reasonablenessEffect?.value?.to ?? 0
  );

  return (100 + randPercentIncrease) / 100;
}

function getSalesTeamById(globalSettings, salesTeamId) {
  if (!salesTeamId) return null;

  const salesTeams = globalSettings?.salesTeams;

  if (Array.isArray(salesTeams)) {
    return salesTeams.find(item => item?.id === salesTeamId) || null;
  }

  if (salesTeams && typeof salesTeams === 'object') {
    if (salesTeams.id === salesTeamId) return salesTeams;
    return salesTeams[salesTeamId] || null;
  }

  return null;
}

/* =========================================================
   RULES HELPERS
========================================================= */

function getTicketSalesRules(globalSettings, overrides = {}) {
  const adminRules = globalSettings?.baseRules?.ticketSalesRules || {};
  const merged = deepMerge(
    DEFAULT_TICKET_SALES_RULES,
    adminRules,
    overrides || {}
  );

  normalizeTicketSalesRules(merged);
  return merged;
}

function normalizeTicketSalesRules(rules) {
  fixMinMax(rules.infrastructure, 'populationDivisorMinMultiplier', 'populationDivisorMaxMultiplier');
  fixMinMax(rules.priceReasonableness, 'historyAdjustmentMin', 'historyAdjustmentMax');
  fixMinMax(rules.demand, 'minSalesEfficiency', 'maxSalesEfficiency');

  rules.infrastructure.minInfrastructureDivisor = Math.max(
    1,
    Number(rules.infrastructure.minInfrastructureDivisor || 1)
  );

  rules.infrastructure.earlyTurnSofteningTurns = Math.max(
    1,
    Number(rules.infrastructure.earlyTurnSofteningTurns || 1)
  );

  rules.priceReasonableness.minOptimalPrice = Math.max(
    0.000001,
    Number(rules.priceReasonableness.minOptimalPrice || 0.5)
  );

  rules.priceReasonableness.freeTicketFactor = Math.max(
    0,
    Number(rules.priceReasonableness.freeTicketFactor || 0)
  );

  rules.priceReasonableness.maxFactor = Math.max(
    0.000001,
    Number(rules.priceReasonableness.maxFactor || 2.0)
  );

  rules.priceReasonableness.idealFactor = Math.max(
    0.000001,
    Number(rules.priceReasonableness.idealFactor || 1.0)
  );

  rules.priceReasonableness.priceSteepness = Math.max(
    0.000001,
    Number(rules.priceReasonableness.priceSteepness || 1.8)
  );

  rules.priceReasonableness.previousPriceFactorRecencyDecay = clamp(
    rules.priceReasonableness.previousPriceFactorRecencyDecay,
    0,
    1
  );

  rules.priceReasonableness.previousPriceFactorMaxClamp = Math.max(
    0.000001,
    Number(rules.priceReasonableness.previousPriceFactorMaxClamp || 2.0)
  );

  rules.priceReasonableness.salesMomentumNeutralPoint = clamp01(
    rules.priceReasonableness.salesMomentumNeutralPoint
  );

  rules.marketing.saturationK = Math.max(
    1,
    Number(rules.marketing.saturationK || 50)
  );

  rules.demand.maxDemand = Math.max(
    0,
    Number(rules.demand.maxDemand || 0)
  );

  rules.demand.minTurnsLeft = Math.max(
    1,
    Number(rules.demand.minTurnsLeft || 1)
  );
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


/* ####################################################################################### */
/* ####################################################################################### */
/* ####################################################################################### */

/* ---------------------------------------------------------------------------------------- */
/* ------------------------------ VENDOR PROPOSALS LOGIC ---------------------------------- */
/* ---------------------------------------------------------------------------------------- */

const DEFAULT_VENDOR_PROPOSAL_RULES = {
  maxOffersPerTile: 5,
  maxTotalOffers: 12,
  roundPriceTo: 10,

  offerCount: {
    randomBaseMin: 0,
    randomBaseMax: 1.25,
    demandMultiplier: 3,
    salesTeamExtraOffersFrom: 1,
    salesTeamExtraOffersTo: 3,
    weights: {
      ticketSales: 0.30,
      salesEfficiency: 0.20,
      marketing: 0.35,
      proximity: 0.15,
    },
  },

  offerPrice: {
    baseBoothsPriceAdjustmentFrom: -10,
    baseBoothsPriceAdjustmentTo: 15,

    ticketSalesMinMultiplier: 0.85,
    ticketSalesBonusRange: 0.5,

    salesEfficiencyMinMultiplier: 0.6,
    salesEfficiencyBonusRange: 0.8,

    marketingMinMultiplier: 0.6,
    marketingBonusRange: 0.8,

    salesTeamMultiplierFrom: 1.2,
    salesTeamMultiplierTo: 1.5,

    marketNoiseFrom: 0.9,
    marketNoiseTo: 1.2,
  },

  proximity: {
    minMultiplier: 0.55,
    maxMultiplier: 1.75,
    penalties: [],
    bonuses: [],
    genericObjectBonusStrength: 0.16,
    genericObjectSaturationK: 30,
  },

  marketing: {
    saturationK: 50,
    websiteBoostFromPercent: 12,
    websiteBoostToPercent: 25,
  },

  vendorSuitability: {
    regularFrom: 1,
    regularTo: 9,
    premiumFrom: 5,
    premiumTo: 15,
  },
};

function generateProposals(gameState, worldSettings, globalSettings, options = {}) {
  const rules = getVendorProposalRules(globalSettings, options);
  console.log("RULES: ", rules);
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
    rules
  );

  const availableStands = getAvailableVendorTiles(gameState);
  if (availableStands.length < 1) {
    return [];
  }

  const salesTeamOfferAddons = getSalesTeamOfferAddons({
    gameState,
    availableStands,
    maxOffersPerTile: rules.maxOffersPerTile,
    salesTeamExtraOffersFrom: rules.offerCount.salesTeamExtraOffersFrom,
    salesTeamExtraOffersTo: rules.offerCount.salesTeamExtraOffersTo,
  });

  const proposals = [];

  availableStands.forEach((stand, standIdx) => {
    const proximity = calculateVendorTileProximityScore(
      stand.tile,
      gameState,
      worldSettings,
      globalSettings,
      rules
    );

    const baseOfferCount = calculateOfferCountForTile({
      totalSoldTicketsPercentage,
      avgSalesFactor,
      marketingFactor,
      proximityMultiplier: proximity.multiplier,
      rules,
    });

    const offerCount = clampInt(
      baseOfferCount + Number(salesTeamOfferAddons[standIdx] || 0),
      0,
      rules.maxOffersPerTile
    );

    for (let i = 0; i < offerCount; i++) {
      const price = calculateVendorOfferPrice({
        stand,
        gameState,
        globalSettings,
        rules,
        totalSoldTicketsPercentage,
        avgSalesFactor,
        marketingFactor,
        proximityMultiplier: proximity.multiplier,
      });

      proposals.push({
        price,
        obj_key: stand.obj_key,
        tile: stand.tile,
        vendorSuitabilityByGroup: generateVendorSuitabilityByGroup(stand.obj_key, rules),
        vendorId: createVendorId(stand.tile, gameState?.turn, i),
      });
    }
  });

  return shuffleArray(proposals).slice(0, rules.maxTotalOffers);
}

function getSalesTeamOfferAddons({
  gameState,
  availableStands,
  maxOffersPerTile,
  salesTeamExtraOffersFrom,
  salesTeamExtraOffersTo,
}) {
  const addonsList = availableStands.map(() => 0);

  if (!gameState?.salesTeam || availableStands.length < 1) {
    return addonsList;
  }

  let remainingAddons = randomInt(
    salesTeamExtraOffersFrom,
    salesTeamExtraOffersTo
  );

  // This distributes sales-team-generated offers overall, not once per booth.
  // If a booth reaches maxOffersPerTile through addons, we try another booth.
  let safety = availableStands.length * Math.max(1, remainingAddons) * 3;

  while (remainingAddons > 0 && safety > 0) {
    const randBoothIdx = randomInt(0, availableStands.length - 1);

    if (addonsList[randBoothIdx] < maxOffersPerTile) {
      addonsList[randBoothIdx] += 1;
      remainingAddons -= 1;
    }

    safety -= 1;
  }

  return addonsList;
}

/* =========================================================
   OFFER PRICE
========================================================= */

function calculateVendorOfferPrice({
  stand,
  gameState,
  globalSettings,
  rules,
  totalSoldTicketsPercentage,
  avgSalesFactor,
  marketingFactor,
  proximityMultiplier,
}) {
  const objects = globalSettings?.objects || {};
  const obj = objects[stand.obj_key] || {};
  const priceRules = rules.offerPrice;

  let lowHigh = [
    rules?.offerPrice?.baseBoothsPriceAdjustmentFrom ?? 0,
    rules?.offerPrice?.baseBoothsPriceAdjustmentTo ?? 0,
  ];

  const salesTeam = getSalesTeamById(globalSettings, gameState?.salesTeam);
  const vendorOfferBoost = salesTeam?.effects?.vendor_offer_boost;

  if (gameState?.salesTeam && vendorOfferBoost?.active) {
    lowHigh = [
      vendorOfferBoost?.value?.from ?? lowHigh[0],
      vendorOfferBoost?.value?.to ?? lowHigh[1],
    ];
  }

  const priceVariance = randomInt(lowHigh[0], lowHigh[1]);
  const basePrice = Math.max(1, Number(obj.price + priceVariance || 0));

  const ticketSalesMultiplier =
    priceRules.ticketSalesMinMultiplier +
    smoothstep(totalSoldTicketsPercentage) * priceRules.ticketSalesBonusRange;

  const salesFactorMultiplier =
    priceRules.salesEfficiencyMinMultiplier +
    clamp01(avgSalesFactor || 0) * priceRules.salesEfficiencyBonusRange;

  const marketingMultiplier =
    priceRules.marketingMinMultiplier +
    clamp01(marketingFactor) * priceRules.marketingBonusRange;

  const salesTeamMultiplier = gameState?.salesTeam
    ? randomBetween(
        priceRules.salesTeamMultiplierFrom,
        priceRules.salesTeamMultiplierTo
      )
    : 1;

  const marketNoise = randomBetween(
    priceRules.marketNoiseFrom,
    priceRules.marketNoiseTo
  );

  const price =
    basePrice *
    ticketSalesMultiplier *
    salesFactorMultiplier *
    marketingMultiplier *
    proximityMultiplier *
    salesTeamMultiplier *
    marketNoise;

  return roundToNearest(Math.max(1, price), rules.roundPriceTo);
}

/* =========================================================
   OFFER COUNT
========================================================= */

function calculateOfferCountForTile({
  totalSoldTicketsPercentage,
  avgSalesFactor,
  marketingFactor,
  proximityMultiplier,
  rules,
}) {
  const countRules = rules.offerCount;
  const weights = countRules.weights || {};
  const proximityRules = rules.proximity;

  const ticketScore = smoothstep(totalSoldTicketsPercentage);
  const salesScore = clamp01(avgSalesFactor || 0);
  const marketingScore = clamp01(marketingFactor);

  const proximityRange = Math.max(
    0.000001,
    Number(proximityRules.maxMultiplier || 0) - Number(proximityRules.minMultiplier || 0)
  );

  const proximityScore = clamp01(
    (proximityMultiplier - proximityRules.minMultiplier) / proximityRange
  );

  const demandScore =
    ticketScore * Number(weights.ticketSales || 0) +
    salesScore * Number(weights.salesEfficiency || 0) +
    marketingScore * Number(weights.marketing || 0) +
    proximityScore * Number(weights.proximity || 0);

  const count = Math.floor(
    randomBetween(countRules.randomBaseMin, countRules.randomBaseMax) +
    demandScore * countRules.demandMultiplier
  );

  return clampInt(count, 0, rules.maxOffersPerTile);
}

/* =========================================================
   PROXIMITY
========================================================= */

function getProximityModifierValue(neighborObjKey, bonusObjects = [], penaltyObjects = []) {
  const neighborKey = String(neighborObjKey || '');
  const normalizedNeighborKey = normalizeObjectKey(neighborKey);

  const bonus = bonusObjects.find(item => {
    const itemKey = String(item?.object || '');
    return itemKey === neighborKey || normalizeObjectKey(itemKey) === normalizedNeighborKey;
  });

  if (bonus) {
    return Number(bonus.value || 0);
  }

  const penalty = penaltyObjects.find(item => {
    const itemKey = String(item?.object || '');
    return itemKey === neighborKey || normalizeObjectKey(itemKey) === normalizedNeighborKey;
  });

  if (penalty) {
    return 0 - Math.abs(Number(penalty.value || 0));
  }

  return 0;
}

function calculateVendorTileProximityScore(tile, gameState, worldSettings, globalSettings, rules) {
  const board = gameState?.board || {};
  const objects = globalSettings?.objects || {};
  const neighbors = getNeighborTiles(tile, worldSettings?.gridSize || 5);
  const proximityRules = rules.proximity;

  let bonus = 0;

  neighbors.forEach(neighborTile => {
    const neighborObjKey = board[neighborTile];
    if (!neighborObjKey) return;

    const neighborObj = objects[neighborObjKey] || {};

    bonus += getProximityModifierValue(
      neighborObjKey,
      proximityRules.bonuses,
      proximityRules.penalties
    );

    const suitability = Array.isArray(neighborObj.suitability)
      ? neighborObj.suitability
      : [0, 0, 0];

    const positiveSuitability = suitability.reduce(
      (acc, v) => acc + Math.max(0, Number(v || 0)),
      0
    );

    const genericBonus =
      saturate(positiveSuitability, proximityRules.genericObjectSaturationK) *
      proximityRules.genericObjectBonusStrength;

    bonus += genericBonus;
  });

  return {
    multiplier: clamp(
      1 + bonus,
      proximityRules.minMultiplier,
      proximityRules.maxMultiplier
    ),
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
  return normalizeObjectKey(objKey) === 'stand';
}

function isPremiumStandKey(objKey) {
  const key = normalizeObjectKey(objKey);
  return key === 'premium stand' || key === 'premium';
}

function normalizeObjectKey(objKey) {
  return String(objKey || '')
    .trim()
    .toLowerCase()
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ');
}

/* =========================================================
   VENDOR SUITABILITY
========================================================= */

function generateVendorSuitabilityByGroup(objKey, rules) {
  const suitabilityRules = rules.vendorSuitability;

  const total = isPremiumStandKey(objKey)
    ? randomInt(suitabilityRules.premiumFrom, suitabilityRules.premiumTo)
    : randomInt(suitabilityRules.regularFrom, suitabilityRules.regularTo);

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
  const returnArr = [0, 0, 0];
  returnArr[idx] = total;
  return returnArr;
}

/* =========================================================
   MARKETING FACTOR
========================================================= */

function calculateMarketingProposalFactor(gameState, rules) {
  const interest = Array.isArray(gameState?.interest)
    ? gameState.interest
    : [0, 0, 0];

  const marketingRules = rules.marketing;
  const marketingK = Number(marketingRules.saturationK || 50);

  let interestFactor =
    interest.reduce((acc, v) => acc + saturate(v, marketingK), 0) / 3;

  if (gameState?.website) {
    const websiteBoostPercent = randomInt(
      marketingRules.websiteBoostFromPercent,
      marketingRules.websiteBoostToPercent
    );

    interestFactor = (interestFactor * (100 + websiteBoostPercent)) / 100;
  }

  return interestFactor;
}


/* =========================================================
   CONFIG HELPERS
========================================================= */

function getVendorProposalRules(globalSettings, overrides = {}) {
  const adminRules = globalSettings?.baseRules?.vendorProposalRules || {};
  const merged = deepMerge(
    DEFAULT_VENDOR_PROPOSAL_RULES,
    adminRules,
    overrides
  );

  normalizeVendorProposalRules(merged);
  return merged;
}

function normalizeVendorProposalRules(rules) {
  rules.maxOffersPerTile = Math.max(0, Math.round(Number(rules.maxOffersPerTile || 0)));
  rules.maxTotalOffers = Math.max(0, Math.round(Number(rules.maxTotalOffers || 0)));
  rules.roundPriceTo = Math.max(1, Math.round(Number(rules.roundPriceTo || 1)));

  fixMinMax(rules.offerCount, 'randomBaseMin', 'randomBaseMax');
  fixMinMax(rules.offerCount, 'salesTeamExtraOffersFrom', 'salesTeamExtraOffersTo');
  fixMinMax(rules.offerPrice, 'salesTeamMultiplierFrom', 'salesTeamMultiplierTo');
  fixMinMax(rules.offerPrice, 'marketNoiseFrom', 'marketNoiseTo');
  fixMinMax(rules.proximity, 'minMultiplier', 'maxMultiplier');
  fixMinMax(rules.marketing, 'websiteBoostFromPercent', 'websiteBoostToPercent');
  fixMinMax(rules.vendorSuitability, 'regularFrom', 'regularTo');
  fixMinMax(rules.vendorSuitability, 'premiumFrom', 'premiumTo');

  rules.offerCount.salesTeamExtraOffersFrom = Math.max(
    0,
    Math.round(Number(rules.offerCount.salesTeamExtraOffersFrom || 0))
  );
  rules.offerCount.salesTeamExtraOffersTo = Math.max(
    0,
    Math.round(Number(rules.offerCount.salesTeamExtraOffersTo || 0))
  );

  rules.proximity.genericObjectSaturationK = Math.max(
    1,
    Number(rules.proximity.genericObjectSaturationK || 1)
  );

  rules.marketing.saturationK = Math.max(
    1,
    Number(rules.marketing.saturationK || 1)
  );

  rules.vendorSuitability.regularFrom = Math.max(
    1,
    Math.round(Number(rules.vendorSuitability.regularFrom || 1))
  );
  rules.vendorSuitability.regularTo = Math.max(
    1,
    Math.round(Number(rules.vendorSuitability.regularTo || 1))
  );
  rules.vendorSuitability.premiumFrom = Math.max(
    1,
    Math.round(Number(rules.vendorSuitability.premiumFrom || 1))
  );
  rules.vendorSuitability.premiumTo = Math.max(
    1,
    Math.round(Number(rules.vendorSuitability.premiumTo || 1))
  );

  rules.proximity.bonuses = Array.isArray(rules.proximity.bonuses)
    ? rules.proximity.bonuses
    : [];

  rules.proximity.penalties = Array.isArray(rules.proximity.penalties)
    ? rules.proximity.penalties
    : [];
}

/* ---------------------------------------------------------------------------------------- */
/* -------------------------- SATISFACTION RULES CONFIG ----------------------------------- */
/* ---------------------------------------------------------------------------------------- */



// just getting how similar is visitors vector to vendors suitability vector
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
  for(let i = 0; i<x.length; i++){
    if(copy[i]<0){
      copy[i] = 0;
    }
  }

  if(copy.every(itm=>itm==0)){
    return copy;
  }

  return copy.map(itm=>itm/copy.reduce((acc, itm)=>acc+itm, 0));
}

const DEFAULT_SATISFACTION_RULES = {
  simulation: {
    entryGateCount: 6,
    simulationSteps: 20,
    fallbackGateTile: "A1",
  },

  suitabilityNet: {
    emptySquareSuitability: [0, 0, 0],
    emptySquareEffectPower: 1,
    emptySquareAbsorptionPower: 0,
  },

  movement: {
    includeCurrentSquareAsCandidate: true,
    minMovementSuitability: 0,
    currentSquareStayMultiplier: 0.5,
    revisitPenaltyMultiplier: 0.66,
  },

  visitors: {
    finalGroupSatisfactionFloor: 0,
    satisfactionSaturationPower: 1,
    satisfactionSaturationK: 1,
  },

  vendors: {
    vectorMatching: {
      negativeSuitabilityFloor: 0,
      zeroVectorSimilarity: 0,
    },

    visits: {
      satisfactionSaturationPower: 2,
      satisfactionSaturationK: 200,
    },
  },
};

function getSatisfactionRules(globalSettings, overrides = {}) {
  const adminRules = globalSettings?.baseRules?.movementsAndSatisfactionRules || {};

  const merged = deepMerge(
    DEFAULT_SATISFACTION_RULES,
    adminRules,
    overrides || {}
  );

  normalizeSatisfactionRules(merged);
  return merged;
}

function normalizeSatisfactionRules(rules) {
  rules.simulation.entryGateCount = Math.max(
    1,
    Math.round(Number(rules.simulation.entryGateCount || 1))
  );

  rules.simulation.simulationSteps = Math.max(
    0,
    Math.round(Number(rules.simulation.simulationSteps || 0))
  );

  rules.simulation.fallbackGateTile = String(
    rules.simulation.fallbackGateTile || "A1"
  );

  rules.suitabilityNet.emptySquareSuitability = normalizeVec3(
    rules.suitabilityNet.emptySquareSuitability,
    [0, 0, 0]
  );

  rules.suitabilityNet.emptySquareEffectPower = Number(
    rules.suitabilityNet.emptySquareEffectPower ?? 1
  );

  rules.suitabilityNet.emptySquareAbsorptionPower = clamp(
    rules.suitabilityNet.emptySquareAbsorptionPower ?? 0,
    0,
    1
  );

  rules.movement.includeCurrentSquareAsCandidate = Boolean(
    rules.movement.includeCurrentSquareAsCandidate
  );

  rules.movement.minMovementSuitability = Number(
    rules.movement.minMovementSuitability ?? 0
  );

  rules.movement.currentSquareStayMultiplier = Math.max(
    0,
    Number(rules.movement.currentSquareStayMultiplier ?? 0.5)
  );

  rules.movement.revisitPenaltyMultiplier = Math.max(
    0,
    Number(rules.movement.revisitPenaltyMultiplier ?? 0.66)
  );

  rules.visitors.finalGroupSatisfactionFloor = Number(
    rules.visitors.finalGroupSatisfactionFloor ?? 0
  );

  rules.visitors.satisfactionSaturationPower = Math.max(
    0.000001,
    Number(rules.visitors.satisfactionSaturationPower || 1)
  );

  rules.visitors.satisfactionSaturationK = Math.max(
    0.000001,
    Number(rules.visitors.satisfactionSaturationK || 1)
  );

  rules.vendors.vectorMatching.negativeSuitabilityFloor = Number(
    rules.vendors.vectorMatching.negativeSuitabilityFloor ?? 0
  );

  rules.vendors.vectorMatching.zeroVectorSimilarity = Number(
    rules.vendors.vectorMatching.zeroVectorSimilarity ?? 0
  );

  rules.vendors.visits.satisfactionSaturationPower = Math.max(
    0.000001,
    Number(rules.vendors.visits.satisfactionSaturationPower || 2)
  );

  rules.vendors.visits.satisfactionSaturationK = Math.max(
    0.000001,
    Number(rules.vendors.visits.satisfactionSaturationK || 200)
  );
}

function normalizeVec3(value, fallback = [0, 0, 0]) {
  const source = Array.isArray(value) ? value : fallback;

  return [0, 1, 2].map(index => Number(source[index] ?? fallback[index] ?? 0));
}

/* ---------------------------------------------------------------------------------------- */
/* -------------------------- VISITORS SATISFACTION LOGIC --------------------------------- */
/* ---------------------------------------------------------------------------------------- */

function getVisitorsSatisfaction(peopleTracker, rules, bonuses, groupCount = 3) {
  const satisfactionByGroup = Array.from({ length: groupCount }, () => []);
  const visitorRules = rules.visitors;

  for (const person of peopleTracker) {
    const satisfactionVector = Array.isArray(person.satisfactionProgress)
      ? person.satisfactionProgress
      : [];

    if (satisfactionVector.length < 1) {
      satisfactionByGroup[person.group].push(visitorRules.finalGroupSatisfactionFloor);
      continue;
    }

    const personSatisfactionMean = satisfactionVector.reduce(
      (sum, value) => sum + Number(value || 0),
      0
    ) / satisfactionVector.length;

    satisfactionByGroup[person.group].push(personSatisfactionMean);
  }

  const averageSatisfactionByGroup = satisfactionByGroup.map(groupValues => {
    if (!Array.isArray(groupValues) || groupValues.length < 1) {
      return visitorRules.finalGroupSatisfactionFloor;
    }

    const groupAverage = groupValues.reduce(
      (sum, value) => sum + Number(value || 0),
      0
    ) / groupValues.length;

    return Math.max(visitorRules.finalGroupSatisfactionFloor, groupAverage);
  });

  console.log("SATISFACTION BY GROUP: ", satisfactionByGroup);
  console.log("Average satisfaction by group: ", averageSatisfactionByGroup);

  if(bonuses.premiumWifi){
    const multiplier = visitorRules?.premiumWifiMultiplier ?? 1.0;
    for(let i=0; i<averageSatisfactionByGroup.length; i++){
      averageSatisfactionByGroup[i] = averageSatisfactionByGroup[i]*multiplier;
    }
  }

   console.log("Average satisfaction by group after wifi applied: ", averageSatisfactionByGroup);

   if(bonuses.brandingPackage){
    const multiplier = visitorRules?.brandingPackageMultiplier ?? 1.0;
    for(let i=0; i<averageSatisfactionByGroup.length; i++){
      averageSatisfactionByGroup[i] = averageSatisfactionByGroup[i]*multiplier;
    }
   }

   console.log("Average satisfaction by group after branding pack applied: ", averageSatisfactionByGroup);

  return averageSatisfactionByGroup;
}

/* ---------------------------------------------------------------------------------------- */
/* -------------------------- VENDORS SATISFACTION LOGIC ---------------------------------- */
/* ---------------------------------------------------------------------------------------- */


function getVendorsSatisfaction(tileVisits, gameState, rules) {
  const rentedBooths = Array.isArray(gameState?.rentedBooths)
    ? gameState.rentedBooths
    : [];

  if (rentedBooths.length < 1) {
    return 0;
  }

  const vectorRules = rules.vendors.vectorMatching;
  const visitRules = rules.vendors.visits;

  const similarityArr = rentedBooths.map(booth => {
    const normalizedVector1 = normalizeVector(
      booth.vendorSuitabilityByGroup,
      vectorRules
    );

    const normalizedVector2 = normalizeVector(
      tileVisits?.[booth.tile] || [0, 0, 0],
      vectorRules
    );

    const similarity = kosinusSimilarity(
      normalizedVector1,
      normalizedVector2,
      vectorRules.zeroVectorSimilarity
    );

    console.log("Vector1: ", normalizedVector1);
    console.log("Vector2: ", normalizedVector2);
    console.log("Similarity: ", similarity);

    return similarity;
  });

  const visitsSatisfaction = rentedBooths.map(booth => {
    const visits = (tileVisits?.[booth.tile] || [0, 0, 0]).reduce(
      (acc, value) => acc + Number(value || 0),
      0
    );

    return saturation(
      visits,
      visitRules.satisfactionSaturationPower,
      visitRules.satisfactionSaturationK
    );
  });

  console.log("SIMilarity arr: ", similarityArr);
  console.log("VISITS satisfaction: ", visitsSatisfaction);

  const combined = [];
  for (let i = 0; i < visitsSatisfaction.length; i++) {
    combined[i] = similarityArr[i] * visitsSatisfaction[i];
  }

  const overall = combined.length > 0
    ? combined.reduce((acc, value) => acc + Number(value || 0), 0) / combined.length
    : 0;

  console.log("combined: ", combined);
  console.log("overall satisfaction: ", overall);

  return overall;
}

/* ---------------------------------------------------------------------------------------- */
/* -------------------------- EVENT SIMULATION -------------------------------------------- */
/* ---------------------------------------------------------------------------------------- */

function getBatches(populationArray, batchSize, numberOfRandomPeopleAirdrops) {
  const batches = [];

  for (let i = 0; i < numberOfRandomPeopleAirdrops; i++) {
    const to = i !== (numberOfRandomPeopleAirdrops - 1)
      ? i * batchSize + batchSize
      : 10000000000;

    batches.push(populationArray.slice(i * batchSize, to));
  }

  console.log("BATCHES: ", batches);
  return batches;
}

function pickGates(rows, cols, gameState, numberOfRandomPeopleAirdrops, rules) {
  const entryRing = [];

  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      const col = j + 1;

      if (i === 0 || i === rows - 1 || j === 0 || j === cols - 1) {
        entryRing.push(rows_notation[i] + col);
      }
    }
  }

  console.log("ENTRY LAYER: ", entryRing);

  const pickedGates = [];
  const freeSquares = entryRing.filter(tile => !gameState.board[tile]);

  console.log("FREE SQR: ", freeSquares);

  if (freeSquares.length < 1) {
    return [rules.simulation.fallbackGateTile];
  }

  if (freeSquares.length <= numberOfRandomPeopleAirdrops) {
    return freeSquares;
  }

  while (pickedGates.length !== numberOfRandomPeopleAirdrops) {
    const randNum = randomInt(0, freeSquares.length - 1);

    if (!pickedGates.find(tile => tile === freeSquares[randNum])) {
      pickedGates.push(freeSquares[randNum]);
    }
  }

  console.log("Picked Gates: ", pickedGates);
  return pickedGates;
}

function initialArrangement(gates, batches) {
  let batchesFormatted = batches.slice();

  while (gates.length < batchesFormatted.length) {
    batchesFormatted = [
      [...batchesFormatted[0], ...batchesFormatted[1]],
      ...batchesFormatted.slice(2),
    ];

    console.log("Batches formatted: ", batchesFormatted);
  }

  const peopleTracker = [];

  gates.forEach((gate, i) => {
    const batch = Array.isArray(batchesFormatted[i]) ? batchesFormatted[i] : [];

    batch.forEach(group => {
      peopleTracker.push({
        group,
        currentSquare: gate,
        visitedSquaresHistory: [gate],
        totalAccumulatedSuitability: [0, 0, 0],
        satisfactionProgress: [],
      });
    });
  });

  console.log("People tracker: ", peopleTracker);
  return peopleTracker;
}

function eventSimulation(gameState, worldSettings, globalSettings, options = {}) {
  const rules = getSatisfactionRules(globalSettings, options.movementsAndSatisfactionRules);

  const numberOfRandomPeopleAirdrops = rules.simulation.entryGateCount;

  const peopleArr = shuffleArray([
    ...getArrayOfKind(gameState.ticketSales[0], 0),
    ...getArrayOfKind(gameState.ticketSales[1], 1),
    ...getArrayOfKind(gameState.ticketSales[2], 2),
  ]);

  console.log("People arr: ", peopleArr);

  const batchSize = Math.max(
    1,
    Math.round(peopleArr.length / numberOfRandomPeopleAirdrops)
  );

  const batches = getBatches(
    peopleArr,
    batchSize,
    numberOfRandomPeopleAirdrops
  );

  const gates = pickGates(
    worldSettings.gridSize,
    worldSettings.gridSize,
    gameState,
    numberOfRandomPeopleAirdrops,
    rules
  );

  const peopleTracker = initialArrangement(gates, batches);

  const dataForSuitabilityNet = prepareDataForBoardSuitabilityNet(
    gameState,
    worldSettings,
    globalSettings,
    rules
  );

  const netResult = mapBoardSuitabilityNet(
    worldSettings.gridSize,
    worldSettings.gridSize,
    dataForSuitabilityNet
  );

  runSimulationSteps(
    peopleTracker,
    worldSettings.gridSize,
    worldSettings.gridSize,
    netResult,
    dataForSuitabilityNet,
    rules.simulation.simulationSteps,
    rules
  );

  console.log("Final people tracker: ", peopleTracker);
  console.log("SUITABILITY NET: ", netResult);

  const tileVisits = getVisitCountsByTile(
    peopleTracker,
    worldSettings.gridSize,
    worldSettings.gridSize
  );

  console.log("Tile visits: ", tileVisits);

  const bonuses = {
    brandingPackage: gameState.brandingPackage,
    premiumWifi: gameState.premiumWifi,
  }
  const visitorsSatisfaction = getVisitorsSatisfaction(peopleTracker, rules, bonuses);
  const vendorsSatisfaction = getVendorsSatisfaction(tileVisits, gameState, rules);

  return {
    visitorsSatisfaction,
    vendorsSatisfaction,
    tileVisits,
    peopleTracker,
  };
}

/* ---------------------------------------------------------------------------------------- */
/* -------------------------- BOARD SUITABILITY NET --------------------------------------- */
/* ---------------------------------------------------------------------------------------- */

function prepareDataForBoardSuitabilityNet(gameState, worldSettings, globalSettings, rules) {
  const data = [];
  const netRules = rules.suitabilityNet;

  for (let i = 0; i < worldSettings.gridSize; i++) {
    for (let j = 0; j < worldSettings.gridSize; j++) {
      const col = j + 1;
      const tileId = rows_notation[i] + col;
      const objKey = gameState.board[tileId];

      if (!objKey) {
        data.push({
          square: tileId,
          object: "Empty",
          suitability: netRules.emptySquareSuitability.slice(),
          effectPower: netRules.emptySquareEffectPower,
          absorptionPower: netRules.emptySquareAbsorptionPower,
        });

        continue;
      }

      const object = globalSettings.objects[objKey];
      const suitability = Array.isArray(object?.suitability)
        ? object.suitability.slice()
        : [0, 0, 0];

      const booth = (gameState?.rentedBooths ?? []).find(item => item.tile === tileId);
      const vendorSuitability = booth && (
        Array.isArray(booth.vendorSuitabilityByGroup)
          ? booth.vendorSuitabilityByGroup.slice()
          : Array.isArray(booth.suitability)
            ? booth.suitability.slice()
            : null
      );

      if (Array.isArray(vendorSuitability)) {
        vendorSuitability.forEach((value, index) => {
          suitability[index] += Number(value || 0);
        });
      }

      const speakerAppointment = (gameState?.appointedSpeakers ?? [])
        .find(item => item.tileId === tileId);

      if (speakerAppointment) {
        const appointedSpeaker = SPEAKERS_LIST.find(
          item => item.id === speakerAppointment.speakerId
        );

        if (appointedSpeaker && Array.isArray(appointedSpeaker.suitability)) {
          appointedSpeaker.suitability.forEach((value, index) => {
            suitability[index] += Number(value || 0);
          });
        }
      }

      data.push({
        square: tileId,
        object: objKey,
        suitability,
        effectPower: object?.effect ?? 0,
        absorptionPower: object?.absorption ?? 0,
      });
    }
  }

  console.log("DATA: ", data);
  return data;
}

function mapBoardSuitabilityNet(rows, cols, items) {
  const parseId = id => {
    const m = id.match(/^([A-Z]+)(\d+)$/);
    if (!m) throw new Error(`Invalid square ID: ${id}`);

    let row = 0;
    for (const ch of m[1]) row = row * 26 + (ch.charCodeAt(0) - 64);

    return {
      row: row - 1,
      col: parseInt(m[2], 10) - 1,
    };
  };

  const makeId = (row, col) => {
    let letters = "";
    let r = row + 1;

    while (r > 0) {
      letters = String.fromCharCode(65 + (r - 1) % 26) + letters;
      r = Math.floor((r - 1) / 26);
    }

    return letters + (col + 1);
  };

  const board = Array.from({ length: rows }, () => Array(cols).fill(null));

  for (const item of items) {
    const { row, col } = parseId(item.square);
    if (row >= 0 && row < rows && col >= 0 && col < cols) {
      board[row][col] = item;
    }
  }

  const dim = items[0]?.suitability?.length ?? 3;

  const result = Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => Array(dim).fill(0))
  );

  const parentOf = (dr, dc) => {
    const adr = Math.abs(dr);
    const adc = Math.abs(dc);

    if (adr > adc) return [dr - Math.sign(dr), dc];
    if (adc > adr) return [dr, dc - Math.sign(dc)];
    return [dr - Math.sign(dr), dc - Math.sign(dc)];
  };

  for (const item of items) {
    const { suitability, effectPower = 0 } = item;
    if (!suitability || suitability.every(value => value === 0)) continue;

    const { row: sr, col: sc } = parseId(item.square);
    if (sr < 0 || sr >= rows || sc < 0 || sc >= cols) continue;

    for (let i = 0; i < dim; i++) {
      result[sr][sc][i] += suitability[i];
    }

    const factor = Array.from({ length: rows }, () => Array(cols).fill(null));
    factor[sr][sc] = 1;

    const maxLayer = Math.max(sr, rows - 1 - sr, sc, cols - 1 - sc);

    for (let layer = 1; layer <= maxLayer; layer++) {
      for (let dr = -layer; dr <= layer; dr++) {
        for (let dc = -layer; dc <= layer; dc++) {
          if (Math.max(Math.abs(dr), Math.abs(dc)) !== layer) continue;

          const tr = sr + dr;
          const tc = sc + dc;
          if (tr < 0 || tr >= rows || tc < 0 || tc >= cols) continue;

          const [pdr, pdc] = parentOf(dr, dc);
          const pr = sr + pdr;
          const pc = sc + pdc;
          const pf = factor[pr][pc];
          if (pf === null) continue;

          const parentIsSource = pr === sr && pc === sc;
          const parentObj = board[pr][pc];
          const passThrough = parentIsSource || !parentObj
            ? 1
            : 1 - (parentObj.absorptionPower || 0);

          const f = pf * effectPower * passThrough;
          factor[tr][tc] = f;

          for (let i = 0; i < dim; i++) {
            result[tr][tc][i] += suitability[i] * f;
          }
        }
      }
    }
  }

  const out = [];

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      out.push({
        square: makeId(r, c),
        suitability: result[r][c],
      });
    }
  }

  return out;
}

/* ---------------------------------------------------------------------------------------- */
/* -------------------------- SIMULATION STEPPING ----------------------------------------- */
/* ---------------------------------------------------------------------------------------- */

function pickNextSquare(person, rows, cols, netLookup, rules) {
  const movementRules = rules.movement;

  const candidates = movementRules.includeCurrentSquareAsCandidate
    ? [person.currentSquare, ...getNeighborSquares(person.currentSquare, rows, cols)]
    : getNeighborSquares(person.currentSquare, rows, cols);

  if (candidates.length < 1) {
    return person.currentSquare;
  }

  const weights = candidates.map(square => {
    const netSuit = netLookup[square]?.suitability ?? [0, 0, 0];
    let value = netSuit[person.group] ?? 0;

    value = Math.max(movementRules.minMovementSuitability, Number(value || 0));

    if (square === person.currentSquare) {
      value *= movementRules.currentSquareStayMultiplier;
    }

    const visitCount = person.visitedSquaresHistory.reduce(
      (count, visitedSquare) => count + (visitedSquare === square ? 1 : 0),
      0
    );

    for (let i = 0; i < visitCount; i++) {
      value *= movementRules.revisitPenaltyMultiplier;
    }

    return value;
  });

  return weightedPick(candidates, weights);
}

function runSimulationSteps(
  peopleTracker,
  rows,
  cols,
  netResult,
  dataForSuitabilityNet,
  numberOfSimulations,
  rules
) {
  const netLookup = {};
  for (const item of netResult) netLookup[item.square] = item;

  const dataLookup = {};
  for (const item of dataForSuitabilityNet) dataLookup[item.square] = item;

  const visitorRules = rules.visitors;

  for (let step = 0; step < numberOfSimulations; step++) {
    for (const person of peopleTracker) {
      const nextSquare = pickNextSquare(person, rows, cols, netLookup, rules);

      person.currentSquare = nextSquare;
      person.visitedSquaresHistory.push(nextSquare);

      const squareSuit = dataLookup[nextSquare]?.suitability;
      if (!squareSuit) continue;

      for (let i = 0; i < person.totalAccumulatedSuitability.length; i++) {
        person.totalAccumulatedSuitability[i] += squareSuit[i] ?? 0;
      }

      const satisfaction = saturationSigned(
        squareSuit[person.group],
        visitorRules.satisfactionSaturationPower,
        visitorRules.satisfactionSaturationK
      );

      person.satisfactionProgress.push(satisfaction);
    }
  }

  return peopleTracker;
}

function getVisitCountsByTile(peopleTracker, rows, cols) {
  const counts = {};

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


/* -------------------------------------------------------------- */

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



function getAccumulatedSponsorEffects(gameState, sponsors_list){
  const effectsAccumulated = {
       suitability_effect: [0, 0, 0],
       marketing_effect: [0, 0, 0, 0],
       ticket_reasonableness_boost: 0,
  }
  
  if(!gameState?.sponsors || gameState?.sponsors.length<1){
    return effectsAccumulated;
  }

  gameState.sponsors.forEach(itm=>{
    const sponsor = sponsors_list.find(spo => spo.id == itm.id);
    sponsor.possible_offers[itm.deal].suitability_effect.forEach((val, idx)=>{
      effectsAccumulated.suitability_effect[idx] += val;
    })

     sponsor.possible_offers[itm.deal].marketing_effect.forEach((val, idx)=>{
      effectsAccumulated.marketing_effect[idx] += val;
    })

    effectsAccumulated.ticket_reasonableness_boost += sponsor.possible_offers[itm.deal].ticket_reasonableness_boost;
  })

  return effectsAccumulated;
}