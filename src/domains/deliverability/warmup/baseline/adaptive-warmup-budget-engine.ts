import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { AdaptiveWarmupBudget } from "./adaptive-warmup-budget.js";

/** One step of the adaptive warmup budget calculation. */
export interface AdaptiveWarmupBudgetAdjuster {
  describe(): string;
  adjust(item: AdaptiveWarmupBudget, value: number): number;
}

export class TieredAdaptiveWarmupBudgetAdjuster implements AdaptiveWarmupBudgetAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: AdaptiveWarmupBudget, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class ChannelAdaptiveWarmupBudgetAdjuster implements AdaptiveWarmupBudgetAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by channel";
  }

  adjust(item: AdaptiveWarmupBudget, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class FlaggedAdaptiveWarmupBudgetAdjuster implements AdaptiveWarmupBudgetAdjuster {
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

  adjust(item: AdaptiveWarmupBudget, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class CapAdaptiveWarmupBudgetAdjuster implements AdaptiveWarmupBudgetAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: AdaptiveWarmupBudget, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class PercentAdaptiveWarmupBudgetAdjuster implements AdaptiveWarmupBudgetAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: AdaptiveWarmupBudget, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the adaptive warmup budget steps in order and keeps a trace of each. */
export class AdaptiveWarmupBudgetEngine {
  steps: AdaptiveWarmupBudgetAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: AdaptiveWarmupBudgetAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: AdaptiveWarmupBudget): number {
    let current = item.projectedTotal();
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

  evaluateAll(items: AdaptiveWarmupBudget[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultAdaptiveWarmupBudgetEngine(flagsValue: flags.Registry): AdaptiveWarmupBudgetEngine {
  return new AdaptiveWarmupBudgetEngine(
    [
      new TieredAdaptiveWarmupBudgetAdjuster([2942, 3456, 9582], [1.05, 0.96, 0.93]),
      new ChannelAdaptiveWarmupBudgetAdjuster(new Map<string, number>([["north", 0.72]])),
      new FlaggedAdaptiveWarmupBudgetAdjuster(flagsValue, "adaptive-warmup-budget-weighted", -0.9),
      new CapAdaptiveWarmupBudgetAdjuster(2772),
      new PercentAdaptiveWarmupBudgetAdjuster(-13.2),
    ],
    [],
    4.9,
    23611.7,
  );
}
