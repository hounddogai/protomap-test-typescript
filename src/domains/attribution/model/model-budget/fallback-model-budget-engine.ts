import * as numbers from "../../../../kit/numbers.js";
import { FallbackModelBudget } from "./fallback-model-budget.js";

/** One step of the fallback model budget calculation. */
export interface FallbackModelBudgetModifier {
  describe(): string;
  adjust(item: FallbackModelBudget, value: number): number;
}

export class UtmSourceFallbackModelBudgetAdjuster implements FallbackModelBudgetModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by utm source";
  }

  adjust(item: FallbackModelBudget, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class PercentFallbackModelBudgetAdjuster implements FallbackModelBudgetModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: FallbackModelBudget, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class CapFallbackModelBudgetAdjuster implements FallbackModelBudgetModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: FallbackModelBudget, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class FallbackModelBudgetSequenceOffsetAdjuster implements FallbackModelBudgetModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus sequence times ${this.weight}`;
  }

  adjust(item: FallbackModelBudget, value: number): number {
    return value + item.sequence * this.weight;
  }
}

export class TieredFallbackModelBudgetAdjuster implements FallbackModelBudgetModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: FallbackModelBudget, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

/** Runs the fallback model budget steps in order and keeps a trace of each. */
export class FallbackModelBudgetEngine {
  steps: FallbackModelBudgetModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: FallbackModelBudgetModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: FallbackModelBudget): number {
    let current = item.netLoad();
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

  evaluateAll(items: FallbackModelBudget[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultFallbackModelBudgetEngine(): FallbackModelBudgetEngine {
  return new FallbackModelBudgetEngine(
    [
      new UtmSourceFallbackModelBudgetAdjuster(new Map<string, number>([["west", 0.95], ["online", 1.09]])),
      new PercentFallbackModelBudgetAdjuster(20.9),
      new CapFallbackModelBudgetAdjuster(20634),
      new FallbackModelBudgetSequenceOffsetAdjuster(0.99),
      new TieredFallbackModelBudgetAdjuster([479, 8990], [0.83, 1.12]),
    ],
    [],
    2.6,
    65244.4,
  );
}
