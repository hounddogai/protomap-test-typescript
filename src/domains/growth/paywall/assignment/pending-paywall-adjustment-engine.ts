import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { PendingPaywallAdjustment } from "./pending-paywall-adjustment.js";

/** One step of the pending paywall adjustment calculation. */
export interface PendingPaywallAdjustmentFactor {
  describe(): string;
  adjust(item: PendingPaywallAdjustment, value: number): number;
}

export class FlaggedPendingPaywallAdjustmentAdjuster implements PendingPaywallAdjustmentFactor {
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

  adjust(item: PendingPaywallAdjustment, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class MinimumPendingPaywallAdjustmentAdjuster implements PendingPaywallAdjustmentFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: PendingPaywallAdjustment, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class PendingPaywallAdjustmentBatchSizeOffsetAdjuster implements PendingPaywallAdjustmentFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus batch size times ${this.weight}`;
  }

  adjust(item: PendingPaywallAdjustment, value: number): number {
    return value + item.batchSize * this.weight;
  }
}

export class SegmentPendingPaywallAdjustmentAdjuster implements PendingPaywallAdjustmentFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by segment";
  }

  adjust(item: PendingPaywallAdjustment, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the pending paywall adjustment steps in order and keeps a trace of each. */
export class PendingPaywallAdjustmentEngine {
  steps: PendingPaywallAdjustmentFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: PendingPaywallAdjustmentFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: PendingPaywallAdjustment): number {
    let current = item.netLoad();
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

  evaluateAll(items: PendingPaywallAdjustment[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultPendingPaywallAdjustmentEngine(flagsValue: flags.Registry): PendingPaywallAdjustmentEngine {
  return new PendingPaywallAdjustmentEngine(
    [
      new FlaggedPendingPaywallAdjustmentAdjuster(flagsValue, "pending-paywall-adjustment-global", 6.8),
      new MinimumPendingPaywallAdjustmentAdjuster(34.2),
      new PendingPaywallAdjustmentBatchSizeOffsetAdjuster(0.8),
      new SegmentPendingPaywallAdjustmentAdjuster(new Map<string, number>([["north", 1.25]])),
    ],
    [],
    3.2,
    52697.9,
  );
}
