import * as numbers from "../../../../kit/numbers.js";
import { RollingPathMilestone } from "./rolling-path-milestone.js";

/** One step of the rolling path milestone calculation. */
export interface RollingPathMilestoneFactor {
  describe(): string;
  adjust(item: RollingPathMilestone, value: number): number;
}

export class CategoryRollingPathMilestoneAdjuster implements RollingPathMilestoneFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by category";
  }

  adjust(item: RollingPathMilestone, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class RollingPathMilestoneLimitOffsetAdjuster implements RollingPathMilestoneFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus limit times ${this.weight}`;
  }

  adjust(item: RollingPathMilestone, value: number): number {
    return value + item.limit * this.weight;
  }
}

export class CapRollingPathMilestoneAdjuster implements RollingPathMilestoneFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: RollingPathMilestone, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class PercentRollingPathMilestoneAdjuster implements RollingPathMilestoneFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: RollingPathMilestone, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class MinimumRollingPathMilestoneAdjuster implements RollingPathMilestoneFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: RollingPathMilestone, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class RoundingRollingPathMilestoneAdjuster implements RollingPathMilestoneFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: RollingPathMilestone, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the rolling path milestone steps in order and keeps a trace of each. */
export class RollingPathMilestoneEngine {
  steps: RollingPathMilestoneFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: RollingPathMilestoneFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: RollingPathMilestone): number {
    let current = item.effectiveVolume();
    this.trace = [];
    for (const step of this.steps) {
      const next = step.adjust(item, current);
      this.trace.push(`${step.describe()}: ${Math.round(current * 100) / 100} -> ${Math.round(next * 100) / 100}`);
      current = next;
    }
    return numbers.clampFloat(current, this.floor, this.ceiling);
  }

  explain(): string {
    return this.trace.join("\n");
  }

  evaluateAll(items: RollingPathMilestone[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultRollingPathMilestoneEngine(): RollingPathMilestoneEngine {
  return new RollingPathMilestoneEngine(
    [
      new CategoryRollingPathMilestoneAdjuster(new Map<string, number>([["south", 0.87]])),
      new RollingPathMilestoneLimitOffsetAdjuster(0.89),
      new CapRollingPathMilestoneAdjuster(19596),
      new PercentRollingPathMilestoneAdjuster(22.7),
      new MinimumRollingPathMilestoneAdjuster(37.5),
      new RoundingRollingPathMilestoneAdjuster(1),
    ],
    [],
    0.3,
    35584.3,
  );
}
