import * as flags from "../../../../kit/flags.js";
import { GlobalSuppressionAllocation } from "./global-suppression-allocation.js";

/** One step of the global suppression allocation calculation. */
export interface GlobalSuppressionAllocationAdjuster {
  describe(): string;
  adjust(item: GlobalSuppressionAllocation, value: number): number;
}

export class TieredGlobalSuppressionAllocationAdjuster implements GlobalSuppressionAllocationAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: GlobalSuppressionAllocation, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class FlaggedGlobalSuppressionAllocationAdjuster implements GlobalSuppressionAllocationAdjuster {
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

  adjust(item: GlobalSuppressionAllocation, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class MinimumGlobalSuppressionAllocationAdjuster implements GlobalSuppressionAllocationAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: GlobalSuppressionAllocation, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the global suppression allocation steps in order and keeps a trace of each. */
export class GlobalSuppressionAllocationEngine {
  steps: GlobalSuppressionAllocationAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: GlobalSuppressionAllocationAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: GlobalSuppressionAllocation): number {
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

  evaluateAll(items: GlobalSuppressionAllocation[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultGlobalSuppressionAllocationEngine(flagsValue: flags.Registry): GlobalSuppressionAllocationEngine {
  return new GlobalSuppressionAllocationEngine(
    [
      new TieredGlobalSuppressionAllocationAdjuster([17, 1283, 9762], [1.12, 0.82, 1.18]),
      new FlaggedGlobalSuppressionAllocationAdjuster(flagsValue, "global-suppression-allocation-fallback", -3.1),
      new MinimumGlobalSuppressionAllocationAdjuster(44.1),
    ],
    [],
    0.1,
    37532.9,
  );
}
