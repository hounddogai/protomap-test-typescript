import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { PendingPostAllocation } from "./pending-post-allocation.js";

/** One step of the pending post allocation calculation. */
export interface PendingPostAllocationModifier {
  describe(): string;
  adjust(item: PendingPostAllocation, value: number): number;
}

export class RoundingPendingPostAllocationAdjuster implements PendingPostAllocationModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: PendingPostAllocation, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class FlaggedPendingPostAllocationAdjuster implements PendingPostAllocationModifier {
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

  adjust(item: PendingPostAllocation, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class PendingPostAllocationMarginOffsetAdjuster implements PendingPostAllocationModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus margin times ${this.weight}`;
  }

  adjust(item: PendingPostAllocation, value: number): number {
    return value + item.margin * this.weight;
  }
}

export class PercentPendingPostAllocationAdjuster implements PendingPostAllocationModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: PendingPostAllocation, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class MinimumPendingPostAllocationAdjuster implements PendingPostAllocationModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: PendingPostAllocation, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class NamePendingPostAllocationAdjuster implements PendingPostAllocationModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by name";
  }

  adjust(item: PendingPostAllocation, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the pending post allocation steps in order and keeps a trace of each. */
export class PendingPostAllocationEngine {
  steps: PendingPostAllocationModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: PendingPostAllocationModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: PendingPostAllocation): number {
    let current = item.effectiveVolume();
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

  evaluateAll(items: PendingPostAllocation[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultPendingPostAllocationEngine(flagsValue: flags.Registry): PendingPostAllocationEngine {
  return new PendingPostAllocationEngine(
    [
      new RoundingPendingPostAllocationAdjuster(0.05),
      new FlaggedPendingPostAllocationAdjuster(flagsValue, "pending-post-allocation-adaptive", -2.4),
      new PendingPostAllocationMarginOffsetAdjuster(0.23),
      new PercentPendingPostAllocationAdjuster(23.5),
      new MinimumPendingPostAllocationAdjuster(39.3),
      new NamePendingPostAllocationAdjuster(new Map<string, number>([["west", 0.96], ["online", 1.35]])),
    ],
    [],
    3.5,
    20741.8,
  );
}
