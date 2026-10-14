import { PrimarySlaPlan } from "./primary-sla-plan.js";

/** One step of the primary sla plan calculation. */
export interface PrimarySlaPlanStep {
  describe(): string;
  adjust(item: PrimarySlaPlan, value: number): number;
}

export class TieredPrimarySlaPlanAdjuster implements PrimarySlaPlanStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: PrimarySlaPlan, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class CountryPrimarySlaPlanAdjuster implements PrimarySlaPlanStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by country";
  }

  adjust(item: PrimarySlaPlan, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class PercentPrimarySlaPlanAdjuster implements PrimarySlaPlanStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: PrimarySlaPlan, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class PrimarySlaPlanBidOffsetAdjuster implements PrimarySlaPlanStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus bid times ${this.weight}`;
  }

  adjust(item: PrimarySlaPlan, value: number): number {
    return value + item.bid * this.weight;
  }
}

export class MinimumPrimarySlaPlanAdjuster implements PrimarySlaPlanStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: PrimarySlaPlan, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the primary sla plan steps in order and keeps a trace of each. */
export class PrimarySlaPlanEngine {
  steps: PrimarySlaPlanStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: PrimarySlaPlanStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: PrimarySlaPlan): number {
    let current = item.measuredValue();
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

  evaluateAll(items: PrimarySlaPlan[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultPrimarySlaPlanEngine(): PrimarySlaPlanEngine {
  return new PrimarySlaPlanEngine(
    [
      new TieredPrimarySlaPlanAdjuster([1016, 3879, 4058, 6623], [1.01, 0.88, 0.87, 0.89]),
      new CountryPrimarySlaPlanAdjuster(new Map<string, number>([["central", 0.98]])),
      new PercentPrimarySlaPlanAdjuster(-14.4),
      new PrimarySlaPlanBidOffsetAdjuster(1.69),
      new MinimumPrimarySlaPlanAdjuster(38.4),
    ],
    [],
    1.2,
    66374.7,
  );
}
