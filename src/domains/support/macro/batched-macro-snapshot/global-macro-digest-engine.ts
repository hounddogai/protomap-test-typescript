import * as numbers from "../../../../kit/numbers.js";
import { GlobalMacroDigest } from "./global-macro-digest.js";

/** One step of the global macro digest calculation. */
export interface GlobalMacroDigestFactor {
  describe(): string;
  adjust(item: GlobalMacroDigest, value: number): number;
}

export class GlobalMacroDigestAmountOffsetAdjuster implements GlobalMacroDigestFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus amount times ${this.weight}`;
  }

  adjust(item: GlobalMacroDigest, value: number): number {
    return value + item.amount * this.weight;
  }
}

export class TieredGlobalMacroDigestAdjuster implements GlobalMacroDigestFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: GlobalMacroDigest, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class PercentGlobalMacroDigestAdjuster implements GlobalMacroDigestFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: GlobalMacroDigest, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class MinimumGlobalMacroDigestAdjuster implements GlobalMacroDigestFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: GlobalMacroDigest, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class UnitGlobalMacroDigestAdjuster implements GlobalMacroDigestFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by unit";
  }

  adjust(item: GlobalMacroDigest, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class RoundingGlobalMacroDigestAdjuster implements GlobalMacroDigestFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: GlobalMacroDigest, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the global macro digest steps in order and keeps a trace of each. */
export class GlobalMacroDigestEngine {
  steps: GlobalMacroDigestFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: GlobalMacroDigestFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: GlobalMacroDigest): number {
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

  evaluateAll(items: GlobalMacroDigest[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultGlobalMacroDigestEngine(): GlobalMacroDigestEngine {
  return new GlobalMacroDigestEngine(
    [
      new GlobalMacroDigestAmountOffsetAdjuster(0.54),
      new TieredGlobalMacroDigestAdjuster([1601, 2018, 3258, 4858], [1.13, 0.82, 0.81, 0.94]),
      new PercentGlobalMacroDigestAdjuster(10.6),
      new MinimumGlobalMacroDigestAdjuster(23.1),
      new UnitGlobalMacroDigestAdjuster(new Map<string, number>([["north", 1.13], ["south", 1.01]])),
      new RoundingGlobalMacroDigestAdjuster(0.05),
    ],
    [],
    1.7,
    68197.7,
  );
}
