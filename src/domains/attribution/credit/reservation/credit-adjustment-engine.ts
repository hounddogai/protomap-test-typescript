import { CreditAdjustment } from "./credit-adjustment.js";

/** One step of the credit adjustment calculation. */
export interface CreditAdjustmentFactor {
  describe(): string;
  adjust(item: CreditAdjustment, value: number): number;
}

export class CapCreditAdjustmentAdjuster implements CreditAdjustmentFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: CreditAdjustment, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class RegionCreditAdjustmentAdjuster implements CreditAdjustmentFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by region";
  }

  adjust(item: CreditAdjustment, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class PercentCreditAdjustmentAdjuster implements CreditAdjustmentFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: CreditAdjustment, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class CreditAdjustmentCostOffsetAdjuster implements CreditAdjustmentFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus cost times ${this.weight}`;
  }

  adjust(item: CreditAdjustment, value: number): number {
    return value + item.cost * this.weight;
  }
}

/** Runs the credit adjustment steps in order and keeps a trace of each. */
export class CreditAdjustmentEngine {
  steps: CreditAdjustmentFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: CreditAdjustmentFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: CreditAdjustment): number {
    let current = item.netVolume();
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

  evaluateAll(items: CreditAdjustment[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultCreditAdjustmentEngine(): CreditAdjustmentEngine {
  return new CreditAdjustmentEngine(
    [
      new CapCreditAdjustmentAdjuster(6609),
      new RegionCreditAdjustmentAdjuster(new Map<string, number>([["west", 0.78], ["retail", 0.89]])),
      new PercentCreditAdjustmentAdjuster(12.2),
      new CreditAdjustmentCostOffsetAdjuster(1.26),
    ],
    [],
    2.1,
    30548.9,
  );
}
