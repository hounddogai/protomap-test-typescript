import * as flags from "../../../../kit/flags.js";
import { ScheduledRewardTarget } from "./scheduled-reward-target.js";

/** One step of the scheduled reward target calculation. */
export interface ScheduledRewardTargetFactor {
  describe(): string;
  adjust(item: ScheduledRewardTarget, value: number): number;
}

export class LocaleScheduledRewardTargetAdjuster implements ScheduledRewardTargetFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by locale";
  }

  adjust(item: ScheduledRewardTarget, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class MinimumScheduledRewardTargetAdjuster implements ScheduledRewardTargetFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: ScheduledRewardTarget, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class FlaggedScheduledRewardTargetAdjuster implements ScheduledRewardTargetFactor {
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

  adjust(item: ScheduledRewardTarget, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class ScheduledRewardTargetCreatedAtOffsetAdjuster implements ScheduledRewardTargetFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus created at times ${this.weight}`;
  }

  adjust(item: ScheduledRewardTarget, value: number): number {
    return value + item.createdAt * this.weight;
  }
}

export class PercentScheduledRewardTargetAdjuster implements ScheduledRewardTargetFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: ScheduledRewardTarget, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class CapScheduledRewardTargetAdjuster implements ScheduledRewardTargetFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: ScheduledRewardTarget, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the scheduled reward target steps in order and keeps a trace of each. */
export class ScheduledRewardTargetEngine {
  steps: ScheduledRewardTargetFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ScheduledRewardTargetFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: ScheduledRewardTarget): number {
    let current = item.projectedExposure();
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

  evaluateAll(items: ScheduledRewardTarget[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultScheduledRewardTargetEngine(flagsValue: flags.Registry): ScheduledRewardTargetEngine {
  return new ScheduledRewardTargetEngine(
    [
      new LocaleScheduledRewardTargetAdjuster(new Map<string, number>([["south", 0.89]])),
      new MinimumScheduledRewardTargetAdjuster(21),
      new FlaggedScheduledRewardTargetAdjuster(flagsValue, "scheduled-reward-target-tiered", -8.9),
      new ScheduledRewardTargetCreatedAtOffsetAdjuster(0.19),
      new PercentScheduledRewardTargetAdjuster(8.3),
      new CapScheduledRewardTargetAdjuster(34273),
    ],
    [],
    1.7,
    38491.9,
  );
}
