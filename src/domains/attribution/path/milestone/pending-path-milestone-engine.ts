import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { PendingPathMilestone } from "./pending-path-milestone.js";

/** One step of the pending path milestone calculation. */
export interface PendingPathMilestoneFactor {
  describe(): string;
  adjust(item: PendingPathMilestone, value: number): number;
}

export class RoundingPendingPathMilestoneAdjuster implements PendingPathMilestoneFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: PendingPathMilestone, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class CapPendingPathMilestoneAdjuster implements PendingPathMilestoneFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: PendingPathMilestone, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class FlaggedPendingPathMilestoneAdjuster implements PendingPathMilestoneFactor {
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

  adjust(item: PendingPathMilestone, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class PendingPathMilestoneVersionOffsetAdjuster implements PendingPathMilestoneFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus version times ${this.weight}`;
  }

  adjust(item: PendingPathMilestone, value: number): number {
    return value + item.version * this.weight;
  }
}

export class MinimumPendingPathMilestoneAdjuster implements PendingPathMilestoneFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: PendingPathMilestone, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class PercentPendingPathMilestoneAdjuster implements PendingPathMilestoneFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: PendingPathMilestone, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the pending path milestone steps in order and keeps a trace of each. */
export class PendingPathMilestoneEngine {
  steps: PendingPathMilestoneFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: PendingPathMilestoneFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: PendingPathMilestone): number {
    let current = item.weightedLoad();
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

  evaluateAll(items: PendingPathMilestone[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultPendingPathMilestoneEngine(flagsValue: flags.Registry): PendingPathMilestoneEngine {
  return new PendingPathMilestoneEngine(
    [
      new RoundingPendingPathMilestoneAdjuster(1),
      new CapPendingPathMilestoneAdjuster(19024),
      new FlaggedPendingPathMilestoneAdjuster(flagsValue, "pending-path-milestone-default", -0.9),
      new PendingPathMilestoneVersionOffsetAdjuster(1.79),
      new MinimumPendingPathMilestoneAdjuster(18.6),
      new PercentPendingPathMilestoneAdjuster(-9),
    ],
    [],
    0.1,
    99512.6,
  );
}
