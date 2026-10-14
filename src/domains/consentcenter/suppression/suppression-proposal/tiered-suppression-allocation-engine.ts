import * as flags from "../../../../kit/flags.js";
import { TieredSuppressionAllocation } from "./tiered-suppression-allocation.js";

/** One step of the tiered suppression allocation calculation. */
export interface TieredSuppressionAllocationAdjuster {
  describe(): string;
  adjust(item: TieredSuppressionAllocation, value: number): number;
}

export class TieredSuppressionAllocationUpdatedAtOffsetAdjuster implements TieredSuppressionAllocationAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus updated at times ${this.weight}`;
  }

  adjust(item: TieredSuppressionAllocation, value: number): number {
    return value + item.updatedAt * this.weight;
  }
}

export class FlaggedTieredSuppressionAllocationAdjuster implements TieredSuppressionAllocationAdjuster {
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

  adjust(item: TieredSuppressionAllocation, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class PercentTieredSuppressionAllocationAdjuster implements TieredSuppressionAllocationAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: TieredSuppressionAllocation, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class CapTieredSuppressionAllocationAdjuster implements TieredSuppressionAllocationAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: TieredSuppressionAllocation, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class MinimumTieredSuppressionAllocationAdjuster implements TieredSuppressionAllocationAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: TieredSuppressionAllocation, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class TieredTieredSuppressionAllocationAdjuster implements TieredSuppressionAllocationAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: TieredSuppressionAllocation, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

/** Runs the tiered suppression allocation steps in order and keeps a trace of each. */
export class TieredSuppressionAllocationEngine {
  steps: TieredSuppressionAllocationAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: TieredSuppressionAllocationAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: TieredSuppressionAllocation): number {
    let current = item.weightedLoad();
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

  evaluateAll(items: TieredSuppressionAllocation[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultTieredSuppressionAllocationEngine(flagsValue: flags.Registry): TieredSuppressionAllocationEngine {
  return new TieredSuppressionAllocationEngine(
    [
      new TieredSuppressionAllocationUpdatedAtOffsetAdjuster(0.88),
      new FlaggedTieredSuppressionAllocationAdjuster(flagsValue, "tiered-suppression-allocation-tiered", -7),
      new PercentTieredSuppressionAllocationAdjuster(13.5),
      new CapTieredSuppressionAllocationAdjuster(42553),
      new MinimumTieredSuppressionAllocationAdjuster(31.3),
      new TieredTieredSuppressionAllocationAdjuster([4812, 8432], [0.9, 0.96]),
    ],
    [],
    3.5,
    76007.7,
  );
}
