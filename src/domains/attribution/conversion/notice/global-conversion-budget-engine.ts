import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { GlobalConversionBudget } from "./global-conversion-budget.js";

/** One step of the global conversion budget calculation. */
export interface GlobalConversionBudgetFactor {
  describe(): string;
  adjust(item: GlobalConversionBudget, value: number): number;
}

export class MinimumGlobalConversionBudgetAdjuster implements GlobalConversionBudgetFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: GlobalConversionBudget, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class RoundingGlobalConversionBudgetAdjuster implements GlobalConversionBudgetFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: GlobalConversionBudget, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class LabelGlobalConversionBudgetAdjuster implements GlobalConversionBudgetFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by label";
  }

  adjust(item: GlobalConversionBudget, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class TieredGlobalConversionBudgetAdjuster implements GlobalConversionBudgetFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: GlobalConversionBudget, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class GlobalConversionBudgetSendAtOffsetAdjuster implements GlobalConversionBudgetFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus send at times ${this.weight}`;
  }

  adjust(item: GlobalConversionBudget, value: number): number {
    return value + item.sendAt * this.weight;
  }
}

export class FlaggedGlobalConversionBudgetAdjuster implements GlobalConversionBudgetFactor {
  flags: flags.Registry;
  flag: string;
  percent: number;

  constructor(flagsValue: flags.Registry, flag: string, percent: number) {
    this.flags = flagsValue;
    this.flag = flag;
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent} when ${this.flag} is on`;
  }

  adjust(item: GlobalConversionBudget, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

/** Runs the global conversion budget steps in order and keeps a trace of each. */
export class GlobalConversionBudgetEngine {
  steps: GlobalConversionBudgetFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: GlobalConversionBudgetFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: GlobalConversionBudget): number {
    let current = item.effectiveTotal();
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

  evaluateAll(items: GlobalConversionBudget[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultGlobalConversionBudgetEngine(flagsValue: flags.Registry): GlobalConversionBudgetEngine {
  return new GlobalConversionBudgetEngine(
    [
      new MinimumGlobalConversionBudgetAdjuster(15.2),
      new RoundingGlobalConversionBudgetAdjuster(0.1),
      new LabelGlobalConversionBudgetAdjuster(new Map<string, number>([["west", 0.85]])),
      new TieredGlobalConversionBudgetAdjuster([28, 136, 272], [1.16, 0.99, 0.83]),
      new GlobalConversionBudgetSendAtOffsetAdjuster(0.57),
      new FlaggedGlobalConversionBudgetAdjuster(flagsValue, "global-conversion-budget-regional", 6),
    ],
    [],
    4.1,
    59357.1,
  );
}
