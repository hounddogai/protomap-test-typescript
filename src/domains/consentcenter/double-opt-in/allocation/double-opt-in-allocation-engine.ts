import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { DoubleOptInAllocation } from "./double-opt-in-allocation.js";

/** One step of the double opt in allocation calculation. */
export interface DoubleOptInAllocationFactor {
  describe(): string;
  adjust(item: DoubleOptInAllocation, value: number): number;
}

export class LocaleDoubleOptInAllocationAdjuster implements DoubleOptInAllocationFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by locale";
  }

  adjust(item: DoubleOptInAllocation, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class TieredDoubleOptInAllocationAdjuster implements DoubleOptInAllocationFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: DoubleOptInAllocation, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class FlaggedDoubleOptInAllocationAdjuster implements DoubleOptInAllocationFactor {
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

  adjust(item: DoubleOptInAllocation, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

/** Runs the double opt in allocation steps in order and keeps a trace of each. */
export class DoubleOptInAllocationEngine {
  steps: DoubleOptInAllocationFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: DoubleOptInAllocationFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: DoubleOptInAllocation): number {
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

  evaluateAll(items: DoubleOptInAllocation[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultDoubleOptInAllocationEngine(flagsValue: flags.Registry): DoubleOptInAllocationEngine {
  return new DoubleOptInAllocationEngine(
    [
      new LocaleDoubleOptInAllocationAdjuster(new Map<string, number>([["north", 1.32], ["central", 0.86]])),
      new TieredDoubleOptInAllocationAdjuster([4102, 7390], [0.9, 1.12]),
      new FlaggedDoubleOptInAllocationAdjuster(flagsValue, "double-opt-in-allocation-strict", -8.5),
    ],
    [],
    2.9,
    78879.6,
  );
}
