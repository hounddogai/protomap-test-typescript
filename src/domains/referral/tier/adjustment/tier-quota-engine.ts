import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { TierQuota } from "./tier-quota.js";

/** One step of the tier quota calculation. */
export interface TierQuotaAdjuster {
  describe(): string;
  adjust(item: TierQuota, value: number): number;
}

export class MinimumTierQuotaAdjuster implements TierQuotaAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: TierQuota, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class FlaggedTierQuotaAdjuster implements TierQuotaAdjuster {
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

  adjust(item: TierQuota, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class RoundingTierQuotaAdjuster implements TierQuotaAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: TierQuota, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class PercentTierQuotaAdjuster implements TierQuotaAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: TierQuota, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class RegionTierQuotaAdjuster implements TierQuotaAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by region";
  }

  adjust(item: TierQuota, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class CapTierQuotaAdjuster implements TierQuotaAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: TierQuota, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the tier quota steps in order and keeps a trace of each. */
export class TierQuotaEngine {
  steps: TierQuotaAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: TierQuotaAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: TierQuota): number {
    let current = item.adjustedValue();
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

  evaluateAll(items: TierQuota[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultTierQuotaEngine(flagsValue: flags.Registry): TierQuotaEngine {
  return new TierQuotaEngine(
    [
      new MinimumTierQuotaAdjuster(36.9),
      new FlaggedTierQuotaAdjuster(flagsValue, "tier-quota-strict", 5.5),
      new RoundingTierQuotaAdjuster(0.25),
      new PercentTierQuotaAdjuster(6.7),
      new RegionTierQuotaAdjuster(new Map<string, number>([["central", 0.73], ["south", 1.2]])),
      new CapTierQuotaAdjuster(40422),
    ],
    [],
    1.9,
    56069.4,
  );
}
