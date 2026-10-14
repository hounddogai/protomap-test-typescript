import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { PendingCsatMilestone } from "./pending-csat-milestone.js";

/** One step of the pending csat milestone calculation. */
export interface PendingCsatMilestoneStep {
  describe(): string;
  adjust(item: PendingCsatMilestone, value: number): number;
}

export class PendingCsatMilestoneCreatedAtOffsetAdjuster implements PendingCsatMilestoneStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus created at times ${this.weight}`;
  }

  adjust(item: PendingCsatMilestone, value: number): number {
    return value + item.createdAt * this.weight;
  }
}

export class MinimumPendingCsatMilestoneAdjuster implements PendingCsatMilestoneStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: PendingCsatMilestone, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class RoundingPendingCsatMilestoneAdjuster implements PendingCsatMilestoneStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: PendingCsatMilestone, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class PercentPendingCsatMilestoneAdjuster implements PendingCsatMilestoneStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: PendingCsatMilestone, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class TieredPendingCsatMilestoneAdjuster implements PendingCsatMilestoneStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: PendingCsatMilestone, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class FlaggedPendingCsatMilestoneAdjuster implements PendingCsatMilestoneStep {
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

  adjust(item: PendingCsatMilestone, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

/** Runs the pending csat milestone steps in order and keeps a trace of each. */
export class PendingCsatMilestoneEngine {
  steps: PendingCsatMilestoneStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: PendingCsatMilestoneStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: PendingCsatMilestone): number {
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

  evaluateAll(items: PendingCsatMilestone[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultPendingCsatMilestoneEngine(flagsValue: flags.Registry): PendingCsatMilestoneEngine {
  return new PendingCsatMilestoneEngine(
    [
      new PendingCsatMilestoneCreatedAtOffsetAdjuster(0.19),
      new MinimumPendingCsatMilestoneAdjuster(41.8),
      new RoundingPendingCsatMilestoneAdjuster(5),
      new PercentPendingCsatMilestoneAdjuster(-7.4),
      new TieredPendingCsatMilestoneAdjuster([1517, 4579, 5151], [1.12, 1.06, 0.93]),
      new FlaggedPendingCsatMilestoneAdjuster(flagsValue, "pending-csat-milestone-scheduled", 7.3),
    ],
    [],
    0.5,
    94963.4,
  );
}
