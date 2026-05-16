const SPONSORS_LIST = [
  {
    id: "sponsor1",
    name: "CocaCola",
    requirement_sets: [
      {
        sales_team_required: false,
        min_ticket_sales_percentage: 0,
        //last turn = last element, this both defines the minimum of turns played as well as
        //the efficiency of ticket sales after each of those turns
        min_ticket_sales_efficiency_last_turns: [0.5, 0.5],
        min_suitability_per_group: [5, 5, 5],
        min_infrastructural_investment: 300,
        min_vendors: 0,
        min_appointed_speakers: 1,
      },
      //... OR:
      {
        sales_team_required: true,
        min_ticket_sales_percentage: 45,
        //last turn = last element, this both defines the minimum of turns played as well as
        //the efficiency of ticket sales after each of those turns
        min_ticket_sales_efficiency_last_turns: [],
        min_suitability_per_group: [40, 20, 10],
        min_infrastructural_investment: 300,
        min_vendors: 2,
        min_appointed_speakers: 0,
      },
    ],
    possible_offers: [
      {
        installments: 1,
        amount: 400,
        suitability_effect: [-5, -10, -20],
        marketing_effect: [0, 0, 0, 0],
        ticket_reasonableness_boost: 0, //0 percent
      },
      {
        installments: 3,
        amount: 180,
        suitability_effect: [-5, -10, -20],
        marketing_effect: [5, 5, 5, 5],
        ticket_reasonableness_boost: 3, //3 percent
      },
      {
        installments: 1,
        amount: 0,
        suitability_effect: [0, 0, 0],
        marketing_effect: [10, 10, 10, 10],
        ticket_reasonableness_boost: 5, //3 percent
      },
    ],
  },
  {
    id: "sponsor2",
    name: "Rolex",
    requirement_sets: [
      // High-end crowd path: smaller but premium audience
      {
        sales_team_required: false,
        min_ticket_sales_percentage: 30,
        min_ticket_sales_efficiency_last_turns: [0.9, 0.9, 0.85],
        min_suitability_per_group: [70, 50, 20],
        min_infrastructural_investment: 800,
        min_vendors: 1,
        min_appointed_speakers: 2,
      },
      // OR: prestige-by-volume path with sales team pushing hard
      {
        sales_team_required: true,
        min_ticket_sales_percentage: 70,
        min_ticket_sales_efficiency_last_turns: [],
        min_suitability_per_group: [60, 40, 15],
        min_infrastructural_investment: 1000,
        min_vendors: 0,
        min_appointed_speakers: 1,
      },
    ],
    possible_offers: [
      {
        installments: 1,
        amount: 1500,
        suitability_effect: [-10, -5, 0],
        marketing_effect: [15, 10, 5, 0],
        ticket_reasonableness_boost: 0,
      },
      {
        installments: 4,
        amount: 500,
        suitability_effect: [-5, 0, 0],
        marketing_effect: [20, 15, 10, 5],
        ticket_reasonableness_boost: 2,
      },
      {
        installments: 1,
        amount: 200,
        suitability_effect: [5, 0, -5],
        marketing_effect: [25, 20, 15, 10],
        ticket_reasonableness_boost: 8,
      },
    ],
  },
  {
    id: "sponsor3",
    name: "Nike",
    requirement_sets: [
      // Entertainment-heavy event with broad appeal
      {
        sales_team_required: false,
        min_ticket_sales_percentage: 0,
        min_ticket_sales_efficiency_last_turns: [0.7, 0.7],
        min_suitability_per_group: [20, 40, 50],
        min_infrastructural_investment: 200,
        min_vendors: 1,
        min_appointed_speakers: 3,
      },
    ],
    possible_offers: [
      {
        installments: 1,
        amount: 600,
        suitability_effect: [-8, -5, -3],
        marketing_effect: [3, 5, 8, 10],
        ticket_reasonableness_boost: 1,
      },
      {
        installments: 2,
        amount: 350,
        suitability_effect: [-5, -3, 0],
        marketing_effect: [5, 8, 12, 15],
        ticket_reasonableness_boost: 4,
      },
      {
        installments: 1,
        amount: 100,
        suitability_effect: [0, 0, 5],
        marketing_effect: [8, 12, 18, 22],
        ticket_reasonableness_boost: 6,
      },
    ],
  },
];



window.SPONSORS_LIST = SPONSORS_LIST;
