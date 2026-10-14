import * as numbers from "../../../../kit/numbers.js";
import { RegionalSubscriptionAllocation } from "./regional-subscription-allocation.js";

/** One step of the regional subscription allocation calculation. */
export interface RegionalSubscriptionAllocationAdjuster {
  describe(): string;
  adjust(item: RegionalSubscriptionAllocation, value: number): number;
}

export class MinimumRegionalSubscriptionAllocationAdjuster implements RegionalSubscriptionAllocationAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: RegionalSubscriptionAllocation, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class TieredRegionalSubscriptionAllocationAdjuster implements RegionalSubscriptionAllocationAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: RegionalSubscriptionAllocation, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class RegionalSubscriptionAllocationRateOffsetAdjuster implements RegionalSubscriptionAllocationAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus rate times ${this.weight}`;
  }

  adjust(item: RegionalSubscriptionAllocation, value: number): number {
    return value + item.rate * this.weight;
  }
}

export class PercentRegionalSubscriptionAllocationAdjuster implements RegionalSubscriptionAllocationAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: RegionalSubscriptionAllocation, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class RoundingRegionalSubscriptionAllocationAdjuster implements RegionalSubscriptionAllocationAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: RegionalSubscriptionAllocation, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class CapRegionalSubscriptionAllocationAdjuster implements RegionalSubscriptionAllocationAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: RegionalSubscriptionAllocation, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the regional subscription allocation steps in order and keeps a trace of each. */
export class RegionalSubscriptionAllocationEngine {
  steps: RegionalSubscriptionAllocationAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: RegionalSubscriptionAllocationAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: RegionalSubscriptionAllocation): number {
    let current = item.adjustedValue();
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

  evaluateAll(items: RegionalSubscriptionAllocation[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultRegionalSubscriptionAllocationEngine(): RegionalSubscriptionAllocationEngine {
  return new RegionalSubscriptionAllocationEngine(
    [
      new MinimumRegionalSubscriptionAllocationAdjuster(39.6),
      new TieredRegionalSubscriptionAllocationAdjuster([1471, 2366, 6644], [1.16, 1.18, 1.12]),
      new RegionalSubscriptionAllocationRateOffsetAdjuster(0.22),
      new PercentRegionalSubscriptionAllocationAdjuster(-12.6),
      new RoundingRegionalSubscriptionAllocationAdjuster(0.25),
      new CapRegionalSubscriptionAllocationAdjuster(2345),
    ],
    [],
    2.8,
    68878.9,
  );
}
