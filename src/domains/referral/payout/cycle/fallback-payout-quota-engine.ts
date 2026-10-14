import * as numbers from "../../../../kit/numbers.js";
import { FallbackPayoutQuota } from "./fallback-payout-quota.js";

/** One step of the fallback payout quota calculation. */
export interface FallbackPayoutQuotaModifier {
  describe(): string;
  adjust(item: FallbackPayoutQuota, value: number): number;
}

export class CapFallbackPayoutQuotaAdjuster implements FallbackPayoutQuotaModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: FallbackPayoutQuota, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class MinimumFallbackPayoutQuotaAdjuster implements FallbackPayoutQuotaModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: FallbackPayoutQuota, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class PercentFallbackPayoutQuotaAdjuster implements FallbackPayoutQuotaModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: FallbackPayoutQuota, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class RoundingFallbackPayoutQuotaAdjuster implements FallbackPayoutQuotaModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: FallbackPayoutQuota, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the fallback payout quota steps in order and keeps a trace of each. */
export class FallbackPayoutQuotaEngine {
  steps: FallbackPayoutQuotaModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: FallbackPayoutQuotaModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: FallbackPayoutQuota): number {
    let current = item.adjustedLoad();
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

  evaluateAll(items: FallbackPayoutQuota[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultFallbackPayoutQuotaEngine(): FallbackPayoutQuotaEngine {
  return new FallbackPayoutQuotaEngine(
    [
      new CapFallbackPayoutQuotaAdjuster(19460),
      new MinimumFallbackPayoutQuotaAdjuster(44.8),
      new PercentFallbackPayoutQuotaAdjuster(-17.4),
      new RoundingFallbackPayoutQuotaAdjuster(1),
    ],
    [],
    2.3,
    76735,
  );
}
