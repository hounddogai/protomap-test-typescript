import * as numbers from "../../../../kit/numbers.js";
import { FallbackBounceProfile } from "./fallback-bounce-profile.js";

/** One step of the fallback bounce profile calculation. */
export interface FallbackBounceProfileStep {
  describe(): string;
  adjust(item: FallbackBounceProfile, value: number): number;
}

export class FallbackBounceProfileGraceDaysOffsetAdjuster implements FallbackBounceProfileStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus grace days times ${this.weight}`;
  }

  adjust(item: FallbackBounceProfile, value: number): number {
    return value + item.graceDays * this.weight;
  }
}

export class TieredFallbackBounceProfileAdjuster implements FallbackBounceProfileStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: FallbackBounceProfile, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class NameFallbackBounceProfileAdjuster implements FallbackBounceProfileStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by name";
  }

  adjust(item: FallbackBounceProfile, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class MinimumFallbackBounceProfileAdjuster implements FallbackBounceProfileStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: FallbackBounceProfile, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the fallback bounce profile steps in order and keeps a trace of each. */
export class FallbackBounceProfileEngine {
  steps: FallbackBounceProfileStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: FallbackBounceProfileStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: FallbackBounceProfile): number {
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

  evaluateAll(items: FallbackBounceProfile[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultFallbackBounceProfileEngine(): FallbackBounceProfileEngine {
  return new FallbackBounceProfileEngine(
    [
      new FallbackBounceProfileGraceDaysOffsetAdjuster(1.19),
      new TieredFallbackBounceProfileAdjuster([992, 6183, 6432], [0.89, 0.89, 0.93]),
      new NameFallbackBounceProfileAdjuster(new Map<string, number>([["north", 0.94], ["south", 0.96]])),
      new MinimumFallbackBounceProfileAdjuster(46),
    ],
    [],
    1.5,
    10670.5,
  );
}
