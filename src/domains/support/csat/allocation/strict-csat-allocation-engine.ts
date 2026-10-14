import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { StrictCsatAllocation } from "./strict-csat-allocation.js";

/** One step of the strict csat allocation calculation. */
export interface StrictCsatAllocationStep {
  describe(): string;
  adjust(item: StrictCsatAllocation, value: number): number;
}

export class PercentStrictCsatAllocationAdjuster implements StrictCsatAllocationStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: StrictCsatAllocation, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class CapStrictCsatAllocationAdjuster implements StrictCsatAllocationStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: StrictCsatAllocation, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class CategoryStrictCsatAllocationAdjuster implements StrictCsatAllocationStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by category";
  }

  adjust(item: StrictCsatAllocation, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class FlaggedStrictCsatAllocationAdjuster implements StrictCsatAllocationStep {
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

  adjust(item: StrictCsatAllocation, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

/** Runs the strict csat allocation steps in order and keeps a trace of each. */
export class StrictCsatAllocationEngine {
  steps: StrictCsatAllocationStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: StrictCsatAllocationStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: StrictCsatAllocation): number {
    let current = item.projectedTotal();
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

  evaluateAll(items: StrictCsatAllocation[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultStrictCsatAllocationEngine(flagsValue: flags.Registry): StrictCsatAllocationEngine {
  return new StrictCsatAllocationEngine(
    [
      new PercentStrictCsatAllocationAdjuster(18.3),
      new CapStrictCsatAllocationAdjuster(41479),
      new CategoryStrictCsatAllocationAdjuster(
        new Map<string, number>([["online", 1.18], ["central", 0.73], ["north", 0.88]]),
      ),
      new FlaggedStrictCsatAllocationAdjuster(flagsValue, "strict-csat-allocation-seasonal", -4.3),
    ],
    [],
    3.5,
    58677,
  );
}
