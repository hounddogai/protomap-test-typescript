import * as numbers from "../../../../kit/numbers.js";
import { ScheduledWarmupMilestone } from "./scheduled-warmup-milestone.js";

/** One step of the scheduled warmup milestone calculation. */
export interface ScheduledWarmupMilestoneAdjuster {
  describe(): string;
  adjust(item: ScheduledWarmupMilestone, value: number): number;
}

export class PercentScheduledWarmupMilestoneAdjuster implements ScheduledWarmupMilestoneAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: ScheduledWarmupMilestone, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class MinimumScheduledWarmupMilestoneAdjuster implements ScheduledWarmupMilestoneAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: ScheduledWarmupMilestone, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class CapScheduledWarmupMilestoneAdjuster implements ScheduledWarmupMilestoneAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: ScheduledWarmupMilestone, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class ScheduledWarmupMilestoneQuantityOffsetAdjuster implements ScheduledWarmupMilestoneAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus quantity times ${this.weight}`;
  }

  adjust(item: ScheduledWarmupMilestone, value: number): number {
    return value + item.quantity * this.weight;
  }
}

export class RoundingScheduledWarmupMilestoneAdjuster implements ScheduledWarmupMilestoneAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: ScheduledWarmupMilestone, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the scheduled warmup milestone steps in order and keeps a trace of each. */
export class ScheduledWarmupMilestoneEngine {
  steps: ScheduledWarmupMilestoneAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ScheduledWarmupMilestoneAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: ScheduledWarmupMilestone): number {
    let current = item.effectiveValue();
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

  evaluateAll(items: ScheduledWarmupMilestone[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultScheduledWarmupMilestoneEngine(): ScheduledWarmupMilestoneEngine {
  return new ScheduledWarmupMilestoneEngine(
    [
      new PercentScheduledWarmupMilestoneAdjuster(-5.5),
      new MinimumScheduledWarmupMilestoneAdjuster(39.2),
      new CapScheduledWarmupMilestoneAdjuster(37498),
      new ScheduledWarmupMilestoneQuantityOffsetAdjuster(1.45),
      new RoundingScheduledWarmupMilestoneAdjuster(0.25),
    ],
    [],
    4.6,
    56876.1,
  );
}
