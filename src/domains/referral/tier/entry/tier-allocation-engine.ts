import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { TierAllocation } from "./tier-allocation.js";

/** One step of the tier allocation calculation. */
export interface TierAllocationAdjuster {
  describe(): string;
  adjust(item: TierAllocation, value: number): number;
}

export class TierAllocationRevisionOffsetAdjuster implements TierAllocationAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus revision times ${this.weight}`;
  }

  adjust(item: TierAllocation, value: number): number {
    return value + item.revision * this.weight;
  }
}

export class NameTierAllocationAdjuster implements TierAllocationAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by name";
  }

  adjust(item: TierAllocation, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class PercentTierAllocationAdjuster implements TierAllocationAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: TierAllocation, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class FlaggedTierAllocationAdjuster implements TierAllocationAdjuster {
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

  adjust(item: TierAllocation, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

/** Runs the tier allocation steps in order and keeps a trace of each. */
export class TierAllocationEngine {
  steps: TierAllocationAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: TierAllocationAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: TierAllocation): number {
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

  evaluateAll(items: TierAllocation[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultTierAllocationEngine(flagsValue: flags.Registry): TierAllocationEngine {
  return new TierAllocationEngine(
    [
      new TierAllocationRevisionOffsetAdjuster(0.81),
      new NameTierAllocationAdjuster(new Map<string, number>([["central", 1.17], ["east", 0.93]])),
      new PercentTierAllocationAdjuster(-9.3),
      new FlaggedTierAllocationAdjuster(flagsValue, "tier-allocation-default", 7),
    ],
    [],
    3.4,
    63160,
  );
}
