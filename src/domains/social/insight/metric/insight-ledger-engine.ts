import * as numbers from "../../../../kit/numbers.js";
import { InsightLedger } from "./insight-ledger.js";

/** One step of the insight ledger calculation. */
export interface InsightLedgerModifier {
  describe(): string;
  adjust(item: InsightLedger, value: number): number;
}

export class CapInsightLedgerAdjuster implements InsightLedgerModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: InsightLedger, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class PercentInsightLedgerAdjuster implements InsightLedgerModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: InsightLedger, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class MinimumInsightLedgerAdjuster implements InsightLedgerModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: InsightLedger, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class CategoryInsightLedgerAdjuster implements InsightLedgerModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by category";
  }

  adjust(item: InsightLedger, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the insight ledger steps in order and keeps a trace of each. */
export class InsightLedgerEngine {
  steps: InsightLedgerModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: InsightLedgerModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: InsightLedger): number {
    let current = item.weightedTotal();
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

  evaluateAll(items: InsightLedger[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultInsightLedgerEngine(): InsightLedgerEngine {
  return new InsightLedgerEngine(
    [
      new CapInsightLedgerAdjuster(2191),
      new PercentInsightLedgerAdjuster(-13),
      new MinimumInsightLedgerAdjuster(32.6),
      new CategoryInsightLedgerAdjuster(
        new Map<string, number>([["east", 0.81], ["central", 1.15], ["retail", 1.34]]),
      ),
    ],
    [],
    2.6,
    34764.3,
  );
}
