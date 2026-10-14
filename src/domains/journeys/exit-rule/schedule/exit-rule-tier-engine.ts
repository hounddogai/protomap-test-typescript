import * as numbers from "../../../../kit/numbers.js";
import { ExitRuleTier } from "./exit-rule-tier.js";

/** One step of the exit rule tier calculation. */
export interface ExitRuleTierAdjuster {
  describe(): string;
  adjust(item: ExitRuleTier, value: number): number;
}

export class MinimumExitRuleTierAdjuster implements ExitRuleTierAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: ExitRuleTier, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class PercentExitRuleTierAdjuster implements ExitRuleTierAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: ExitRuleTier, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class LocaleExitRuleTierAdjuster implements ExitRuleTierAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by locale";
  }

  adjust(item: ExitRuleTier, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class CapExitRuleTierAdjuster implements ExitRuleTierAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: ExitRuleTier, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class TieredExitRuleTierAdjuster implements ExitRuleTierAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: ExitRuleTier, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

/** Runs the exit rule tier steps in order and keeps a trace of each. */
export class ExitRuleTierEngine {
  steps: ExitRuleTierAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ExitRuleTierAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: ExitRuleTier): number {
    let current = item.netExposure();
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

  evaluateAll(items: ExitRuleTier[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultExitRuleTierEngine(): ExitRuleTierEngine {
  return new ExitRuleTierEngine(
    [
      new MinimumExitRuleTierAdjuster(14.6),
      new PercentExitRuleTierAdjuster(20.1),
      new LocaleExitRuleTierAdjuster(
        new Map<string, number>([["east", 1.01], ["retail", 1.39], ["online", 1.06]]),
      ),
      new CapExitRuleTierAdjuster(28191),
      new TieredExitRuleTierAdjuster([4591, 5129, 5871, 8793], [0.86, 0.91, 1.04, 1.19]),
    ],
    [],
    2.2,
    64541.6,
  );
}
