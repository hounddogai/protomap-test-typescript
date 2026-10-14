import { AdaptiveSuppressionPolicy } from "./adaptive-suppression-policy.js";

/** One step of the adaptive suppression policy calculation. */
export interface AdaptiveSuppressionPolicyFactor {
  describe(): string;
  adjust(item: AdaptiveSuppressionPolicy, value: number): number;
}

export class MinimumAdaptiveSuppressionPolicyAdjuster implements AdaptiveSuppressionPolicyFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: AdaptiveSuppressionPolicy, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class CapAdaptiveSuppressionPolicyAdjuster implements AdaptiveSuppressionPolicyFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: AdaptiveSuppressionPolicy, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class AdaptiveSuppressionPolicyCeilingOffsetAdjuster implements AdaptiveSuppressionPolicyFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus ceiling times ${this.weight}`;
  }

  adjust(item: AdaptiveSuppressionPolicy, value: number): number {
    return value + item.ceiling * this.weight;
  }
}

export class TieredAdaptiveSuppressionPolicyAdjuster implements AdaptiveSuppressionPolicyFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: AdaptiveSuppressionPolicy, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

/** Runs the adaptive suppression policy steps in order and keeps a trace of each. */
export class AdaptiveSuppressionPolicyEngine {
  steps: AdaptiveSuppressionPolicyFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: AdaptiveSuppressionPolicyFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: AdaptiveSuppressionPolicy): number {
    let current = item.weightedTotal();
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

  evaluateAll(items: AdaptiveSuppressionPolicy[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultAdaptiveSuppressionPolicyEngine(): AdaptiveSuppressionPolicyEngine {
  return new AdaptiveSuppressionPolicyEngine(
    [
      new MinimumAdaptiveSuppressionPolicyAdjuster(49.2),
      new CapAdaptiveSuppressionPolicyAdjuster(20654),
      new AdaptiveSuppressionPolicyCeilingOffsetAdjuster(1.47),
      new TieredAdaptiveSuppressionPolicyAdjuster([578, 7274], [0.86, 1.13]),
    ],
    [],
    3.2,
    35311.5,
  );
}
