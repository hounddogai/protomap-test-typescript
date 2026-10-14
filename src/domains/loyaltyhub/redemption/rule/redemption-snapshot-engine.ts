import * as numbers from "../../../../kit/numbers.js";
import { RedemptionSnapshot } from "./redemption-snapshot.js";

/** One step of the redemption snapshot calculation. */
export interface RedemptionSnapshotStep {
  describe(): string;
  adjust(item: RedemptionSnapshot, value: number): number;
}

export class TieredRedemptionSnapshotAdjuster implements RedemptionSnapshotStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: RedemptionSnapshot, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class RedemptionSnapshotDiscountOffsetAdjuster implements RedemptionSnapshotStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus discount times ${this.weight}`;
  }

  adjust(item: RedemptionSnapshot, value: number): number {
    return value + item.discount * this.weight;
  }
}

export class PercentRedemptionSnapshotAdjuster implements RedemptionSnapshotStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: RedemptionSnapshot, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class LabelRedemptionSnapshotAdjuster implements RedemptionSnapshotStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by label";
  }

  adjust(item: RedemptionSnapshot, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the redemption snapshot steps in order and keeps a trace of each. */
export class RedemptionSnapshotEngine {
  steps: RedemptionSnapshotStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: RedemptionSnapshotStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: RedemptionSnapshot): number {
    let current = item.effectiveExposure();
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

  evaluateAll(items: RedemptionSnapshot[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultRedemptionSnapshotEngine(): RedemptionSnapshotEngine {
  return new RedemptionSnapshotEngine(
    [
      new TieredRedemptionSnapshotAdjuster([535, 1407, 9549, 9943], [1.14, 0.83, 1.08, 1.06]),
      new RedemptionSnapshotDiscountOffsetAdjuster(1.45),
      new PercentRedemptionSnapshotAdjuster(4),
      new LabelRedemptionSnapshotAdjuster(
        new Map<string, number>([["online", 1.1], ["west", 1.22], ["retail", 1.1]]),
      ),
    ],
    [],
    1.3,
    7834.4,
  );
}
