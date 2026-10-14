import * as numbers from "../../../../kit/numbers.js";
import { ManualCreditAgreement } from "./manual-credit-agreement.js";

/** One step of the manual credit agreement calculation. */
export interface ManualCreditAgreementAdjuster {
  describe(): string;
  adjust(item: ManualCreditAgreement, value: number): number;
}

export class ManualCreditAgreementCeilingOffsetAdjuster implements ManualCreditAgreementAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus ceiling times ${this.weight}`;
  }

  adjust(item: ManualCreditAgreement, value: number): number {
    return value + item.ceiling * this.weight;
  }
}

export class MinimumManualCreditAgreementAdjuster implements ManualCreditAgreementAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: ManualCreditAgreement, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class TieredManualCreditAgreementAdjuster implements ManualCreditAgreementAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: ManualCreditAgreement, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class RoundingManualCreditAgreementAdjuster implements ManualCreditAgreementAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: ManualCreditAgreement, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the manual credit agreement steps in order and keeps a trace of each. */
export class ManualCreditAgreementEngine {
  steps: ManualCreditAgreementAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ManualCreditAgreementAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: ManualCreditAgreement): number {
    let current = item.weightedExposure();
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

  evaluateAll(items: ManualCreditAgreement[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultManualCreditAgreementEngine(): ManualCreditAgreementEngine {
  return new ManualCreditAgreementEngine(
    [
      new ManualCreditAgreementCeilingOffsetAdjuster(1.23),
      new MinimumManualCreditAgreementAdjuster(37),
      new TieredManualCreditAgreementAdjuster([433, 1175, 2194], [0.9, 0.81, 1.17]),
      new RoundingManualCreditAgreementAdjuster(5),
    ],
    [],
    1.8,
    23376.9,
  );
}
