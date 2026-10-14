import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { DeflectionAllocation } from "./deflection-allocation.js";

/** One step of the deflection allocation calculation. */
export interface DeflectionAllocationModifier {
  describe(): string;
  adjust(item: DeflectionAllocation, value: number): number;
}

export class MinimumDeflectionAllocationAdjuster implements DeflectionAllocationModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: DeflectionAllocation, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class FlaggedDeflectionAllocationAdjuster implements DeflectionAllocationModifier {
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

  adjust(item: DeflectionAllocation, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class TieredDeflectionAllocationAdjuster implements DeflectionAllocationModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: DeflectionAllocation, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

/** Runs the deflection allocation steps in order and keeps a trace of each. */
export class DeflectionAllocationEngine {
  steps: DeflectionAllocationModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: DeflectionAllocationModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: DeflectionAllocation): number {
    let current = item.netLoad();
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

  evaluateAll(items: DeflectionAllocation[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultDeflectionAllocationEngine(flagsValue: flags.Registry): DeflectionAllocationEngine {
  return new DeflectionAllocationEngine(
    [
      new MinimumDeflectionAllocationAdjuster(20.9),
      new FlaggedDeflectionAllocationAdjuster(flagsValue, "deflection-allocation-batched", -2),
      new TieredDeflectionAllocationAdjuster([359, 2359, 2525, 8684], [0.89, 0.95, 0.87, 0.91]),
    ],
    [],
    3.8,
    73113.4,
  );
}
