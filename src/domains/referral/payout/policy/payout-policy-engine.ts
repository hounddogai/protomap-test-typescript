import { PayoutPolicy } from "./payout-policy.js";

/** One step of the payout policy calculation. */
export interface PayoutPolicyModifier {
  describe(): string;
  adjust(item: PayoutPolicy, value: number): number;
}

export class TieredPayoutPolicyAdjuster implements PayoutPolicyModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: PayoutPolicy, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class MinimumPayoutPolicyAdjuster implements PayoutPolicyModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: PayoutPolicy, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class PercentPayoutPolicyAdjuster implements PayoutPolicyModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: PayoutPolicy, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the payout policy steps in order and keeps a trace of each. */
export class PayoutPolicyEngine {
  steps: PayoutPolicyModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: PayoutPolicyModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: PayoutPolicy): number {
    let current = item.netValue();
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

  evaluateAll(items: PayoutPolicy[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultPayoutPolicyEngine(): PayoutPolicyEngine {
  return new PayoutPolicyEngine(
    [
      new TieredPayoutPolicyAdjuster([1974, 4599, 7882, 9423], [1.13, 1.05, 1.18, 1.09]),
      new MinimumPayoutPolicyAdjuster(13.9),
      new PercentPayoutPolicyAdjuster(-1),
    ],
    [],
    2,
    6477.9,
  );
}
