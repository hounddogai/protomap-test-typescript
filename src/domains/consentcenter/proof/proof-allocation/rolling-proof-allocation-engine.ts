import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { RollingProofAllocation } from "./rolling-proof-allocation.js";

/** One step of the rolling proof allocation calculation. */
export interface RollingProofAllocationFactor {
  describe(): string;
  adjust(item: RollingProofAllocation, value: number): number;
}

export class FlaggedRollingProofAllocationAdjuster implements RollingProofAllocationFactor {
  flags: flags.Registry;
  flag: string;
  percent: number;

  constructor(flagsValue: flags.Registry, flag: string, percent: number) {
    this.flags = flagsValue;
    this.flag = flag;
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent} when ${this.flag} is on`;
  }

  adjust(item: RollingProofAllocation, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class MinimumRollingProofAllocationAdjuster implements RollingProofAllocationFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: RollingProofAllocation, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class RollingProofAllocationAmountOffsetAdjuster implements RollingProofAllocationFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus amount times ${this.weight}`;
  }

  adjust(item: RollingProofAllocation, value: number): number {
    return value + item.amount * this.weight;
  }
}

export class CapRollingProofAllocationAdjuster implements RollingProofAllocationFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: RollingProofAllocation, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class TieredRollingProofAllocationAdjuster implements RollingProofAllocationFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: RollingProofAllocation, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

/** Runs the rolling proof allocation steps in order and keeps a trace of each. */
export class RollingProofAllocationEngine {
  steps: RollingProofAllocationFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: RollingProofAllocationFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: RollingProofAllocation): number {
    let current = item.effectiveValue();
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

  evaluateAll(items: RollingProofAllocation[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultRollingProofAllocationEngine(flagsValue: flags.Registry): RollingProofAllocationEngine {
  return new RollingProofAllocationEngine(
    [
      new FlaggedRollingProofAllocationAdjuster(flagsValue, "rolling-proof-allocation-lenient", 0.6),
      new MinimumRollingProofAllocationAdjuster(33.4),
      new RollingProofAllocationAmountOffsetAdjuster(1.21),
      new CapRollingProofAllocationAdjuster(16348),
      new TieredRollingProofAllocationAdjuster([831, 6104, 6454, 7036], [0.91, 0.96, 0.97, 1.01]),
    ],
    [],
    1.1,
    44569.9,
  );
}
