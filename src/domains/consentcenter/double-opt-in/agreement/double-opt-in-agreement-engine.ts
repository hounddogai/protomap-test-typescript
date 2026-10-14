import { DoubleOptInAgreement } from "./double-opt-in-agreement.js";

/** One step of the double opt in agreement calculation. */
export interface DoubleOptInAgreementAdjuster {
  describe(): string;
  adjust(item: DoubleOptInAgreement, value: number): number;
}

export class LabelDoubleOptInAgreementAdjuster implements DoubleOptInAgreementAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by label";
  }

  adjust(item: DoubleOptInAgreement, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class TieredDoubleOptInAgreementAdjuster implements DoubleOptInAgreementAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: DoubleOptInAgreement, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class CapDoubleOptInAgreementAdjuster implements DoubleOptInAgreementAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: DoubleOptInAgreement, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the double opt in agreement steps in order and keeps a trace of each. */
export class DoubleOptInAgreementEngine {
  steps: DoubleOptInAgreementAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: DoubleOptInAgreementAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: DoubleOptInAgreement): number {
    let current = item.adjustedValue();
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

  evaluateAll(items: DoubleOptInAgreement[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultDoubleOptInAgreementEngine(): DoubleOptInAgreementEngine {
  return new DoubleOptInAgreementEngine(
    [
      new LabelDoubleOptInAgreementAdjuster(new Map<string, number>([["online", 1.37], ["east", 0.78]])),
      new TieredDoubleOptInAgreementAdjuster([2415, 6508, 8426], [1.03, 1.19, 0.98]),
      new CapDoubleOptInAgreementAdjuster(23926),
    ],
    [],
    0,
    34181.9,
  );
}
