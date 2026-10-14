import * as numbers from "../../../../kit/numbers.js";
import { ManualPaywallClaim } from "./manual-paywall-claim.js";

/** One step of the manual paywall claim calculation. */
export interface ManualPaywallClaimStep {
  describe(): string;
  adjust(item: ManualPaywallClaim, value: number): number;
}

export class TieredManualPaywallClaimAdjuster implements ManualPaywallClaimStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: ManualPaywallClaim, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class CapManualPaywallClaimAdjuster implements ManualPaywallClaimStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: ManualPaywallClaim, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class CategoryManualPaywallClaimAdjuster implements ManualPaywallClaimStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by category";
  }

  adjust(item: ManualPaywallClaim, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the manual paywall claim steps in order and keeps a trace of each. */
export class ManualPaywallClaimEngine {
  steps: ManualPaywallClaimStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ManualPaywallClaimStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: ManualPaywallClaim): number {
    let current = item.adjustedExposure();
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

  evaluateAll(items: ManualPaywallClaim[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultManualPaywallClaimEngine(): ManualPaywallClaimEngine {
  return new ManualPaywallClaimEngine(
    [
      new TieredManualPaywallClaimAdjuster([8536, 9675], [1.03, 0.93]),
      new CapManualPaywallClaimAdjuster(12343),
      new CategoryManualPaywallClaimAdjuster(new Map<string, number>([["online", 0.95], ["east", 1.18]])),
    ],
    [],
    3.5,
    16729.5,
  );
}
