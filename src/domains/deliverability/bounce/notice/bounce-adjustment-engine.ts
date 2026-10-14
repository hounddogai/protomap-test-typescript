import * as flags from "../../../../kit/flags.js";
import { BounceAdjustment } from "./bounce-adjustment.js";

/** One step of the bounce adjustment calculation. */
export interface BounceAdjustmentFactor {
  describe(): string;
  adjust(item: BounceAdjustment, value: number): number;
}

export class FlaggedBounceAdjustmentAdjuster implements BounceAdjustmentFactor {
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

  adjust(item: BounceAdjustment, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class CapBounceAdjustmentAdjuster implements BounceAdjustmentFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: BounceAdjustment, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class TieredBounceAdjustmentAdjuster implements BounceAdjustmentFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: BounceAdjustment, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class PercentBounceAdjustmentAdjuster implements BounceAdjustmentFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: BounceAdjustment, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the bounce adjustment steps in order and keeps a trace of each. */
export class BounceAdjustmentEngine {
  steps: BounceAdjustmentFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: BounceAdjustmentFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: BounceAdjustment): number {
    let current = item.weightedLoad();
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

  evaluateAll(items: BounceAdjustment[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultBounceAdjustmentEngine(flagsValue: flags.Registry): BounceAdjustmentEngine {
  return new BounceAdjustmentEngine(
    [
      new FlaggedBounceAdjustmentAdjuster(flagsValue, "bounce-adjustment-lenient", 0.5),
      new CapBounceAdjustmentAdjuster(27973),
      new TieredBounceAdjustmentAdjuster([4054, 4401, 6487], [1.04, 0.89, 1.16]),
      new PercentBounceAdjustmentAdjuster(-19.8),
    ],
    [],
    3.2,
    72453.5,
  );
}
