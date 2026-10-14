import { RegionalTouchpointBudget } from "./regional-touchpoint-budget.js";

/** One step of the regional touchpoint budget calculation. */
export interface RegionalTouchpointBudgetModifier {
  describe(): string;
  adjust(item: RegionalTouchpointBudget, value: number): number;
}

export class CapRegionalTouchpointBudgetAdjuster implements RegionalTouchpointBudgetModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: RegionalTouchpointBudget, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class RegionalTouchpointBudgetVersionOffsetAdjuster implements RegionalTouchpointBudgetModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus version times ${this.weight}`;
  }

  adjust(item: RegionalTouchpointBudget, value: number): number {
    return value + item.version * this.weight;
  }
}

export class TieredRegionalTouchpointBudgetAdjuster implements RegionalTouchpointBudgetModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: RegionalTouchpointBudget, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

/** Runs the regional touchpoint budget steps in order and keeps a trace of each. */
export class RegionalTouchpointBudgetEngine {
  steps: RegionalTouchpointBudgetModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: RegionalTouchpointBudgetModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: RegionalTouchpointBudget): number {
    let current = item.weightedValue();
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

  evaluateAll(items: RegionalTouchpointBudget[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultRegionalTouchpointBudgetEngine(): RegionalTouchpointBudgetEngine {
  return new RegionalTouchpointBudgetEngine(
    [
      new CapRegionalTouchpointBudgetAdjuster(13797),
      new RegionalTouchpointBudgetVersionOffsetAdjuster(0.68),
      new TieredRegionalTouchpointBudgetAdjuster([2336, 3573, 7826], [1.05, 0.96, 0.97]),
    ],
    [],
    1.8,
    15976,
  );
}
