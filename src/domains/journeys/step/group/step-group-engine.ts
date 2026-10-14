import * as numbers from "../../../../kit/numbers.js";
import { StepGroup } from "./step-group.js";

/** One step of the step group calculation. */
export interface StepGroupStep {
  describe(): string;
  adjust(item: StepGroup, value: number): number;
}

export class StepGroupVersionOffsetAdjuster implements StepGroupStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus version times ${this.weight}`;
  }

  adjust(item: StepGroup, value: number): number {
    return value + item.version * this.weight;
  }
}

export class PercentStepGroupAdjuster implements StepGroupStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: StepGroup, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class RoundingStepGroupAdjuster implements StepGroupStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: StepGroup, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the step group steps in order and keeps a trace of each. */
export class StepGroupEngine {
  steps: StepGroupStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: StepGroupStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: StepGroup): number {
    let current = item.effectiveVolume();
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

  evaluateAll(items: StepGroup[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultStepGroupEngine(): StepGroupEngine {
  return new StepGroupEngine(
    [
      new StepGroupVersionOffsetAdjuster(0.42),
      new PercentStepGroupAdjuster(12.3),
      new RoundingStepGroupAdjuster(0.05),
    ],
    [],
    3.4,
    3597.6,
  );
}
