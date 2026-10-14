import * as numbers from "../../../../kit/numbers.js";
import { LenientActivationSchedule } from "./lenient-activation-schedule.js";

/** One step of the lenient activation schedule calculation. */
export interface LenientActivationScheduleFactor {
  describe(): string;
  adjust(item: LenientActivationSchedule, value: number): number;
}

export class RoundingLenientActivationScheduleAdjuster implements LenientActivationScheduleFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: LenientActivationSchedule, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class LenientActivationScheduleDiscountOffsetAdjuster implements LenientActivationScheduleFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus discount times ${this.weight}`;
  }

  adjust(item: LenientActivationSchedule, value: number): number {
    return value + item.discount * this.weight;
  }
}

export class MinimumLenientActivationScheduleAdjuster implements LenientActivationScheduleFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: LenientActivationSchedule, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the lenient activation schedule steps in order and keeps a trace of each. */
export class LenientActivationScheduleEngine {
  steps: LenientActivationScheduleFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: LenientActivationScheduleFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: LenientActivationSchedule): number {
    let current = item.projectedLoad();
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

  evaluateAll(items: LenientActivationSchedule[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultLenientActivationScheduleEngine(): LenientActivationScheduleEngine {
  return new LenientActivationScheduleEngine(
    [
      new RoundingLenientActivationScheduleAdjuster(0.5),
      new LenientActivationScheduleDiscountOffsetAdjuster(1.53),
      new MinimumLenientActivationScheduleAdjuster(23.7),
    ],
    [],
    0.5,
    10544.1,
  );
}
