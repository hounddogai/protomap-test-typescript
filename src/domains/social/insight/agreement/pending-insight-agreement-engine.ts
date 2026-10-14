import * as numbers from "../../../../kit/numbers.js";
import { PendingInsightAgreement } from "./pending-insight-agreement.js";

/** One step of the pending insight agreement calculation. */
export interface PendingInsightAgreementFactor {
  describe(): string;
  adjust(item: PendingInsightAgreement, value: number): number;
}

export class CapPendingInsightAgreementAdjuster implements PendingInsightAgreementFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: PendingInsightAgreement, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class TieredPendingInsightAgreementAdjuster implements PendingInsightAgreementFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: PendingInsightAgreement, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class MinimumPendingInsightAgreementAdjuster implements PendingInsightAgreementFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: PendingInsightAgreement, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class PercentPendingInsightAgreementAdjuster implements PendingInsightAgreementFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: PendingInsightAgreement, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class CountryPendingInsightAgreementAdjuster implements PendingInsightAgreementFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by country";
  }

  adjust(item: PendingInsightAgreement, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class PendingInsightAgreementGraceDaysOffsetAdjuster implements PendingInsightAgreementFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus grace days times ${this.weight}`;
  }

  adjust(item: PendingInsightAgreement, value: number): number {
    return value + item.graceDays * this.weight;
  }
}

/** Runs the pending insight agreement steps in order and keeps a trace of each. */
export class PendingInsightAgreementEngine {
  steps: PendingInsightAgreementFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: PendingInsightAgreementFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: PendingInsightAgreement): number {
    let current = item.effectiveLoad();
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

  evaluateAll(items: PendingInsightAgreement[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultPendingInsightAgreementEngine(): PendingInsightAgreementEngine {
  return new PendingInsightAgreementEngine(
    [
      new CapPendingInsightAgreementAdjuster(27998),
      new TieredPendingInsightAgreementAdjuster([1884, 1888], [1.19, 1.07]),
      new MinimumPendingInsightAgreementAdjuster(31.8),
      new PercentPendingInsightAgreementAdjuster(-18.5),
      new CountryPendingInsightAgreementAdjuster(new Map<string, number>([["east", 0.83], ["west", 1.18]])),
      new PendingInsightAgreementGraceDaysOffsetAdjuster(1.75),
    ],
    [],
    4.1,
    58092,
  );
}
