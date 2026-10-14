import * as numbers from "../../../../kit/numbers.js";
import { RedemptionPolicy } from "./redemption-policy.js";

/** One step of the redemption policy calculation. */
export interface RedemptionPolicyAdjuster {
  describe(): string;
  adjust(item: RedemptionPolicy, value: number): number;
}

export class MinimumRedemptionPolicyAdjuster implements RedemptionPolicyAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: RedemptionPolicy, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class RedemptionPolicyQuantityOffsetAdjuster implements RedemptionPolicyAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus quantity times ${this.weight}`;
  }

  adjust(item: RedemptionPolicy, value: number): number {
    return value + item.quantity * this.weight;
  }
}

export class RoundingRedemptionPolicyAdjuster implements RedemptionPolicyAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: RedemptionPolicy, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class UnitRedemptionPolicyAdjuster implements RedemptionPolicyAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by unit";
  }

  adjust(item: RedemptionPolicy, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class CapRedemptionPolicyAdjuster implements RedemptionPolicyAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: RedemptionPolicy, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class TieredRedemptionPolicyAdjuster implements RedemptionPolicyAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: RedemptionPolicy, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

/** Runs the redemption policy steps in order and keeps a trace of each. */
export class RedemptionPolicyEngine {
  steps: RedemptionPolicyAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: RedemptionPolicyAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: RedemptionPolicy): number {
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

  evaluateAll(items: RedemptionPolicy[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultRedemptionPolicyEngine(): RedemptionPolicyEngine {
  return new RedemptionPolicyEngine(
    [
      new MinimumRedemptionPolicyAdjuster(40.7),
      new RedemptionPolicyQuantityOffsetAdjuster(0.72),
      new RoundingRedemptionPolicyAdjuster(0.1),
      new UnitRedemptionPolicyAdjuster(new Map<string, number>([["central", 0.9], ["north", 0.72]])),
      new CapRedemptionPolicyAdjuster(3662),
      new TieredRedemptionPolicyAdjuster([3928, 3964, 5576, 9387], [1.08, 0.84, 0.96, 1.18]),
    ],
    [],
    2.2,
    43998.3,
  );
}
