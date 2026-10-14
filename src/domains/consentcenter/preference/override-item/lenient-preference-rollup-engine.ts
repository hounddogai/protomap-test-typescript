import * as numbers from "../../../../kit/numbers.js";
import { LenientPreferenceRollup } from "./lenient-preference-rollup.js";

/** One step of the lenient preference rollup calculation. */
export interface LenientPreferenceRollupModifier {
  describe(): string;
  adjust(item: LenientPreferenceRollup, value: number): number;
}

export class TieredLenientPreferenceRollupAdjuster implements LenientPreferenceRollupModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: LenientPreferenceRollup, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class MinimumLenientPreferenceRollupAdjuster implements LenientPreferenceRollupModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: LenientPreferenceRollup, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class RoundingLenientPreferenceRollupAdjuster implements LenientPreferenceRollupModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: LenientPreferenceRollup, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class PercentLenientPreferenceRollupAdjuster implements LenientPreferenceRollupModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: LenientPreferenceRollup, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class CapLenientPreferenceRollupAdjuster implements LenientPreferenceRollupModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: LenientPreferenceRollup, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the lenient preference rollup steps in order and keeps a trace of each. */
export class LenientPreferenceRollupEngine {
  steps: LenientPreferenceRollupModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: LenientPreferenceRollupModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: LenientPreferenceRollup): number {
    let current = item.effectiveLoad();
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

  evaluateAll(items: LenientPreferenceRollup[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultLenientPreferenceRollupEngine(): LenientPreferenceRollupEngine {
  return new LenientPreferenceRollupEngine(
    [
      new TieredLenientPreferenceRollupAdjuster([1592, 6085, 7849, 9334], [1.1, 0.83, 1.06, 0.91]),
      new MinimumLenientPreferenceRollupAdjuster(46.8),
      new RoundingLenientPreferenceRollupAdjuster(1),
      new PercentLenientPreferenceRollupAdjuster(14.2),
      new CapLenientPreferenceRollupAdjuster(20901),
    ],
    [],
    3.4,
    97524.1,
  );
}
