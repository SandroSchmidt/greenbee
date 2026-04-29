function clamp01(v) { return Math.max(0, Math.min(1, Number(v || 0))); }

function saturate(value, k) {
    const v = Math.max(0, Number(value || 0));
    const kk = Math.max(1, Number(k || 1));
    return v <= 0 ? 0 : v / (v + kk);
}

function calculateTicketsAfterTurn(suitabilityVec, worldSettings, gameState, globalSettings) {
      const groupPopulation = worldSettings.population;
      const sold = gameState.ticketSales;
      const marketingScore = gameState.interest;
      const suitabilityScore = suitabilityVec;

      const remaining = groupPopulation.map((total, i) => Math.max(0, total - (sold[i] || 0)));
      const rules = globalSettings.baseRules || {};
      const marketingK = Number(rules.marketingSaturationK || 50);
      const suitabilityK = Number(rules.suitabilitySaturationK || 50);
      const baseDemand = Number(rules.ticketBaseDemand ?? 0.03);
      const marketingWeight = Number(rules.ticketMarketingWeight ?? 0.40);
      const suitabilityWeight = Number(rules.ticketSuitabilityWeight ?? 0.45);
      const synergyWeight = Number(rules.ticketSynergyWeight ?? 0.15);
      const maxDemand = Number(rules.ticketMaxDemand ?? 0.95);

      const maxTurns = Number(worldSettings.maxTurns || 10);
      const currentTurn = Number(gameState.turn || 0);
      const turnsLeft = Math.max(1, maxTurns - currentTurn);

      const newSales = [0, 0, 0];
      const debug = [];

      for (let i = 0; i < 3; i++) {
        if (remaining[i] <= 0) { newSales[i] = 0; continue; }
        const marketingFactor = saturate(marketingScore[i], marketingK);
        const suitabilityFactor = saturate(suitabilityScore[i], suitabilityK);
        let demand =
          baseDemand +
          marketingWeight * marketingFactor +
          suitabilityWeight * suitabilityFactor +
          synergyWeight * marketingFactor * suitabilityFactor;
        demand = Math.min(maxDemand, clamp01(demand));
        const baseSalesPace = remaining[i] / turnsLeft;
        const tickets = Math.min(remaining[i], Math.round(baseSalesPace * demand));
        newSales[i] = tickets;
        debug[i] = { group:i, population:groupPopulation[i], alreadySold:sold[i], remaining:remaining[i],
          marketingScore:marketingScore[i], suitabilityScore:suitabilityScore[i],
          marketingFactor, suitabilityFactor, demand, tickets };
      }

      gameState.ticketSales = sold.map((oldVal, i) => oldVal + (newSales[i] || 0));
      console.log("check LIST: ", debug);
      return gameState.ticketSales;
    }