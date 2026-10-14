import * as numbers from "../../../../kit/numbers.js";
import { RedemptionBaseline } from "./redemption-baseline.js";

/** One step of the redemption baseline calculation. */
export interface RedemptionBaselineStep {
  describe(): string;
  adjust(item: RedemptionBaseline, value: number): number;
}

export class MinimumRedemptionBaselineAdjuster implements RedemptionBaselineStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: RedemptionBaseline, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class RoundingRedemptionBaselineAdjuster implements RedemptionBaselineStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: RedemptionBaseline, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class TieredRedemptionBaselineAdjuster implements RedemptionBaselineStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: RedemptionBaseline, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class LabelRedemptionBaselineAdjuster implements RedemptionBaselineStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by label";
  }

  adjust(item: RedemptionBaseline, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class CapRedemptionBaselineAdjuster implements RedemptionBaselineStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: RedemptionBaseline, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the redemption baseline steps in order and keeps a trace of each. */
export class RedemptionBaselineEngine {
  steps: RedemptionBaselineStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: RedemptionBaselineStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: RedemptionBaseline): number {
    let current = item.measuredValue();
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

  evaluateAll(items: RedemptionBaseline[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultRedemptionBaselineEngine(): RedemptionBaselineEngine {
  return new RedemptionBaselineEngine(
    [
      new MinimumRedemptionBaselineAdjuster(16.3),
      new RoundingRedemptionBaselineAdjuster(5),
      new TieredRedemptionBaselineAdjuster([123, 8221, 8379, 8657], [0.86, 1.02, 1.14, 0.93]),
      new LabelRedemptionBaselineAdjuster(
        new Map<string, number>([["east", 1.2], ["south", 0.72], ["central", 0.72]]),
      ),
      new CapRedemptionBaselineAdjuster(47616),
    ],
    [],
    2.1,
    70150.2,
  );
}
