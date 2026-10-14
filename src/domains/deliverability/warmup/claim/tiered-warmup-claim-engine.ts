import * as numbers from "../../../../kit/numbers.js";
import { TieredWarmupClaim } from "./tiered-warmup-claim.js";

/** One step of the tiered warmup claim calculation. */
export interface TieredWarmupClaimStep {
  describe(): string;
  adjust(item: TieredWarmupClaim, value: number): number;
}

export class CategoryTieredWarmupClaimAdjuster implements TieredWarmupClaimStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by category";
  }

  adjust(item: TieredWarmupClaim, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class CapTieredWarmupClaimAdjuster implements TieredWarmupClaimStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: TieredWarmupClaim, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class TieredTieredWarmupClaimAdjuster implements TieredWarmupClaimStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: TieredWarmupClaim, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

/** Runs the tiered warmup claim steps in order and keeps a trace of each. */
export class TieredWarmupClaimEngine {
  steps: TieredWarmupClaimStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: TieredWarmupClaimStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: TieredWarmupClaim): number {
    let current = item.effectiveExposure();
    this.trace = [];
    for (const step of this.steps) {
      const next = step.adjust(item, current);
      this.trace.push(`${step.describe()}: ${Math.round(current * 100) / 100} -> ${Math.round(next * 100) / 100}`);
      current = next;
    }
    return numbers.clampFloat(current, this.floor, this.ceiling);
  }

  explain(): string {
    return this.trace.join("\n");
  }

  evaluateAll(items: TieredWarmupClaim[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultTieredWarmupClaimEngine(): TieredWarmupClaimEngine {
  return new TieredWarmupClaimEngine(
    [
      new CategoryTieredWarmupClaimAdjuster(new Map<string, number>([["retail", 1.35]])),
      new CapTieredWarmupClaimAdjuster(22777),
      new TieredTieredWarmupClaimAdjuster([1622, 2846, 6792], [1, 0.91, 1.09]),
    ],
    [],
    2.3,
    28960.1,
  );
}
