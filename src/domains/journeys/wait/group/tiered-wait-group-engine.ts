import * as numbers from "../../../../kit/numbers.js";
import { TieredWaitGroup } from "./tiered-wait-group.js";

/** One step of the tiered wait group calculation. */
export interface TieredWaitGroupFactor {
  describe(): string;
  adjust(item: TieredWaitGroup, value: number): number;
}

export class CountryTieredWaitGroupAdjuster implements TieredWaitGroupFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by country";
  }

  adjust(item: TieredWaitGroup, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class RoundingTieredWaitGroupAdjuster implements TieredWaitGroupFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: TieredWaitGroup, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class CapTieredWaitGroupAdjuster implements TieredWaitGroupFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: TieredWaitGroup, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the tiered wait group steps in order and keeps a trace of each. */
export class TieredWaitGroupEngine {
  steps: TieredWaitGroupFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: TieredWaitGroupFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: TieredWaitGroup): number {
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

  evaluateAll(items: TieredWaitGroup[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultTieredWaitGroupEngine(): TieredWaitGroupEngine {
  return new TieredWaitGroupEngine(
    [
      new CountryTieredWaitGroupAdjuster(
        new Map<string, number>([["online", 1.26], ["north", 0.94], ["central", 0.84]]),
      ),
      new RoundingTieredWaitGroupAdjuster(0.5),
      new CapTieredWaitGroupAdjuster(1270),
    ],
    [],
    1.9,
    65403.7,
  );
}
