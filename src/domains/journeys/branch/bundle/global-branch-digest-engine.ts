import * as flags from "../../../../kit/flags.js";
import { GlobalBranchDigest } from "./global-branch-digest.js";

/** One step of the global branch digest calculation. */
export interface GlobalBranchDigestAdjuster {
  describe(): string;
  adjust(item: GlobalBranchDigest, value: number): number;
}

export class PercentGlobalBranchDigestAdjuster implements GlobalBranchDigestAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: GlobalBranchDigest, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class TieredGlobalBranchDigestAdjuster implements GlobalBranchDigestAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: GlobalBranchDigest, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class FlaggedGlobalBranchDigestAdjuster implements GlobalBranchDigestAdjuster {
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

  adjust(item: GlobalBranchDigest, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class MinimumGlobalBranchDigestAdjuster implements GlobalBranchDigestAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: GlobalBranchDigest, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class CapGlobalBranchDigestAdjuster implements GlobalBranchDigestAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: GlobalBranchDigest, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the global branch digest steps in order and keeps a trace of each. */
export class GlobalBranchDigestEngine {
  steps: GlobalBranchDigestAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: GlobalBranchDigestAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: GlobalBranchDigest): number {
    let current = item.effectiveExposure();
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

  evaluateAll(items: GlobalBranchDigest[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultGlobalBranchDigestEngine(flagsValue: flags.Registry): GlobalBranchDigestEngine {
  return new GlobalBranchDigestEngine(
    [
      new PercentGlobalBranchDigestAdjuster(7.2),
      new TieredGlobalBranchDigestAdjuster([886, 3101, 7270, 8616], [1.02, 1.2, 0.96, 1.19]),
      new FlaggedGlobalBranchDigestAdjuster(flagsValue, "global-branch-digest-fallback", 6.1),
      new MinimumGlobalBranchDigestAdjuster(20.4),
      new CapGlobalBranchDigestAdjuster(20799),
    ],
    [],
    1.8,
    10069.9,
  );
}
