import * as numbers from "../../../../kit/numbers.js";
import { StreakSchedule } from "./streak-schedule.js";

/** One step of the streak schedule calculation. */
export interface StreakScheduleModifier {
  describe(): string;
  adjust(item: StreakSchedule, value: number): number;
}

export class TieredStreakScheduleAdjuster implements StreakScheduleModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: StreakSchedule, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class MinimumStreakScheduleAdjuster implements StreakScheduleModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: StreakSchedule, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class PercentStreakScheduleAdjuster implements StreakScheduleModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: StreakSchedule, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class CapStreakScheduleAdjuster implements StreakScheduleModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: StreakSchedule, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the streak schedule steps in order and keeps a trace of each. */
export class StreakScheduleEngine {
  steps: StreakScheduleModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: StreakScheduleModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: StreakSchedule): number {
    let current = item.adjustedLoad();
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

  evaluateAll(items: StreakSchedule[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultStreakScheduleEngine(): StreakScheduleEngine {
  return new StreakScheduleEngine(
    [
      new TieredStreakScheduleAdjuster([179, 9507], [1.05, 1.13]),
      new MinimumStreakScheduleAdjuster(38.6),
      new PercentStreakScheduleAdjuster(-5.5),
      new CapStreakScheduleAdjuster(23142),
    ],
    [],
    2.5,
    92096.3,
  );
}
