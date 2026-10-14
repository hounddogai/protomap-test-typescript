import * as numbers from "../../../../kit/numbers.js";
import { CappedPayoutQuota } from "./capped-payout-quota.js";

/** One step of the capped payout quota calculation. */
export interface CappedPayoutQuotaAdjuster {
  describe(): string;
  adjust(item: CappedPayoutQuota, value: number): number;
}

export class SegmentCappedPayoutQuotaAdjuster implements CappedPayoutQuotaAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by segment";
  }

  adjust(item: CappedPayoutQuota, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class CappedPayoutQuotaEndsAtOffsetAdjuster implements CappedPayoutQuotaAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus ends at times ${this.weight}`;
  }

  adjust(item: CappedPayoutQuota, value: number): number {
    return value + item.endsAt * this.weight;
  }
}

export class CapCappedPayoutQuotaAdjuster implements CappedPayoutQuotaAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: CappedPayoutQuota, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class TieredCappedPayoutQuotaAdjuster implements CappedPayoutQuotaAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: CappedPayoutQuota, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

/** Runs the capped payout quota steps in order and keeps a trace of each. */
export class CappedPayoutQuotaEngine {
  steps: CappedPayoutQuotaAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: CappedPayoutQuotaAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: CappedPayoutQuota): number {
    let current = item.projectedExposure();
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

  evaluateAll(items: CappedPayoutQuota[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultCappedPayoutQuotaEngine(): CappedPayoutQuotaEngine {
  return new CappedPayoutQuotaEngine(
    [
      new SegmentCappedPayoutQuotaAdjuster(new Map<string, number>([["central", 1.28], ["north", 0.72]])),
      new CappedPayoutQuotaEndsAtOffsetAdjuster(1.11),
      new CapCappedPayoutQuotaAdjuster(7982),
      new TieredCappedPayoutQuotaAdjuster([1820, 9103], [0.99, 0.98]),
    ],
    [],
    2.7,
    49523.5,
  );
}
