import * as flags from "../../../../kit/flags.js";
import { BadgeMilestone } from "./badge-milestone.js";

/** One step of the badge milestone calculation. */
export interface BadgeMilestoneFactor {
  describe(): string;
  adjust(item: BadgeMilestone, value: number): number;
}

export class FlaggedBadgeMilestoneAdjuster implements BadgeMilestoneFactor {
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

  adjust(item: BadgeMilestone, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class BadgeMilestoneLimitOffsetAdjuster implements BadgeMilestoneFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus limit times ${this.weight}`;
  }

  adjust(item: BadgeMilestone, value: number): number {
    return value + item.limit * this.weight;
  }
}

export class RegionBadgeMilestoneAdjuster implements BadgeMilestoneFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by region";
  }

  adjust(item: BadgeMilestone, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class PercentBadgeMilestoneAdjuster implements BadgeMilestoneFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: BadgeMilestone, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the badge milestone steps in order and keeps a trace of each. */
export class BadgeMilestoneEngine {
  steps: BadgeMilestoneFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: BadgeMilestoneFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: BadgeMilestone): number {
    let current = item.adjustedLoad();
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

  evaluateAll(items: BadgeMilestone[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultBadgeMilestoneEngine(flagsValue: flags.Registry): BadgeMilestoneEngine {
  return new BadgeMilestoneEngine(
    [
      new FlaggedBadgeMilestoneAdjuster(flagsValue, "badge-milestone-pending", 9.1),
      new BadgeMilestoneLimitOffsetAdjuster(0.17),
      new RegionBadgeMilestoneAdjuster(new Map<string, number>([["north", 1.28], ["retail", 1.34]])),
      new PercentBadgeMilestoneAdjuster(14.9),
    ],
    [],
    0.4,
    59372.8,
  );
}
