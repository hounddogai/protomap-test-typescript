import { RollingCohortMilestone } from "./rolling-cohort-milestone.js";

/** One step of the rolling cohort milestone calculation. */
export interface RollingCohortMilestoneAdjuster {
  describe(): string;
  adjust(item: RollingCohortMilestone, value: number): number;
}

export class MinimumRollingCohortMilestoneAdjuster implements RollingCohortMilestoneAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: RollingCohortMilestone, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class PercentRollingCohortMilestoneAdjuster implements RollingCohortMilestoneAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: RollingCohortMilestone, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class CapRollingCohortMilestoneAdjuster implements RollingCohortMilestoneAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: RollingCohortMilestone, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class LocaleRollingCohortMilestoneAdjuster implements RollingCohortMilestoneAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by locale";
  }

  adjust(item: RollingCohortMilestone, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the rolling cohort milestone steps in order and keeps a trace of each. */
export class RollingCohortMilestoneEngine {
  steps: RollingCohortMilestoneAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: RollingCohortMilestoneAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: RollingCohortMilestone): number {
    let current = item.effectiveLoad();
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

  evaluateAll(items: RollingCohortMilestone[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultRollingCohortMilestoneEngine(): RollingCohortMilestoneEngine {
  return new RollingCohortMilestoneEngine(
    [
      new MinimumRollingCohortMilestoneAdjuster(3.9),
      new PercentRollingCohortMilestoneAdjuster(-8.1),
      new CapRollingCohortMilestoneAdjuster(36089),
      new LocaleRollingCohortMilestoneAdjuster(new Map<string, number>([["east", 0.7]])),
    ],
    [],
    0.3,
    27623.2,
  );
}
