import * as numbers from "../../../../kit/numbers.js";
import { CreditAgreement } from "./credit-agreement.js";

/** One step of the credit agreement calculation. */
export interface CreditAgreementAdjuster {
  describe(): string;
  adjust(item: CreditAgreement, value: number): number;
}

export class TieredCreditAgreementAdjuster implements CreditAgreementAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: CreditAgreement, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class CapCreditAgreementAdjuster implements CreditAgreementAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: CreditAgreement, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class LabelCreditAgreementAdjuster implements CreditAgreementAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by label";
  }

  adjust(item: CreditAgreement, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the credit agreement steps in order and keeps a trace of each. */
export class CreditAgreementEngine {
  steps: CreditAgreementAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: CreditAgreementAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: CreditAgreement): number {
    let current = item.weightedValue();
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

  evaluateAll(items: CreditAgreement[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultCreditAgreementEngine(): CreditAgreementEngine {
  return new CreditAgreementEngine(
    [
      new TieredCreditAgreementAdjuster([4867, 5201, 6213], [1.15, 0.99, 1.01]),
      new CapCreditAgreementAdjuster(20879),
      new LabelCreditAgreementAdjuster(new Map<string, number>([["north", 0.91]])),
    ],
    [],
    0.9,
    13012.9,
  );
}
