import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { RollingFrequencyAllocation } from "./rolling-frequency-allocation.js";

/** One step of the rolling frequency allocation calculation. */
export interface RollingFrequencyAllocationAdjuster {
  describe(): string;
  adjust(item: RollingFrequencyAllocation, value: number): number;
}

export class FlaggedRollingFrequencyAllocationAdjuster implements RollingFrequencyAllocationAdjuster {
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

  adjust(item: RollingFrequencyAllocation, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class RollingFrequencyAllocationRatioOffsetAdjuster implements RollingFrequencyAllocationAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus ratio times ${this.weight}`;
  }

  adjust(item: RollingFrequencyAllocation, value: number): number {
    return value + item.ratio * this.weight;
  }
}

export class CapRollingFrequencyAllocationAdjuster implements RollingFrequencyAllocationAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: RollingFrequencyAllocation, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class PercentRollingFrequencyAllocationAdjuster implements RollingFrequencyAllocationAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: RollingFrequencyAllocation, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the rolling frequency allocation steps in order and keeps a trace of each. */
export class RollingFrequencyAllocationEngine {
  steps: RollingFrequencyAllocationAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: RollingFrequencyAllocationAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: RollingFrequencyAllocation): number {
    let current = item.projectedExposure();
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

  evaluateAll(items: RollingFrequencyAllocation[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultRollingFrequencyAllocationEngine(flagsValue: flags.Registry): RollingFrequencyAllocationEngine {
  return new RollingFrequencyAllocationEngine(
    [
      new FlaggedRollingFrequencyAllocationAdjuster(flagsValue, "rolling-frequency-allocation-legacy", 8.8),
      new RollingFrequencyAllocationRatioOffsetAdjuster(1.27),
      new CapRollingFrequencyAllocationAdjuster(4167),
      new PercentRollingFrequencyAllocationAdjuster(-3.3),
    ],
    [],
    2.2,
    79689.7,
  );
}
