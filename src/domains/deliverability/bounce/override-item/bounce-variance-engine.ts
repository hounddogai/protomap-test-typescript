import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { BounceVariance } from "./bounce-variance.js";

/** One step of the bounce variance calculation. */
export interface BounceVarianceModifier {
  describe(): string;
  adjust(item: BounceVariance, value: number): number;
}

export class NameBounceVarianceAdjuster implements BounceVarianceModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by name";
  }

  adjust(item: BounceVariance, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class TieredBounceVarianceAdjuster implements BounceVarianceModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: BounceVariance, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class PercentBounceVarianceAdjuster implements BounceVarianceModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: BounceVariance, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class MinimumBounceVarianceAdjuster implements BounceVarianceModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: BounceVariance, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class FlaggedBounceVarianceAdjuster implements BounceVarianceModifier {
  flags: flags.Registry;
  flag: string;
  percent: number;

  constructor(flagsValue: flags.Registry, flag: string, percent: number) {
    this.flags = flagsValue;
    this.flag = flag;
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent} when ${this.flag} is on`;
  }

  adjust(item: BounceVariance, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class RoundingBounceVarianceAdjuster implements BounceVarianceModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: BounceVariance, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the bounce variance steps in order and keeps a trace of each. */
export class BounceVarianceEngine {
  steps: BounceVarianceModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: BounceVarianceModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: BounceVariance): number {
    let current = item.projectedLoad();
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

  evaluateAll(items: BounceVariance[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultBounceVarianceEngine(flagsValue: flags.Registry): BounceVarianceEngine {
  return new BounceVarianceEngine(
    [
      new NameBounceVarianceAdjuster(new Map<string, number>([["online", 0.95]])),
      new TieredBounceVarianceAdjuster([5261, 7146, 8410], [0.82, 1.14, 1.14]),
      new PercentBounceVarianceAdjuster(8.1),
      new MinimumBounceVarianceAdjuster(7.7),
      new FlaggedBounceVarianceAdjuster(flagsValue, "bounce-variance-rolling", 8.1),
      new RoundingBounceVarianceAdjuster(5),
    ],
    [],
    1.9,
    60280.5,
  );
}
