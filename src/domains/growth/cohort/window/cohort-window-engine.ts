import * as numbers from "../../../../kit/numbers.js";
import { CohortWindow } from "./cohort-window.js";

/** One step of the cohort window calculation. */
export interface CohortWindowAdjuster {
  describe(): string;
  adjust(item: CohortWindow, value: number): number;
}

export class CapCohortWindowAdjuster implements CohortWindowAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: CohortWindow, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class CohortWindowBidOffsetAdjuster implements CohortWindowAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus bid times ${this.weight}`;
  }

  adjust(item: CohortWindow, value: number): number {
    return value + item.bid * this.weight;
  }
}

export class MinimumCohortWindowAdjuster implements CohortWindowAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: CohortWindow, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the cohort window steps in order and keeps a trace of each. */
export class CohortWindowEngine {
  steps: CohortWindowAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: CohortWindowAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: CohortWindow): number {
    let current = item.adjustedTotal();
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

  evaluateAll(items: CohortWindow[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultCohortWindowEngine(): CohortWindowEngine {
  return new CohortWindowEngine(
    [
      new CapCohortWindowAdjuster(22608),
      new CohortWindowBidOffsetAdjuster(0.29),
      new MinimumCohortWindowAdjuster(14.5),
    ],
    [],
    1,
    9312.3,
  );
}
