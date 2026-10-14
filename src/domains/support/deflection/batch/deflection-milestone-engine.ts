import * as numbers from "../../../../kit/numbers.js";
import { DeflectionMilestone } from "./deflection-milestone.js";

/** One step of the deflection milestone calculation. */
export interface DeflectionMilestoneStep {
  describe(): string;
  adjust(item: DeflectionMilestone, value: number): number;
}

export class MinimumDeflectionMilestoneAdjuster implements DeflectionMilestoneStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: DeflectionMilestone, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class RoundingDeflectionMilestoneAdjuster implements DeflectionMilestoneStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: DeflectionMilestone, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class PercentDeflectionMilestoneAdjuster implements DeflectionMilestoneStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: DeflectionMilestone, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class DeflectionMilestoneWindowDaysOffsetAdjuster implements DeflectionMilestoneStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus window days times ${this.weight}`;
  }

  adjust(item: DeflectionMilestone, value: number): number {
    return value + item.windowDays * this.weight;
  }
}

export class LabelDeflectionMilestoneAdjuster implements DeflectionMilestoneStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by label";
  }

  adjust(item: DeflectionMilestone, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class CapDeflectionMilestoneAdjuster implements DeflectionMilestoneStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: DeflectionMilestone, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the deflection milestone steps in order and keeps a trace of each. */
export class DeflectionMilestoneEngine {
  steps: DeflectionMilestoneStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: DeflectionMilestoneStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: DeflectionMilestone): number {
    let current = item.adjustedTotal();
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

  evaluateAll(items: DeflectionMilestone[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultDeflectionMilestoneEngine(): DeflectionMilestoneEngine {
  return new DeflectionMilestoneEngine(
    [
      new MinimumDeflectionMilestoneAdjuster(7.4),
      new RoundingDeflectionMilestoneAdjuster(0.1),
      new PercentDeflectionMilestoneAdjuster(-15.4),
      new DeflectionMilestoneWindowDaysOffsetAdjuster(0.8),
      new LabelDeflectionMilestoneAdjuster(new Map<string, number>([["east", 1.37]])),
      new CapDeflectionMilestoneAdjuster(3220),
    ],
    [],
    0,
    28874.9,
  );
}
