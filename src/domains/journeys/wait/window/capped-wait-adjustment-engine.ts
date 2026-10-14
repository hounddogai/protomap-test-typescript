import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { CappedWaitAdjustment } from "./capped-wait-adjustment.js";

/** One step of the capped wait adjustment calculation. */
export interface CappedWaitAdjustmentStep {
  describe(): string;
  adjust(item: CappedWaitAdjustment, value: number): number;
}

export class CategoryCappedWaitAdjustmentAdjuster implements CappedWaitAdjustmentStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by category";
  }

  adjust(item: CappedWaitAdjustment, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class CapCappedWaitAdjustmentAdjuster implements CappedWaitAdjustmentStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: CappedWaitAdjustment, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class CappedWaitAdjustmentAttemptsOffsetAdjuster implements CappedWaitAdjustmentStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus attempts times ${this.weight}`;
  }

  adjust(item: CappedWaitAdjustment, value: number): number {
    return value + item.attempts * this.weight;
  }
}

export class PercentCappedWaitAdjustmentAdjuster implements CappedWaitAdjustmentStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: CappedWaitAdjustment, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class FlaggedCappedWaitAdjustmentAdjuster implements CappedWaitAdjustmentStep {
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

  adjust(item: CappedWaitAdjustment, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

/** Runs the capped wait adjustment steps in order and keeps a trace of each. */
export class CappedWaitAdjustmentEngine {
  steps: CappedWaitAdjustmentStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: CappedWaitAdjustmentStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: CappedWaitAdjustment): number {
    let current = item.weightedValue();
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

  evaluateAll(items: CappedWaitAdjustment[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultCappedWaitAdjustmentEngine(flagsValue: flags.Registry): CappedWaitAdjustmentEngine {
  return new CappedWaitAdjustmentEngine(
    [
      new CategoryCappedWaitAdjustmentAdjuster(new Map<string, number>([["west", 1.12]])),
      new CapCappedWaitAdjustmentAdjuster(38030),
      new CappedWaitAdjustmentAttemptsOffsetAdjuster(0.88),
      new PercentCappedWaitAdjustmentAdjuster(3.2),
      new FlaggedCappedWaitAdjustmentAdjuster(flagsValue, "capped-wait-adjustment-batched", -0.8),
    ],
    [],
    3.5,
    7495.4,
  );
}
