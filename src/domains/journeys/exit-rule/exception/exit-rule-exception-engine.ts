import * as numbers from "../../../../kit/numbers.js";
import { ExitRuleException } from "./exit-rule-exception.js";

/** One step of the exit rule exception calculation. */
export interface ExitRuleExceptionStep {
  describe(): string;
  adjust(item: ExitRuleException, value: number): number;
}

export class TieredExitRuleExceptionAdjuster implements ExitRuleExceptionStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: ExitRuleException, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class CapExitRuleExceptionAdjuster implements ExitRuleExceptionStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: ExitRuleException, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class PercentExitRuleExceptionAdjuster implements ExitRuleExceptionStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: ExitRuleException, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class RoundingExitRuleExceptionAdjuster implements ExitRuleExceptionStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: ExitRuleException, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the exit rule exception steps in order and keeps a trace of each. */
export class ExitRuleExceptionEngine {
  steps: ExitRuleExceptionStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ExitRuleExceptionStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: ExitRuleException): number {
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

  evaluateAll(items: ExitRuleException[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultExitRuleExceptionEngine(): ExitRuleExceptionEngine {
  return new ExitRuleExceptionEngine(
    [
      new TieredExitRuleExceptionAdjuster([4168, 7370, 8717], [0.93, 1.18, 0.92]),
      new CapExitRuleExceptionAdjuster(12347),
      new PercentExitRuleExceptionAdjuster(22.9),
      new RoundingExitRuleExceptionAdjuster(0.05),
    ],
    [],
    3.1,
    51969.3,
  );
}
