import * as numbers from "../../../../kit/numbers.js";
import { ManualApprovalQuota } from "./manual-approval-quota.js";

/** One step of the manual approval quota calculation. */
export interface ManualApprovalQuotaStep {
  describe(): string;
  adjust(item: ManualApprovalQuota, value: number): number;
}

export class LocaleManualApprovalQuotaAdjuster implements ManualApprovalQuotaStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by locale";
  }

  adjust(item: ManualApprovalQuota, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class PercentManualApprovalQuotaAdjuster implements ManualApprovalQuotaStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: ManualApprovalQuota, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class TieredManualApprovalQuotaAdjuster implements ManualApprovalQuotaStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: ManualApprovalQuota, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class CapManualApprovalQuotaAdjuster implements ManualApprovalQuotaStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: ManualApprovalQuota, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class RoundingManualApprovalQuotaAdjuster implements ManualApprovalQuotaStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: ManualApprovalQuota, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class MinimumManualApprovalQuotaAdjuster implements ManualApprovalQuotaStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: ManualApprovalQuota, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the manual approval quota steps in order and keeps a trace of each. */
export class ManualApprovalQuotaEngine {
  steps: ManualApprovalQuotaStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ManualApprovalQuotaStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: ManualApprovalQuota): number {
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

  evaluateAll(items: ManualApprovalQuota[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultManualApprovalQuotaEngine(): ManualApprovalQuotaEngine {
  return new ManualApprovalQuotaEngine(
    [
      new LocaleManualApprovalQuotaAdjuster(new Map<string, number>([["central", 1.17]])),
      new PercentManualApprovalQuotaAdjuster(-7),
      new TieredManualApprovalQuotaAdjuster([410, 6425, 6895, 9788], [1.01, 1.13, 0.91, 0.96]),
      new CapManualApprovalQuotaAdjuster(15858),
      new RoundingManualApprovalQuotaAdjuster(0.25),
      new MinimumManualApprovalQuotaAdjuster(13),
    ],
    [],
    4.8,
    14684.7,
  );
}
