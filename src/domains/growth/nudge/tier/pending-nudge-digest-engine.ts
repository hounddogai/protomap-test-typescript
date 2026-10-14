import * as flags from "../../../../kit/flags.js";
import { PendingNudgeDigest } from "./pending-nudge-digest.js";

/** One step of the pending nudge digest calculation. */
export interface PendingNudgeDigestAdjuster {
  describe(): string;
  adjust(item: PendingNudgeDigest, value: number): number;
}

export class CountryPendingNudgeDigestAdjuster implements PendingNudgeDigestAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by country";
  }

  adjust(item: PendingNudgeDigest, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class PendingNudgeDigestExpiresAtOffsetAdjuster implements PendingNudgeDigestAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus expires at times ${this.weight}`;
  }

  adjust(item: PendingNudgeDigest, value: number): number {
    return value + item.expiresAt * this.weight;
  }
}

export class FlaggedPendingNudgeDigestAdjuster implements PendingNudgeDigestAdjuster {
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

  adjust(item: PendingNudgeDigest, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class TieredPendingNudgeDigestAdjuster implements PendingNudgeDigestAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: PendingNudgeDigest, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class CapPendingNudgeDigestAdjuster implements PendingNudgeDigestAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: PendingNudgeDigest, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class PercentPendingNudgeDigestAdjuster implements PendingNudgeDigestAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: PendingNudgeDigest, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the pending nudge digest steps in order and keeps a trace of each. */
export class PendingNudgeDigestEngine {
  steps: PendingNudgeDigestAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: PendingNudgeDigestAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: PendingNudgeDigest): number {
    let current = item.effectiveTotal();
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

  evaluateAll(items: PendingNudgeDigest[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultPendingNudgeDigestEngine(flagsValue: flags.Registry): PendingNudgeDigestEngine {
  return new PendingNudgeDigestEngine(
    [
      new CountryPendingNudgeDigestAdjuster(new Map<string, number>([["east", 0.73], ["online", 0.96]])),
      new PendingNudgeDigestExpiresAtOffsetAdjuster(1.39),
      new FlaggedPendingNudgeDigestAdjuster(flagsValue, "pending-nudge-digest-pending", -3.7),
      new TieredPendingNudgeDigestAdjuster([556, 4403, 6661], [1.13, 1.01, 0.97]),
      new CapPendingNudgeDigestAdjuster(4184),
      new PercentPendingNudgeDigestAdjuster(18.4),
    ],
    [],
    2.3,
    49239.2,
  );
}
