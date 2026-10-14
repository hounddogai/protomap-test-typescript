import * as numbers from "../../../../kit/numbers.js";
import { TieredBranchAdjustment } from "./tiered-branch-adjustment.js";

/** One step of the tiered branch adjustment calculation. */
export interface TieredBranchAdjustmentStep {
  describe(): string;
  adjust(item: TieredBranchAdjustment, value: number): number;
}

export class CapTieredBranchAdjustmentAdjuster implements TieredBranchAdjustmentStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: TieredBranchAdjustment, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class LabelTieredBranchAdjustmentAdjuster implements TieredBranchAdjustmentStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by label";
  }

  adjust(item: TieredBranchAdjustment, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class PercentTieredBranchAdjustmentAdjuster implements TieredBranchAdjustmentStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: TieredBranchAdjustment, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the tiered branch adjustment steps in order and keeps a trace of each. */
export class TieredBranchAdjustmentEngine {
  steps: TieredBranchAdjustmentStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: TieredBranchAdjustmentStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: TieredBranchAdjustment): number {
    let current = item.netValue();
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

  evaluateAll(items: TieredBranchAdjustment[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultTieredBranchAdjustmentEngine(): TieredBranchAdjustmentEngine {
  return new TieredBranchAdjustmentEngine(
    [
      new CapTieredBranchAdjustmentAdjuster(2967),
      new LabelTieredBranchAdjustmentAdjuster(new Map<string, number>([["retail", 0.75], ["east", 0.92]])),
      new PercentTieredBranchAdjustmentAdjuster(-11.4),
    ],
    [],
    3.7,
    54975,
  );
}
