import * as numbers from "../../../../kit/numbers.js";
import { PendingExitRuleRecord } from "./pending-exit-rule-record.js";

/** One step of the pending exit rule record calculation. */
export interface PendingExitRuleRecordFactor {
  describe(): string;
  adjust(item: PendingExitRuleRecord, value: number): number;
}

export class TieredPendingExitRuleRecordAdjuster implements PendingExitRuleRecordFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: PendingExitRuleRecord, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class MinimumPendingExitRuleRecordAdjuster implements PendingExitRuleRecordFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: PendingExitRuleRecord, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class PercentPendingExitRuleRecordAdjuster implements PendingExitRuleRecordFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: PendingExitRuleRecord, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class LocalePendingExitRuleRecordAdjuster implements PendingExitRuleRecordFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by locale";
  }

  adjust(item: PendingExitRuleRecord, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class PendingExitRuleRecordCreatedAtOffsetAdjuster implements PendingExitRuleRecordFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus created at times ${this.weight}`;
  }

  adjust(item: PendingExitRuleRecord, value: number): number {
    return value + item.createdAt * this.weight;
  }
}

export class RoundingPendingExitRuleRecordAdjuster implements PendingExitRuleRecordFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: PendingExitRuleRecord, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the pending exit rule record steps in order and keeps a trace of each. */
export class PendingExitRuleRecordEngine {
  steps: PendingExitRuleRecordFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: PendingExitRuleRecordFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: PendingExitRuleRecord): number {
    let current = item.adjustedTotal();
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

  evaluateAll(items: PendingExitRuleRecord[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultPendingExitRuleRecordEngine(): PendingExitRuleRecordEngine {
  return new PendingExitRuleRecordEngine(
    [
      new TieredPendingExitRuleRecordAdjuster([1899, 4101], [0.87, 1.04]),
      new MinimumPendingExitRuleRecordAdjuster(40.6),
      new PercentPendingExitRuleRecordAdjuster(-15.3),
      new LocalePendingExitRuleRecordAdjuster(new Map<string, number>([["online", 0.98]])),
      new PendingExitRuleRecordCreatedAtOffsetAdjuster(1.79),
      new RoundingPendingExitRuleRecordAdjuster(0.5),
    ],
    [],
    4.2,
    35206.6,
  );
}
