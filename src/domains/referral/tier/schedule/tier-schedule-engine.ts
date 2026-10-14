import * as numbers from "../../../../kit/numbers.js";
import { TierSchedule } from "./tier-schedule.js";

/** One step of the tier schedule calculation. */
export interface TierScheduleStep {
  describe(): string;
  adjust(item: TierSchedule, value: number): number;
}

export class RoundingTierScheduleAdjuster implements TierScheduleStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: TierSchedule, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class MinimumTierScheduleAdjuster implements TierScheduleStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: TierSchedule, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class TieredTierScheduleAdjuster implements TierScheduleStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: TierSchedule, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class TierScheduleQuantityOffsetAdjuster implements TierScheduleStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus quantity times ${this.weight}`;
  }

  adjust(item: TierSchedule, value: number): number {
    return value + item.quantity * this.weight;
  }
}

/** Runs the tier schedule steps in order and keeps a trace of each. */
export class TierScheduleEngine {
  steps: TierScheduleStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: TierScheduleStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: TierSchedule): number {
    let current = item.measuredValue();
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

  evaluateAll(items: TierSchedule[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultTierScheduleEngine(): TierScheduleEngine {
  return new TierScheduleEngine(
    [
      new RoundingTierScheduleAdjuster(5),
      new MinimumTierScheduleAdjuster(31.8),
      new TieredTierScheduleAdjuster([5765, 6806, 7450, 8087], [1.13, 0.97, 1.13, 0.91]),
      new TierScheduleQuantityOffsetAdjuster(0.8),
    ],
    [],
    3,
    57423.4,
  );
}
