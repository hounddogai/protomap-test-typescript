import * as flags from "../../../../kit/flags.js";
import { ManualLeaderboardQuota } from "./manual-leaderboard-quota.js";

/** One step of the manual leaderboard quota calculation. */
export interface ManualLeaderboardQuotaModifier {
  describe(): string;
  adjust(item: ManualLeaderboardQuota, value: number): number;
}

export class TieredManualLeaderboardQuotaAdjuster implements ManualLeaderboardQuotaModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: ManualLeaderboardQuota, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class CapManualLeaderboardQuotaAdjuster implements ManualLeaderboardQuotaModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: ManualLeaderboardQuota, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class PercentManualLeaderboardQuotaAdjuster implements ManualLeaderboardQuotaModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: ManualLeaderboardQuota, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class LocaleManualLeaderboardQuotaAdjuster implements ManualLeaderboardQuotaModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by locale";
  }

  adjust(item: ManualLeaderboardQuota, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class FlaggedManualLeaderboardQuotaAdjuster implements ManualLeaderboardQuotaModifier {
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

  adjust(item: ManualLeaderboardQuota, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

/** Runs the manual leaderboard quota steps in order and keeps a trace of each. */
export class ManualLeaderboardQuotaEngine {
  steps: ManualLeaderboardQuotaModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ManualLeaderboardQuotaModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: ManualLeaderboardQuota): number {
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

  evaluateAll(items: ManualLeaderboardQuota[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultManualLeaderboardQuotaEngine(flagsValue: flags.Registry): ManualLeaderboardQuotaEngine {
  return new ManualLeaderboardQuotaEngine(
    [
      new TieredManualLeaderboardQuotaAdjuster([1127, 3414, 5459], [1.13, 0.9, 1.08]),
      new CapManualLeaderboardQuotaAdjuster(20458),
      new PercentManualLeaderboardQuotaAdjuster(13.9),
      new LocaleManualLeaderboardQuotaAdjuster(new Map<string, number>([["east", 0.93]])),
      new FlaggedManualLeaderboardQuotaAdjuster(flagsValue, "manual-leaderboard-quota-batched", -4.8),
    ],
    [],
    3.9,
    56535.3,
  );
}
