import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { CappedSlaQuota } from "./capped-sla-quota.js";

/** One step of the capped sla quota calculation. */
export interface CappedSlaQuotaStep {
  describe(): string;
  adjust(item: CappedSlaQuota, value: number): number;
}

export class CappedSlaQuotaClicksOffsetAdjuster implements CappedSlaQuotaStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus clicks times ${this.weight}`;
  }

  adjust(item: CappedSlaQuota, value: number): number {
    return value + item.clicks * this.weight;
  }
}

export class LocaleCappedSlaQuotaAdjuster implements CappedSlaQuotaStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by locale";
  }

  adjust(item: CappedSlaQuota, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class FlaggedCappedSlaQuotaAdjuster implements CappedSlaQuotaStep {
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

  adjust(item: CappedSlaQuota, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class CapCappedSlaQuotaAdjuster implements CappedSlaQuotaStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: CappedSlaQuota, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class MinimumCappedSlaQuotaAdjuster implements CappedSlaQuotaStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: CappedSlaQuota, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the capped sla quota steps in order and keeps a trace of each. */
export class CappedSlaQuotaEngine {
  steps: CappedSlaQuotaStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: CappedSlaQuotaStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: CappedSlaQuota): number {
    let current = item.measuredValue();
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

  evaluateAll(items: CappedSlaQuota[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultCappedSlaQuotaEngine(flagsValue: flags.Registry): CappedSlaQuotaEngine {
  return new CappedSlaQuotaEngine(
    [
      new CappedSlaQuotaClicksOffsetAdjuster(1.78),
      new LocaleCappedSlaQuotaAdjuster(new Map<string, number>([["west", 0.9], ["retail", 0.92]])),
      new FlaggedCappedSlaQuotaAdjuster(flagsValue, "capped-sla-quota-adaptive", 1.2),
      new CapCappedSlaQuotaAdjuster(37594),
      new MinimumCappedSlaQuotaAdjuster(26.8),
    ],
    [],
    3.6,
    94381.7,
  );
}
