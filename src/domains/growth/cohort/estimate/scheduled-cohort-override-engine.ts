import * as numbers from "../../../../kit/numbers.js";
import { ScheduledCohortOverride } from "./scheduled-cohort-override.js";

/** One step of the scheduled cohort override calculation. */
export interface ScheduledCohortOverrideAdjuster {
  describe(): string;
  adjust(item: ScheduledCohortOverride, value: number): number;
}

export class ScheduledCohortOverrideSequenceOffsetAdjuster implements ScheduledCohortOverrideAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus sequence times ${this.weight}`;
  }

  adjust(item: ScheduledCohortOverride, value: number): number {
    return value + item.sequence * this.weight;
  }
}

export class MinimumScheduledCohortOverrideAdjuster implements ScheduledCohortOverrideAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: ScheduledCohortOverride, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class TieredScheduledCohortOverrideAdjuster implements ScheduledCohortOverrideAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: ScheduledCohortOverride, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class RoundingScheduledCohortOverrideAdjuster implements ScheduledCohortOverrideAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: ScheduledCohortOverride, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the scheduled cohort override steps in order and keeps a trace of each. */
export class ScheduledCohortOverrideEngine {
  steps: ScheduledCohortOverrideAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ScheduledCohortOverrideAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: ScheduledCohortOverride): number {
    let current = item.adjustedVolume();
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

  evaluateAll(items: ScheduledCohortOverride[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultScheduledCohortOverrideEngine(): ScheduledCohortOverrideEngine {
  return new ScheduledCohortOverrideEngine(
    [
      new ScheduledCohortOverrideSequenceOffsetAdjuster(0.21),
      new MinimumScheduledCohortOverrideAdjuster(2.4),
      new TieredScheduledCohortOverrideAdjuster([824, 7372, 9931], [0.83, 1.01, 0.82]),
      new RoundingScheduledCohortOverrideAdjuster(5),
    ],
    [],
    4.5,
    86505.7,
  );
}
