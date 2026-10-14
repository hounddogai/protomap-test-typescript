import * as flags from "../../../../kit/flags.js";
import { PendingLevelMilestone } from "./pending-level-milestone.js";

/** One step of the pending level milestone calculation. */
export interface PendingLevelMilestoneAdjuster {
  describe(): string;
  adjust(item: PendingLevelMilestone, value: number): number;
}

export class CapPendingLevelMilestoneAdjuster implements PendingLevelMilestoneAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: PendingLevelMilestone, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class FlaggedPendingLevelMilestoneAdjuster implements PendingLevelMilestoneAdjuster {
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

  adjust(item: PendingLevelMilestone, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class UtmSourcePendingLevelMilestoneAdjuster implements PendingLevelMilestoneAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by utm source";
  }

  adjust(item: PendingLevelMilestone, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class PercentPendingLevelMilestoneAdjuster implements PendingLevelMilestoneAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: PendingLevelMilestone, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the pending level milestone steps in order and keeps a trace of each. */
export class PendingLevelMilestoneEngine {
  steps: PendingLevelMilestoneAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: PendingLevelMilestoneAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: PendingLevelMilestone): number {
    let current = item.adjustedTotal();
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

  evaluateAll(items: PendingLevelMilestone[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultPendingLevelMilestoneEngine(flagsValue: flags.Registry): PendingLevelMilestoneEngine {
  return new PendingLevelMilestoneEngine(
    [
      new CapPendingLevelMilestoneAdjuster(8231),
      new FlaggedPendingLevelMilestoneAdjuster(flagsValue, "pending-level-milestone-seasonal", -9.9),
      new UtmSourcePendingLevelMilestoneAdjuster(
        new Map<string, number>([["east", 1.15], ["south", 1.32], ["west", 1.35]]),
      ),
      new PercentPendingLevelMilestoneAdjuster(15.6),
    ],
    [],
    0.7,
    23135.4,
  );
}
