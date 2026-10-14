import * as flags from "../../../../kit/flags.js";
import { CappedTierAllocation } from "./capped-tier-allocation.js";

/** One step of the capped tier allocation calculation. */
export interface CappedTierAllocationStep {
  describe(): string;
  adjust(item: CappedTierAllocation, value: number): number;
}

export class MinimumCappedTierAllocationAdjuster implements CappedTierAllocationStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: CappedTierAllocation, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class FlaggedCappedTierAllocationAdjuster implements CappedTierAllocationStep {
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

  adjust(item: CappedTierAllocation, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class PercentCappedTierAllocationAdjuster implements CappedTierAllocationStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: CappedTierAllocation, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the capped tier allocation steps in order and keeps a trace of each. */
export class CappedTierAllocationEngine {
  steps: CappedTierAllocationStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: CappedTierAllocationStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: CappedTierAllocation): number {
    let current = item.effectiveTotal();
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

  evaluateAll(items: CappedTierAllocation[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultCappedTierAllocationEngine(flagsValue: flags.Registry): CappedTierAllocationEngine {
  return new CappedTierAllocationEngine(
    [
      new MinimumCappedTierAllocationAdjuster(29.9),
      new FlaggedCappedTierAllocationAdjuster(flagsValue, "capped-tier-allocation-tiered", -7.9),
      new PercentCappedTierAllocationAdjuster(-2.4),
    ],
    [],
    4,
    37583.4,
  );
}
