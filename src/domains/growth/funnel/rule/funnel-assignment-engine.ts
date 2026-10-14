import * as numbers from "../../../../kit/numbers.js";
import { FunnelAssignment } from "./funnel-assignment.js";

/** One step of the funnel assignment calculation. */
export interface FunnelAssignmentFactor {
  describe(): string;
  adjust(item: FunnelAssignment, value: number): number;
}

export class CountryFunnelAssignmentAdjuster implements FunnelAssignmentFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by country";
  }

  adjust(item: FunnelAssignment, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class TieredFunnelAssignmentAdjuster implements FunnelAssignmentFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: FunnelAssignment, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class FunnelAssignmentBudgetOffsetAdjuster implements FunnelAssignmentFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus budget times ${this.weight}`;
  }

  adjust(item: FunnelAssignment, value: number): number {
    return value + item.budget * this.weight;
  }
}

export class PercentFunnelAssignmentAdjuster implements FunnelAssignmentFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: FunnelAssignment, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class MinimumFunnelAssignmentAdjuster implements FunnelAssignmentFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: FunnelAssignment, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class CapFunnelAssignmentAdjuster implements FunnelAssignmentFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: FunnelAssignment, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the funnel assignment steps in order and keeps a trace of each. */
export class FunnelAssignmentEngine {
  steps: FunnelAssignmentFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: FunnelAssignmentFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: FunnelAssignment): number {
    let current = item.projectedValue();
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

  evaluateAll(items: FunnelAssignment[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultFunnelAssignmentEngine(): FunnelAssignmentEngine {
  return new FunnelAssignmentEngine(
    [
      new CountryFunnelAssignmentAdjuster(new Map<string, number>([["online", 1.35]])),
      new TieredFunnelAssignmentAdjuster([7986, 8884, 9575], [1.03, 0.85, 1.14]),
      new FunnelAssignmentBudgetOffsetAdjuster(2),
      new PercentFunnelAssignmentAdjuster(16.3),
      new MinimumFunnelAssignmentAdjuster(8.2),
      new CapFunnelAssignmentAdjuster(31089),
    ],
    [],
    1.4,
    77588.7,
  );
}
