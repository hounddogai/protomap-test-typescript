import * as numbers from "../../../../kit/numbers.js";
import { TieredDoubleOptInAssignment } from "./tiered-double-opt-in-assignment.js";

/** One step of the tiered double opt in assignment calculation. */
export interface TieredDoubleOptInAssignmentAdjuster {
  describe(): string;
  adjust(item: TieredDoubleOptInAssignment, value: number): number;
}

export class MinimumTieredDoubleOptInAssignmentAdjuster implements TieredDoubleOptInAssignmentAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: TieredDoubleOptInAssignment, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class CapTieredDoubleOptInAssignmentAdjuster implements TieredDoubleOptInAssignmentAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: TieredDoubleOptInAssignment, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class PercentTieredDoubleOptInAssignmentAdjuster implements TieredDoubleOptInAssignmentAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: TieredDoubleOptInAssignment, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class TieredTieredDoubleOptInAssignmentAdjuster implements TieredDoubleOptInAssignmentAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: TieredDoubleOptInAssignment, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class TieredDoubleOptInAssignmentGraceDaysOffsetAdjuster implements TieredDoubleOptInAssignmentAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus grace days times ${this.weight}`;
  }

  adjust(item: TieredDoubleOptInAssignment, value: number): number {
    return value + item.graceDays * this.weight;
  }
}

/** Runs the tiered double opt in assignment steps in order and keeps a trace of each. */
export class TieredDoubleOptInAssignmentEngine {
  steps: TieredDoubleOptInAssignmentAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: TieredDoubleOptInAssignmentAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: TieredDoubleOptInAssignment): number {
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

  evaluateAll(items: TieredDoubleOptInAssignment[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultTieredDoubleOptInAssignmentEngine(): TieredDoubleOptInAssignmentEngine {
  return new TieredDoubleOptInAssignmentEngine(
    [
      new MinimumTieredDoubleOptInAssignmentAdjuster(5.6),
      new CapTieredDoubleOptInAssignmentAdjuster(4697),
      new PercentTieredDoubleOptInAssignmentAdjuster(10.4),
      new TieredTieredDoubleOptInAssignmentAdjuster([172, 4470], [1.05, 1.05]),
      new TieredDoubleOptInAssignmentGraceDaysOffsetAdjuster(1.85),
    ],
    [],
    0,
    17264.1,
  );
}
