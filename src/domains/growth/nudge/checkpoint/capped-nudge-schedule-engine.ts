import * as numbers from "../../../../kit/numbers.js";
import { CappedNudgeSchedule } from "./capped-nudge-schedule.js";

/** One step of the capped nudge schedule calculation. */
export interface CappedNudgeScheduleStep {
  describe(): string;
  adjust(item: CappedNudgeSchedule, value: number): number;
}

export class RoundingCappedNudgeScheduleAdjuster implements CappedNudgeScheduleStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: CappedNudgeSchedule, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class MinimumCappedNudgeScheduleAdjuster implements CappedNudgeScheduleStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: CappedNudgeSchedule, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class CappedNudgeScheduleRateOffsetAdjuster implements CappedNudgeScheduleStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus rate times ${this.weight}`;
  }

  adjust(item: CappedNudgeSchedule, value: number): number {
    return value + item.rate * this.weight;
  }
}

export class CapCappedNudgeScheduleAdjuster implements CappedNudgeScheduleStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: CappedNudgeSchedule, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the capped nudge schedule steps in order and keeps a trace of each. */
export class CappedNudgeScheduleEngine {
  steps: CappedNudgeScheduleStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: CappedNudgeScheduleStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: CappedNudgeSchedule): number {
    let current = item.adjustedTotal();
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

  evaluateAll(items: CappedNudgeSchedule[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultCappedNudgeScheduleEngine(): CappedNudgeScheduleEngine {
  return new CappedNudgeScheduleEngine(
    [
      new RoundingCappedNudgeScheduleAdjuster(0.25),
      new MinimumCappedNudgeScheduleAdjuster(49.4),
      new CappedNudgeScheduleRateOffsetAdjuster(1.79),
      new CapCappedNudgeScheduleAdjuster(30183),
    ],
    [],
    4.7,
    62973,
  );
}
