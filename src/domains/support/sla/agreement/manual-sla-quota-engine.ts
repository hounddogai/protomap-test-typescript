import * as flags from "../../../../kit/flags.js";
import { ManualSlaQuota } from "./manual-sla-quota.js";

/** One step of the manual sla quota calculation. */
export interface ManualSlaQuotaAdjuster {
  describe(): string;
  adjust(item: ManualSlaQuota, value: number): number;
}

export class FlaggedManualSlaQuotaAdjuster implements ManualSlaQuotaAdjuster {
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

  adjust(item: ManualSlaQuota, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class CapManualSlaQuotaAdjuster implements ManualSlaQuotaAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: ManualSlaQuota, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class MinimumManualSlaQuotaAdjuster implements ManualSlaQuotaAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: ManualSlaQuota, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class LabelManualSlaQuotaAdjuster implements ManualSlaQuotaAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by label";
  }

  adjust(item: ManualSlaQuota, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class ManualSlaQuotaBudgetOffsetAdjuster implements ManualSlaQuotaAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus budget times ${this.weight}`;
  }

  adjust(item: ManualSlaQuota, value: number): number {
    return value + item.budget * this.weight;
  }
}

/** Runs the manual sla quota steps in order and keeps a trace of each. */
export class ManualSlaQuotaEngine {
  steps: ManualSlaQuotaAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ManualSlaQuotaAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: ManualSlaQuota): number {
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

  evaluateAll(items: ManualSlaQuota[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultManualSlaQuotaEngine(flagsValue: flags.Registry): ManualSlaQuotaEngine {
  return new ManualSlaQuotaEngine(
    [
      new FlaggedManualSlaQuotaAdjuster(flagsValue, "manual-sla-quota-legacy", -8.2),
      new CapManualSlaQuotaAdjuster(29100),
      new MinimumManualSlaQuotaAdjuster(9.2),
      new LabelManualSlaQuotaAdjuster(new Map<string, number>([["west", 1.01]])),
      new ManualSlaQuotaBudgetOffsetAdjuster(1.52),
    ],
    [],
    4.8,
    79164.5,
  );
}
