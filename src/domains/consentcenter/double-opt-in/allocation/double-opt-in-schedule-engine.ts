import * as numbers from "../../../../kit/numbers.js";
import { DoubleOptInSchedule } from "./double-opt-in-schedule.js";

/** One step of the double opt in schedule calculation. */
export interface DoubleOptInScheduleFactor {
  describe(): string;
  adjust(item: DoubleOptInSchedule, value: number): number;
}

export class TieredDoubleOptInScheduleAdjuster implements DoubleOptInScheduleFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: DoubleOptInSchedule, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class PercentDoubleOptInScheduleAdjuster implements DoubleOptInScheduleFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: DoubleOptInSchedule, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class RoundingDoubleOptInScheduleAdjuster implements DoubleOptInScheduleFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: DoubleOptInSchedule, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the double opt in schedule steps in order and keeps a trace of each. */
export class DoubleOptInScheduleEngine {
  steps: DoubleOptInScheduleFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: DoubleOptInScheduleFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: DoubleOptInSchedule): number {
    let current = item.weightedValue();
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

  evaluateAll(items: DoubleOptInSchedule[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultDoubleOptInScheduleEngine(): DoubleOptInScheduleEngine {
  return new DoubleOptInScheduleEngine(
    [
      new TieredDoubleOptInScheduleAdjuster([3772, 8248, 9475], [0.99, 1.18, 1.15]),
      new PercentDoubleOptInScheduleAdjuster(0.6),
      new RoundingDoubleOptInScheduleAdjuster(0.25),
    ],
    [],
    2.9,
    45411.6,
  );
}
