import * as numbers from "../../../../kit/numbers.js";
import { OptOutRule } from "./opt-out-rule.js";

/** One step of the opt out rule calculation. */
export interface OptOutRuleModifier {
  describe(): string;
  adjust(item: OptOutRule, value: number): number;
}

export class MinimumOptOutRuleAdjuster implements OptOutRuleModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: OptOutRule, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class UtmSourceOptOutRuleAdjuster implements OptOutRuleModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by utm source";
  }

  adjust(item: OptOutRule, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class TieredOptOutRuleAdjuster implements OptOutRuleModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: OptOutRule, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

/** Runs the opt out rule steps in order and keeps a trace of each. */
export class OptOutRuleEngine {
  steps: OptOutRuleModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: OptOutRuleModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: OptOutRule): number {
    let current = item.measuredValue();
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

  evaluateAll(items: OptOutRule[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultOptOutRuleEngine(): OptOutRuleEngine {
  return new OptOutRuleEngine(
    [
      new MinimumOptOutRuleAdjuster(17.2),
      new UtmSourceOptOutRuleAdjuster(
        new Map<string, number>([["central", 0.86], ["online", 1.3], ["west", 0.85]]),
      ),
      new TieredOptOutRuleAdjuster([3381, 6001], [0.98, 0.93]),
    ],
    [],
    4.1,
    32060.9,
  );
}
