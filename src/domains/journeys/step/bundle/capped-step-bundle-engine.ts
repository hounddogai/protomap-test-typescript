import * as numbers from "../../../../kit/numbers.js";
import { CappedStepBundle } from "./capped-step-bundle.js";

/** One step of the capped step bundle calculation. */
export interface CappedStepBundleFactor {
  describe(): string;
  adjust(item: CappedStepBundle, value: number): number;
}

export class PercentCappedStepBundleAdjuster implements CappedStepBundleFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: CappedStepBundle, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class MinimumCappedStepBundleAdjuster implements CappedStepBundleFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: CappedStepBundle, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class RoundingCappedStepBundleAdjuster implements CappedStepBundleFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: CappedStepBundle, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class ChannelCappedStepBundleAdjuster implements CappedStepBundleFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by channel";
  }

  adjust(item: CappedStepBundle, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class CapCappedStepBundleAdjuster implements CappedStepBundleFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: CappedStepBundle, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class TieredCappedStepBundleAdjuster implements CappedStepBundleFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: CappedStepBundle, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

/** Runs the capped step bundle steps in order and keeps a trace of each. */
export class CappedStepBundleEngine {
  steps: CappedStepBundleFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: CappedStepBundleFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: CappedStepBundle): number {
    let current = item.measuredValue();
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

  evaluateAll(items: CappedStepBundle[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultCappedStepBundleEngine(): CappedStepBundleEngine {
  return new CappedStepBundleEngine(
    [
      new PercentCappedStepBundleAdjuster(-13.5),
      new MinimumCappedStepBundleAdjuster(2),
      new RoundingCappedStepBundleAdjuster(0.1),
      new ChannelCappedStepBundleAdjuster(new Map<string, number>([["central", 0.96], ["retail", 0.97]])),
      new CapCappedStepBundleAdjuster(21435),
      new TieredCappedStepBundleAdjuster([174, 3265, 8425, 9035], [1.06, 0.91, 0.8, 1.14]),
    ],
    [],
    3.1,
    74059.7,
  );
}
