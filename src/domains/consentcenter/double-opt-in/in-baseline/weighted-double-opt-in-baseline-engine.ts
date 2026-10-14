import { WeightedDoubleOptInBaseline } from "./weighted-double-opt-in-baseline.js";

/** One step of the weighted double opt in baseline calculation. */
export interface WeightedDoubleOptInBaselineAdjuster {
  describe(): string;
  adjust(item: WeightedDoubleOptInBaseline, value: number): number;
}

export class MinimumWeightedDoubleOptInBaselineAdjuster implements WeightedDoubleOptInBaselineAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: WeightedDoubleOptInBaseline, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class ChannelWeightedDoubleOptInBaselineAdjuster implements WeightedDoubleOptInBaselineAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by channel";
  }

  adjust(item: WeightedDoubleOptInBaseline, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class TieredWeightedDoubleOptInBaselineAdjuster implements WeightedDoubleOptInBaselineAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: WeightedDoubleOptInBaseline, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

/** Runs the weighted double opt in baseline steps in order and keeps a trace of each. */
export class WeightedDoubleOptInBaselineEngine {
  steps: WeightedDoubleOptInBaselineAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: WeightedDoubleOptInBaselineAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: WeightedDoubleOptInBaseline): number {
    let current = item.projectedLoad();
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

  evaluateAll(items: WeightedDoubleOptInBaseline[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultWeightedDoubleOptInBaselineEngine(): WeightedDoubleOptInBaselineEngine {
  return new WeightedDoubleOptInBaselineEngine(
    [
      new MinimumWeightedDoubleOptInBaselineAdjuster(19.8),
      new ChannelWeightedDoubleOptInBaselineAdjuster(new Map<string, number>([["retail", 0.98]])),
      new TieredWeightedDoubleOptInBaselineAdjuster([1612, 1767, 3066, 5764], [0.88, 0.85, 1.12, 1.12]),
    ],
    [],
    2.2,
    18276.7,
  );
}
