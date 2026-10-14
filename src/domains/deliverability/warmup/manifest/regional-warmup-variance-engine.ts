import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { RegionalWarmupVariance } from "./regional-warmup-variance.js";

/** One step of the regional warmup variance calculation. */
export interface RegionalWarmupVarianceAdjuster {
  describe(): string;
  adjust(item: RegionalWarmupVariance, value: number): number;
}

export class TitleRegionalWarmupVarianceAdjuster implements RegionalWarmupVarianceAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by title";
  }

  adjust(item: RegionalWarmupVariance, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class RoundingRegionalWarmupVarianceAdjuster implements RegionalWarmupVarianceAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: RegionalWarmupVariance, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class CapRegionalWarmupVarianceAdjuster implements RegionalWarmupVarianceAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: RegionalWarmupVariance, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class MinimumRegionalWarmupVarianceAdjuster implements RegionalWarmupVarianceAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: RegionalWarmupVariance, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class FlaggedRegionalWarmupVarianceAdjuster implements RegionalWarmupVarianceAdjuster {
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

  adjust(item: RegionalWarmupVariance, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class TieredRegionalWarmupVarianceAdjuster implements RegionalWarmupVarianceAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: RegionalWarmupVariance, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

/** Runs the regional warmup variance steps in order and keeps a trace of each. */
export class RegionalWarmupVarianceEngine {
  steps: RegionalWarmupVarianceAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: RegionalWarmupVarianceAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: RegionalWarmupVariance): number {
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

  evaluateAll(items: RegionalWarmupVariance[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultRegionalWarmupVarianceEngine(flagsValue: flags.Registry): RegionalWarmupVarianceEngine {
  return new RegionalWarmupVarianceEngine(
    [
      new TitleRegionalWarmupVarianceAdjuster(
        new Map<string, number>([["central", 0.88], ["south", 1.37], ["retail", 1.06]]),
      ),
      new RoundingRegionalWarmupVarianceAdjuster(0.5),
      new CapRegionalWarmupVarianceAdjuster(40729),
      new MinimumRegionalWarmupVarianceAdjuster(38.2),
      new FlaggedRegionalWarmupVarianceAdjuster(flagsValue, "regional-warmup-variance-scheduled", -10),
      new TieredRegionalWarmupVarianceAdjuster([4181, 7655], [0.97, 0.81]),
    ],
    [],
    0.6,
    47213.2,
  );
}
