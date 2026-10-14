import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { PendingRetentionAdjustment } from "./pending-retention-adjustment.js";

/** One step of the pending retention adjustment calculation. */
export interface PendingRetentionAdjustmentModifier {
  describe(): string;
  adjust(item: PendingRetentionAdjustment, value: number): number;
}

export class CapPendingRetentionAdjustmentAdjuster implements PendingRetentionAdjustmentModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: PendingRetentionAdjustment, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class FlaggedPendingRetentionAdjustmentAdjuster implements PendingRetentionAdjustmentModifier {
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

  adjust(item: PendingRetentionAdjustment, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class PendingRetentionAdjustmentCreatedAtOffsetAdjuster implements PendingRetentionAdjustmentModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus created at times ${this.weight}`;
  }

  adjust(item: PendingRetentionAdjustment, value: number): number {
    return value + item.createdAt * this.weight;
  }
}

export class MinimumPendingRetentionAdjustmentAdjuster implements PendingRetentionAdjustmentModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: PendingRetentionAdjustment, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the pending retention adjustment steps in order and keeps a trace of each. */
export class PendingRetentionAdjustmentEngine {
  steps: PendingRetentionAdjustmentModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: PendingRetentionAdjustmentModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: PendingRetentionAdjustment): number {
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

  evaluateAll(items: PendingRetentionAdjustment[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultPendingRetentionAdjustmentEngine(flagsValue: flags.Registry): PendingRetentionAdjustmentEngine {
  return new PendingRetentionAdjustmentEngine(
    [
      new CapPendingRetentionAdjustmentAdjuster(48108),
      new FlaggedPendingRetentionAdjustmentAdjuster(flagsValue, "pending-retention-adjustment-global", -1),
      new PendingRetentionAdjustmentCreatedAtOffsetAdjuster(1.13),
      new MinimumPendingRetentionAdjustmentAdjuster(1.1),
    ],
    [],
    2.2,
    75961.6,
  );
}
