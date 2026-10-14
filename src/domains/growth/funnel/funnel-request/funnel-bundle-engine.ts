import * as flags from "../../../../kit/flags.js";
import { FunnelBundle } from "./funnel-bundle.js";

/** One step of the funnel bundle calculation. */
export interface FunnelBundleAdjuster {
  describe(): string;
  adjust(item: FunnelBundle, value: number): number;
}

export class PercentFunnelBundleAdjuster implements FunnelBundleAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: FunnelBundle, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class CapFunnelBundleAdjuster implements FunnelBundleAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: FunnelBundle, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class FlaggedFunnelBundleAdjuster implements FunnelBundleAdjuster {
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

  adjust(item: FunnelBundle, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class FunnelBundleWeightOffsetAdjuster implements FunnelBundleAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus weight times ${this.weight}`;
  }

  adjust(item: FunnelBundle, value: number): number {
    return value + item.weight * this.weight;
  }
}

/** Runs the funnel bundle steps in order and keeps a trace of each. */
export class FunnelBundleEngine {
  steps: FunnelBundleAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: FunnelBundleAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: FunnelBundle): number {
    let current = item.effectiveValue();
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

  evaluateAll(items: FunnelBundle[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultFunnelBundleEngine(flagsValue: flags.Registry): FunnelBundleEngine {
  return new FunnelBundleEngine(
    [
      new PercentFunnelBundleAdjuster(21.2),
      new CapFunnelBundleAdjuster(16300),
      new FlaggedFunnelBundleAdjuster(flagsValue, "funnel-bundle-tiered", -2.8),
      new FunnelBundleWeightOffsetAdjuster(1.88),
    ],
    [],
    2.5,
    55476.4,
  );
}
