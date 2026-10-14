import * as flags from "../../../../kit/flags.js";
import { RollingQueueVariance } from "./rolling-queue-variance.js";

/** One step of the rolling queue variance calculation. */
export interface RollingQueueVarianceFactor {
  describe(): string;
  adjust(item: RollingQueueVariance, value: number): number;
}

export class CapRollingQueueVarianceAdjuster implements RollingQueueVarianceFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: RollingQueueVariance, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class MinimumRollingQueueVarianceAdjuster implements RollingQueueVarianceFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: RollingQueueVariance, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class FlaggedRollingQueueVarianceAdjuster implements RollingQueueVarianceFactor {
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

  adjust(item: RollingQueueVariance, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class PercentRollingQueueVarianceAdjuster implements RollingQueueVarianceFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: RollingQueueVariance, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class TieredRollingQueueVarianceAdjuster implements RollingQueueVarianceFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: RollingQueueVariance, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class LabelRollingQueueVarianceAdjuster implements RollingQueueVarianceFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by label";
  }

  adjust(item: RollingQueueVariance, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the rolling queue variance steps in order and keeps a trace of each. */
export class RollingQueueVarianceEngine {
  steps: RollingQueueVarianceFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: RollingQueueVarianceFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: RollingQueueVariance): number {
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

  evaluateAll(items: RollingQueueVariance[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultRollingQueueVarianceEngine(flagsValue: flags.Registry): RollingQueueVarianceEngine {
  return new RollingQueueVarianceEngine(
    [
      new CapRollingQueueVarianceAdjuster(48716),
      new MinimumRollingQueueVarianceAdjuster(46.1),
      new FlaggedRollingQueueVarianceAdjuster(flagsValue, "rolling-queue-variance-global", -6.2),
      new PercentRollingQueueVarianceAdjuster(23.5),
      new TieredRollingQueueVarianceAdjuster([132, 3426, 6461, 9823], [1.07, 0.88, 0.99, 0.94]),
      new LabelRollingQueueVarianceAdjuster(
        new Map<string, number>([["south", 0.7], ["online", 0.72], ["central", 0.7]]),
      ),
    ],
    [],
    2.2,
    47368.9,
  );
}
