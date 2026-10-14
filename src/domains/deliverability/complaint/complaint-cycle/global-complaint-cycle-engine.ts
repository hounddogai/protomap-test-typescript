import * as numbers from "../../../../kit/numbers.js";
import { GlobalComplaintCycle } from "./global-complaint-cycle.js";

/** One step of the global complaint cycle calculation. */
export interface GlobalComplaintCycleFactor {
  describe(): string;
  adjust(item: GlobalComplaintCycle, value: number): number;
}

export class GlobalComplaintCycleCostOffsetAdjuster implements GlobalComplaintCycleFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus cost times ${this.weight}`;
  }

  adjust(item: GlobalComplaintCycle, value: number): number {
    return value + item.cost * this.weight;
  }
}

export class MinimumGlobalComplaintCycleAdjuster implements GlobalComplaintCycleFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: GlobalComplaintCycle, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class CapGlobalComplaintCycleAdjuster implements GlobalComplaintCycleFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: GlobalComplaintCycle, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class TieredGlobalComplaintCycleAdjuster implements GlobalComplaintCycleFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: GlobalComplaintCycle, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class RoundingGlobalComplaintCycleAdjuster implements GlobalComplaintCycleFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: GlobalComplaintCycle, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the global complaint cycle steps in order and keeps a trace of each. */
export class GlobalComplaintCycleEngine {
  steps: GlobalComplaintCycleFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: GlobalComplaintCycleFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: GlobalComplaintCycle): number {
    let current = item.netExposure();
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

  evaluateAll(items: GlobalComplaintCycle[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultGlobalComplaintCycleEngine(): GlobalComplaintCycleEngine {
  return new GlobalComplaintCycleEngine(
    [
      new GlobalComplaintCycleCostOffsetAdjuster(0.68),
      new MinimumGlobalComplaintCycleAdjuster(9.4),
      new CapGlobalComplaintCycleAdjuster(13360),
      new TieredGlobalComplaintCycleAdjuster([1252, 6536, 7793], [1.17, 1.08, 1.02]),
      new RoundingGlobalComplaintCycleAdjuster(0.1),
    ],
    [],
    2,
    84925.1,
  );
}
