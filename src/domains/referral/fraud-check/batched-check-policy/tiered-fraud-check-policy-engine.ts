import { TieredFraudCheckPolicy } from "./tiered-fraud-check-policy.js";

/** One step of the tiered fraud check policy calculation. */
export interface TieredFraudCheckPolicyFactor {
  describe(): string;
  adjust(item: TieredFraudCheckPolicy, value: number): number;
}

export class MinimumTieredFraudCheckPolicyAdjuster implements TieredFraudCheckPolicyFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: TieredFraudCheckPolicy, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class TieredFraudCheckPolicyScoreOffsetAdjuster implements TieredFraudCheckPolicyFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus score times ${this.weight}`;
  }

  adjust(item: TieredFraudCheckPolicy, value: number): number {
    return value + item.score * this.weight;
  }
}

export class TieredTieredFraudCheckPolicyAdjuster implements TieredFraudCheckPolicyFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: TieredFraudCheckPolicy, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

/** Runs the tiered fraud check policy steps in order and keeps a trace of each. */
export class TieredFraudCheckPolicyEngine {
  steps: TieredFraudCheckPolicyFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: TieredFraudCheckPolicyFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: TieredFraudCheckPolicy): number {
    let current = item.projectedExposure();
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

  evaluateAll(items: TieredFraudCheckPolicy[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultTieredFraudCheckPolicyEngine(): TieredFraudCheckPolicyEngine {
  return new TieredFraudCheckPolicyEngine(
    [
      new MinimumTieredFraudCheckPolicyAdjuster(34.1),
      new TieredFraudCheckPolicyScoreOffsetAdjuster(1.16),
      new TieredTieredFraudCheckPolicyAdjuster([1549, 1974, 4069, 7396], [0.92, 0.9, 0.9, 1.18]),
    ],
    [],
    0.6,
    52982.7,
  );
}
