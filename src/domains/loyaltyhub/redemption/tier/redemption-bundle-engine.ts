import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { RedemptionBundle } from "./redemption-bundle.js";

/** One step of the redemption bundle calculation. */
export interface RedemptionBundleAdjuster {
  describe(): string;
  adjust(item: RedemptionBundle, value: number): number;
}

export class RoundingRedemptionBundleAdjuster implements RedemptionBundleAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: RedemptionBundle, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class SegmentRedemptionBundleAdjuster implements RedemptionBundleAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by segment";
  }

  adjust(item: RedemptionBundle, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class FlaggedRedemptionBundleAdjuster implements RedemptionBundleAdjuster {
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

  adjust(item: RedemptionBundle, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class CapRedemptionBundleAdjuster implements RedemptionBundleAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: RedemptionBundle, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class RedemptionBundleMaximumOffsetAdjuster implements RedemptionBundleAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus maximum times ${this.weight}`;
  }

  adjust(item: RedemptionBundle, value: number): number {
    return value + item.maximum * this.weight;
  }
}

export class TieredRedemptionBundleAdjuster implements RedemptionBundleAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: RedemptionBundle, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

/** Runs the redemption bundle steps in order and keeps a trace of each. */
export class RedemptionBundleEngine {
  steps: RedemptionBundleAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: RedemptionBundleAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: RedemptionBundle): number {
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

  evaluateAll(items: RedemptionBundle[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultRedemptionBundleEngine(flagsValue: flags.Registry): RedemptionBundleEngine {
  return new RedemptionBundleEngine(
    [
      new RoundingRedemptionBundleAdjuster(0.1),
      new SegmentRedemptionBundleAdjuster(
        new Map<string, number>([["central", 0.91], ["west", 1.33], ["north", 1.18]]),
      ),
      new FlaggedRedemptionBundleAdjuster(flagsValue, "redemption-bundle-pending", 7.2),
      new CapRedemptionBundleAdjuster(19129),
      new RedemptionBundleMaximumOffsetAdjuster(0.57),
      new TieredRedemptionBundleAdjuster([305, 602, 2422, 8320], [1.13, 1.16, 1.15, 0.99]),
    ],
    [],
    4.8,
    59369.2,
  );
}
