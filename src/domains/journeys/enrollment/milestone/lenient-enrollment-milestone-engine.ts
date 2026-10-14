import * as numbers from "../../../../kit/numbers.js";
import { LenientEnrollmentMilestone } from "./lenient-enrollment-milestone.js";

/** One step of the lenient enrollment milestone calculation. */
export interface LenientEnrollmentMilestoneAdjuster {
  describe(): string;
  adjust(item: LenientEnrollmentMilestone, value: number): number;
}

export class LenientEnrollmentMilestoneSequenceOffsetAdjuster implements LenientEnrollmentMilestoneAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus sequence times ${this.weight}`;
  }

  adjust(item: LenientEnrollmentMilestone, value: number): number {
    return value + item.sequence * this.weight;
  }
}

export class MinimumLenientEnrollmentMilestoneAdjuster implements LenientEnrollmentMilestoneAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: LenientEnrollmentMilestone, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class RoundingLenientEnrollmentMilestoneAdjuster implements LenientEnrollmentMilestoneAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: LenientEnrollmentMilestone, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the lenient enrollment milestone steps in order and keeps a trace of each. */
export class LenientEnrollmentMilestoneEngine {
  steps: LenientEnrollmentMilestoneAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: LenientEnrollmentMilestoneAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: LenientEnrollmentMilestone): number {
    let current = item.effectiveExposure();
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

  evaluateAll(items: LenientEnrollmentMilestone[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultLenientEnrollmentMilestoneEngine(): LenientEnrollmentMilestoneEngine {
  return new LenientEnrollmentMilestoneEngine(
    [
      new LenientEnrollmentMilestoneSequenceOffsetAdjuster(1.34),
      new MinimumLenientEnrollmentMilestoneAdjuster(41.7),
      new RoundingLenientEnrollmentMilestoneAdjuster(0.5),
    ],
    [],
    3.6,
    10125.3,
  );
}
