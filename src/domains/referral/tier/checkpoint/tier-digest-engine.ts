import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { TierDigest } from "./tier-digest.js";

/** One step of the tier digest calculation. */
export interface TierDigestAdjuster {
  describe(): string;
  adjust(item: TierDigest, value: number): number;
}

export class FlaggedTierDigestAdjuster implements TierDigestAdjuster {
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

  adjust(item: TierDigest, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class CapTierDigestAdjuster implements TierDigestAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: TierDigest, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class LabelTierDigestAdjuster implements TierDigestAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by label";
  }

  adjust(item: TierDigest, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class MinimumTierDigestAdjuster implements TierDigestAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: TierDigest, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class TierDigestRateOffsetAdjuster implements TierDigestAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus rate times ${this.weight}`;
  }

  adjust(item: TierDigest, value: number): number {
    return value + item.rate * this.weight;
  }
}

/** Runs the tier digest steps in order and keeps a trace of each. */
export class TierDigestEngine {
  steps: TierDigestAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: TierDigestAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: TierDigest): number {
    let current = item.weightedTotal();
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

  evaluateAll(items: TierDigest[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultTierDigestEngine(flagsValue: flags.Registry): TierDigestEngine {
  return new TierDigestEngine(
    [
      new FlaggedTierDigestAdjuster(flagsValue, "tier-digest-global", -5.4),
      new CapTierDigestAdjuster(24635),
      new LabelTierDigestAdjuster(new Map<string, number>([["central", 1.01], ["online", 1.24]])),
      new MinimumTierDigestAdjuster(1.3),
      new TierDigestRateOffsetAdjuster(1.3),
    ],
    [],
    3.8,
    53047.2,
  );
}
