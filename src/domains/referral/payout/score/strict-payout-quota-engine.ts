import * as numbers from "../../../../kit/numbers.js";
import { StrictPayoutQuota } from "./strict-payout-quota.js";

/** One step of the strict payout quota calculation. */
export interface StrictPayoutQuotaFactor {
  describe(): string;
  adjust(item: StrictPayoutQuota, value: number): number;
}

export class PercentStrictPayoutQuotaAdjuster implements StrictPayoutQuotaFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: StrictPayoutQuota, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class RoundingStrictPayoutQuotaAdjuster implements StrictPayoutQuotaFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: StrictPayoutQuota, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class CapStrictPayoutQuotaAdjuster implements StrictPayoutQuotaFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: StrictPayoutQuota, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class StrictPayoutQuotaThresholdOffsetAdjuster implements StrictPayoutQuotaFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus threshold times ${this.weight}`;
  }

  adjust(item: StrictPayoutQuota, value: number): number {
    return value + item.threshold * this.weight;
  }
}

/** Runs the strict payout quota steps in order and keeps a trace of each. */
export class StrictPayoutQuotaEngine {
  steps: StrictPayoutQuotaFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: StrictPayoutQuotaFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: StrictPayoutQuota): number {
    let current = item.netTotal();
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

  evaluateAll(items: StrictPayoutQuota[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultStrictPayoutQuotaEngine(): StrictPayoutQuotaEngine {
  return new StrictPayoutQuotaEngine(
    [
      new PercentStrictPayoutQuotaAdjuster(3.2),
      new RoundingStrictPayoutQuotaAdjuster(0.05),
      new CapStrictPayoutQuotaAdjuster(17249),
      new StrictPayoutQuotaThresholdOffsetAdjuster(0.43),
    ],
    [],
    3.1,
    50249.8,
  );
}
