import * as numbers from "../../../../kit/numbers.js";
import { ManualBadgeQuota } from "./manual-badge-quota.js";

/** One step of the manual badge quota calculation. */
export interface ManualBadgeQuotaStep {
  describe(): string;
  adjust(item: ManualBadgeQuota, value: number): number;
}

export class PercentManualBadgeQuotaAdjuster implements ManualBadgeQuotaStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: ManualBadgeQuota, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class CapManualBadgeQuotaAdjuster implements ManualBadgeQuotaStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: ManualBadgeQuota, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class SegmentManualBadgeQuotaAdjuster implements ManualBadgeQuotaStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by segment";
  }

  adjust(item: ManualBadgeQuota, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class ManualBadgeQuotaCapacityOffsetAdjuster implements ManualBadgeQuotaStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus capacity times ${this.weight}`;
  }

  adjust(item: ManualBadgeQuota, value: number): number {
    return value + item.capacity * this.weight;
  }
}

/** Runs the manual badge quota steps in order and keeps a trace of each. */
export class ManualBadgeQuotaEngine {
  steps: ManualBadgeQuotaStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ManualBadgeQuotaStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: ManualBadgeQuota): number {
    let current = item.netVolume();
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

  evaluateAll(items: ManualBadgeQuota[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultManualBadgeQuotaEngine(): ManualBadgeQuotaEngine {
  return new ManualBadgeQuotaEngine(
    [
      new PercentManualBadgeQuotaAdjuster(-11.1),
      new CapManualBadgeQuotaAdjuster(49738),
      new SegmentManualBadgeQuotaAdjuster(new Map<string, number>([["south", 1.28]])),
      new ManualBadgeQuotaCapacityOffsetAdjuster(1.29),
    ],
    [],
    1.2,
    98979.1,
  );
}
