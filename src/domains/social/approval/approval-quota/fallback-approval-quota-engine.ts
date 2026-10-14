import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { FallbackApprovalQuota } from "./fallback-approval-quota.js";

/** One step of the fallback approval quota calculation. */
export interface FallbackApprovalQuotaAdjuster {
  describe(): string;
  adjust(item: FallbackApprovalQuota, value: number): number;
}

export class CapFallbackApprovalQuotaAdjuster implements FallbackApprovalQuotaAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: FallbackApprovalQuota, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class FallbackApprovalQuotaBudgetOffsetAdjuster implements FallbackApprovalQuotaAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus budget times ${this.weight}`;
  }

  adjust(item: FallbackApprovalQuota, value: number): number {
    return value + item.budget * this.weight;
  }
}

export class NameFallbackApprovalQuotaAdjuster implements FallbackApprovalQuotaAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by name";
  }

  adjust(item: FallbackApprovalQuota, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class FlaggedFallbackApprovalQuotaAdjuster implements FallbackApprovalQuotaAdjuster {
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

  adjust(item: FallbackApprovalQuota, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

/** Runs the fallback approval quota steps in order and keeps a trace of each. */
export class FallbackApprovalQuotaEngine {
  steps: FallbackApprovalQuotaAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: FallbackApprovalQuotaAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: FallbackApprovalQuota): number {
    let current = item.adjustedVolume();
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

  evaluateAll(items: FallbackApprovalQuota[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultFallbackApprovalQuotaEngine(flagsValue: flags.Registry): FallbackApprovalQuotaEngine {
  return new FallbackApprovalQuotaEngine(
    [
      new CapFallbackApprovalQuotaAdjuster(32384),
      new FallbackApprovalQuotaBudgetOffsetAdjuster(0.44),
      new NameFallbackApprovalQuotaAdjuster(new Map<string, number>([["west", 1.05]])),
      new FlaggedFallbackApprovalQuotaAdjuster(flagsValue, "fallback-approval-quota-rolling", -2.6),
    ],
    [],
    0.9,
    82236.3,
  );
}
