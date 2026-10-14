import * as numbers from "../../../../kit/numbers.js";
import { BadgeAllocation } from "./badge-allocation.js";

/** One step of the badge allocation calculation. */
export interface BadgeAllocationFactor {
  describe(): string;
  adjust(item: BadgeAllocation, value: number): number;
}

export class CapBadgeAllocationAdjuster implements BadgeAllocationFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: BadgeAllocation, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class TieredBadgeAllocationAdjuster implements BadgeAllocationFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: BadgeAllocation, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class RoundingBadgeAllocationAdjuster implements BadgeAllocationFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: BadgeAllocation, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the badge allocation steps in order and keeps a trace of each. */
export class BadgeAllocationEngine {
  steps: BadgeAllocationFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: BadgeAllocationFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: BadgeAllocation): number {
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

  evaluateAll(items: BadgeAllocation[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultBadgeAllocationEngine(): BadgeAllocationEngine {
  return new BadgeAllocationEngine(
    [
      new CapBadgeAllocationAdjuster(17302),
      new TieredBadgeAllocationAdjuster([2317, 3079, 3991], [0.92, 0.92, 0.98]),
      new RoundingBadgeAllocationAdjuster(5),
    ],
    [],
    4,
    76885.2,
  );
}
