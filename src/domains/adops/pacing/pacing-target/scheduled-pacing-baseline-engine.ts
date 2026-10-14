import * as numbers from "../../../../kit/numbers.js";
import { ScheduledPacingBaseline } from "./scheduled-pacing-baseline.js";

/** One step of the scheduled pacing baseline calculation. */
export interface ScheduledPacingBaselineFactor {
  describe(): string;
  adjust(item: ScheduledPacingBaseline, value: number): number;
}

export class ScheduledPacingBaselineDurationMinutesOffsetAdjuster implements ScheduledPacingBaselineFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus duration minutes times ${this.weight}`;
  }

  adjust(item: ScheduledPacingBaseline, value: number): number {
    return value + item.durationMinutes * this.weight;
  }
}

export class CapScheduledPacingBaselineAdjuster implements ScheduledPacingBaselineFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: ScheduledPacingBaseline, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class RoundingScheduledPacingBaselineAdjuster implements ScheduledPacingBaselineFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: ScheduledPacingBaseline, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class MinimumScheduledPacingBaselineAdjuster implements ScheduledPacingBaselineFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: ScheduledPacingBaseline, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the scheduled pacing baseline steps in order and keeps a trace of each. */
export class ScheduledPacingBaselineEngine {
  steps: ScheduledPacingBaselineFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ScheduledPacingBaselineFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: ScheduledPacingBaseline): number {
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

  evaluateAll(items: ScheduledPacingBaseline[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultScheduledPacingBaselineEngine(): ScheduledPacingBaselineEngine {
  return new ScheduledPacingBaselineEngine(
    [
      new ScheduledPacingBaselineDurationMinutesOffsetAdjuster(1.74),
      new CapScheduledPacingBaselineAdjuster(5633),
      new RoundingScheduledPacingBaselineAdjuster(0.05),
      new MinimumScheduledPacingBaselineAdjuster(40.8),
    ],
    [],
    3.9,
    1758.3,
  );
}
