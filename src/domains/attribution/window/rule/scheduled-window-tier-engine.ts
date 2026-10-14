import * as flags from "../../../../kit/flags.js";
import { ScheduledWindowTier } from "./scheduled-window-tier.js";

/** One step of the scheduled window tier calculation. */
export interface ScheduledWindowTierFactor {
  describe(): string;
  adjust(item: ScheduledWindowTier, value: number): number;
}

export class ScheduledWindowTierImpressionsOffsetAdjuster implements ScheduledWindowTierFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus impressions times ${this.weight}`;
  }

  adjust(item: ScheduledWindowTier, value: number): number {
    return value + item.impressions * this.weight;
  }
}

export class TitleScheduledWindowTierAdjuster implements ScheduledWindowTierFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by title";
  }

  adjust(item: ScheduledWindowTier, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class CapScheduledWindowTierAdjuster implements ScheduledWindowTierFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: ScheduledWindowTier, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class FlaggedScheduledWindowTierAdjuster implements ScheduledWindowTierFactor {
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

  adjust(item: ScheduledWindowTier, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class PercentScheduledWindowTierAdjuster implements ScheduledWindowTierFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: ScheduledWindowTier, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the scheduled window tier steps in order and keeps a trace of each. */
export class ScheduledWindowTierEngine {
  steps: ScheduledWindowTierFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ScheduledWindowTierFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: ScheduledWindowTier): number {
    let current = item.weightedValue();
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

  evaluateAll(items: ScheduledWindowTier[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultScheduledWindowTierEngine(flagsValue: flags.Registry): ScheduledWindowTierEngine {
  return new ScheduledWindowTierEngine(
    [
      new ScheduledWindowTierImpressionsOffsetAdjuster(0.6),
      new TitleScheduledWindowTierAdjuster(new Map<string, number>([["retail", 0.86]])),
      new CapScheduledWindowTierAdjuster(2824),
      new FlaggedScheduledWindowTierAdjuster(flagsValue, "scheduled-window-tier-default", -0.4),
      new PercentScheduledWindowTierAdjuster(20.2),
    ],
    [],
    4,
    40720.3,
  );
}
