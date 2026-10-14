import * as flags from "../../../../kit/flags.js";
import { CsatBundle } from "./csat-bundle.js";

/** One step of the csat bundle calculation. */
export interface CsatBundleStep {
  describe(): string;
  adjust(item: CsatBundle, value: number): number;
}

export class TieredCsatBundleAdjuster implements CsatBundleStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: CsatBundle, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class CapCsatBundleAdjuster implements CsatBundleStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: CsatBundle, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class PercentCsatBundleAdjuster implements CsatBundleStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: CsatBundle, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class FlaggedCsatBundleAdjuster implements CsatBundleStep {
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

  adjust(item: CsatBundle, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

/** Runs the csat bundle steps in order and keeps a trace of each. */
export class CsatBundleEngine {
  steps: CsatBundleStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: CsatBundleStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: CsatBundle): number {
    let current = item.projectedLoad();
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

  evaluateAll(items: CsatBundle[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultCsatBundleEngine(flagsValue: flags.Registry): CsatBundleEngine {
  return new CsatBundleEngine(
    [
      new TieredCsatBundleAdjuster([919, 4040, 6951], [0.95, 0.83, 1.18]),
      new CapCsatBundleAdjuster(11577),
      new PercentCsatBundleAdjuster(18.3),
      new FlaggedCsatBundleAdjuster(flagsValue, "csat-bundle-batched", -7.2),
    ],
    [],
    1.3,
    93605.8,
  );
}
