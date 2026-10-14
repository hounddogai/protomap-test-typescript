import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { TieredModelVariance } from "./tiered-model-variance.js";

/** One step of the tiered model variance calculation. */
export interface TieredModelVarianceFactor {
  describe(): string;
  adjust(item: TieredModelVariance, value: number): number;
}

export class FlaggedTieredModelVarianceAdjuster implements TieredModelVarianceFactor {
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

  adjust(item: TieredModelVariance, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class TieredTieredModelVarianceAdjuster implements TieredModelVarianceFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: TieredModelVariance, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class MinimumTieredModelVarianceAdjuster implements TieredModelVarianceFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: TieredModelVariance, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class RoundingTieredModelVarianceAdjuster implements TieredModelVarianceFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: TieredModelVariance, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the tiered model variance steps in order and keeps a trace of each. */
export class TieredModelVarianceEngine {
  steps: TieredModelVarianceFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: TieredModelVarianceFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: TieredModelVariance): number {
    let current = item.projectedVolume();
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

  evaluateAll(items: TieredModelVariance[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultTieredModelVarianceEngine(flagsValue: flags.Registry): TieredModelVarianceEngine {
  return new TieredModelVarianceEngine(
    [
      new FlaggedTieredModelVarianceAdjuster(flagsValue, "tiered-model-variance-legacy", 6.1),
      new TieredTieredModelVarianceAdjuster([6678, 6964, 7461], [1.13, 1.04, 0.88]),
      new MinimumTieredModelVarianceAdjuster(1.7),
      new RoundingTieredModelVarianceAdjuster(1),
    ],
    [],
    4.9,
    49594,
  );
}
