import * as numbers from "../../../../kit/numbers.js";
import { WeightedEnrollmentCycle } from "./weighted-enrollment-cycle.js";

/** One step of the weighted enrollment cycle calculation. */
export interface WeightedEnrollmentCycleStep {
  describe(): string;
  adjust(item: WeightedEnrollmentCycle, value: number): number;
}

export class RoundingWeightedEnrollmentCycleAdjuster implements WeightedEnrollmentCycleStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: WeightedEnrollmentCycle, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class PercentWeightedEnrollmentCycleAdjuster implements WeightedEnrollmentCycleStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: WeightedEnrollmentCycle, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class WeightedEnrollmentCycleMinimumOffsetAdjuster implements WeightedEnrollmentCycleStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus minimum times ${this.weight}`;
  }

  adjust(item: WeightedEnrollmentCycle, value: number): number {
    return value + item.minimum * this.weight;
  }
}

export class LabelWeightedEnrollmentCycleAdjuster implements WeightedEnrollmentCycleStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by label";
  }

  adjust(item: WeightedEnrollmentCycle, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the weighted enrollment cycle steps in order and keeps a trace of each. */
export class WeightedEnrollmentCycleEngine {
  steps: WeightedEnrollmentCycleStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: WeightedEnrollmentCycleStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: WeightedEnrollmentCycle): number {
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

  evaluateAll(items: WeightedEnrollmentCycle[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultWeightedEnrollmentCycleEngine(): WeightedEnrollmentCycleEngine {
  return new WeightedEnrollmentCycleEngine(
    [
      new RoundingWeightedEnrollmentCycleAdjuster(0.05),
      new PercentWeightedEnrollmentCycleAdjuster(-7.2),
      new WeightedEnrollmentCycleMinimumOffsetAdjuster(1.27),
      new LabelWeightedEnrollmentCycleAdjuster(
        new Map<string, number>([["central", 0.83], ["west", 1.06], ["east", 1.27]]),
      ),
    ],
    [],
    3.1,
    43030.6,
  );
}
