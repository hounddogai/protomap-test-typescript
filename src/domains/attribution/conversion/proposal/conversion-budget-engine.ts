import { ConversionBudget } from "./conversion-budget.js";

/** One step of the conversion budget calculation. */
export interface ConversionBudgetModifier {
  describe(): string;
  adjust(item: ConversionBudget, value: number): number;
}

export class TieredConversionBudgetAdjuster implements ConversionBudgetModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: ConversionBudget, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class ConversionBudgetGraceDaysOffsetAdjuster implements ConversionBudgetModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus grace days times ${this.weight}`;
  }

  adjust(item: ConversionBudget, value: number): number {
    return value + item.graceDays * this.weight;
  }
}

export class PercentConversionBudgetAdjuster implements ConversionBudgetModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: ConversionBudget, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class CapConversionBudgetAdjuster implements ConversionBudgetModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: ConversionBudget, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the conversion budget steps in order and keeps a trace of each. */
export class ConversionBudgetEngine {
  steps: ConversionBudgetModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ConversionBudgetModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: ConversionBudget): number {
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

  evaluateAll(items: ConversionBudget[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultConversionBudgetEngine(): ConversionBudgetEngine {
  return new ConversionBudgetEngine(
    [
      new TieredConversionBudgetAdjuster([43, 8097, 9663], [0.82, 0.83, 1.12]),
      new ConversionBudgetGraceDaysOffsetAdjuster(1.04),
      new PercentConversionBudgetAdjuster(22.1),
      new CapConversionBudgetAdjuster(44756),
    ],
    [],
    1.5,
    17764.1,
  );
}
