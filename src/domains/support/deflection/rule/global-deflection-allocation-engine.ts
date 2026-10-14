import * as flags from "../../../../kit/flags.js";
import { GlobalDeflectionAllocation } from "./global-deflection-allocation.js";

/** One step of the global deflection allocation calculation. */
export interface GlobalDeflectionAllocationStep {
  describe(): string;
  adjust(item: GlobalDeflectionAllocation, value: number): number;
}

export class MinimumGlobalDeflectionAllocationAdjuster implements GlobalDeflectionAllocationStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: GlobalDeflectionAllocation, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class FlaggedGlobalDeflectionAllocationAdjuster implements GlobalDeflectionAllocationStep {
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

  adjust(item: GlobalDeflectionAllocation, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class GlobalDeflectionAllocationRetriesOffsetAdjuster implements GlobalDeflectionAllocationStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus retries times ${this.weight}`;
  }

  adjust(item: GlobalDeflectionAllocation, value: number): number {
    return value + item.retries * this.weight;
  }
}

export class CountryGlobalDeflectionAllocationAdjuster implements GlobalDeflectionAllocationStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by country";
  }

  adjust(item: GlobalDeflectionAllocation, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class TieredGlobalDeflectionAllocationAdjuster implements GlobalDeflectionAllocationStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: GlobalDeflectionAllocation, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class CapGlobalDeflectionAllocationAdjuster implements GlobalDeflectionAllocationStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: GlobalDeflectionAllocation, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the global deflection allocation steps in order and keeps a trace of each. */
export class GlobalDeflectionAllocationEngine {
  steps: GlobalDeflectionAllocationStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: GlobalDeflectionAllocationStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: GlobalDeflectionAllocation): number {
    let current = item.projectedVolume();
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

  evaluateAll(items: GlobalDeflectionAllocation[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultGlobalDeflectionAllocationEngine(flagsValue: flags.Registry): GlobalDeflectionAllocationEngine {
  return new GlobalDeflectionAllocationEngine(
    [
      new MinimumGlobalDeflectionAllocationAdjuster(12.2),
      new FlaggedGlobalDeflectionAllocationAdjuster(flagsValue, "global-deflection-allocation-rolling", -7.7),
      new GlobalDeflectionAllocationRetriesOffsetAdjuster(0.71),
      new CountryGlobalDeflectionAllocationAdjuster(
        new Map<string, number>([["central", 0.85], ["east", 1.02], ["north", 0.93]]),
      ),
      new TieredGlobalDeflectionAllocationAdjuster([78, 2472, 7704], [0.89, 1.16, 1.01]),
      new CapGlobalDeflectionAllocationAdjuster(22325),
    ],
    [],
    4.8,
    55703.8,
  );
}
