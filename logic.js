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