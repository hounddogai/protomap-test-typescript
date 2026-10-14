import * as numbers from "../../../../kit/numbers.js";
import { TieredSubscriptionAllocation } from "./tiered-subscription-allocation.js";

/** One step of the tiered subscription allocation calculation. */
export interface TieredSubscriptionAllocationStep {
  describe(): string;
  adjust(item: TieredSubscriptionAllocation, value: number): number;
}

export class PercentTieredSubscriptionAllocationAdjuster implements TieredSubscriptionAllocationStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: TieredSubscriptionAllocation, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class MinimumTieredSubscriptionAllocationAdjuster implements TieredSubscriptionAllocationStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: TieredSubscriptionAllocation, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class RoundingTieredSubscriptionAllocationAdjuster implements TieredSubscriptionAllocationStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: TieredSubscriptionAllocation, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class ChannelTieredSubscriptionAllocationAdjuster implements TieredSubscriptionAllocationStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by channel";
  }

  adjust(item: TieredSubscriptionAllocation, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class TieredTieredSubscriptionAllocationAdjuster implements TieredSubscriptionAllocationStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: TieredSubscriptionAllocation, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class CapTieredSubscriptionAllocationAdjuster implements TieredSubscriptionAllocationStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: TieredSubscriptionAllocation, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the tiered subscription allocation steps in order and keeps a trace of each. */
export class TieredSubscriptionAllocationEngine {
  steps: TieredSubscriptionAllocationStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: TieredSubscriptionAllocationStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: TieredSubscriptionAllocation): number {
    let current = item.weightedTotal();
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

  evaluateAll(items: TieredSubscriptionAllocation[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultTieredSubscriptionAllocationEngine(): TieredSubscriptionAllocationEngine {
  return new TieredSubscriptionAllocationEngine(
    [
      new PercentTieredSubscriptionAllocationAdjuster(-21),
      new MinimumTieredSubscriptionAllocationAdjuster(5.2),
      new RoundingTieredSubscriptionAllocationAdjuster(0.05),
      new ChannelTieredSubscriptionAllocationAdjuster(
        new Map<string, number>([["online", 0.8], ["east", 0.72]]),
      ),
      new TieredTieredSubscriptionAllocationAdjuster([5048, 7466, 8907], [1, 1.09, 0.81]),
      new CapTieredSubscriptionAllocationAdjuster(15340),
    ],
    [],
    1.8,
    26585.4,
  );
}
