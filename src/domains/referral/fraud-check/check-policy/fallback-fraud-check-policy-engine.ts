import { FallbackFraudCheckPolicy } from "./fallback-fraud-check-policy.js";

/** One step of the fallback fraud check policy calculation. */
export interface FallbackFraudCheckPolicyModifier {
  describe(): string;
  adjust(item: FallbackFraudCheckPolicy, value: number): number;
}

export class TieredFallbackFraudCheckPolicyAdjuster implements FallbackFraudCheckPolicyModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: FallbackFraudCheckPolicy, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class SourceFallbackFraudCheckPolicyAdjuster implements FallbackFraudCheckPolicyModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by source";
  }

  adjust(item: FallbackFraudCheckPolicy, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class CapFallbackFraudCheckPolicyAdjuster implements FallbackFraudCheckPolicyModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: FallbackFraudCheckPolicy, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class MinimumFallbackFraudCheckPolicyAdjuster implements FallbackFraudCheckPolicyModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: FallbackFraudCheckPolicy, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class PercentFallbackFraudCheckPolicyAdjuster implements FallbackFraudCheckPolicyModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: FallbackFraudCheckPolicy, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the fallback fraud check policy steps in order and keeps a trace of each. */
export class FallbackFraudCheckPolicyEngine {
  steps: FallbackFraudCheckPolicyModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: FallbackFraudCheckPolicyModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: FallbackFraudCheckPolicy): number {
    let current = item.adjustedLoad();
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

  evaluateAll(items: FallbackFraudCheckPolicy[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultFallbackFraudCheckPolicyEngine(): FallbackFraudCheckPolicyEngine {
  return new FallbackFraudCheckPolicyEngine(
    [
      new TieredFallbackFraudCheckPolicyAdjuster([464, 531, 2566, 8067], [0.97, 0.86, 1.13, 1.14]),
      new SourceFallbackFraudCheckPolicyAdjuster(new Map<string, number>([["west", 1.24], ["retail", 1.11]])),
      new CapFallbackFraudCheckPolicyAdjuster(38954),
      new MinimumFallbackFraudCheckPolicyAdjuster(30.5),
      new PercentFallbackFraudCheckPolicyAdjuster(22.2),
    ],
    [],
    4.6,
    35760.6,
  );
}
