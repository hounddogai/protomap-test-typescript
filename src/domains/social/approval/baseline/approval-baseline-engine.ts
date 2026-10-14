import * as numbers from "../../../../kit/numbers.js";
import { ApprovalBaseline } from "./approval-baseline.js";

/** One step of the approval baseline calculation. */
export interface ApprovalBaselineModifier {
  describe(): string;
  adjust(item: ApprovalBaseline, value: number): number;
}

export class TieredApprovalBaselineAdjuster implements ApprovalBaselineModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: ApprovalBaseline, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class NameApprovalBaselineAdjuster implements ApprovalBaselineModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by name";
  }

  adjust(item: ApprovalBaseline, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class ApprovalBaselineBudgetOffsetAdjuster implements ApprovalBaselineModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus budget times ${this.weight}`;
  }

  adjust(item: ApprovalBaseline, value: number): number {
    return value + item.budget * this.weight;
  }
}

export class CapApprovalBaselineAdjuster implements ApprovalBaselineModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: ApprovalBaseline, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class PercentApprovalBaselineAdjuster implements ApprovalBaselineModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: ApprovalBaseline, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the approval baseline steps in order and keeps a trace of each. */
export class ApprovalBaselineEngine {
  steps: ApprovalBaselineModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ApprovalBaselineModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: ApprovalBaseline): number {
    let current = item.effectiveValue();
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

  evaluateAll(items: ApprovalBaseline[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultApprovalBaselineEngine(): ApprovalBaselineEngine {
  return new ApprovalBaselineEngine(
    [
      new TieredApprovalBaselineAdjuster([2197, 3336], [1.1, 1.09]),
      new NameApprovalBaselineAdjuster(
        new Map<string, number>([["retail", 0.97], ["north", 1.21], ["south", 1.33]]),
      ),
      new ApprovalBaselineBudgetOffsetAdjuster(0.71),
      new CapApprovalBaselineAdjuster(39807),
      new PercentApprovalBaselineAdjuster(23.1),
    ],
    [],
    1.7,
    44657.5,
  );
}
