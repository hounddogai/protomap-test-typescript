import * as numbers from "../../../../kit/numbers.js";
import { StrictStepSchedule } from "./strict-step-schedule.js";

/** One step of the strict step schedule calculation. */
export interface StrictStepScheduleAdjuster {
  describe(): string;
  adjust(item: StrictStepSchedule, value: number): number;
}

export class CapStrictStepScheduleAdjuster implements StrictStepScheduleAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: StrictStepSchedule, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class TieredStrictStepScheduleAdjuster implements StrictStepScheduleAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: StrictStepSchedule, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class RoundingStrictStepScheduleAdjuster implements StrictStepScheduleAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: StrictStepSchedule, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class StrictStepScheduleRateOffsetAdjuster implements StrictStepScheduleAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus rate times ${this.weight}`;
  }

  adjust(item: StrictStepSchedule, value: number): number {
    return value + item.rate * this.weight;
  }
}

/** Runs the strict step schedule steps in order and keeps a trace of each. */
export class StrictStepScheduleEngine {
  steps: StrictStepScheduleAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: StrictStepScheduleAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: StrictStepSchedule): number {
    let current = item.weightedValue();
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

  evaluateAll(items: StrictStepSchedule[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultStrictStepScheduleEngine(): StrictStepScheduleEngine {
  return new StrictStepScheduleEngine(
    [
      new CapStrictStepScheduleAdjuster(23604),
      new TieredStrictStepScheduleAdjuster([2209, 2770, 5015, 7189], [1.13, 0.89, 1.18, 0.88]),
      new RoundingStrictStepScheduleAdjuster(0.5),
      new StrictStepScheduleRateOffsetAdjuster(0.3),
    ],
    [],
    2.7,
    2096.1,
  );
}
