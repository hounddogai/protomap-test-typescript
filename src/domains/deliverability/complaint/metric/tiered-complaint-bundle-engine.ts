import * as flags from "../../../../kit/flags.js";
import { TieredComplaintBundle } from "./tiered-complaint-bundle.js";

/** One step of the tiered complaint bundle calculation. */
export interface TieredComplaintBundleFactor {
  describe(): string;
  adjust(item: TieredComplaintBundle, value: number): number;
}

export class TieredComplaintBundleAmountOffsetAdjuster implements TieredComplaintBundleFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus amount times ${this.weight}`;
  }

  adjust(item: TieredComplaintBundle, value: number): number {
    return value + item.amount * this.weight;
  }
}

export class MinimumTieredComplaintBundleAdjuster implements TieredComplaintBundleFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: TieredComplaintBundle, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class TieredTieredComplaintBundleAdjuster implements TieredComplaintBundleFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: TieredComplaintBundle, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class FlaggedTieredComplaintBundleAdjuster implements TieredComplaintBundleFactor {
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

  adjust(item: TieredComplaintBundle, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class PercentTieredComplaintBundleAdjuster implements TieredComplaintBundleFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: TieredComplaintBundle, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class ChannelTieredComplaintBundleAdjuster implements TieredComplaintBundleFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by channel";
  }

  adjust(item: TieredComplaintBundle, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the tiered complaint bundle steps in order and keeps a trace of each. */
export class TieredComplaintBundleEngine {
  steps: TieredComplaintBundleFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: TieredComplaintBundleFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: TieredComplaintBundle): number {
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

  evaluateAll(items: TieredComplaintBundle[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultTieredComplaintBundleEngine(flagsValue: flags.Registry): TieredComplaintBundleEngine {
  return new TieredComplaintBundleEngine(
    [
      new TieredComplaintBundleAmountOffsetAdjuster(0.89),
      new MinimumTieredComplaintBundleAdjuster(45.5),
      new TieredTieredComplaintBundleAdjuster([1527, 2706], [1.2, 1.08]),
      new FlaggedTieredComplaintBundleAdjuster(flagsValue, "tiered-complaint-bundle-regional", -6.3),
      new PercentTieredComplaintBundleAdjuster(11.5),
      new ChannelTieredComplaintBundleAdjuster(
        new Map<string, number>([["north", 1.18], ["online", 0.85], ["west", 0.86]]),
      ),
    ],
    [],
    0.3,
    5574.9,
  );
}
