import * as flags from "../../../../kit/flags.js";
import { CappedMentionDigest } from "./capped-mention-digest.js";

/** One step of the capped mention digest calculation. */
export interface CappedMentionDigestStep {
  describe(): string;
  adjust(item: CappedMentionDigest, value: number): number;
}

export class TieredCappedMentionDigestAdjuster implements CappedMentionDigestStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: CappedMentionDigest, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class FlaggedCappedMentionDigestAdjuster implements CappedMentionDigestStep {
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

  adjust(item: CappedMentionDigest, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class PercentCappedMentionDigestAdjuster implements CappedMentionDigestStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: CappedMentionDigest, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class MinimumCappedMentionDigestAdjuster implements CappedMentionDigestStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: CappedMentionDigest, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the capped mention digest steps in order and keeps a trace of each. */
export class CappedMentionDigestEngine {
  steps: CappedMentionDigestStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: CappedMentionDigestStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: CappedMentionDigest): number {
    let current = item.weightedExposure();
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

  evaluateAll(items: CappedMentionDigest[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultCappedMentionDigestEngine(flagsValue: flags.Registry): CappedMentionDigestEngine {
  return new CappedMentionDigestEngine(
    [
      new TieredCappedMentionDigestAdjuster([5921, 7240, 8576], [1.02, 1, 0.95]),
      new FlaggedCappedMentionDigestAdjuster(flagsValue, "capped-mention-digest-fallback", -6),
      new PercentCappedMentionDigestAdjuster(-1.9),
      new MinimumCappedMentionDigestAdjuster(42.6),
    ],
    [],
    2.5,
    20917.3,
  );
}
