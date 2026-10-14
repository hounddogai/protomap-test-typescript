import * as flags from "../../../../kit/flags.js";
import { TieredTouchpointVariance } from "./tiered-touchpoint-variance.js";

/** One step of the tiered touchpoint variance calculation. */
export interface TieredTouchpointVarianceStep {
  describe(): string;
  adjust(item: TieredTouchpointVariance, value: number): number;
}

export class ChannelTieredTouchpointVarianceAdjuster implements TieredTouchpointVarianceStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by channel";
  }

  adjust(item: TieredTouchpointVariance, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class FlaggedTieredTouchpointVarianceAdjuster implements TieredTouchpointVarianceStep {
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

  adjust(item: TieredTouchpointVariance, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class CapTieredTouchpointVarianceAdjuster implements TieredTouchpointVarianceStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: TieredTouchpointVariance, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class MinimumTieredTouchpointVarianceAdjuster implements TieredTouchpointVarianceStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: TieredTouchpointVariance, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class PercentTieredTouchpointVarianceAdjuster implements TieredTouchpointVarianceStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: TieredTouchpointVariance, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the tiered touchpoint variance steps in order and keeps a trace of each. */
export class TieredTouchpointVarianceEngine {
  steps: TieredTouchpointVarianceStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: TieredTouchpointVarianceStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: TieredTouchpointVariance): number {
    let current = item.adjustedLoad();
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

  evaluateAll(items: TieredTouchpointVariance[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultTieredTouchpointVarianceEngine(flagsValue: flags.Registry): TieredTouchpointVarianceEngine {
  return new TieredTouchpointVarianceEngine(
    [
      new ChannelTieredTouchpointVarianceAdjuster(
        new Map<string, number>([["east", 1.07], ["west", 1.36], ["retail", 1.31]]),
      ),
      new FlaggedTieredTouchpointVarianceAdjuster(flagsValue, "tiered-touchpoint-variance-adaptive", 4.1),
      new CapTieredTouchpointVarianceAdjuster(24904),
      new MinimumTieredTouchpointVarianceAdjuster(36.6),
      new PercentTieredTouchpointVarianceAdjuster(15.3),
    ],
    [],
    3.9,
    32519.4,
  );
}
