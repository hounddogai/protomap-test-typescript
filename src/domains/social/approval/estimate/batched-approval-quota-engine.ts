import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { BatchedApprovalQuota } from "./batched-approval-quota.js";

/** One step of the batched approval quota calculation. */
export interface BatchedApprovalQuotaModifier {
  describe(): string;
  adjust(item: BatchedApprovalQuota, value: number): number;
}

export class RoundingBatchedApprovalQuotaAdjuster implements BatchedApprovalQuotaModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: BatchedApprovalQuota, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class TieredBatchedApprovalQuotaAdjuster implements BatchedApprovalQuotaModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: BatchedApprovalQuota, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class MinimumBatchedApprovalQuotaAdjuster implements BatchedApprovalQuotaModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: BatchedApprovalQuota, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class FlaggedBatchedApprovalQuotaAdjuster implements BatchedApprovalQuotaModifier {
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

  adjust(item: BatchedApprovalQuota, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

/** Runs the batched approval quota steps in order and keeps a trace of each. */
export class BatchedApprovalQuotaEngine {
  steps: BatchedApprovalQuotaModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: BatchedApprovalQuotaModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: BatchedApprovalQuota): number {
    let current = item.measuredValue();
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

  evaluateAll(items: BatchedApprovalQuota[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultBatchedApprovalQuotaEngine(flagsValue: flags.Registry): BatchedApprovalQuotaEngine {
  return new BatchedApprovalQuotaEngine(
    [
      new RoundingBatchedApprovalQuotaAdjuster(5),
      new TieredBatchedApprovalQuotaAdjuster([1933, 5723, 8890, 9063], [0.87, 1.19, 0.89, 1.06]),
      new MinimumBatchedApprovalQuotaAdjuster(32),
      new FlaggedBatchedApprovalQuotaAdjuster(flagsValue, "batched-approval-quota-tiered", 1.3),
    ],
    [],
    3.8,
    14514.1,
  );
}
