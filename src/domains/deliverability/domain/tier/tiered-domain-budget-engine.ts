import { TieredDomainBudget } from "./tiered-domain-budget.js";

/** One step of the tiered domain budget calculation. */
export interface TieredDomainBudgetModifier {
  describe(): string;
  adjust(item: TieredDomainBudget, value: number): number;
}

export class TieredDomainBudgetOpenRateOffsetAdjuster implements TieredDomainBudgetModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus open rate times ${this.weight}`;
  }

  adjust(item: TieredDomainBudget, value: number): number {
    return value + item.openRate * this.weight;
  }
}

export class PercentTieredDomainBudgetAdjuster implements TieredDomainBudgetModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: TieredDomainBudget, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class TieredTieredDomainBudgetAdjuster implements TieredDomainBudgetModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: TieredDomainBudget, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class MinimumTieredDomainBudgetAdjuster implements TieredDomainBudgetModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: TieredDomainBudget, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the tiered domain budget steps in order and keeps a trace of each. */
export class TieredDomainBudgetEngine {
  steps: TieredDomainBudgetModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: TieredDomainBudgetModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: TieredDomainBudget): number {
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

  evaluateAll(items: TieredDomainBudget[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultTieredDomainBudgetEngine(): TieredDomainBudgetEngine {
  return new TieredDomainBudgetEngine(
    [
      new TieredDomainBudgetOpenRateOffsetAdjuster(0.01),
      new PercentTieredDomainBudgetAdjuster(-20.3),
      new TieredTieredDomainBudgetAdjuster([989, 5720, 9512], [0.89, 1.17, 1.05]),
      new MinimumTieredDomainBudgetAdjuster(14.1),
    ],
    [],
    2.5,
    82271.6,
  );
}
