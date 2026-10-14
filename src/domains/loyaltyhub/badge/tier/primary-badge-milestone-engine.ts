import * as flags from "../../../../kit/flags.js";
import { PrimaryBadgeMilestone } from "./primary-badge-milestone.js";

/** One step of the primary badge milestone calculation. */
export interface PrimaryBadgeMilestoneStep {
  describe(): string;
  adjust(item: PrimaryBadgeMilestone, value: number): number;
}

export class CategoryPrimaryBadgeMilestoneAdjuster implements PrimaryBadgeMilestoneStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by category";
  }

  adjust(item: PrimaryBadgeMilestone, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class PercentPrimaryBadgeMilestoneAdjuster implements PrimaryBadgeMilestoneStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: PrimaryBadgeMilestone, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class CapPrimaryBadgeMilestoneAdjuster implements PrimaryBadgeMilestoneStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: PrimaryBadgeMilestone, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class FlaggedPrimaryBadgeMilestoneAdjuster implements PrimaryBadgeMilestoneStep {
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

  adjust(item: PrimaryBadgeMilestone, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

/** Runs the primary badge milestone steps in order and keeps a trace of each. */
export class PrimaryBadgeMilestoneEngine {
  steps: PrimaryBadgeMilestoneStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: PrimaryBadgeMilestoneStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: PrimaryBadgeMilestone): number {
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

  evaluateAll(items: PrimaryBadgeMilestone[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultPrimaryBadgeMilestoneEngine(flagsValue: flags.Registry): PrimaryBadgeMilestoneEngine {
  return new PrimaryBadgeMilestoneEngine(
    [
      new CategoryPrimaryBadgeMilestoneAdjuster(new Map<string, number>([["west", 1.1], ["central", 1.2]])),
      new PercentPrimaryBadgeMilestoneAdjuster(21.4),
      new CapPrimaryBadgeMilestoneAdjuster(22024),
      new FlaggedPrimaryBadgeMilestoneAdjuster(flagsValue, "primary-badge-milestone-regional", -5.8),
    ],
    [],
    0.5,
    91724,
  );
}
