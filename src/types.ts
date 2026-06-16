// Domain types are inferred from the zod schemas in `src/schemas.ts`, which are
// the single source of truth (they also drive the generated OpenAPI components
// and the generator contract tests).
import type { z } from "zod";
import type {
  AllowanceSchema,
  ApproveTxSchema,
  BalanceSchema,
  BtcEventSchema,
  CandleSchema,
  CandleIntervalSchema,
  ChainIdSchema,
  DefiPositionSchema,
  DefiPositionsSchema,
  DefiPositionTypeSchema,
  GenericEventSchema,
  GpsEventSchema,
  LendingHealthSchema,
  OrderSchema,
  PnlBreakdownEntrySchema,
  PnlPeriodSchema,
  PoolSchema,
  PortfolioPnlSchema,
  SwapQuoteSchema,
  TokenPriceSchema,
  TokenSchema,
  TxSchema,
  UserSchema,
  UserStatusSchema,
  WsEventSchema
} from "./schemas.js";

export type UserStatus = z.infer<typeof UserStatusSchema>;
export type User = z.infer<typeof UserSchema>;
export type Order = z.infer<typeof OrderSchema>;
export type ChainId = z.infer<typeof ChainIdSchema>;
export type Token = z.infer<typeof TokenSchema>;
export type TokenPrice = z.infer<typeof TokenPriceSchema>;
export type Balance = z.infer<typeof BalanceSchema>;
export type Tx = z.infer<typeof TxSchema>;
export type SwapQuote = z.infer<typeof SwapQuoteSchema>;
export type Pool = z.infer<typeof PoolSchema>;
export type Allowance = z.infer<typeof AllowanceSchema>;
export type ApproveTx = z.infer<typeof ApproveTxSchema>;
export type DefiPositionType = z.infer<typeof DefiPositionTypeSchema>;
export type DefiPosition = z.infer<typeof DefiPositionSchema>;
export type DefiPositions = z.infer<typeof DefiPositionsSchema>;
export type LendingHealth = z.infer<typeof LendingHealthSchema>;
export type CandleInterval = z.infer<typeof CandleIntervalSchema>;
export type Candle = z.infer<typeof CandleSchema>;
export type PnlPeriod = z.infer<typeof PnlPeriodSchema>;
export type PnlBreakdownEntry = z.infer<typeof PnlBreakdownEntrySchema>;
export type PortfolioPnl = z.infer<typeof PortfolioPnlSchema>;
export type GpsEvent = z.infer<typeof GpsEventSchema>;
export type BtcEvent = z.infer<typeof BtcEventSchema>;
export type GenericEvent = z.infer<typeof GenericEventSchema>;
export type WsEvent = z.infer<typeof WsEventSchema>;
