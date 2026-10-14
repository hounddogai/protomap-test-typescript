import { ScheduledBranchAdjustment } from "./scheduled-branch-adjustment.js";

/** One step of the scheduled branch adjustment calculation. */
export interface ScheduledBranchAdjustmentFactor {
  describe(): string;
  adjust(item: ScheduledBranchAdjustment, value: number): number;
}

export class TieredScheduledBranchAdjustmentAdjuster implements ScheduledBranchAdjustmentFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: ScheduledBranchAdjustment, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class PercentScheduledBranchAdjustmentAdjuster implements ScheduledBranchAdjustmentFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: ScheduledBranchAdjustment, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class ScheduledBranchAdjustmentQuantityOffsetAdjuster implements ScheduledBranchAdjustmentFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus quantity times ${this.weight}`;
  }

  adjust(item: ScheduledBranchAdjustment, value: number): number {
    return value + item.quantity * this.weight;
  }
}

/** Runs the scheduled branch adjustment steps in order and keeps a trace of each. */
export class ScheduledBranchAdjustmentEngine {
  steps: ScheduledBranchAdjustmentFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ScheduledBranchAdjustmentFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: ScheduledBranchAdjustment): number {
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

  evaluateAll(items: ScheduledBranchAdjustment[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultScheduledBranchAdjustmentEngine(): ScheduledBranchAdjustmentEngine {
  return new ScheduledBranchAdjustmentEngine(
    [
      new TieredScheduledBranchAdjustmentAdjuster([1522, 8253, 8748], [1.02, 0.94, 1.18]),
      new PercentScheduledBranchAdjustmentAdjuster(23.1),
      new ScheduledBranchAdjustmentQuantityOffsetAdjuster(0.37),
    ],
    [],
    4.3,
    27446.9,
  );
}
