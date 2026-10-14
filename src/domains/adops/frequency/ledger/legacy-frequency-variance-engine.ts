import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { LegacyFrequencyVariance } from "./legacy-frequency-variance.js";

/** One step of the legacy frequency variance calculation. */
export interface LegacyFrequencyVarianceFactor {
  describe(): string;
  adjust(item: LegacyFrequencyVariance, value: number): number;
}

export class FlaggedLegacyFrequencyVarianceAdjuster implements LegacyFrequencyVarianceFactor {
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

  adjust(item: LegacyFrequencyVariance, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class CapLegacyFrequencyVarianceAdjuster implements LegacyFrequencyVarianceFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: LegacyFrequencyVariance, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class MinimumLegacyFrequencyVarianceAdjuster implements LegacyFrequencyVarianceFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: LegacyFrequencyVariance, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class LocaleLegacyFrequencyVarianceAdjuster implements LegacyFrequencyVarianceFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by locale";
  }

  adjust(item: LegacyFrequencyVariance, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class RoundingLegacyFrequencyVarianceAdjuster implements LegacyFrequencyVarianceFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: LegacyFrequencyVariance, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class TieredLegacyFrequencyVarianceAdjuster implements LegacyFrequencyVarianceFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: LegacyFrequencyVariance, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

/** Runs the legacy frequency variance steps in order and keeps a trace of each. */
export class LegacyFrequencyVarianceEngine {
  steps: LegacyFrequencyVarianceFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: LegacyFrequencyVarianceFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: LegacyFrequencyVariance): number {
    let current = item.weightedExposure();
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

  evaluateAll(items: LegacyFrequencyVariance[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultLegacyFrequencyVarianceEngine(flagsValue: flags.Registry): LegacyFrequencyVarianceEngine {
  return new LegacyFrequencyVarianceEngine(
    [
      new FlaggedLegacyFrequencyVarianceAdjuster(flagsValue, "legacy-frequency-variance-lenient", -2.6),
      new CapLegacyFrequencyVarianceAdjuster(42013),
      new MinimumLegacyFrequencyVarianceAdjuster(21.2),
      new LocaleLegacyFrequencyVarianceAdjuster(new Map<string, number>([["retail", 1.04], ["central", 0.92]])),
      new RoundingLegacyFrequencyVarianceAdjuster(1),
      new TieredLegacyFrequencyVarianceAdjuster([4050, 6343, 8588], [1.13, 1.13, 1.11]),
    ],
    [],
    3.8,
    42626.9,
  );
}
