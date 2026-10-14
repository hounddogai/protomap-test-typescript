import * as numbers from "../../../../kit/numbers.js";
import { ExitRuleWindow } from "./exit-rule-window.js";

/** One step of the exit rule window calculation. */
export interface ExitRuleWindowModifier {
  describe(): string;
  adjust(item: ExitRuleWindow, value: number): number;
}

export class TieredExitRuleWindowAdjuster implements ExitRuleWindowModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: ExitRuleWindow, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class PercentExitRuleWindowAdjuster implements ExitRuleWindowModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: ExitRuleWindow, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class NameExitRuleWindowAdjuster implements ExitRuleWindowModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by name";
  }

  adjust(item: ExitRuleWindow, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class MinimumExitRuleWindowAdjuster implements ExitRuleWindowModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: ExitRuleWindow, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the exit rule window steps in order and keeps a trace of each. */
export class ExitRuleWindowEngine {
  steps: ExitRuleWindowModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ExitRuleWindowModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: ExitRuleWindow): number {
    let current = item.projectedLoad();
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

  evaluateAll(items: ExitRuleWindow[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultExitRuleWindowEngine(): ExitRuleWindowEngine {
  return new ExitRuleWindowEngine(
    [
      new TieredExitRuleWindowAdjuster([919, 7288, 7887], [1.02, 1.14, 1.12]),
      new PercentExitRuleWindowAdjuster(19.8),
      new NameExitRuleWindowAdjuster(new Map<string, number>([["north", 0.83]])),
      new MinimumExitRuleWindowAdjuster(26.3),
    ],
    [],
    0.5,
    53156.7,
  );
}
