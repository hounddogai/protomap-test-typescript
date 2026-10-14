import { FallbackFraudCheckClaim } from "./fallback-fraud-check-claim.js";

/** One step of the fallback fraud check claim calculation. */
export interface FallbackFraudCheckClaimModifier {
  describe(): string;
  adjust(item: FallbackFraudCheckClaim, value: number): number;
}

export class TieredFallbackFraudCheckClaimAdjuster implements FallbackFraudCheckClaimModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: FallbackFraudCheckClaim, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class FallbackFraudCheckClaimBudgetOffsetAdjuster implements FallbackFraudCheckClaimModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus budget times ${this.weight}`;
  }

  adjust(item: FallbackFraudCheckClaim, value: number): number {
    return value + item.budget * this.weight;
  }
}

export class MinimumFallbackFraudCheckClaimAdjuster implements FallbackFraudCheckClaimModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: FallbackFraudCheckClaim, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class PercentFallbackFraudCheckClaimAdjuster implements FallbackFraudCheckClaimModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: FallbackFraudCheckClaim, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the fallback fraud check claim steps in order and keeps a trace of each. */
export class FallbackFraudCheckClaimEngine {
  steps: FallbackFraudCheckClaimModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: FallbackFraudCheckClaimModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: FallbackFraudCheckClaim): number {
    let current = item.measuredValue();
    this.trace = [];
    for (let index = 0; index < this.steps.length; index++) {
      const step = this.steps[index]!;
      const before = current;
      current = step.adjust(item, current);
      if (before !== current) {
        this.trace.push(`${index + 1}. ${step.describe()} changed ${before} to ${current}`);
      }
    }
    if (current < this.floor) return this.floor;
    if (current > this.ceiling) return this.ceiling;
    return current;
  }

  explain(): string {
    return this.trace.join("\n");
  }

  evaluateAll(items: FallbackFraudCheckClaim[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultFallbackFraudCheckClaimEngine(): FallbackFraudCheckClaimEngine {
  return new FallbackFraudCheckClaimEngine(
    [
      new TieredFallbackFraudCheckClaimAdjuster([4664, 8471], [1.07, 1.2]),
      new FallbackFraudCheckClaimBudgetOffsetAdjuster(0.35),
      new MinimumFallbackFraudCheckClaimAdjuster(12.6),
      new PercentFallbackFraudCheckClaimAdjuster(10),
    ],
    [],
    1,
    23126.9,
  );
}
