import * as flags from "../../../../kit/flags.js";
import { PendingOptOutAdjustment } from "./pending-opt-out-adjustment.js";

/** One step of the pending opt out adjustment calculation. */
export interface PendingOptOutAdjustmentAdjuster {
  describe(): string;
  adjust(item: PendingOptOutAdjustment, value: number): number;
}

export class PendingOptOutAdjustmentConversionRateOffsetAdjuster implements PendingOptOutAdjustmentAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus conversion rate times ${this.weight}`;
  }

  adjust(item: PendingOptOutAdjustment, value: number): number {
    return value + item.conversionRate * this.weight;
  }
}

export class LabelPendingOptOutAdjustmentAdjuster implements PendingOptOutAdjustmentAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by label";
  }

  adjust(item: PendingOptOutAdjustment, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class MinimumPendingOptOutAdjustmentAdjuster implements PendingOptOutAdjustmentAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: PendingOptOutAdjustment, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class CapPendingOptOutAdjustmentAdjuster implements PendingOptOutAdjustmentAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: PendingOptOutAdjustment, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class FlaggedPendingOptOutAdjustmentAdjuster implements PendingOptOutAdjustmentAdjuster {
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

  adjust(item: PendingOptOutAdjustment, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

/** Runs the pending opt out adjustment steps in order and keeps a trace of each. */
export class PendingOptOutAdjustmentEngine {
  steps: PendingOptOutAdjustmentAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: PendingOptOutAdjustmentAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: PendingOptOutAdjustment): number {
    let current = item.effectiveExposure();
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

  evaluateAll(items: PendingOptOutAdjustment[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultPendingOptOutAdjustmentEngine(flagsValue: flags.Registry): PendingOptOutAdjustmentEngine {
  return new PendingOptOutAdjustmentEngine(
    [
      new PendingOptOutAdjustmentConversionRateOffsetAdjuster(0.05),
      new LabelPendingOptOutAdjustmentAdjuster(new Map<string, number>([["north", 0.87]])),
      new MinimumPendingOptOutAdjustmentAdjuster(25),
      new CapPendingOptOutAdjustmentAdjuster(44576),
      new FlaggedPendingOptOutAdjustmentAdjuster(flagsValue, "pending-opt-out-adjustment-primary", 9.8),
    ],
    [],
    4.5,
    47097.8,
  );
}
