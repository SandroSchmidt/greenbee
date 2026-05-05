/**
 * This does not do anything at runtime, but it mirrors the current DB schema closely enough
 * to be a reliable reference when navigating this otherwise untyped vanilla JS codebase.
 *
 * Database paths:
 * - /globalsettings
 * - /worlds/{worldId}/worldsettings
 * - /worlds/{worldId}/players/{playerId}
 * - /worlds/{worldId}/players/{playerId}/gameState
 */

export type TimestampMs = number;
export type WorldId = string;
export type PlayerId = string;
export type ObjectKey = string;
export type MarketingChannelKey = string;
export type BoardTileId = string;

export type Vec3 = [number, number, number];
export type CreditOption = [amount: number, interestPercent: number];

export type SalesTeamId = "ironpath" | "northwave" | "havenfield";
export type AssistantId = "mira" | "leo" | "nora";

export interface DatabaseSchema {
  globalsettings: GlobalSettings;
  worlds: Record<WorldId, WorldNode>;
}

export interface WorldNode {
  worldsettings: WorldSettings;
  players?: Record<PlayerId, PlayerRecord>;
}

/**
 * /globalsettings
 * Edited primarily through universalsettings.html.
 */
export interface GlobalSettings {
  /**
   * The app currently expects three audience groups.
   * functions.js defaults this to ["Youth", "Families", "Seniors"].
   */
  groups: Vec3Labels;

  /**
   * Object definitions keyed by object id, e.g. "stage", "bar", "premium".
   * functions.js has a legacy fallback of [] when missing, but the app UI
   * reads/writes this as an object map.
   */
  objects: Record<ObjectKey, GameObjectDefinition>;

  marketingChannels: Record<MarketingChannelKey, MarketingChannelDefinition>;
  baseRules: BaseRules;
}

export type Vec3Labels = [string, string, string];

export interface GameObjectDefinition {
  price: number;
  income: number;
  color: string;
  suitability: Vec3;
  icon: string;
}

export interface MarketingChannelDefinition {
  /**
   * Optional because universalsettings.html currently saves maxSpend and
   * effectiveness, while older/in-memory rows may also carry a label.
   */
  label?: string;
  maxSpend: number;
  effectiveness: Vec3;
  icon?: string;
}

export interface BaseRules {
  suitabilitySaturationK: number;
}

/**
 * /worlds/{worldId}/worldsettings
 * Edited primarily through worldsettings.html.
 */
export interface WorldSettings {
  name: string;
  startBudget: number;
  maxTurns: number;
  gridSize: number;
  population: Vec3;
  creditoptions: CreditOption[];
  objectsEnabled: Record<ObjectKey, boolean>;
  marketingEnabled: Record<MarketingChannelKey, boolean>;
  students: Record<PlayerId, StudentRecord>;
}

export interface StudentRecord {
  name: string;
  code: string;
}

/**
 * /worlds/{worldId}/players/{playerId}
 * ensurePlayer() creates name + lastUpdate. gameState is added separately.
 */
export interface PlayerRecord {
  name: string;
  lastUpdate: TimestampMs;
  gameState?: PersistedGameState;
}

/**
 * Runtime game state before saveGameState() adds lastUpdate.
 */
export interface GameState {
  /**
   * Present after saveGameState() writes the state to Firebase.
   */
  lastUpdate?: TimestampMs;

  turn: number;
  budget: number;

  /**
   * Board cells keyed by tile id, e.g. "A1", "B3".
   * Values are keys from globalsettings.objects.
   */
  board: Record<BoardTileId, ObjectKey>;

  budgetHistory: number[];
  incomeHistory: number[];
  objectIncomeHistory: number[];
  ticketIncomeHistory: number[];

  ticketSales: Vec3;
  ticketSalesProgress: Vec3[];
  ticketPrice: number;
  ticketPriceProgress: number[];
  cumulativeSalesFactorProgress: Vec3[];
  priceReasonablenessProgress: number[];

  /**
   * Older/placeholder field. The active spend plan is marketingPlan.
   */
  marketingBudgetHistory: number[];
  marketingPlan: Record<MarketingChannelKey, number>;
  website: boolean;
  interest: Vec3;

  requestedCredits: RequestedCredit[];
  proposals: VendorProposal[];
  finalCreditRepaymentsApplied: boolean;

  salesTeam: SalesTeamId | null;
  assistant: AssistantId | null;
  assistantHiredTurn: number | null;
  assistantProjectionTurn: number | null;
  assistantProjection: AssistantProjection | null;

  turnReports: TurnReport[];
  infrastructuralSpendings: number;
  rentedBooths: RentedBooth[];
}

/**
 * Saved at /worlds/{worldId}/players/{playerId}/gameState.
 * saveGameState() always adds lastUpdate.
 */
export interface PersistedGameState extends GameState {
  lastUpdate: TimestampMs;
}

export interface RequestedCredit {
  optionIndex: number;
  amount: number;
  interest: number;
  takenTurn: number;
}

export interface VendorProposal {
  id: string;
  price: number;
  obj_key: ObjectKey;
  tile: BoardTileId;
  vendorSuitabilityByGroup: Vec3;
  vendorId?: string;
  vendorName: string;
  turn: number;
  status: ProposalStatus;
}

export interface RentedBooth {
  price: number;
  obj_key: ObjectKey;
  tile: BoardTileId;
  vendorSuitabilityByGroup: Vec3;
  vendorId?: string;
  vendorName?: string;
  acceptedTurn: number;
  proposalId: string;
}

export interface AssistantProjection {
  turn: number;
  estimate: number;
  modelValue: number;
  objectIncome: number;
  ticketIncome: number;
  variancePct: number;
  direction: -1 | 1;
  newSales: Vec3;
  priceReasonableness: number;
}

export interface TurnReport {
  turn: number;
  openingBudget: number;
  objectIncome: number;
  ticketIncome: number;
  totalIncome: number;
  creditRepayment: number;
  closingBudget: number;
  newSales: Vec3;
  totalTicketSales: Vec3;
  salesEfficiency: Vec3;
  priceReasonableness: number;
  ticketPrice: number;
  suitability: Vec3;
  interest: Vec3;
}

/**
 * Static option models used in index.html.
 * GameState stores only their ids.
 */
export interface HireablePartnerDefinition {
  id: string;
  name: string;
  initials: string;
  color: string;
  tagline: string;
  bio: string;
  stats: string[];
  price: number;
}

export type SalesTeamDefinition = HireablePartnerDefinition;
export type AssistantDefinition = HireablePartnerDefinition;

/**
 * Desk menu models currently built in index.html as placeholder data.
 * These are not persisted yet, but they are part of the app data shape.
 */
export type DeskItem = DeskReportItem | DeskProposalItem | DeskNewsItem;

export interface DeskItemBase {
  id: string;
  sender: string;
  turn?: number;
  timestamp?: string;
  title: string;
  preview?: string;
  body?: string;
  read?: boolean;
  icon?: string;
}

export interface DeskReportItem extends DeskItemBase {
  type: "report";
}

export interface DeskNewsItem extends DeskItemBase {
  type: "news";
}

export interface DeskProposalItem extends DeskItemBase {
  type: "proposal";
  status?: ProposalStatus;
  expiresInTurns?: number;
  terms?: DeskProposalTerm[];
}

export type ProposalStatus = "pending" | "accepted" | "declined" | "expired";

export interface DeskProposalTerm {
  label: string;
  value: string;
}

/**
 * Convenience aliases for the Firebase helper function return values.
 */
export type LoadGlobalSettingsResult = GlobalSettings;
export type LoadWorldSettingsResult = WorldSettings;
export type LoadPlayerListResult = Record<PlayerId, PlayerRecord>;
export type LoadGameStateResult = PersistedGameState | null;
