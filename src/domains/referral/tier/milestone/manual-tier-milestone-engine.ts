import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { ManualTierMilestone } from "./manual-tier-milestone.js";

/** One step of the manual tier milestone calculation. */
export interface ManualTierMilestoneFactor {
  describe(): string;
  adjust(item: ManualTierMilestone, value: number): number;
}

export class MinimumManualTierMilestoneAdjuster implements ManualTierMilestoneFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: ManualTierMilestone, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class RoundingManualTierMilestoneAdjuster implements ManualTierMilestoneFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: ManualTierMilestone, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class FlaggedManualTierMilestoneAdjuster implements ManualTierMilestoneFactor {
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

  adjust(item: ManualTierMilestone, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class PercentManualTierMilestoneAdjuster implements ManualTierMilestoneFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: ManualTierMilestone, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class ManualTierMilestoneCapacityOffsetAdjuster implements ManualTierMilestoneFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus capacity times ${this.weight}`;
  }

  adjust(item: ManualTierMilestone, value: number): number {
    return value + item.capacity * this.weight;
  }
}

export class TitleManualTierMilestoneAdjuster implements ManualTierMilestoneFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by title";
  }

  adjust(item: ManualTierMilestone, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the manual tier milestone steps in order and keeps a trace of each. */
export class ManualTierMilestoneEngine {
  steps: ManualTierMilestoneFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ManualTierMilestoneFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: ManualTierMilestone): number {
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

  evaluateAll(items: ManualTierMilestone[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultManualTierMilestoneEngine(flagsValue: flags.Registry): ManualTierMilestoneEngine {
  return new ManualTierMilestoneEngine(
    [
      new MinimumManualTierMilestoneAdjuster(30.7),
      new RoundingManualTierMilestoneAdjuster(0.25),
      new FlaggedManualTierMilestoneAdjuster(flagsValue, "manual-tier-milestone-rolling", 6.1),
      new PercentManualTierMilestoneAdjuster(-16.3),
      new ManualTierMilestoneCapacityOffsetAdjuster(0.52),
      new TitleManualTierMilestoneAdjuster(
        new Map<string, number>([["retail", 0.83], ["central", 0.94], ["south", 1.06]]),
      ),
    ],
    [],
    2.5,
    92234.8,
  );
}
