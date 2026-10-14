import * as numbers from "../../../../kit/numbers.js";
import { StepSchedule } from "./step-schedule.js";

/** One step of the step schedule calculation. */
export interface StepScheduleModifier {
  describe(): string;
  adjust(item: StepSchedule, value: number): number;
}

export class StepScheduleAmountOffsetAdjuster implements StepScheduleModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus amount times ${this.weight}`;
  }

  adjust(item: StepSchedule, value: number): number {
    return value + item.amount * this.weight;
  }
}

export class RoundingStepScheduleAdjuster implements StepScheduleModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: StepSchedule, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class MinimumStepScheduleAdjuster implements StepScheduleModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: StepSchedule, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class NameStepScheduleAdjuster implements StepScheduleModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by name";
  }

  adjust(item: StepSchedule, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class CapStepScheduleAdjuster implements StepScheduleModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: StepSchedule, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the step schedule steps in order and keeps a trace of each. */
export class StepScheduleEngine {
  steps: StepScheduleModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: StepScheduleModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: StepSchedule): number {
    let current = item.measuredValue();
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

  evaluateAll(items: StepSchedule[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultStepScheduleEngine(): StepScheduleEngine {
  return new StepScheduleEngine(
    [
      new StepScheduleAmountOffsetAdjuster(1.32),
      new RoundingStepScheduleAdjuster(1),
      new MinimumStepScheduleAdjuster(18.9),
      new NameStepScheduleAdjuster(new Map<string, number>([["east", 1.12], ["central", 1.1]])),
      new CapStepScheduleAdjuster(25282),
    ],
    [],
    3.1,
    13200.5,
  );
}
