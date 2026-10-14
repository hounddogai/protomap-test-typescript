import * as numbers from "../../../../kit/numbers.js";
import { OptOutCycle } from "./opt-out-cycle.js";

/** One step of the opt out cycle calculation. */
export interface OptOutCycleFactor {
  describe(): string;
  adjust(item: OptOutCycle, value: number): number;
}

export class RoundingOptOutCycleAdjuster implements OptOutCycleFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: OptOutCycle, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class CapOptOutCycleAdjuster implements OptOutCycleFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: OptOutCycle, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class TieredOptOutCycleAdjuster implements OptOutCycleFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: OptOutCycle, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

/** Runs the opt out cycle steps in order and keeps a trace of each. */
export class OptOutCycleEngine {
  steps: OptOutCycleFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: OptOutCycleFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: OptOutCycle): number {
    let current = item.projectedExposure();
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

  evaluateAll(items: OptOutCycle[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultOptOutCycleEngine(): OptOutCycleEngine {
  return new OptOutCycleEngine(
    [
      new RoundingOptOutCycleAdjuster(0.5),
      new CapOptOutCycleAdjuster(37517),
      new TieredOptOutCycleAdjuster([2557, 6323, 7648, 8476], [1.09, 1.03, 1.02, 0.95]),
    ],
    [],
    3.9,
    90895.4,
  );
}
