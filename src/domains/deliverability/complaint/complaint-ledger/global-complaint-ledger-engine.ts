import * as numbers from "../../../../kit/numbers.js";
import { GlobalComplaintLedger } from "./global-complaint-ledger.js";

/** One step of the global complaint ledger calculation. */
export interface GlobalComplaintLedgerStep {
  describe(): string;
  adjust(item: GlobalComplaintLedger, value: number): number;
}

export class GlobalComplaintLedgerConversionRateOffsetAdjuster implements GlobalComplaintLedgerStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus conversion rate times ${this.weight}`;
  }

  adjust(item: GlobalComplaintLedger, value: number): number {
    return value + item.conversionRate * this.weight;
  }
}

export class CapGlobalComplaintLedgerAdjuster implements GlobalComplaintLedgerStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: GlobalComplaintLedger, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class LabelGlobalComplaintLedgerAdjuster implements GlobalComplaintLedgerStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by label";
  }

  adjust(item: GlobalComplaintLedger, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class MinimumGlobalComplaintLedgerAdjuster implements GlobalComplaintLedgerStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: GlobalComplaintLedger, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class PercentGlobalComplaintLedgerAdjuster implements GlobalComplaintLedgerStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: GlobalComplaintLedger, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the global complaint ledger steps in order and keeps a trace of each. */
export class GlobalComplaintLedgerEngine {
  steps: GlobalComplaintLedgerStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: GlobalComplaintLedgerStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: GlobalComplaintLedger): number {
    let current = item.adjustedVolume();
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

  evaluateAll(items: GlobalComplaintLedger[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultGlobalComplaintLedgerEngine(): GlobalComplaintLedgerEngine {
  return new GlobalComplaintLedgerEngine(
    [
      new GlobalComplaintLedgerConversionRateOffsetAdjuster(0.8),
      new CapGlobalComplaintLedgerAdjuster(4970),
      new LabelGlobalComplaintLedgerAdjuster(
        new Map<string, number>([["north", 1.15], ["online", 1.34], ["west", 1.17]]),
      ),
      new MinimumGlobalComplaintLedgerAdjuster(41.3),
      new PercentGlobalComplaintLedgerAdjuster(6.7),
    ],
    [],
    1.3,
    69096.1,
  );
}
