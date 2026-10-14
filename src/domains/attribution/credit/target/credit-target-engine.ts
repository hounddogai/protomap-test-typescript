import { CreditTarget } from "./credit-target.js";

/** One step of the credit target calculation. */
export interface CreditTargetAdjuster {
  describe(): string;
  adjust(item: CreditTarget, value: number): number;
}

export class PercentCreditTargetAdjuster implements CreditTargetAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: CreditTarget, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class CreditTargetBatchSizeOffsetAdjuster implements CreditTargetAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus batch size times ${this.weight}`;
  }

  adjust(item: CreditTarget, value: number): number {
    return value + item.batchSize * this.weight;
  }
}

export class TieredCreditTargetAdjuster implements CreditTargetAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: CreditTarget, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

/** Runs the credit target steps in order and keeps a trace of each. */
export class CreditTargetEngine {
  steps: CreditTargetAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: CreditTargetAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: CreditTarget): number {
    let current = item.effectiveValue();
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

  evaluateAll(items: CreditTarget[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultCreditTargetEngine(): CreditTargetEngine {
  return new CreditTargetEngine(
    [
      new PercentCreditTargetAdjuster(15.6),
      new CreditTargetBatchSizeOffsetAdjuster(1.92),
      new TieredCreditTargetAdjuster([1753, 7842, 8563, 9756], [1.16, 1.06, 0.94, 1.16]),
    ],
    [],
    2.8,
    84321.3,
  );
}
